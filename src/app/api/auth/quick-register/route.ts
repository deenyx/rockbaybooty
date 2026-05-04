import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import prisma from '@/lib/prisma'

import {
  AUTH_COOKIE_NAME,
  AUTH_TOKEN_MAX_AGE_SECONDS,
  MESSAGES,
  MIN_AGE,
} from '@/lib/constants'

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/

function generatePersonalCode(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase()
}

function parseDob(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const date = new Date(`${value}T00:00:00.000Z`)
  if (Number.isNaN(date.getTime())) return null
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

function isAtLeastMinimumAge(dateOfBirth: Date, minimumAge: number): boolean {
  const now = new Date()
  const threshold = new Date(now)
  threshold.setFullYear(now.getFullYear() - minimumAge)
  return dateOfBirth <= threshold
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const displayName = body.displayName?.trim()
    const username = body.username?.trim().toLowerCase()
    const dobInput = body.dateOfBirth?.trim()

    if (!displayName) {
      return NextResponse.json({ error: 'Display name is required' }, { status: 400 })
    }

    if (!username || !USERNAME_REGEX.test(username)) {
      return NextResponse.json(
        { error: MESSAGES.INVALID_USER_ID },
        { status: 400 }
      )
    }

    if (!dobInput) {
      return NextResponse.json({ error: MESSAGES.INVALID_DATE_OF_BIRTH }, { status: 400 })
    }

    const dob = parseDob(dobInput)
    if (!dob) {
      return NextResponse.json({ error: MESSAGES.INVALID_DATE_OF_BIRTH }, { status: 400 })
    }

    if (!isAtLeastMinimumAge(dob, MIN_AGE)) {
      return NextResponse.json(
        { error: `You must be at least ${MIN_AGE} to join` },
        { status: 403 }
      )
    }

    const existing = await prisma.user.findUnique({ where: { username } })
    if (existing) {
      return NextResponse.json({ error: MESSAGES.USERNAME_EXISTS }, { status: 409 })
    }

    // Generate a unique personalCode — this becomes the member's PIN
    let personalCode = generatePersonalCode()
    while (await prisma.user.findUnique({ where: { personalCode } })) {
      personalCode = generatePersonalCode()
    }

    // No passwords — hash the personalCode as the dummy passwordHash
    const passwordHash = await bcrypt.hash(personalCode, 10)

    const user = await prisma.user.create({
      data: {
        username,
        displayName,
        personalCode,
        passwordHash,
        onboardingStep: 'completed',
        status: 'active',
        profile: {
          create: {
            dateOfBirth: dob,
          },
        },
      },
    })

    const jwtSecret = process.env.JWT_SECRET
    if (!jwtSecret) {
      return NextResponse.json({ error: MESSAGES.ERROR_GENERAL }, { status: 500 })
    }

    const token = jwt.sign(
      { userId: user.id, personalCode: user.personalCode },
      jwtSecret,
      { expiresIn: AUTH_TOKEN_MAX_AGE_SECONDS }
    )

    const response = NextResponse.json({
      message: MESSAGES.ACCOUNT_CREATED,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        personalCode: user.personalCode,
      },
      pin: personalCode,
    })

    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: AUTH_TOKEN_MAX_AGE_SECONDS,
    })

    return response
  } catch (error) {
    console.error('Quick register error:', error)
    return NextResponse.json({ error: MESSAGES.ERROR_GENERAL }, { status: 500 })
  }
}
