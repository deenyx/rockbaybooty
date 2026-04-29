import crypto from 'crypto'
import { NextRequest, NextResponse } from 'next/server'

import prisma from '@/lib/prisma'
import { MESSAGES } from '@/lib/constants'
import { sendCredentialResetEmail } from '@/lib/email'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''

    // Always return success-like response to prevent account enumeration.
    if (!email || !EMAIL_REGEX.test(email)) {
      return NextResponse.json({ message: MESSAGES.RESET_REQUEST_SENT }, { status: 200 })
    }

    const user = await prisma.user.findFirst({
      where: {
        email: {
          equals: email,
          mode: 'insensitive',
        },
      },
      select: {
        id: true,
        email: true,
        firstName: true,
      },
    })

    if (!user?.email) {
      return NextResponse.json({ message: MESSAGES.RESET_REQUEST_SENT }, { status: 200 })
    }

    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000)

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: token,
        passwordResetExpiresAt: expiresAt,
      },
    })

    try {
      await sendCredentialResetEmail(user.email, user.firstName || 'there', token)
    } catch (error) {
      console.error('[request-reset] sendCredentialResetEmail failed', error)
    }

    return NextResponse.json({ message: MESSAGES.RESET_REQUEST_SENT }, { status: 200 })
  } catch (error) {
    console.error('[request-reset]', error)
    return NextResponse.json({ error: MESSAGES.ERROR_GENERAL }, { status: 500 })
  }
}
