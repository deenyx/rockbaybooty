import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'
import { sendAssignedPinEmail } from '@/lib/email'

const prisma = new PrismaClient()

function normalizeNameForMatch(name: string) {
  return name.trim().toLowerCase()
}

async function generateNameBasedLoginPin(userId: string, name: string): Promise<string> {
  const normalizedName = normalizeNameForMatch(name)

  const priorCount = await prisma.user.count({
    where: {
      id: { not: userId },
      emailVerified: true,
      loginPin: { not: null },
      firstName: {
        equals: normalizedName,
        mode: 'insensitive',
      },
    },
  })

  const pinNumber = 5555 + priorCount * 2
  if (pinNumber > 9999) {
    throw new Error('PIN range exhausted for this name')
  }

  return String(pinNumber)
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
        email: true,
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

    if (!user.firstName) {
      return NextResponse.redirect(new URL('/signup?error=invalid_name', request.url))
    }

    const loginPin = await generateNameBasedLoginPin(user.id, user.firstName)

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

    if (user.email) {
      await sendAssignedPinEmail(user.email, user.firstName, loginPin)
    }

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
