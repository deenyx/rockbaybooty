import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import { NextRequest, NextResponse } from 'next/server'

import prisma from '@/lib/prisma'
import {
  AUTH_COOKIE_NAME,
  MESSAGES,
  ROUTES,
  TEMP_ADMIN_AUTH_MAX_AGE_SECONDS,
} from '@/lib/constants'

const TEMP_ADMIN_USERNAME_BASE = 'temp_admin'
const TEMP_ADMIN_EMAIL = 'temp-admin@fuxem.local'
const TEMP_ADMIN_DISPLAY_NAME = 'Temporary Admin'

function generatePersonalCode(): string {
  return crypto.randomBytes(4).toString('hex').toUpperCase()
}

function generateTempUsername(seed = ''): string {
  const suffix = seed || crypto.randomBytes(2).toString('hex')
  return `${TEMP_ADMIN_USERNAME_BASE}_${suffix}`
}

async function createOrGetTempAdmin() {
  const existingByEmail = await prisma.user.findUnique({
    where: { email: TEMP_ADMIN_EMAIL },
    select: { id: true, username: true, displayName: true, personalCode: true, isAdmin: true },
  })

  if (existingByEmail) {
    if (!existingByEmail.isAdmin) {
      const elevated = await prisma.user.update({
        where: { id: existingByEmail.id },
        data: {
          isAdmin: true,
          status: 'active',
          emailVerified: true,
          onboardingStep: 'completed',
        },
        select: { id: true, username: true, displayName: true, personalCode: true },
      })
      return elevated
    }

    return existingByEmail
  }

  let username = generateTempUsername('core')
  let usernameExists = await prisma.user.findUnique({ where: { username }, select: { id: true } })
  while (usernameExists) {
    username = generateTempUsername()
    usernameExists = await prisma.user.findUnique({ where: { username }, select: { id: true } })
  }

  let personalCode = generatePersonalCode()
  let codeExists = await prisma.user.findUnique({ where: { personalCode }, select: { id: true } })
  while (codeExists) {
    personalCode = generatePersonalCode()
    codeExists = await prisma.user.findUnique({ where: { personalCode }, select: { id: true } })
  }

  return prisma.user.create({
    data: {
      email: TEMP_ADMIN_EMAIL,
      username,
      displayName: TEMP_ADMIN_DISPLAY_NAME,
      firstName: TEMP_ADMIN_DISPLAY_NAME,
      personalCode,
      passwordHash: 'TEMP_ADMIN_PASS_ONLY',
      status: 'active',
      emailVerified: true,
      onboardingStep: 'completed',
      isAdmin: true,
      profile: {
        create: {
          isPublic: false,
        },
      },
    },
    select: { id: true, username: true, displayName: true, personalCode: true },
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const passphrase = String(body?.passphrase || '').trim()

    if (!passphrase) {
      return NextResponse.json({ error: MESSAGES.ADMIN_PASSPHRASE_REQUIRED }, { status: 400 })
    }

    const expected = process.env.TEMP_ADMIN_PASSPHRASE || 'alljackedup'
    if (passphrase !== expected) {
      return NextResponse.json({ error: MESSAGES.ADMIN_PASSPHRASE_INVALID }, { status: 401 })
    }

    const jwtSecret = process.env.JWT_SECRET
    if (!jwtSecret) {
      return NextResponse.json({ error: MESSAGES.ERROR_GENERAL }, { status: 500 })
    }

    const adminUser = await createOrGetTempAdmin()

    const token = jwt.sign(
      {
        userId: adminUser.id,
        personalCode: adminUser.personalCode,
        mode: 'default-member',
        username: adminUser.username,
      },
      jwtSecret,
      { expiresIn: TEMP_ADMIN_AUTH_MAX_AGE_SECONDS }
    )

    const response = NextResponse.json(
      {
        message: MESSAGES.LOGIN_SUCCESS,
        returnTo: ROUTES.ADMIN,
        user: adminUser,
      },
      { status: 200 }
    )

    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: TEMP_ADMIN_AUTH_MAX_AGE_SECONDS,
    })

    return response
  } catch (error) {
    console.error('[admin-auth]', error)
    return NextResponse.json({ error: MESSAGES.ERROR_GENERAL }, { status: 500 })
  }
}
