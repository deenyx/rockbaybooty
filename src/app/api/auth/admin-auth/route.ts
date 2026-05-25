import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import { NextRequest, NextResponse } from 'next/server'

import prisma from '@/lib/prisma'
import {
  AUTH_COOKIE_NAME,
  MESSAGES,
  ROUTES,
  TEMP_ADMIN_AUTH_MAX_AGE_SECONDS,
  TEMP_ADMIN_AUTH_RATE_LIMIT_LOCKOUT_MS,
  TEMP_ADMIN_AUTH_RATE_LIMIT_MAX_ATTEMPTS,
  TEMP_ADMIN_AUTH_RATE_LIMIT_WINDOW_MS,
} from '@/lib/constants'

const TEMP_ADMIN_USERNAME_BASE = 'temp_admin'
const TEMP_ADMIN_EMAIL = 'temp-admin@fuxem.local'
const TEMP_ADMIN_DISPLAY_NAME = 'Temporary Admin'

type RateLimitState = {
  count: number
  windowStartMs: number
  blockedUntilMs: number
}

const rateLimitStore = new Map<string, RateLimitState>()

function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }

  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp.trim()
  }

  const cfConnectingIp = request.headers.get('cf-connecting-ip')
  if (cfConnectingIp) {
    return cfConnectingIp.trim()
  }

  return 'unknown'
}

function logAdminAuthEvent(
  event: 'attempt_denied_rate_limited' | 'attempt_failed' | 'attempt_succeeded',
  request: NextRequest,
  metadata: Record<string, unknown> = {}
) {
  const logEntry = {
    event,
    ip: getClientIp(request),
    userAgent: request.headers.get('user-agent') || 'unknown',
    timestamp: new Date().toISOString(),
    ...metadata,
  }

  console.info('[admin-auth-audit]', JSON.stringify(logEntry))
}

function getRateLimitConfig() {
  const maxAttempts = Number.parseInt(
    process.env.TEMP_ADMIN_MAX_ATTEMPTS || String(TEMP_ADMIN_AUTH_RATE_LIMIT_MAX_ATTEMPTS),
    10
  )
  const windowMs = Number.parseInt(
    process.env.TEMP_ADMIN_RATE_LIMIT_WINDOW_MS || String(TEMP_ADMIN_AUTH_RATE_LIMIT_WINDOW_MS),
    10
  )
  const lockoutMs = Number.parseInt(
    process.env.TEMP_ADMIN_RATE_LIMIT_LOCKOUT_MS || String(TEMP_ADMIN_AUTH_RATE_LIMIT_LOCKOUT_MS),
    10
  )

  return {
    maxAttempts: Number.isFinite(maxAttempts) && maxAttempts > 0
      ? maxAttempts
      : TEMP_ADMIN_AUTH_RATE_LIMIT_MAX_ATTEMPTS,
    windowMs: Number.isFinite(windowMs) && windowMs > 0
      ? windowMs
      : TEMP_ADMIN_AUTH_RATE_LIMIT_WINDOW_MS,
    lockoutMs: Number.isFinite(lockoutMs) && lockoutMs > 0
      ? lockoutMs
      : TEMP_ADMIN_AUTH_RATE_LIMIT_LOCKOUT_MS,
  }
}

function getRateLimitState(ip: string): RateLimitState {
  const now = Date.now()
  const existing = rateLimitStore.get(ip)

  if (!existing) {
    const initial = { count: 0, windowStartMs: now, blockedUntilMs: 0 }
    rateLimitStore.set(ip, initial)
    return initial
  }

  return existing
}

function isRateLimited(ip: string, windowMs: number): { limited: boolean; retryAfterSeconds: number } {
  const now = Date.now()
  const state = getRateLimitState(ip)

  if (state.windowStartMs + windowMs <= now) {
    state.count = 0
    state.windowStartMs = now
    state.blockedUntilMs = 0
  }

  if (state.blockedUntilMs > now) {
    return {
      limited: true,
      retryAfterSeconds: Math.max(1, Math.ceil((state.blockedUntilMs - now) / 1000)),
    }
  }

  return { limited: false, retryAfterSeconds: 0 }
}

function registerFailedAttempt(ip: string, maxAttempts: number, lockoutMs: number) {
  const now = Date.now()
  const state = getRateLimitState(ip)

  state.count += 1
  if (state.count >= maxAttempts) {
    state.blockedUntilMs = now + lockoutMs
  }
}

function clearRateLimit(ip: string) {
  rateLimitStore.delete(ip)
}

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
    select: { id: true, username: true, displayName: true, personalCode: true },
  })

  if (existingByEmail) {
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
    },
    select: { id: true, username: true, displayName: true, personalCode: true },
  })
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request)
    const { maxAttempts, windowMs, lockoutMs } = getRateLimitConfig()
    const rateLimitStatus = isRateLimited(ip, windowMs)

    if (rateLimitStatus.limited) {
      logAdminAuthEvent('attempt_denied_rate_limited', request, {
        retryAfterSeconds: rateLimitStatus.retryAfterSeconds,
      })

      const response = NextResponse.json(
        { error: MESSAGES.ADMIN_AUTH_RATE_LIMITED },
        { status: 429 }
      )
      response.headers.set('Retry-After', String(rateLimitStatus.retryAfterSeconds))
      return response
    }

    const body = await request.json().catch(() => ({}))
    const passphrase = String(body?.passphrase || '').trim()

    if (!passphrase) {
      return NextResponse.json({ error: MESSAGES.ADMIN_PASSPHRASE_REQUIRED }, { status: 400 })
    }

    const expected = process.env.TEMP_ADMIN_PASSPHRASE || 'alljackedup'
    if (passphrase !== expected) {
      registerFailedAttempt(ip, maxAttempts, lockoutMs)
      logAdminAuthEvent('attempt_failed', request, {
        reason: 'invalid_passphrase',
      })
      return NextResponse.json({ error: MESSAGES.ADMIN_PASSPHRASE_INVALID }, { status: 401 })
    }

    const jwtSecret = process.env.JWT_SECRET
    if (!jwtSecret) {
      return NextResponse.json({ error: MESSAGES.ERROR_GENERAL }, { status: 500 })
    }

    const adminUser = await createOrGetTempAdmin()
    clearRateLimit(ip)
    logAdminAuthEvent('attempt_succeeded', request, {
      adminUserId: adminUser.id,
      adminUsername: adminUser.username,
      usedDefaultPassphrase: !process.env.TEMP_ADMIN_PASSPHRASE,
    })

    const token = jwt.sign(
      {
        userId: adminUser.id,
        personalCode: adminUser.personalCode,
        mode: 'temp-admin',
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
