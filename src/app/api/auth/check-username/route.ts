import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

import { MESSAGES } from '@/lib/constants'

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const username = body.username?.trim().toLowerCase()

    if (!username || !USERNAME_REGEX.test(username)) {
      return NextResponse.json(
        { error: MESSAGES.INVALID_USER_ID },
        { status: 400 }
      )
    }

    const existingUser = await prisma.user.findFirst({
      where: { username },
      select: { id: true },
    })

    return NextResponse.json(
      { available: !existingUser },
      { status: 200 }
    )
  } catch (error) {
    console.error('Username availability error:', error)
    return NextResponse.json(
      { error: MESSAGES.ERROR_GENERAL },
      { status: 500 }
    )
  }
}
