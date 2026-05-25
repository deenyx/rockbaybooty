import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from 'crypto'
import jwt from 'jsonwebtoken'
import { NextRequest } from 'next/server'

import { AUTH_COOKIE_NAME, TEMP_ADMIN_AUTH_MAX_AGE_SECONDS } from '@/lib/constants'
import prisma from '@/lib/prisma'
import type { AuthTokenPayload } from '@/lib/types'

const TEMP_ADMIN_CONTROL_CODE = '__TEMP_ADMIN_CONTROL__'
const DEFAULT_MAX_ACTIVE_TEMP_ADMIN_SESSIONS = 2
const DEFAULT_TEMP_ADMIN_SESSION_VERSION = 1

type TempAdminControlData = {
  passphraseHash: string | null
  passphraseSalt: string | null
  sessionVersion: number
  updatedAt: string
  rotatedBy: string | null
}

type ActiveTempAdminSession = {
  sessionId: string
  userId: string
  sessionVersion: number
  expiresAtMs: number
  ip: string
  userAgent: string
}

const activeTempAdminSessions = new Map<string, ActiveTempAdminSession>()

function normalizePositiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value || '', 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function createPassphraseHash(passphrase: string, salt = randomBytes(16).toString('hex')) {
  const hash = scryptSync(passphrase, salt, 64).toString('hex')
  return { salt, hash }
}

function verifyPassphraseHash(passphrase: string, salt: string, expectedHash: string): boolean {
  const actual = scryptSync(passphrase, salt, 64)
  const expected = Buffer.from(expectedHash, 'hex')

  if (actual.length !== expected.length) {
    return false
  }

  return timingSafeEqual(actual, expected)
}

function parseControlData(value: string | null | undefined): TempAdminControlData {
  if (!value) {
    return {
      passphraseHash: null,
      passphraseSalt: null,
      sessionVersion: DEFAULT_TEMP_ADMIN_SESSION_VERSION,
      updatedAt: new Date(0).toISOString(),
      rotatedBy: null,
    }
  }

  try {
    const parsed = JSON.parse(value) as Partial<TempAdminControlData>
    return {
      passphraseHash: typeof parsed.passphraseHash === 'string' ? parsed.passphraseHash : null,
      passphraseSalt: typeof parsed.passphraseSalt === 'string' ? parsed.passphraseSalt : null,
      sessionVersion:
        typeof parsed.sessionVersion === 'number' && parsed.sessionVersion > 0
          ? parsed.sessionVersion
          : DEFAULT_TEMP_ADMIN_SESSION_VERSION,
      updatedAt:
        typeof parsed.updatedAt === 'string' ? parsed.updatedAt : new Date(0).toISOString(),
      rotatedBy: typeof parsed.rotatedBy === 'string' ? parsed.rotatedBy : null,
    }
  } catch {
    return {
      passphraseHash: null,
      passphraseSalt: null,
      sessionVersion: DEFAULT_TEMP_ADMIN_SESSION_VERSION,
      updatedAt: new Date(0).toISOString(),
      rotatedBy: null,
    }
  }
}

export function getClientIp(request: NextRequest): string {
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

export async function getTempAdminControlState(): Promise<TempAdminControlData> {
  const control = await prisma.inviteCode.findUnique({
    where: { code: TEMP_ADMIN_CONTROL_CODE },
    select: { usedBy: true },
  })

  return parseControlData(control?.usedBy)
}

export async function verifyTempAdminPassphrase(passphrase: string): Promise<boolean> {
  const fallback = process.env.TEMP_ADMIN_PASSPHRASE || 'alljackedup'
  if (passphrase === fallback) {
    return true
  }

  const control = await getTempAdminControlState()
  if (control.passphraseHash && control.passphraseSalt) {
    return verifyPassphraseHash(passphrase, control.passphraseSalt, control.passphraseHash)
  }

  return false
}

export async function rotateTempAdminAccess(params: {
  newPassphrase: string
  revokeExistingSessions?: boolean
  rotatedBy?: string | null
}) {
  const current = await getTempAdminControlState()
  const nextVersion = params.revokeExistingSessions === false
    ? current.sessionVersion
    : current.sessionVersion + 1
  const { salt, hash } = createPassphraseHash(params.newPassphrase)

  await prisma.inviteCode.upsert({
    where: { code: TEMP_ADMIN_CONTROL_CODE },
    update: {
      status: 'active',
      usedAt: new Date(),
      usedBy: JSON.stringify({
        passphraseHash: hash,
        passphraseSalt: salt,
        sessionVersion: nextVersion,
        updatedAt: new Date().toISOString(),
        rotatedBy: params.rotatedBy || null,
      }),
    },
    create: {
      code: TEMP_ADMIN_CONTROL_CODE,
      status: 'active',
      usedAt: new Date(),
      usedBy: JSON.stringify({
        passphraseHash: hash,
        passphraseSalt: salt,
        sessionVersion: nextVersion,
        updatedAt: new Date().toISOString(),
        rotatedBy: params.rotatedBy || null,
      }),
    },
  })

  pruneExpiredTempAdminSessions(nextVersion)

  return { sessionVersion: nextVersion }
}

function getTokenFromRequest(request: NextRequest): string | null {
  const cookieToken = request.cookies.get(AUTH_COOKIE_NAME)?.value
  if (cookieToken) {
    return cookieToken
  }

  const authorization = request.headers.get('authorization')
  if (!authorization) {
    return null
  }

  const [scheme, token] = authorization.split(' ')
  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    return null
  }

  return token
}

