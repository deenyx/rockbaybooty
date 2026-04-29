import bcrypt from 'bcryptjs'
import { NextRequest, NextResponse } from 'next/server'

import prisma from '@/lib/prisma'
import { MESSAGES, MIN_PASSWORD_LENGTH } from '@/lib/constants'

const PIN_REGEX = /^\d{4}$/

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const token = typeof body.token === 'string' ? body.token.trim() : ''
    const password = typeof body.password === 'string' ? body.password : ''
    const loginPin = typeof body.loginPin === 'string' ? body.loginPin.trim() : ''

    if (!token) {
      return NextResponse.json({ error: MESSAGES.RESET_TOKEN_INVALID }, { status: 400 })
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json({ error: MESSAGES.PASSWORD_MIN_LENGTH }, { status: 400 })
    }

    if (!PIN_REGEX.test(loginPin)) {
      return NextResponse.json({ error: 'PIN must be exactly 4 digits' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { passwordResetToken: token },
      select: {
        id: true,
        passwordResetExpiresAt: true,
      },
    })

    if (!user || !user.passwordResetExpiresAt || user.passwordResetExpiresAt < new Date()) {
      return NextResponse.json({ error: MESSAGES.RESET_TOKEN_INVALID }, { status: 400 })
    }

    const passwordHash = await bcrypt.hash(password, 10)

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        loginPin,
        passwordResetToken: null,
        passwordResetExpiresAt: null,
      },
    })

    return NextResponse.json({ message: MESSAGES.RESET_SUCCESS }, { status: 200 })
  } catch (error) {
    console.error('[reset-credentials]', error)
    return NextResponse.json({ error: MESSAGES.ERROR_GENERAL }, { status: 500 })
  }
}
