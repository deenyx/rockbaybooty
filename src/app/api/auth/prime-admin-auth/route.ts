import { NextRequest, NextResponse } from 'next/server'

import {
  MESSAGES,
  PRIME_ADMIN_AUTH_MAX_AGE_SECONDS,
  PRIME_ADMIN_COOKIE_NAME,
  ROUTES,
} from '@/lib/constants'
import {
  createPrimeAdminToken,
  hasConfiguredBreakglassSecret,
  isValidBreakglassSecret,
} from '@/lib/prime-admin'

export async function POST(request: NextRequest) {
  try {
    if (!hasConfiguredBreakglassSecret()) {
      return NextResponse.json(
        { error: MESSAGES.ADMIN_BREAKGLASS_NOT_CONFIGURED },
        { status: 503 }
      )
    }

    const jwtSecret = process.env.JWT_SECRET
    if (!jwtSecret) {
      return NextResponse.json({ error: MESSAGES.ERROR_GENERAL }, { status: 500 })
    }

    const body = await request.json().catch(() => ({}))
    const breakglas = String(body?.breakglas || '').trim()

    if (!breakglas) {
      return NextResponse.json(
        { error: MESSAGES.ADMIN_BREAKGLASS_SECRET_REQUIRED },
        { status: 400 }
      )
    }

    if (!isValidBreakglassSecret(breakglas)) {
      return NextResponse.json(
        { error: MESSAGES.ADMIN_BREAKGLASS_SECRET_INVALID },
        { status: 401 }
      )
    }

    const token = createPrimeAdminToken(jwtSecret)
    const response = NextResponse.json(
      {
        message: MESSAGES.PRIME_ADMIN_UNLOCK_SUCCESS,
        returnTo: ROUTES.ADMIN_AUTH,
      },
      { status: 200 }
    )

    response.cookies.set({
      name: PRIME_ADMIN_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: PRIME_ADMIN_AUTH_MAX_AGE_SECONDS,
    })

    return response
  } catch (error) {
    console.error('[prime-admin-auth]', error)
    return NextResponse.json({ error: MESSAGES.ERROR_GENERAL }, { status: 500 })
  }
}
