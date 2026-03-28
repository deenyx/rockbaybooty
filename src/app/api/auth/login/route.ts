import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'
import { NextRequest, NextResponse } from 'next/server'

import {
  AUTH_COOKIE_NAME,
  AUTH_TOKEN_MAX_AGE_SECONDS,
  MESSAGES,
  ROUTES,
} from '@/lib/constants'
import { sendLoginAlertEmail } from '@/lib/email'
import type { AuthTokenPayload } from '@/lib/types'

function getSafeReturnTo(returnTo: string | null): string {
  if (!returnTo) {
    return ROUTES.DASHBOARD
  }

  if (!returnTo.startsWith('/') || returnTo.startsWith('//')) {
    return ROUTES.DASHBOARD
  }

  return returnTo
}

const prisma = new PrismaClient()

type ParsedLoginInput = {
  code: string
  firstName: string
  returnTo: string
  requestKind: 'json' | 'form'
}

async function parseLoginInput(request: NextRequest): Promise<ParsedLoginInput> {
  const contentType = request.headers.get('content-type') || ''
  const requestKind: ParsedLoginInput['requestKind'] = contentType.includes('application/json') ? 'json' : 'form'

  if (requestKind === 'json') {
    const body = await request.json()
    return {
      code: (body.passcode || body.pin || '').trim(),
      firstName: (body.firstName || '').trim().toLowerCase(),
      returnTo: getSafeReturnTo(body.returnTo || null),
      requestKind,
    }
  }

  const formData = await request.formData()
  return {
    code: String(formData.get('passcode') || '').trim(),
    firstName: String(formData.get('firstName') || '').trim().toLowerCase(),
    returnTo: getSafeReturnTo(String(formData.get('returnTo') || ROUTES.DASHBOARD)),
    requestKind,
  }
}

function withAuthCookie(response: NextResponse, token: string) {
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
}

function buildErrorResponse(request: NextRequest, kind: ParsedLoginInput['requestKind'], error: string, status: number) {
  if (kind === 'json') {
    return NextResponse.json({ error }, { status })
  }

  const loginUrl = new URL(ROUTES.LOGIN, request.url)
  loginUrl.searchParams.set('error', error)
  return NextResponse.redirect(loginUrl)
}

function buildSuccessResponse(kind: ParsedLoginInput['requestKind'], returnTo: string, payload: {
  message: string
  user: {
    id: string
    username: string
    displayName: string
    personalCode: string
  }
}, request: NextRequest) {
  if (kind === 'json') {
    return NextResponse.json({ ...payload, returnTo }, { status: 200 })
  }

  return NextResponse.redirect(new URL(returnTo, request.url))
}

export async function POST(request: NextRequest) {
  try {
    const { code, firstName, returnTo, requestKind } = await parseLoginInput(request)

    if (!code) {
      return buildErrorResponse(request, requestKind, MESSAGES.PASSCODE_REQUIRED, 400)
    }

    const jwtSecret = process.env.JWT_SECRET
    if (!jwtSecret) {
      return buildErrorResponse(request, requestKind, MESSAGES.ERROR_GENERAL, 500)
    }

    // Local QA shortcut: 0000 routes to onboarding with passcode prefilled.
    if (code === '0000') {
      const onboardingPath = `${ROUTES.ONBOARDING}?passcode=0000`

      if (requestKind === 'json') {
        return NextResponse.json(
          { message: MESSAGES.PASSCODE_VALID, returnTo: onboardingPath },
          { status: 200 }
        )
      }

      return NextResponse.redirect(new URL(onboardingPath, request.url))
    }

    // Local QA shortcut: 9999 enters static default-member dashboard preview mode.
    if (code === '9999') {
      const previewPayload: AuthTokenPayload = {
        userId: 'default-member',
        personalCode: code,
        mode: 'default-member',
      }

      const token = jwt.sign(previewPayload, jwtSecret, {
        expiresIn: AUTH_TOKEN_MAX_AGE_SECONDS,
      })

      const response = buildSuccessResponse(
        requestKind,
        returnTo,
        {
          message: MESSAGES.LOGIN_SUCCESS,
          user: {
            id: 'default-member',
            username: 'default_member',
            displayName: 'Default Member',
            personalCode: code,
          },
        },
        request
      )

      return withAuthCookie(response, token)
    }

    let user: {
      id: string
      username: string
      displayName: string
      personalCode: string
      firstName: string | null
      email: string | null
      status: string
      emailVerified: boolean
    } | null = null

    if (firstName) {
      user = await prisma.user.findUnique({
        where: { loginPin: code },
        select: {
          id: true,
          username: true,
          displayName: true,
          personalCode: true,
          firstName: true,
          email: true,
          status: true,
          emailVerified: true,
        },
      })

      if (!user || user.status !== 'active' || !user.emailVerified) {
        return buildErrorResponse(request, requestKind, MESSAGES.LOGIN_INVALID, 401)
      }

      if ((user.firstName?.trim().toLowerCase() ?? '') !== firstName) {
        return buildErrorResponse(request, requestKind, MESSAGES.LOGIN_INVALID, 401)
      }
    } else {
      user = await prisma.user.findUnique({
        where: { personalCode: code.toUpperCase() },
        select: {
          id: true,
          username: true,
          displayName: true,
          personalCode: true,
          firstName: true,
          email: true,
          status: true,
          emailVerified: true,
        },
      })

      if (!user || user.status !== 'active') {
        return buildErrorResponse(request, requestKind, MESSAGES.LOGIN_INVALID, 401)
      }
    }

    const token = jwt.sign(
      {
        userId: user.id,
        personalCode: user.personalCode,
      },
      jwtSecret,
      { expiresIn: AUTH_TOKEN_MAX_AGE_SECONDS }
    )

    // Send login alert in background — do not await
    if (user.email) {
      sendLoginAlertEmail(user.email, user.firstName ?? user.displayName)
    }

    const response = buildSuccessResponse(
      requestKind,
      returnTo,
      {
        message: MESSAGES.LOGIN_SUCCESS,
        user: {
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          personalCode: user.personalCode,
        },
      },
      request
    )

    return withAuthCookie(response, token)
  } catch (error) {
    console.error('Login error:', error)
    return buildErrorResponse(request, 'json', MESSAGES.ERROR_GENERAL, 500)
  }
}
