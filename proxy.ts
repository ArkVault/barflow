import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const DEMO_SCOPE_COOKIE = 'barflow_demo_scope'

function isTruthyEnv(value: string | undefined) {
  return value === '1' || value === 'true'
}

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  let user: Awaited<ReturnType<ReturnType<typeof createServerClient>['auth']['getUser']>>['data']['user'] | null = null
  let userLoaded = false

  async function getUser() {
    if (userLoaded) return user

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
            supabaseResponse = NextResponse.next({
              request,
            })
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    // Refresh session if expired
    const {
      data: { user: fetchedUser },
    } = await supabase.auth.getUser()

    user = fetchedUser
    userLoaded = true
    return user
  }

  const pathname = request.nextUrl.pathname
  const isAuthPage = pathname.startsWith('/auth')
  const isDemoLegacyPage = pathname.startsWith('/demo')
  const isDemoPrivatePage = pathname.startsWith('/demo-private')
  const isDemoPublicPage = pathname.startsWith('/demo-public')
  const isApiPath = pathname.startsWith('/api')

  const demoPublicEnabled =
    isTruthyEnv(process.env.DEMO_PUBLIC_ENABLED) ||
    isTruthyEnv(process.env.NEXT_PUBLIC_DEMO_PUBLIC_ENABLED)
  const demoPublicReadonlyEnabled =
    process.env.DEMO_PUBLIC_READONLY_ENABLED !== 'false'
  const legacyDemoMode = process.env.DEMO_LEGACY_MODE === 'public' ? 'public' : 'private'

  // Readonly guardrail for demo-public context across API writes.
  if (
    isApiPath &&
    demoPublicReadonlyEnabled &&
    request.cookies.get(DEMO_SCOPE_COOKIE)?.value === 'public' &&
    request.method !== 'GET' &&
    request.method !== 'HEAD' &&
    request.method !== 'OPTIONS'
  ) {
    return NextResponse.json(
      { error: 'Writes are disabled in demo-public mode' },
      { status: 403 }
    )
  }

  // /demo-public/* => optional public access, rewritten to /demo/*.
  if (isDemoPublicPage) {
    if (!demoPublicEnabled) {
      const url = request.nextUrl.clone()
      url.pathname = '/demo'
      return NextResponse.redirect(url)
    }

    const rewriteUrl = request.nextUrl.clone()
    rewriteUrl.pathname = pathname.replace('/demo-public', '/demo')
    const rewriteResponse = NextResponse.rewrite(rewriteUrl)
    rewriteResponse.cookies.set(DEMO_SCOPE_COOKIE, 'public', { path: '/' })
    return rewriteResponse
  }

  // /demo-private/* => always requires auth, rewritten to /demo/*.
  if (isDemoPrivatePage) {
    if (!(await getUser())) {
      const url = request.nextUrl.clone()
      url.pathname = '/auth/login'
      return NextResponse.redirect(url)
    }

    const rewriteUrl = request.nextUrl.clone()
    rewriteUrl.pathname = pathname.replace('/demo-private', '/demo')
    const rewriteResponse = NextResponse.rewrite(rewriteUrl)
    rewriteResponse.cookies.set(DEMO_SCOPE_COOKIE, 'private', { path: '/' })
    return rewriteResponse
  }

  // Backward compatibility for existing /demo/* routes.
  if (isDemoLegacyPage && legacyDemoMode === 'public' && demoPublicEnabled) {
    supabaseResponse.cookies.set(DEMO_SCOPE_COOKIE, 'public', { path: '/' })
    return supabaseResponse
  }

  if (
    isDemoLegacyPage &&
    demoPublicEnabled &&
    request.cookies.get(DEMO_SCOPE_COOKIE)?.value === 'public'
  ) {
    supabaseResponse.cookies.set(DEMO_SCOPE_COOKIE, 'public', { path: '/' })
    return supabaseResponse
  }

  // Protect /demo routes (legacy private behavior by default).
  if (isDemoLegacyPage && !(await getUser())) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }
  if (isDemoLegacyPage) {
    supabaseResponse.cookies.set(DEMO_SCOPE_COOKIE, 'private', { path: '/' })
  }

  // Redirect authenticated users from auth pages to demo.
  if (isAuthPage && (await getUser())) {
    const url = request.nextUrl.clone()
    url.pathname = '/demo'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/demo/:path*',
    '/demo-public/:path*',
    '/demo-private/:path*',
    '/auth/:path*',
    '/api/:path*',
  ],
}
