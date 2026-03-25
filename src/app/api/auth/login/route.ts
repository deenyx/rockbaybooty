import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'
import { NextRequest, NextResponse } from 'next/server'

import {
  AUTH_COOKIE_NAME,
  AUTH_TOKEN_MAX_AGE_SECONDS,
  MESSAGES,
  ROUTES,
} from '@/lib/constants'

function getSafeReturnTo(returnTo: string | null): string {
  if (!returnTo) {
    return ROUTES.DASHBOARD
  }

  if (!returnTo.startsWith('/') || returnTo.startsWith('//')) {
    return ROUTES.DASHBOARD
  }

  return returnTo
}

function shouldReturnJson(request: NextRequest): boolean {
  const contentType = request.headers.get('content-type') || ''
  return contentType.includes('application/json')
}

async function getLoginInput(request: NextRequest): Promise<{
  personalCode: string
  returnTo: string
}> {
  if (shouldReturnJson(request)) {
    const body = await request.json()

    return {
      personalCode: body.passcode?.trim().toUpperCase() || '',
      returnTo: getSafeReturnTo(body.returnTo || null),
    }
  }

  const formData = await request.formData()

  return {
    personalCode: String(formData.get('passcode') || '').trim().toUpperCase(),
    returnTo: getSafeReturnTo(String(formData.get('returnTo') || '') || null),
  }
}

function getLoginRedirectUrl(request: NextRequest, returnTo: string, error?: string): URL {
  const url = new URL(ROUTES.LOGIN, request.url)
  url.searchParams.set('returnTo', returnTo)

  if (error) {
    url.searchParams.set('error', error)
  }

  return url
}

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const { personalCode, returnTo } = await getLoginInput(request)
    const expectsJson = shouldReturnJson(request)

    if (!personalCode) {
      if (!expectsJson) {
        return NextResponse.redirect(
          getLoginRedirectUrl(request, returnTo, MESSAGES.PASSCODE_REQUIRED)
        )
      }

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
      if (!expectsJson) {
        return NextResponse.redirect(
          getLoginRedirectUrl(request, returnTo, MESSAGES.LOGIN_INVALID)
        )
      }

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
        userId: user.id,
        personalCode: user.personalCode,
      },
      jwtSecret,
      { expiresIn: AUTH_TOKEN_MAX_AGE_SECONDS }
    )

    const response = expectsJson
      ? NextResponse.json(
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
      : NextResponse.redirect(new URL(returnTo || ROUTES.DASHBOARD, request.url))

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