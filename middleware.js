import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request) {
  const { pathname } = request.nextUrl
  
  // Public routes that don't require authentication
  const publicRoutes = ['/', '/pricing', '/api/auth/login', '/api/auth/signup', '/api/auth/logout']
  
  // If the request is for a public route, continue
  if (publicRoutes.some(route => pathname === route || pathname.startsWith(route + '/'))) {
    return NextResponse.next()
  }

  // API routes under /api/auth/ are allowed
  if (pathname.startsWith('/api/auth/')) {
    return NextResponse.next()
  }

  // Create a response object
  let response = NextResponse.next()

  // Create a Supabase client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return request.cookies.get(name)?.value
        },
        set(name, value, options) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({ name, value, ...options })
        },
        remove(name, options) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  // Get the user's session
  const { data: { session } } = await supabase.auth.getSession()

  // If there's no session and the path is protected, redirect to login
  if (!session) {
    const url = new URL('/?error=unauthorized', request.url)
    return NextResponse.redirect(url)
  }

  // For API routes, return JSON response if not authenticated
  if (pathname.startsWith('/api/') && !session) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  // If user is trying to access admin routes but is not an admin
  if (pathname.startsWith('/admin') && session.user?.user_metadata?.role !== 'admin') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
