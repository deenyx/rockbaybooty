import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

import { AUTH_COOKIE_NAME, ROUTES } from '@/lib/constants'

const PUBLIC_PATHS = [ROUTES.HOME, ROUTES.WELCOME, ROUTES.ONBOARDING, ROUTES.LOGIN, ROUTES.SIGNUP, ROUTES.PIN_REVEAL]

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some((path) => {
    if (path === ROUTES.HOME) {
      return pathname === ROUTES.HOME
    }

    return pathname === path || pathname.startsWith(`${path}/`)
  })
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const search = request.nextUrl.search

  if (pathname.startsWith('/api/auth/')) {
    return NextResponse.next()
  }

  if (isPublicPath(pathname)) {
    return NextResponse.next()
  }

  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value

  if (!token) {
    const loginUrl = new URL(ROUTES.WELCOME, request.url)
    loginUrl.searchParams.set('returnTo', `${pathname}${search}`)
    return NextResponse.redirect(loginUrl)
  }

  try {
    const jwtSecret = process.env.JWT_SECRET
    if (!jwtSecret) {
      const loginUrl = new URL(ROUTES.WELCOME, request.url)
      loginUrl.searchParams.set('returnTo', `${pathname}${search}`)
      return NextResponse.redirect(loginUrl)
    }

    jwt.verify(token, jwtSecret)
    return NextResponse.next()
  } catch {
    const loginUrl = new URL(ROUTES.WELCOME, request.url)
    loginUrl.searchParams.set('returnTo', `${pathname}${search}`)
    const response = NextResponse.redirect(loginUrl)
    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: '',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      expires: new Date(0),
    })
    return response
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
