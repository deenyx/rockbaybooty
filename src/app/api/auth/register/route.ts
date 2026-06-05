import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import {
  MIN_PASSWORD_LENGTH,
  MIN_AGE,
  MESSAGES,
  NEW_MEMBER_PIN,
  USERNAME_REGEX,
} from '@/lib/constants'
import { sendVerificationEmail } from '@/lib/email'
import { generateNextAccountName } from '@/lib/account-name'

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
    const rawUsername =
      typeof body.username === 'string'
        ? body.username
        : typeof body.name === 'string'
          ? body.name
          : body.firstName
    const username = typeof rawUsername === 'string' ? rawUsername.trim().toLowerCase() : ''
    const password = typeof body.password === 'string' ? body.password.trim() : ''
    const dateOfBirth = parseDob(body.dateOfBirth)

    if (!email || !EMAIL_REGEX.test(email)) {
      return NextResponse.json({ error: MESSAGES.INVALID_EMAIL }, { status: 400 })
    }

    if (!username) {
      return NextResponse.json({ error: MESSAGES.LOGIN_USER_ID_REQUIRED }, { status: 400 })
    }

    if (!USERNAME_REGEX.test(username)) {
      return NextResponse.json({ error: MESSAGES.INVALID_USER_ID }, { status: 400 })
    }

    if (!dateOfBirth || !isAtLeastMinimumAge(dateOfBirth, MIN_AGE)) {
      return NextResponse.json({ error: MESSAGES.INVALID_DATE_OF_BIRTH }, { status: 400 })
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json({ error: MESSAGES.PASSWORD_MIN_LENGTH }, { status: 400 })
    }

    const existingUsername = await prisma.user.findUnique({
      where: { username },
      select: { id: true },
    })

    if (existingUsername) {
      return NextResponse.json({ error: MESSAGES.USERNAME_EXISTS }, { status: 409 })
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

    const personalCode = crypto.randomBytes(4).toString('hex').toUpperCase()
    const passwordHash = await bcrypt.hash(password, 10)

    const createdUser = await prisma.$transaction(async (tx) => {
      const accountName = await generateNextAccountName(tx)

      return tx.user.create({
        data: {
          email,
          firstName: username,
          displayName: username,
          username,
          accountName,
          personalCode,
          passwordHash,
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
    })

    // Skip email send in development; auto-mark as verified
    if (process.env.NODE_ENV !== 'production') {
      await prisma.user.update({
        where: { email },
        data: { emailVerified: true, emailVerificationToken: null },
      })
    } else {
      try {
        await sendVerificationEmail(email, username, token)
      } catch (error) {
        await prisma.user.delete({ where: { id: createdUser.id } }).catch(() => undefined)

        if (error instanceof Error && error.message === 'Email service is not configured') {
          return NextResponse.json({ error: MESSAGES.EMAIL_SERVICE_UNAVAILABLE }, { status: 503 })
        }

        return NextResponse.json({ error: MESSAGES.ERROR_GENERAL }, { status: 500 })
      }
    }

    // Auto-login after signup (development only, skip if prod)
    if (process.env.NODE_ENV !== 'production') {
      // Fetch the user (should be verified now)
      const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true, username: true, displayName: true, accountName: true, personalCode: true },
      })
      if (user) {
        const jwt = require('jsonwebtoken')
        const { AUTH_COOKIE_NAME, AUTH_TOKEN_MAX_AGE_SECONDS } = require('@/lib/constants')
        const payload = { userId: user.id, personalCode: user.personalCode }
        const jwtSecret = process.env.JWT_SECRET || 'devsecret'
        const token = jwt.sign(payload, jwtSecret, { expiresIn: AUTH_TOKEN_MAX_AGE_SECONDS })
        const response = NextResponse.json(
          {
            message: 'Now, verify your email.',
            pin: NEW_MEMBER_PIN,
            username: user.username,
            user: {
              id: user.id,
              username: user.username,
              accountName: user.accountName,
              displayName: user.displayName,
              personalCode: user.personalCode,
            },
          },
          { status: 200 }
        )
        response.cookies.set({
          name: AUTH_COOKIE_NAME,
          value: token,
          httpOnly: true,
          secure: false,
          sameSite: 'lax',
          path: '/',
          maxAge: AUTH_TOKEN_MAX_AGE_SECONDS,
        })
        return response
      }
    }
    return NextResponse.json(
      {
        message: 'Now, verify your email.',
        pin: NEW_MEMBER_PIN,
        username,
        accountName: createdUser.accountName,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[register]', error)
    return NextResponse.json({ error: MESSAGES.ERROR_GENERAL }, { status: 500 })
  }
}
