import { NextRequest, NextResponse } from 'next/server'

import { AUTH_COOKIE_NAME, MESSAGES, ROUTES } from '@/lib/constants'

export async function POST(request: NextRequest) {
  const loginUrl = new URL(ROUTES.LOGIN, request.url)
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

  response.headers.set('x-logout-message', MESSAGES.LOGOUT_SUCCESS)
  return response
}