function readTempAdminTokenPayload(request: NextRequest, jwtSecret: string): AuthTokenPayload | null {
  const token = getTokenFromRequest(request)
  if (!token) {
    return null
  }

  try {
    return jwt.verify(token, jwtSecret) as AuthTokenPayload
  } catch {
    return null
  }
}

export function getMaxActiveTempAdminSessions(): number {
  return normalizePositiveInteger(
    process.env.TEMP_ADMIN_MAX_ACTIVE_SESSIONS,
    DEFAULT_MAX_ACTIVE_TEMP_ADMIN_SESSIONS
  )
}

export function pruneExpiredTempAdminSessions(activeSessionVersion?: number) {
  const now = Date.now()

  for (const [sessionId, session] of activeTempAdminSessions.entries()) {
    if (
      session.expiresAtMs <= now ||
      (typeof activeSessionVersion === 'number' && session.sessionVersion !== activeSessionVersion)
    ) {
      activeTempAdminSessions.delete(sessionId)
    }
  }
}

export async function reserveTempAdminSession(
  request: NextRequest,
  params: { userId: string; jwtSecret: string }
): Promise<{ sessionId: string; sessionVersion: number } | null> {
  const control = await getTempAdminControlState()
  pruneExpiredTempAdminSessions(control.sessionVersion)

  const now = Date.now()
  const expiresAtMs = now + TEMP_ADMIN_AUTH_MAX_AGE_SECONDS * 1000
  const ip = getClientIp(request)
  const userAgent = request.headers.get('user-agent') || 'unknown'
  const currentPayload = readTempAdminTokenPayload(request, params.jwtSecret)
  const currentSessionId = currentPayload?.mode === 'temp-admin' ? currentPayload.tempAdminSessionId : null
  const currentVersion = currentPayload?.mode === 'temp-admin'
    ? currentPayload.tempAdminSessionVersion ?? DEFAULT_TEMP_ADMIN_SESSION_VERSION
    : null

  if (
    currentSessionId &&
    currentVersion === control.sessionVersion &&
    activeTempAdminSessions.has(currentSessionId)
  ) {
    activeTempAdminSessions.set(currentSessionId, {
      sessionId: currentSessionId,
      userId: params.userId,
      sessionVersion: control.sessionVersion,
      expiresAtMs,
      ip,
      userAgent,
    })

    return { sessionId: currentSessionId, sessionVersion: control.sessionVersion }
  }

  const activeCount = Array.from(activeTempAdminSessions.values()).filter(
    (session) => session.sessionVersion === control.sessionVersion
  ).length

  if (activeCount >= getMaxActiveTempAdminSessions()) {
    return null
  }

  const sessionId = randomUUID()
  activeTempAdminSessions.set(sessionId, {
    sessionId,
    userId: params.userId,
    sessionVersion: control.sessionVersion,
    expiresAtMs,
    ip,
    userAgent,
  })

  return { sessionId, sessionVersion: control.sessionVersion }
}

export function releaseTempAdminSession(request: NextRequest, jwtSecret: string) {
  const payload = readTempAdminTokenPayload(request, jwtSecret)
  if (payload?.mode !== 'temp-admin' || !payload.tempAdminSessionId) {
    return
  }

  activeTempAdminSessions.delete(payload.tempAdminSessionId)
}

export async function isTempAdminSessionValid(payload: AuthTokenPayload): Promise<boolean> {
  if (payload.mode !== 'temp-admin') {
    return true
  }

  const control = await getTempAdminControlState()
  const tokenVersion = payload.tempAdminSessionVersion ?? DEFAULT_TEMP_ADMIN_SESSION_VERSION
  return tokenVersion === control.sessionVersion
}

export function clearAllTempAdminSessions() {
  activeTempAdminSessions.clear()
}