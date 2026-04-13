import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
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
  identifier: string
  secret: string
  secretType: 'password' | 'passcode'
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
  loginPin: string | null
  passwordHash: string | null
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
      identifier: (body.identifier || body.email || body.username || '').trim().toLowerCase(),
      secret: (body.secret || body.password || '').trim(),
      secretType: body.secretType === 'passcode' ? 'passcode' : 'password',
      returnTo: getSafeReturnTo(body.returnTo || null),
      requestKind,
    }
  }

  const formData = await request.formData()
  return {
    code: String(formData.get('passcode') || '').trim(),
    firstName: String(formData.get('name') || formData.get('firstName') || '').trim().toLowerCase(),
    identifier: String(formData.get('identifier') || formData.get('email') || formData.get('username') || '').trim().toLowerCase(),
    secret: String(formData.get('secret') || formData.get('password') || '').trim(),
    secretType: String(formData.get('secretType') || 'password') === 'passcode' ? 'passcode' : 'password',
    returnTo: getSafeReturnTo(String(formData.get('returnTo') || ROUTES.DASHBOARD)),
    requestKind,
  }
}

const loginUserSelect = {
  id: true,
  username: true,
  displayName: true,
  personalCode: true,
  firstName: true,
  email: true,
  loginPin: true,
  passwordHash: true,
  status: true,
  emailVerified: true,
} as const

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
  const TEST_EMAIL = 'test@fuxem.xyz'
  const TEST_PASSWORD = 'testuserpass'
  const bcrypt = require('bcryptjs')
  const passwordHash = await bcrypt.hash(TEST_PASSWORD, 10)

  let existing = await prisma.user.findUnique({
    where: { username: 'defaultuser' },
    select: loginUserSelect,
  })

  if (existing) {
    // Patch any missing/incorrect fields
    let needsUpdate = false
    const updateData: any = {}
    if (existing.status !== 'active') {
      updateData.status = 'active'
      needsUpdate = true
    }
    if (!existing.emailVerified) {
      updateData.emailVerified = true
      needsUpdate = true
    }
    if (!existing.firstName || existing.firstName !== 'Default') {
      updateData.firstName = 'Default'
      needsUpdate = true
    }
    if (!existing.email || existing.email !== TEST_EMAIL) {
      updateData.email = TEST_EMAIL
      needsUpdate = true
    }
    if (!existing.passwordHash || existing.passwordHash === 'LEGACY_PREVIEW_ACCOUNT') {
      updateData.passwordHash = passwordHash
      needsUpdate = true
    }
    if (needsUpdate) {
      existing = await prisma.user.update({
        where: { id: existing.id },
        data: updateData,
        select: loginUserSelect,
      })
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
      passwordHash,
      email: TEST_EMAIL,
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
    select: loginUserSelect,
  })

  return created
}

export async function POST(request: NextRequest) {
  try {
    const { code, firstName, identifier, secret, secretType, returnTo, requestKind } = await parseLoginInput(request)

    const jwtSecret = process.env.JWT_SECRET
    if (!jwtSecret) {
      return buildErrorResponse(request, requestKind, MESSAGES.ERROR_GENERAL, 500)
    }

    if (!code && !(identifier && secret)) {
      return buildErrorResponse(request, requestKind, MESSAGES.ENTRY_PIN_REQUIRED, 400)
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

    // 5555 unlocks credential login mode.
    if (code === '5555' && !identifier && !secret) {
      if (requestKind === 'json') {
        return NextResponse.json(
          {
            message: MESSAGES.PASSCODE_VALID,
            requiresCredentials: true,
            returnTo: ROUTES.LOGIN,
          },
          { status: 200 }
        )
      }

      return NextResponse.redirect(new URL(ROUTES.LOGIN, request.url))
    }

    let user: LoginUser | null = null

    if (code === '5555') {
      if (!identifier || !secret) {
        return buildErrorResponse(request, requestKind, MESSAGES.LOGIN_CREDENTIALS_REQUIRED, 400)
      }

      user = await prisma.user.findFirst({
        where: identifier.includes('@')
          ? { email: identifier }
          : { username: identifier },
        select: loginUserSelect,
      })

      if (!user || user.status !== 'active') {
        return buildErrorResponse(request, requestKind, MESSAGES.LOGIN_INVALID, 401)
      }

      if (secretType === 'passcode') {
        const normalizedSecret = secret.toUpperCase()
        const passcodeMatches = user.personalCode === normalizedSecret || user.loginPin === secret

        if (!passcodeMatches) {
          return buildErrorResponse(request, requestKind, MESSAGES.LOGIN_INVALID, 401)
        }
      } else {
        if (!user.passwordHash || user.passwordHash === 'LEGACY_PREVIEW_ACCOUNT') {
          return buildErrorResponse(request, requestKind, MESSAGES.LOGIN_PASSWORD_NOT_SET, 401)
        }

        const passwordMatches = await bcrypt.compare(secret, user.passwordHash)

        if (!passwordMatches) {
          return buildErrorResponse(request, requestKind, MESSAGES.LOGIN_INVALID, 401)
        }
      }
    }

    if (!user && firstName) {
      const pinUser = await prisma.user.findFirst({
        where: {
          loginPin: code,
          firstName: {
            equals: firstName,
            mode: 'insensitive',
          },
        },
        select: loginUserSelect,
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
          select: loginUserSelect,
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
    } else if (!user) {
      if (!code) {
        return buildErrorResponse(request, requestKind, MESSAGES.PASSCODE_REQUIRED, 400)
      }

      user = await prisma.user.findUnique({
        where: { personalCode: code.toUpperCase() },
        select: loginUserSelect,
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

    const profileSettings = await prisma.profile.findUnique({
      where: { userId: user.id },
      select: { emailLoginAlerts: true },
    })

    // Send login alert in background — do not await
    if (user.email && profileSettings?.emailLoginAlerts !== false) {
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
