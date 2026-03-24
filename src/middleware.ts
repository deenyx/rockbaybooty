import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

// Protected routes that require authentication
const PROTECTED_ROUTES = ['/dashboard', '/profile', '/search', '/chat', '/groups']

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Check if route is protected
  const isProtected = PROTECTED_ROUTES.some(route => 
    pathname.startsWith(route)
  )

  if (!isProtected) {
    return NextResponse.next()
  }

  // Get token from cookie or header
  const token = request.cookies.get('auth-token')?.value ||
    request.headers.get('authorization')?.replace('Bearer ', '')

  if (!token) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || '')
    
    // Token is valid, proceed
    const response = NextResponse.next()
    // Optionally, add user info to response headers or cookies
    return response
  } catch (error) {
    // Token is invalid or expired
    return NextResponse.redirect(new URL('/', request.url))
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public folder)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
}
