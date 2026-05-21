import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import crypto from 'crypto'

import {
  AUTH_COOKIE_NAME,
  AUTH_TOKEN_MAX_AGE_SECONDS,
  BURNER_PREVIEW_MAX_AGE_SECONDS,
  BURNER_PREVIEW_PIN,
  MESSAGES,
  NEW_MEMBER_PIN,
  QUICK_JOIN_PIN,
  ROUTES,
} from '@/lib/constants'
import { sendLoginAlertEmail } from '@/lib/email'

// Extract client IP from request (handles proxies like Vercel, Cloudflare)
function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  const cfConnectingIp = request.headers.get('cf-connecting-ip')
  if (cfConnectingIp) {
    return cfConnectingIp
  }
  
  return request.headers.get('x-real-ip') || 'unknown'
}

// Detect user location from IP using free IP geolocation API
async function detectLocationFromIp(ip: string): Promise<{
  city?: string
  state?: string
  country?: string
  location?: string
} | null> {
  if (!ip || ip === 'unknown' || ip === '127.0.0.1' || ip === '::1') {
    return null
  }

  try {
    // Using ip-api.com free tier (45 requests/minute)
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=city,regionName,country,status`, {
      method: 'GET',
      headers: { 'User-Agent': 'Mozilla/5.0' },
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()

    if (data.status !== 'success') {
      return null
    }

    const city = data.city || undefined
    const state = data.regionName || undefined
    const country = data.country || undefined

    // Build composite location string
    const location = [city, state, country].filter(Boolean).join(', ')

    return {
      city,
      state,
      country,
      location: location || undefined,
    }
  } catch (error) {
    console.log('Location detection failed:', error)
    return null
  }
}

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
  email: string | null
  passwordHash: string | null
  status: string
  emailVerified: boolean
}

function generatePreviewUsername(): string {
  const suffix = crypto.randomBytes(4).toString('hex')
  return `preview_${suffix}`
}

function generatePersonalCode(): string {
  return crypto.randomBytes(4).toString('hex').toUpperCase()
}

async function createBurnerPreviewUser() {
  let username = generatePreviewUsername()
  let existingByUsername = await prisma.user.findUnique({ where: { username }, select: { id: true } })

  while (existingByUsername) {
    username = generatePreviewUsername()
    existingByUsername = await prisma.user.findUnique({ where: { username }, select: { id: true } })
  }

  let personalCode = generatePersonalCode()
  let existingByCode = await prisma.user.findUnique({ where: { personalCode }, select: { id: true } })

  while (existingByCode) {
    personalCode = generatePersonalCode()
    existingByCode = await prisma.user.findUnique({ where: { personalCode }, select: { id: true } })
  }

  const displayName = 'Preview Guest'

  return prisma.user.create({
    data: {
      username,
      displayName,
      firstName: displayName,
      personalCode,
      passwordHash: 'LEGACY_PREVIEW_ACCOUNT',
      status: 'active',
      emailVerified: true,
      onboardingStep: 'completed',
      profile: {
        create: {
          isPublic: false,
        },
      },
    },
    select: {
      id: true,
      username: true,
      displayName: true,
      personalCode: true,
    },
  })
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
    returnTo: getSafeReturnTo(String(formData.get('returnTo') || ROUTES.DASHBOARD)),
    requestKind,
  }
}

const loginUserSelect = {
  id: true,
  username: true,
  displayName: true,
  personalCode: true,
  email: true,
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

export async function POST(request: NextRequest) {
  try {
    const { code, identifier, secret, returnTo, requestKind } = await parseLoginInput(request)

    const jwtSecret = process.env.JWT_SECRET
    if (!jwtSecret) {
      return buildErrorResponse(request, requestKind, MESSAGES.ERROR_GENERAL, 500)
    }

    // Shortcut: 0000 starts account creation
    if (code === QUICK_JOIN_PIN) {
      const signupPath = ROUTES.ONBOARDING

      if (requestKind === 'json') {
        return NextResponse.json(
          { message: MESSAGES.PASSCODE_VALID, returnTo: signupPath },
          { status: 200 }
        )
      }

      return NextResponse.redirect(new URL(signupPath, request.url))
    }

    if (code === BURNER_PREVIEW_PIN) {
      const user = await createBurnerPreviewUser()

      const token = jwt.sign(
        {
          userId: user.id,
          personalCode: user.personalCode,
          mode: 'burner-preview',
        },
        jwtSecret,
        { expiresIn: BURNER_PREVIEW_MAX_AGE_SECONDS }
      )

      const response = buildSuccessResponse(
        requestKind,
        returnTo,
        {
          message: MESSAGES.LOGIN_SUCCESS,
          user,
        },
        request
      )

      response.cookies.set({
        name: AUTH_COOKIE_NAME,
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: BURNER_PREVIEW_MAX_AGE_SECONDS,
      })

      return response
    }

    // 5555 unlocks credential login mode
    if (code === NEW_MEMBER_PIN && !identifier && !secret) {
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

    // 5555 with credentials: username/email + password login
    if (code === NEW_MEMBER_PIN) {
      if (!identifier || !secret) {
        return buildErrorResponse(request, requestKind, MESSAGES.LOGIN_CREDENTIALS_REQUIRED, 400)
      }

      const user = await prisma.user.findFirst({
        where: identifier.includes('@')
          ? { email: identifier }
          : { username: identifier },
        select: loginUserSelect,
      })

      if (!user || user.status !== 'active') {
        return buildErrorResponse(request, requestKind, MESSAGES.LOGIN_INVALID, 401)
      }

      // Check email verified
      if (!user.emailVerified) {
        return buildErrorResponse(request, requestKind, MESSAGES.EMAIL_VERIFICATION_REQUIRED, 401)
      }

      // Verify password
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

      // Detect and store user location on login (background task, don't await)
      const clientIp = getClientIp(request)
      detectLocationFromIp(clientIp).then(async (detectedLocation) => {
        if (detectedLocation) {
          try {
            await prisma.profile.upsert({
              where: { userId: user.id },
              create: {
                userId: user.id,
                city: detectedLocation.city || undefined,
                state: detectedLocation.state || undefined,
                country: detectedLocation.country || undefined,
                location: detectedLocation.location || undefined,
              },
              update: {
                city: detectedLocation.city || undefined,
                state: detectedLocation.state || undefined,
                country: detectedLocation.country || undefined,
                location: detectedLocation.location || undefined,
              },
            })
          } catch (error) {
            console.log('Failed to update user location:', error)
          }
        }
      })

      const profileSettings = await prisma.profile.findUnique({
        where: { userId: user.id },
        select: { emailLoginAlerts: true },
      })

      // Send login alert in background
      if (user.email && profileSettings?.emailLoginAlerts !== false) {
        sendLoginAlertEmail(user.email, user.displayName)
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
    }

    // All other codes are invalid now
    return buildErrorResponse(request, requestKind, MESSAGES.LOGIN_INVALID, 401)
  } catch (error) {
    console.error('Login error:', error)
    return buildErrorResponse(request, 'json', MESSAGES.ERROR_GENERAL, 500)
  }
}
