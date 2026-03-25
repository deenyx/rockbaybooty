import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'
import { NextRequest, NextResponse } from 'next/server'

import {
  AUTH_COOKIE_NAME,
  AUTH_TOKEN_MAX_AGE_SECONDS,
  MESSAGES,
} from '@/lib/constants'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const personalCode = body.passcode?.trim().toUpperCase()

    if (!personalCode) {
      return NextResponse.json(
        { error: MESSAGES.PASSCODE_REQUIRED },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { personalCode },
      select: {
        id: true,
        username: true,
        displayName: true,
        personalCode: true,
        status: true,
      },
    })

    if (!user || user.status !== 'active') {
      return NextResponse.json(
        { error: MESSAGES.LOGIN_INVALID },
        { status: 401 }
      )
    }

    const jwtSecret = process.env.JWT_SECRET
    if (!jwtSecret) {
      return NextResponse.json(
        { error: MESSAGES.ERROR_GENERAL },
        { status: 500 }
      )
    }

    const token = jwt.sign(
      {
        sub: user.id,
        username: user.username,
      },
      jwtSecret,
      { expiresIn: AUTH_TOKEN_MAX_AGE_SECONDS }
    )

    const response = NextResponse.json(
      {
        message: MESSAGES.LOGIN_SUCCESS,
        user: {
          id: user.id,
          username: user.username,
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
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: AUTH_TOKEN_MAX_AGE_SECONDS,
    })

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: MESSAGES.ERROR_GENERAL },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}