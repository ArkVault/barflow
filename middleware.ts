import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// ── Rate Limiting ─────────────────────────────────────────────────────────────
// In-memory sliding window counter per Cloud Run instance.
// Provides meaningful protection against casual abuse and spam.
// Upgrade to Upstash Redis if multi-instance consistency becomes critical.

interface RateLimitEntry {
  count: number
  resetAt: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()
let cleanupCounter = 0

/** Periodically purge expired entries to prevent unbounded memory growth. */
function purgeExpired() {
  if (++cleanupCounter % 500 !== 0) return
  const now = Date.now()
  for (const [key, entry] of rateLimitStore) {
    if (now > entry.resetAt) rateLimitStore.delete(key)
  }
}

/**
 * Sliding-window rate check.
 * Returns true (allowed) or false (blocked).
 */
function isAllowed(key: string, limit: number, windowMs: number): boolean {
  purgeExpired()
  const now = Date.now()
  const entry = rateLimitStore.get(key)

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }

  if (entry.count >= limit) return false

  entry.count++
  return true
}

function tooManyRequests(windowMs: number) {
  return NextResponse.json(
    { error: 'Too many requests. Please try again later.' },
    {
      status: 429,
      headers: { 'Retry-After': String(Math.ceil(windowMs / 1000)) },
    }
  )
}

// ── Rate limit rules ──────────────────────────────────────────────────────────
// key: IP + path   |  limit: max requests  |  windowMs: sliding window
const API_RATE_LIMITS: Record<string, { limit: number; windowMs: number }> = {
  '/api/send-quote':                      { limit: 5,  windowMs: 10 * 60 * 1000 }, // 5 / 10 min — public spam guard
  '/api/parse-menu':                      { limit: 10, windowMs:      60 * 1000 }, // 10 / min  — AI quota guard
  '/api/create-checkout-session':         { limit: 10, windowMs:      60 * 1000 }, // 10 / min  — Stripe flood guard
  '/api/stripe/create-checkout-session':  { limit: 10, windowMs:      60 * 1000 }, // 10 / min  — canonical Stripe route
}

// ── Middleware ────────────────────────────────────────────────────────────────
export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // 1. Rate limit — fast path, no DB call
  if (pathname.startsWith('/api/')) {
    const rule = API_RATE_LIMITS[pathname]
    if (rule) {
      const ip =
        request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
        request.headers.get('x-real-ip') ??
        'unknown'
      const key = `${ip}:${pathname}`
      if (!isAllowed(key, rule.limit, rule.windowMs)) {
        return tooManyRequests(rule.windowMs)
      }
    }
    return NextResponse.next()
  }

  // 2. Auth guard — dashboard & auth pages
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isAuthPage = pathname.startsWith('/auth')
  const isDashboardPage = pathname.startsWith('/dashboard')

  if (isDashboardPage && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }

  if (isAuthPage && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/auth/:path*',
    // Rate-limited API routes
    '/api/send-quote',
    '/api/parse-menu',
    '/api/create-checkout-session',
    '/api/stripe/create-checkout-session',
  ],
}
