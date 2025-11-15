import { createClient } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const authHeader = request.headers.get('authorization')
  
  // If no auth and trying to access protected routes, redirect to login
  const isProtectedRoute = 
    request.nextUrl.pathname.startsWith('/dashboard') ||
    request.nextUrl.pathname.startsWith('/demo')
    
  const isAuthRoute = request.nextUrl.pathname.startsWith('/auth')
  
  // Allow demo routes without authentication
  if (request.nextUrl.pathname.startsWith('/demo')) {
    return response
  }
  
  // If accessing protected route without auth, redirect to login
  if (isProtectedRoute && !authHeader) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }

  return response
}
