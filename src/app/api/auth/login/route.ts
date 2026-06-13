import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

import {
  AUTH_COOKIE_NAME,
  AUTH_TOKEN_MAX_AGE_SECONDS,
  BURNER_TOKEN_MAX_AGE_SECONDS,
  BURNER_PIN,
  MESSAGES,
  PRESHARED_KEY_PIN,
  ROUTES,
  SESSION_MODE_COOKIE_NAME,
  SESSION_MODE_DEFAULT_MEMBER,
  SESSION_MODE_MEMBER,
} from '@/lib/constants'
import { sendLoginAlertEmail } from '@/lib/email'
import { generateNextAccountName } from '@/lib/account-name'
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
  identifier: string
  secret: string
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
      identifier: (body.identifier || body.email || body.username || '').trim().toLowerCase(),
      secret: (body.secret || body.password || '').trim(),
      returnTo: getSafeReturnTo(body.returnTo || null),
      requestKind,
    }
  }

  const formData = await request.formData()
  return {
    code: String(formData.get('passcode') || '').trim(),
    identifier: String(formData.get('identifier') || formData.get('email') || formData.get('username') || '').trim().toLowerCase(),
    secret: String(formData.get('secret') || formData.get('password') || '').trim(),
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
  passwordHash: true,
  status: true,
  emailVerified: true,
} as const

function withSessionCookies(
  response: NextResponse,
  token: string,
  sessionMode: typeof SESSION_MODE_MEMBER | typeof SESSION_MODE_DEFAULT_MEMBER,
  maxAgeSeconds: number
) {
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: maxAgeSeconds,
  })

  response.cookies.set({
    name: SESSION_MODE_COOKIE_NAME,
    value: sessionMode,
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: maxAgeSeconds,
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
} & Record<string, unknown>, request: NextRequest) {
  if (kind === 'json') {
    return NextResponse.json({ ...payload, returnTo }, { status: 200 })
  }

  return NextResponse.redirect(new URL(returnTo, request.url))
}

async function generateUniquePersonalCode(baseCode: string, tx: Prisma.TransactionClient) {
  const normalizedBase = baseCode.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12)
  let attempt = 0

  while (attempt < 10) {
    const suffix = attempt === 0 ? '' : String(attempt)
    const personalCode = `${normalizedBase}${suffix}`.slice(0, 12)
    const existing = await tx.user.findUnique({
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

async function generateBurnerUsername(tx: Prisma.TransactionClient) {
  const base = 'defaultuser'

  for (let attempt = 0; attempt < 10_000; attempt += 1) {
    const candidate = attempt === 0 ? base : `${base}${attempt}`
    const existing = await tx.user.findUnique({
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
  return prisma.$transaction(async (tx) => {
    const accountName = await generateNextAccountName(tx)
    const username = await generateBurnerUsername(tx)
    const personalCode = await generateUniquePersonalCode(`BURN${Date.now().toString().slice(-6)}`, tx)

    return tx.user.create({
      data: {
        username,
        accountName,
        displayName: username,
        personalCode,
        role: 'BURNER',
        onboardingStep: 'completed',
        status: 'active',
        emailVerified: true,
      },
      select: loginUserSelect,
    })
  })
}

async function createPresharedUser() {
  return prisma.$transaction(async (tx) => {
    const accountName = await generateNextAccountName(tx)
    const username = await generateBurnerUsername(tx)
    const personalCode = await generateUniquePersonalCode(`KEY${Date.now().toString().slice(-6)}`, tx)

    return tx.user.create({
      data: {
        username,
        accountName,
        displayName: username,
        personalCode,
        role: 'MEMBER',
        onboardingStep: 'completed',
        status: 'active',
        emailVerified: true,
      },
      select: loginUserSelect,
    })
  })
}

export async function POST(request: NextRequest) {
  try {
    const { code, identifier, secret, returnTo, requestKind } = await parseLoginInput(request)
    const normalizedCode = code.toUpperCase()

    const jwtSecret = process.env.JWT_SECRET
    if (!jwtSecret) {
      return buildErrorResponse(request, requestKind, MESSAGES.ERROR_GENERAL, 500)
    }

    if (!code && !(identifier && secret)) {
      return buildErrorResponse(request, requestKind, MESSAGES.LOGIN_CREDENTIALS_REQUIRED, 400)
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
        expiresIn: BURNER_TOKEN_MAX_AGE_SECONDS,
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

      return withSessionCookies(response, token, SESSION_MODE_DEFAULT_MEMBER, BURNER_TOKEN_MAX_AGE_SECONDS)
    }

    if (normalizedCode === PRESHARED_KEY_PIN) {
      const presharedUser = await createPresharedUser()

      const presharedTokenPayload: AuthTokenPayload = {
        userId: presharedUser.id,
        personalCode: presharedUser.personalCode,
        mode: SESSION_MODE_MEMBER,
        sub: presharedUser.id,
        username: presharedUser.username,
      }

      const token = jwt.sign(presharedTokenPayload, jwtSecret, {
        expiresIn: BURNER_TOKEN_MAX_AGE_SECONDS,
      })

      const response = buildSuccessResponse(
        requestKind,
        returnTo,
        {
          message: MESSAGES.LOGIN_SUCCESS,
          sessionMode: SESSION_MODE_MEMBER,
          promptNametag: true,
          user: {
            id: presharedUser.id,
            username: presharedUser.username,
            displayName: presharedUser.displayName,
            personalCode: presharedUser.personalCode,
          },
        },
        request
      )

      return withSessionCookies(response, token, SESSION_MODE_MEMBER, BURNER_TOKEN_MAX_AGE_SECONDS)
    }

    if (!identifier) {
      return buildErrorResponse(request, requestKind, MESSAGES.LOGIN_USER_ID_REQUIRED, 400)
    }

    if (!secret) {
      return buildErrorResponse(request, requestKind, MESSAGES.LOGIN_PASSWORD_REQUIRED, 400)
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ username: identifier }, { email: identifier }],
      },
      select: loginUserSelect,
    })

    if (!user || user.status !== 'active') {
      return buildErrorResponse(request, requestKind, MESSAGES.LOGIN_INVALID, 401)
    }

    if (!user.passwordHash || user.passwordHash === 'LEGACY_PREVIEW_ACCOUNT') {
      return buildErrorResponse(request, requestKind, MESSAGES.LOGIN_PASSWORD_NOT_SET, 401)
    }

    const passwordMatches = await bcrypt.compare(secret, user.passwordHash)
    if (!passwordMatches) {
      return buildErrorResponse(request, requestKind, MESSAGES.LOGIN_INVALID, 401)
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

    return withSessionCookies(response, token, SESSION_MODE_MEMBER, AUTH_TOKEN_MAX_AGE_SECONDS)
  } catch (error) {
    console.error('Login error:', error)
    return buildErrorResponse(request, 'json', MESSAGES.ERROR_GENERAL, 500)
  }
}
