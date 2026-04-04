import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'
import {
  CLOSED_GROUP_ENABLED,
  MAX_MEMBER_COUNT,
  MESSAGES,
  REQUIRE_SIGNUP_INVITE,
} from '@/lib/constants'
import { sendVerificationEmail } from '@/lib/email'

const prisma = new PrismaClient()

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const email = body.email?.trim().toLowerCase()
    const firstName = body.firstName?.trim()
    const inviteCodeInput = body.inviteCode?.trim().toUpperCase()

    if (!email || !EMAIL_REGEX.test(email)) {
      return NextResponse.json({ error: MESSAGES.INVALID_EMAIL }, { status: 400 })
    }

    if (!firstName) {
      return NextResponse.json({ error: MESSAGES.FIELD_REQUIRED }, { status: 400 })
    }

    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true, emailVerified: true },
    })

    if (existingUser?.emailVerified) {
      // Don't reveal whether the account exists — just say "check your email"
      return NextResponse.json({ message: MESSAGES.EMAIL_SENT }, { status: 200 })
    }

    if (!existingUser && CLOSED_GROUP_ENABLED) {
      const currentMembers = await prisma.user.count({
        where: {
          status: {
            not: 'deleted',
          },
        },
      })

      if (currentMembers >= MAX_MEMBER_COUNT) {
        return NextResponse.json({ error: MESSAGES.GROUP_FULL }, { status: 403 })
      }

      if (REQUIRE_SIGNUP_INVITE) {
        if (!inviteCodeInput) {
          return NextResponse.json({ error: MESSAGES.INVITE_CODE_REQUIRED }, { status: 400 })
        }

        const inviteCode = await prisma.inviteCode.findUnique({
          where: { code: inviteCodeInput },
          select: { code: true, status: true, usedAt: true },
        })

        if (!inviteCode || inviteCode.status !== 'active' || inviteCode.usedAt) {
          return NextResponse.json({ error: MESSAGES.INVITE_CODE_INVALID }, { status: 401 })
        }
      }
    }

    if (existingUser) {
      // Re-send verification to existing unverified account
      await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          firstName,
          displayName: firstName,
          emailVerificationToken: token,
          emailVerificationExpiresAt: expiresAt,
        },
      })
    } else {
      // Generate a unique username
      const base = firstName.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 12) || 'member'
      let username = base + Math.floor(1000 + Math.random() * 9000)
      let taken = await prisma.user.findUnique({ where: { username } })
      let attempts = 0
      while (taken && attempts < 20) {
        username = base + Math.floor(1000 + Math.random() * 9000)
        taken = await prisma.user.findUnique({ where: { username } })
        attempts++
      }

      const personalCode = crypto.randomBytes(4).toString('hex').toUpperCase()

      await prisma.user.create({
        data: {
          email,
          firstName,
          displayName: firstName,
          username,
          personalCode,
          emailVerificationToken: token,
          emailVerificationExpiresAt: expiresAt,
          onboardingStep: 'passcode',
        },
      })

      if (CLOSED_GROUP_ENABLED && REQUIRE_SIGNUP_INVITE && inviteCodeInput) {
        await prisma.inviteCode.update({
          where: { code: inviteCodeInput },
          data: {
            status: 'used',
            usedAt: new Date(),
          },
        })
      }
    }

    await sendVerificationEmail(email, firstName, token)

    return NextResponse.json({ message: MESSAGES.EMAIL_SENT }, { status: 200 })
  } catch (error) {
    console.error('[register]', error)
    return NextResponse.json({ error: MESSAGES.ERROR_GENERAL }, { status: 500 })
  }
}
