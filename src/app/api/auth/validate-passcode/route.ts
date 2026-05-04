import { NextRequest, NextResponse } from 'next/server'

import { MESSAGES } from '@/lib/constants'

export async function POST(request: NextRequest) {
  try {
    await request.json().catch(() => ({}))

    return NextResponse.json(
      { message: MESSAGES.PASSCODE_VALID },
      { status: 200 }
    )
  } catch (error) {
    console.error('Passcode validation error:', error)
    return NextResponse.json(
      { error: MESSAGES.ERROR_GENERAL },
      { status: 500 }
    )
  }
}