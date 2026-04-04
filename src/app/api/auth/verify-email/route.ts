import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()

async function generateUniqueLoginPin(): Promise<string> {
  for (let attempt = 0; attempt < 100; attempt++) {
    // Random 4-digit PIN from 1000–9999, never 0000
    const n = Math.floor(1000 + Math.random() * 9000)
    const pin = String(n)
    const existing = await prisma.user.findUnique({
      where: { loginPin: pin },
      select: { id: true },
    })
    if (!existing) return pin
  }
  throw new Error('Could not generate unique login PIN')
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')

  if (!token) {
    return NextResponse.redirect(new URL('/welcome?error=invalid_token', request.url))
  }

  try {
    const user = await prisma.user.findUnique({
      where: { emailVerificationToken: token },
      select: {
        id: true,
        firstName: true,
        emailVerificationExpiresAt: true,
        emailVerified: true,
      },
    })

    if (!user) {
      return NextResponse.redirect(new URL('/welcome?error=invalid_token', request.url))
    }

    if (user.emailVerified) {
      // Already verified — send to login
      return NextResponse.redirect(new URL('/welcome', request.url))
    }

    if (!user.emailVerificationExpiresAt || user.emailVerificationExpiresAt < new Date()) {
      return NextResponse.redirect(new URL('/signup?error=expired', request.url))
    }

    const loginPin = await generateUniqueLoginPin()

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        loginPin,
        emailVerificationToken: null,
        emailVerificationExpiresAt: null,
        onboardingStep: 'completed',
      },
    })

    const jwtSecret = process.env.JWT_SECRET
    if (!jwtSecret) {
      console.error('[verify-email] JWT_SECRET not set')
      return NextResponse.redirect(new URL('/welcome?error=server', request.url))
    }

    // Short-lived token for the pin-reveal page (15 minutes)
    const revealToken = jwt.sign(
      { userId: user.id, pin: loginPin, type: 'pin-reveal' },
      jwtSecret,
      { expiresIn: '15m' }
    )

    const response = NextResponse.redirect(new URL('/pin-reveal', request.url))
    response.cookies.set({
      name: 'pin-reveal-token',
      value: revealToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 900, // 15 minutes
    })

    return response
  } catch (error) {
    console.error('[verify-email]', error)
    return NextResponse.redirect(new URL('/welcome?error=server', request.url))
  }
}
