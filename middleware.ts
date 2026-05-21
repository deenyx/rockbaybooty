import { NextRequest, NextResponse } from 'next/server'

import { AUTH_COOKIE_NAME, MESSAGES, ROUTES } from '@/lib/constants'

// Only onboarding, welcome, login, signup, and home are public
const PUBLIC_PATHS = ['/', '/welcome', '/onboarding', '/log-in', '/login', '/signup', '/pin-reveal', '/admin_auth'];
const DEV_BOGUS_POST_PATHS = new Set([
  '/action',
  '/submit',
  '/_rsc',
  '/api/server-actions',
  '/api/server-action',
])

function isBogusDevProbe(request: NextRequest): boolean {
  if (process.env.NODE_ENV !== 'development') {
    return false
  }

  if (request.method !== 'POST') {
    return false
  }

  const pathname = request.nextUrl.pathname
  const nextAction = request.headers.get('next-action')

  // Some browser tools/extensions send fake Server Action calls (next-action: x)
  // and posts to non-app action endpoints during local development.
  if (nextAction === 'x') {
    return true
  }

  if (DEV_BOGUS_POST_PATHS.has(pathname)) {
    return true
  }

  return false
}

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

type TokenPayload = {
  exp?: number
  mode?: string
}

function getTokenPayload(token: string): TokenPayload | null {
  const parts = token.split('.')

  if (parts.length !== 3) {
    return null
  }

  const payloadJson = decodeBase64Url(parts[1])

  if (!payloadJson) {
    return null
  }

  try {
    return JSON.parse(payloadJson) as TokenPayload
  } catch {
    return null
  }
}

function isLikelyValidToken(payload: TokenPayload): boolean {
  if (typeof payload.exp !== 'number') {
    return true
  }

  const nowInSeconds = Math.floor(Date.now() / 1000)
  return payload.exp > nowInSeconds
}

function isBlockedReadOnlyMutation(pathname: string, method: string): boolean {
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase())) {
    return false
  }

  if (pathname === '/api/auth/logout') {
    return false
  }

  return pathname.startsWith('/api/')
}

function buildReadOnlyResponse(request: NextRequest): NextResponse {
  if (request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.json({ error: MESSAGES.PREVIEW_READ_ONLY }, { status: 403 })
  }

  return NextResponse.redirect(new URL(ROUTES.DASHBOARD, request.url))
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const search = request.nextUrl.search

  if (isBogusDevProbe(request)) {
    return new NextResponse(null, { status: 204 })
  }

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
    const payload = getTokenPayload(token)

    if (!payload || !isLikelyValidToken(payload)) {
      throw new Error('Invalid token payload')
    }

    if (payload.mode === 'burner-preview' && isBlockedReadOnlyMutation(pathname, request.method)) {
      return buildReadOnlyResponse(request)
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
