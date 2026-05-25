import { createHash, timingSafeEqual } from 'crypto'
import jwt from 'jsonwebtoken'
import { NextRequest } from 'next/server'

import {
  PRIME_ADMIN_AUTH_MAX_AGE_SECONDS,
  PRIME_ADMIN_COOKIE_NAME,
} from '@/lib/constants'

type PrimeAdminTokenPayload = {
  mode: 'prime-admin'
  iat?: number
  exp?: number
}

function sha256(value: string): Buffer {
  return createHash('sha256').update(value).digest()
}

export function hasConfiguredBreakglassSecret() {
  return Boolean(process.env.TEMP_ADMIN_BREAKGLASS_SECRET)
}

export function isValidBreakglassSecret(candidate: string): boolean {
  const configured = process.env.TEMP_ADMIN_BREAKGLASS_SECRET
  if (!configured || !candidate) {
    return false
  }

  const left = sha256(candidate)
  const right = sha256(configured)
  return timingSafeEqual(left, right)
}

export function createPrimeAdminToken(jwtSecret: string): string {
  return jwt.sign({ mode: 'prime-admin' }, jwtSecret, {
    expiresIn: PRIME_ADMIN_AUTH_MAX_AGE_SECONDS,
  })
}

export function readPrimeAdminToken(request: NextRequest): string | null {
  return request.cookies.get(PRIME_ADMIN_COOKIE_NAME)?.value || null
}

export function isPrimeAdminUnlocked(request: NextRequest): boolean {
  const jwtSecret = process.env.JWT_SECRET
  if (!jwtSecret) {
    return false
  }

  const token = readPrimeAdminToken(request)
  if (!token) {
    return false
  }

  try {
    const payload = jwt.verify(token, jwtSecret) as PrimeAdminTokenPayload
    return payload.mode === 'prime-admin'
  } catch {
    return false
  }
}
