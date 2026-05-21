import { NextRequest, NextResponse } from 'next/server'

import {
  BURNER_PREVIEW_PIN,
  MESSAGES,
  NEW_MEMBER_PIN,
  QUICK_JOIN_PIN,
  ROUTES,
} from '@/lib/constants'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const passcode = String(body?.passcode || body?.pin || '').trim()

    if (!passcode) {
      return NextResponse.json(
        { error: MESSAGES.ENTRY_PIN_REQUIRED },
        { status: 400 }
      )
    }

    if (passcode === QUICK_JOIN_PIN) {
      return NextResponse.json(
        { message: MESSAGES.PASSCODE_VALID, returnTo: ROUTES.SIGNUP },
        { status: 200 }
      )
    }

    if (passcode === NEW_MEMBER_PIN) {
      return NextResponse.json(
        { message: MESSAGES.PASSCODE_VALID, returnTo: ROUTES.LOGIN },
        { status: 200 }
      )
    }

    if (passcode === BURNER_PREVIEW_PIN) {
      return NextResponse.json(
        { message: MESSAGES.PASSCODE_VALID, returnTo: ROUTES.LOGIN, preview: true },
        { status: 200 }
      )
    }

    return NextResponse.json(
      { error: MESSAGES.ACCESS_CODE_INVALID },
      { status: 401 }
    )
  } catch (error) {
    console.error('Passcode validation error:', error)
    return NextResponse.json(
      { error: MESSAGES.ERROR_GENERAL },
      { status: 500 }
    )
  }
}