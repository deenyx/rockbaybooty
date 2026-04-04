import jwt from 'jsonwebtoken'
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

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

type ParsedLoginInput = {
  code: string
  firstName: string
  returnTo: string
  requestKind: 'json' | 'form'
}

type LoginUser = {
  id: string
  username: string
  displayName: string
  personalCode: string
  firstName: string | null
  email: string | null
  status: string
  emailVerified: boolean
}

async function parseLoginInput(request: NextRequest): Promise<ParsedLoginInput> {
  const contentType = request.headers.get('content-type') || ''
  const requestKind: ParsedLoginInput['requestKind'] = contentType.includes('application/json') ? 'json' : 'form'

  if (requestKind === 'json') {
    const body = await request.json()
    return {
      code: (body.passcode || body.pin || '').trim(),
      firstName: (body.name || body.firstName || '').trim().toLowerCase(),
      returnTo: getSafeReturnTo(body.returnTo || null),
      requestKind,
    }
  }

  const formData = await request.formData()
  return {
    code: String(formData.get('passcode') || '').trim(),
    firstName: String(formData.get('name') || formData.get('firstName') || '').trim().toLowerCase(),
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

async function generateUniquePersonalCode(baseCode: string) {
  const normalizedBase = baseCode.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12)
  let attempt = 0

  while (attempt < 10) {
    const suffix = attempt === 0 ? '' : String(attempt)
    const personalCode = `${normalizedBase}${suffix}`.slice(0, 12)
    const existing = await prisma.user.findUnique({
      where: { personalCode },
      select: { id: true },
    })

    if (!existing) {
      return personalCode
    }

    attempt += 1
  }

  const fallback = `DEFAULT${Date.now().toString().slice(-6)}`
  return fallback
}

async function getOrCreateDefaultUser(): Promise<LoginUser> {
  const existing = await prisma.user.findUnique({
    where: { username: 'defaultuser' },
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

  if (existing) {
    if (existing.status !== 'active' || !existing.emailVerified) {
      const reactivated = await prisma.user.update({
        where: { id: existing.id },
        data: {
          status: 'active',
          emailVerified: true,
          firstName: existing.firstName || 'Default',
        },
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

      return reactivated
    }

    return existing
  }

  const personalCode = await generateUniquePersonalCode('DEFAULTUSER')

  const created = await prisma.user.create({
    data: {
      username: 'defaultuser',
      displayName: 'Default User',
      firstName: 'Default',
      personalCode,
      passwordHash: 'LEGACY_PREVIEW_ACCOUNT',
      emailVerified: true,
      status: 'active',
      onboardingStep: 'completed',
      profile: {
        create: {
          location: 'Member preview',
          bio: 'Default account for preview and quick member access.',
          lookingFor: ['Curious'],
          interests: ['Open-minded'],
          isPublic: true,
        },
      },
    },
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

  return created
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

    // Shortcut: 0000 starts account creation.
    if (code === '0000') {
      const signupPath = ROUTES.ONBOARDING

      if (requestKind === 'json') {
        return NextResponse.json(
          { message: MESSAGES.PASSCODE_VALID, returnTo: signupPath },
          { status: 200 }
        )
      }

      return NextResponse.redirect(new URL(signupPath, request.url))
    }

    // Shortcut: 9999 bypasses signup and logs into a backend default account.
    if (code === '9999') {
      const defaultUser = await getOrCreateDefaultUser()

      const defaultUserPayload: AuthTokenPayload = {
        userId: defaultUser.id,
        personalCode: defaultUser.personalCode,
      }

      const token = jwt.sign(defaultUserPayload, jwtSecret, {
        expiresIn: AUTH_TOKEN_MAX_AGE_SECONDS,
      })

      const response = buildSuccessResponse(
        requestKind,
        returnTo,
        {
          message: MESSAGES.LOGIN_SUCCESS,
          user: {
            id: defaultUser.id,
            username: defaultUser.username,
            displayName: defaultUser.displayName,
            personalCode: defaultUser.personalCode,
          },
        },
        request
      )

      return withAuthCookie(response, token)
    }

    let user: LoginUser | null = null

    if (firstName) {
      const pinUser = await prisma.user.findFirst({
        where: {
          loginPin: code,
          firstName: {
            equals: firstName,
            mode: 'insensitive',
          },
        },
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

      if (pinUser && pinUser.status === 'active') {
        // Legacy PIN path — require email verification
        if (!pinUser.emailVerified) {
          return buildErrorResponse(request, requestKind, MESSAGES.EMAIL_VERIFICATION_REQUIRED, 401)
        }
        user = pinUser
      } else {
        // Fallback: match personalCode + first/display name (all onboarded users)
        const codeUser = await prisma.user.findUnique({
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

        const nameMatches =
          codeUser &&
          (codeUser.firstName?.toLowerCase() === firstName.toLowerCase() ||
            codeUser.displayName?.toLowerCase() === firstName.toLowerCase())

        if (!codeUser || codeUser.status !== 'active' || !nameMatches) {
          return buildErrorResponse(request, requestKind, MESSAGES.LOGIN_INVALID, 401)
        }

        user = codeUser
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
