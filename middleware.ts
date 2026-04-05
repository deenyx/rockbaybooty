import { NextRequest, NextResponse } from 'next/server'

import { AUTH_COOKIE_NAME, ROUTES } from '@/lib/constants'

const PUBLIC_PATHS = [ROUTES.HOME, ROUTES.WELCOME, ROUTES.ONBOARDING, ROUTES.LOG_IN, ROUTES.LOGIN, ROUTES.SIGNUP, ROUTES.PIN_REVEAL]

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some((path) => {
    if (path === ROUTES.HOME) {
      return pathname === ROUTES.HOME
    }

    return pathname === path || pathname.startsWith(`${path}/`)
  })
}

function decodeBase64Url(value: string): string | null {
  try {
    const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4)
    return atob(padded)
  } catch {
    return null
  }
}

function isLikelyValidToken(token: string): boolean {
  const parts = token.split('.')

  if (parts.length !== 3) {
    return false
  }

  const payloadJson = decodeBase64Url(parts[1])

  if (!payloadJson) {
    return false
  }

  try {
    const payload = JSON.parse(payloadJson) as { exp?: number }

    if (typeof payload.exp !== 'number') {
      return true
    }

    const nowInSeconds = Math.floor(Date.now() / 1000)
    return payload.exp > nowInSeconds
  } catch {
    return false
  }
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
    const loginUrl = new URL(ROUTES.LOGIN, request.url)
    loginUrl.searchParams.set('returnTo', `${pathname}${search}`)
    return NextResponse.redirect(loginUrl)
  }

  try {
    if (!isLikelyValidToken(token)) {
      throw new Error('Invalid token payload')
    }

    return NextResponse.next()
  } catch {
    const loginUrl = new URL(ROUTES.LOGIN, request.url)
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
