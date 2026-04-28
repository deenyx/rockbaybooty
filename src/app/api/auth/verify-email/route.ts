import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { sendAssignedPinEmail } from '@/lib/email'
import { NEW_MEMBER_PIN } from '@/lib/constants'

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
      return NextResponse.redirect(new URL('/login?verified=1', request.url))
    }

    if (!user.emailVerificationExpiresAt || user.emailVerificationExpiresAt < new Date()) {
      return NextResponse.redirect(new URL('/signup?error=expired', request.url))
    }

    if (!user.firstName) {
      return NextResponse.redirect(new URL('/signup?error=invalid_name', request.url))
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpiresAt: null,
        onboardingStep: 'completed',
      },
    })

    if (user.email) {
      sendAssignedPinEmail(user.email, user.firstName, NEW_MEMBER_PIN)
    }

    return NextResponse.redirect(new URL('/login?verified=1', request.url))
  } catch (error) {
    console.error('[verify-email]', error)
    return NextResponse.redirect(new URL('/welcome?error=server', request.url))
  }
}
