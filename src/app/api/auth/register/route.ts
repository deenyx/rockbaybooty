import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import crypto from 'crypto'
import {
  MIN_AGE,
  MESSAGES,
  NEW_MEMBER_PIN,
} from '@/lib/constants'
import { sendVerificationEmail } from '@/lib/email'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function parseDob(value: unknown): Date | null {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null
  }

  const date = new Date(`${value}T00:00:00.000Z`)
  if (Number.isNaN(date.getTime())) {
    return null
  }

  const [year, month, day] = value.split('-').map(Number)
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() + 1 !== month ||
    date.getUTCDate() !== day
  ) {
    return null
  }

  return date
}

function calculateAge(dateOfBirth: Date): number {
  const now = new Date()
  let age = now.getFullYear() - dateOfBirth.getUTCFullYear()
  const monthDifference = now.getMonth() - dateOfBirth.getUTCMonth()
  const dayDifference = now.getDate() - dateOfBirth.getUTCDate()

  if (monthDifference < 0 || (monthDifference === 0 && dayDifference < 0)) {
    age -= 1
  }

  return age
}

function isAtLeastMinimumAge(dateOfBirth: Date, minimumAge: number): boolean {
  return calculateAge(dateOfBirth) >= minimumAge
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const email = body.email?.trim().toLowerCase()
    const name = body.name?.trim() || body.firstName?.trim()
    const dateOfBirth = parseDob(body.dateOfBirth)

    if (!email || !EMAIL_REGEX.test(email)) {
      return NextResponse.json({ error: MESSAGES.INVALID_EMAIL }, { status: 400 })
    }

    if (!name) {
      return NextResponse.json({ error: MESSAGES.FIELD_REQUIRED }, { status: 400 })
    }

    if (!dateOfBirth || !isAtLeastMinimumAge(dateOfBirth, MIN_AGE)) {
      return NextResponse.json({ error: MESSAGES.INVALID_DATE_OF_BIRTH }, { status: 400 })
    }

    const existingName = await prisma.user.findFirst({
      where: {
        firstName: {
          equals: name,
          mode: 'insensitive',
        },
      },
      select: { id: true },
    })

    if (existingName) {
      return NextResponse.json({ error: MESSAGES.NAME_EXISTS }, { status: 409 })
    }

    const existingEmail = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    })

    if (existingEmail) {
      return NextResponse.json({ error: MESSAGES.EMAIL_EXISTS }, { status: 409 })
    }

    const age = calculateAge(dateOfBirth)

    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

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
        loginPin: NEW_MEMBER_PIN,
        emailVerificationToken: token,
        emailVerificationExpiresAt: expiresAt,
        onboardingStep: 'passcode',
        profile: {
          create: {
            age,
            dateOfBirth,
          },
        },
      },
    })

    await sendVerificationEmail(email, name, token)

    return NextResponse.json(
      {
        message: 'Verify your email to activate your PIN.',
        pin: NEW_MEMBER_PIN,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[register]', error)
    return NextResponse.json({ error: MESSAGES.ERROR_GENERAL }, { status: 500 })
  }
}
