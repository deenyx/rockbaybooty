import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

import {
  AUTH_COOKIE_NAME,
  AUTH_TOKEN_MAX_AGE_SECONDS,
  BURNER_PIN,
  MESSAGES,
  ROUTES,
  SESSION_MODE_COOKIE_NAME,
  SESSION_MODE_DEFAULT_MEMBER,
  SESSION_MODE_MEMBER,
} from '@/lib/constants'
import { sendLoginAlertEmail } from '@/lib/email'
import type { AuthTokenPayload } from '@/lib/types'

function getSafeReturnTo(returnTo: string | null): string {
  if (!returnTo) {
    return ROUTES.ME
  }

  if (!returnTo.startsWith('/') || returnTo.startsWith('//')) {
    return ROUTES.ME
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
    returnTo: getSafeReturnTo(String(formData.get('returnTo') || ROUTES.ME)),
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

function withSessionCookies(
  response: NextResponse,
  token: string,
  sessionMode: typeof SESSION_MODE_MEMBER | typeof SESSION_MODE_DEFAULT_MEMBER
) {
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    ...(sessionMode === SESSION_MODE_DEFAULT_MEMBER ? {} : { maxAge: AUTH_TOKEN_MAX_AGE_SECONDS }),
  })

  response.cookies.set({
    name: SESSION_MODE_COOKIE_NAME,
    value: sessionMode,
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    ...(sessionMode === SESSION_MODE_DEFAULT_MEMBER ? {} : { maxAge: AUTH_TOKEN_MAX_AGE_SECONDS }),
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
  sessionMode: typeof SESSION_MODE_MEMBER | typeof SESSION_MODE_DEFAULT_MEMBER
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

async function generateBurnerUsername() {
  const base = 'defaultuser'

  for (let attempt = 0; attempt < 10_000; attempt += 1) {
    const candidate = attempt === 0 ? base : `${base}${attempt}`
    const existing = await prisma.user.findUnique({
      where: { username: candidate },
      select: { id: true },
    })

    if (!existing) {
      return candidate
    }
  }

  return `${base}${Date.now()}`
}

async function createBurnerUser() {
  const username = await generateBurnerUsername()
  const personalCode = await generateUniquePersonalCode(`BURN${Date.now().toString().slice(-6)}`)

  return prisma.user.create({
    data: {
      username,
      displayName: username,
      personalCode,
      role: 'BURNER',
      onboardingStep: 'completed',
      status: 'active',
      emailVerified: true,
    },
    select: loginUserSelect,
  })
}

export async function POST(request: NextRequest) {
  try {
    const { code, firstName, identifier, secret, secretType, returnTo, requestKind } = await parseLoginInput(request)
    const normalizedCode = code.toUpperCase()

    const jwtSecret = process.env.JWT_SECRET
    if (!jwtSecret) {
      return buildErrorResponse(request, requestKind, MESSAGES.ERROR_GENERAL, 500)
    }

    if (!code && !(identifier && secret)) {
      return buildErrorResponse(request, requestKind, MESSAGES.ENTRY_PIN_REQUIRED, 400)
    }

    // Burner access: always create a fresh read-only account for this session.
    if (normalizedCode === BURNER_PIN) {
      const burnerUser = await createBurnerUser()

      const burnerTokenPayload: AuthTokenPayload = {
        userId: burnerUser.id,
        personalCode: burnerUser.personalCode,
        mode: SESSION_MODE_DEFAULT_MEMBER,
        sub: burnerUser.id,
        username: burnerUser.username,
      }

      const token = jwt.sign(burnerTokenPayload, jwtSecret, {
        expiresIn: AUTH_TOKEN_MAX_AGE_SECONDS,
      })

      const response = buildSuccessResponse(
        requestKind,
        returnTo,
        {
          message: MESSAGES.LOGIN_SUCCESS,
          sessionMode: SESSION_MODE_DEFAULT_MEMBER,
          user: {
            id: burnerUser.id,
            username: burnerUser.username,
            displayName: burnerUser.displayName,
            personalCode: burnerUser.personalCode,
          },
        },
        request
      )

      return withSessionCookies(response, token, SESSION_MODE_DEFAULT_MEMBER)
    }

    // Shortcut: 0000 starts account creation.
    if (normalizedCode === '0000') {
      const signupPath = ROUTES.SIGNUP

      if (requestKind === 'json') {
        return NextResponse.json(
          { message: MESSAGES.PASSCODE_VALID, returnTo: signupPath },
          { status: 200 }
        )
      }

      return NextResponse.redirect(new URL(signupPath, request.url))
    }

    // 5555 unlocks credential login mode.
    if (normalizedCode === '5555' && !identifier && !secret) {
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

    if (normalizedCode === '5555') {
      if (!identifier) {
        return buildErrorResponse(request, requestKind, MESSAGES.LOGIN_CREDENTIALS_REQUIRED, 400)
      }

      if (!secret) {
        const missingSecretError = secretType === 'passcode'
          ? MESSAGES.LOGIN_PASSCODE_REQUIRED
          : MESSAGES.LOGIN_PASSWORD_REQUIRED
        return buildErrorResponse(request, requestKind, missingSecretError, 400)
      }

      user = await prisma.user.findFirst({
        where: identifier.includes('@')
          ? {
              email: {
                equals: identifier,
                mode: 'insensitive',
              },
            }
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
          loginPin: normalizedCode,
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
          where: { personalCode: normalizedCode },
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
        where: { personalCode: normalizedCode },
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
        sessionMode: SESSION_MODE_MEMBER,
        user: {
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          personalCode: user.personalCode,
        },
      },
      request
    )

    return withSessionCookies(response, token, SESSION_MODE_MEMBER)
  } catch (error) {
    console.error('Login error:', error)
    return buildErrorResponse(request, 'json', MESSAGES.ERROR_GENERAL, 500)
  }
}
