import { NextRequest, NextResponse } from 'next/server'

import { AUTH_COOKIE_NAME, MESSAGES, ROUTES, SESSION_MODE_COOKIE_NAME } from '@/lib/constants'

export async function POST(request: NextRequest) {
  const homeUrl = new URL(ROUTES.HOME, request.url)
  const response = NextResponse.redirect(homeUrl)

  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: new Date(0),
  })

  response.cookies.set({
    name: SESSION_MODE_COOKIE_NAME,
    value: '',
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: new Date(0),
  })

  response.headers.set('x-logout-message', MESSAGES.LOGOUT_SUCCESS)
  return response
}