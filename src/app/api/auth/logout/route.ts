import { NextRequest, NextResponse } from 'next/server'

import { AUTH_COOKIE_NAME, MESSAGES, ROUTES } from '@/lib/constants'
import { releaseTempAdminSession } from '@/lib/temp-admin-control'

export async function POST(request: NextRequest) {
  const jwtSecret = process.env.JWT_SECRET
  if (jwtSecret) {
    releaseTempAdminSession(request, jwtSecret)
  }

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

  response.headers.set('x-logout-message', MESSAGES.LOGOUT_SUCCESS)
  return response
}