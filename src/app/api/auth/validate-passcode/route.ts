import { PrismaClient } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'

import { MESSAGES } from '@/lib/constants'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const normalizedPasscode = body.passcode?.trim().toUpperCase()

    if (!normalizedPasscode) {
      return NextResponse.json(
        { error: MESSAGES.PASSCODE_REQUIRED },
        { status: 400 }
      )
    }

    const inviteCode = await prisma.inviteCode.findUnique({
      where: { code: normalizedPasscode },
    })

    if (!inviteCode || inviteCode.status !== 'active') {
      return NextResponse.json(
        { error: MESSAGES.PASSCODE_GATE_INVALID },
        { status: 401 }
      )
    }

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
  } finally {
    await prisma.$disconnect()
  }
}