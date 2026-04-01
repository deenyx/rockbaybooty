import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'
import {
  MIN_AGE,
  MESSAGES,
} from '@/lib/constants'
import { sendVerificationEmail } from '@/lib/email'

const prisma = new PrismaClient()

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const email = body.email?.trim().toLowerCase()
    const name = body.name?.trim() || body.firstName?.trim()
    const age = Number.parseInt(String(body.age || ''), 10)

    if (!email || !EMAIL_REGEX.test(email)) {
      return NextResponse.json({ error: MESSAGES.INVALID_EMAIL }, { status: 400 })
    }

    if (!name) {
      return NextResponse.json({ error: MESSAGES.FIELD_REQUIRED }, { status: 400 })
    }

    if (!Number.isFinite(age) || age < MIN_AGE) {
      return NextResponse.json({ error: MESSAGES.INVALID_AGE }, { status: 400 })
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

    if (existingUser) {
      // Re-send verification to existing unverified account
      await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          firstName: name,
          displayName: name,
          emailVerificationToken: token,
          emailVerificationExpiresAt: expiresAt,
          profile: {
            upsert: {
              create: {
                age,
              },
              update: {
                age,
              },
            },
          },
        },
      })
    } else {
      // Generate a unique username
      const base = name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 12) || 'member'
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
          firstName: name,
          displayName: name,
          username,
          personalCode,
          emailVerificationToken: token,
          emailVerificationExpiresAt: expiresAt,
          onboardingStep: 'passcode',
          profile: {
            create: {
              age,
            },
          },
        },
      })
    }

    await sendVerificationEmail(email, name, token)

    return NextResponse.json({ message: MESSAGES.EMAIL_SENT }, { status: 200 })
  } catch (error) {
    console.error('[register]', error)
    return NextResponse.json({ error: MESSAGES.ERROR_GENERAL }, { status: 500 })
  }
}
