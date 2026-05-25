import { NextRequest, NextResponse } from 'next/server'

import {
  AUTH_COOKIE_NAME,
  MESSAGES,
  MIN_PASSWORD_LENGTH,
} from '@/lib/constants'
import { clearAllTempAdminSessions, rotateTempAdminAccess } from '@/lib/temp-admin-control'

export async function POST(request: NextRequest) {
  try {
    const configuredSecret = process.env.TEMP_ADMIN_BREAKGLASS_SECRET
    if (!configuredSecret) {
      return NextResponse.json(
        { error: MESSAGES.ADMIN_BREAKGLASS_NOT_CONFIGURED },
        { status: 503 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const breakglassSecret = String(body?.breakglassSecret || '').trim()
    const newPassphrase = String(body?.newPassphrase || '').trim()
    const revokeExistingSessions = body?.revokeExistingSessions !== false

    if (!breakglassSecret) {
      return NextResponse.json(
        { error: MESSAGES.ADMIN_BREAKGLASS_SECRET_REQUIRED },
        { status: 400 }
      )
    }

    if (breakglassSecret !== configuredSecret) {
      return NextResponse.json(
        { error: MESSAGES.ADMIN_BREAKGLASS_SECRET_INVALID },
        { status: 401 }
      )
    }

    if (newPassphrase.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json(
        { error: `New passphrase must be at least ${MIN_PASSWORD_LENGTH} characters` },
        { status: 400 }
      )
    }

    const result = await rotateTempAdminAccess({
      newPassphrase,
      revokeExistingSessions,
      rotatedBy: 'breakglass',
    })

    if (revokeExistingSessions) {
      clearAllTempAdminSessions()
    }

    const response = NextResponse.json(
      {
        message: MESSAGES.ADMIN_PASSPHRASE_RESET_SUCCESS,
        sessionVersion: result.sessionVersion,
      },
      { status: 200 }
    )

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
  } catch (error) {
    console.error('[admin-reset]', error)
    return NextResponse.json({ error: MESSAGES.ERROR_GENERAL }, { status: 500 })
  }
}
