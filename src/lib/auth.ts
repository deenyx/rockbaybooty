import jwt from 'jsonwebtoken'
import { NextRequest } from 'next/server'

import { AUTH_COOKIE_NAME } from '@/lib/constants'
import { isTempAdminSessionValid } from '@/lib/temp-admin-control'
import type { AuthTokenPayload } from '@/lib/types'

function getBearerToken(header: string | null): string | null {
  if (!header) {
    return null
  }

  const [scheme, token] = header.split(' ')

  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    return null
  }

  return token
}

export async function getAuthenticatedUserId(request: NextRequest): Promise<string | null> {
  const payload = await getAuthTokenPayload(request)
  return payload?.userId ?? null
}

export async function getAuthTokenPayload(
  request: NextRequest
): Promise<(AuthTokenPayload & { sub?: string }) | null> {
  const jwtSecret = process.env.JWT_SECRET

  if (!jwtSecret) {
    return null
  }

  const cookieToken = request.cookies.get(AUTH_COOKIE_NAME)?.value
  const authToken = getBearerToken(request.headers.get('authorization'))
  const token = cookieToken || authToken

  if (!token) {
    return null
  }

  try {
    const payload = jwt.verify(token, jwtSecret) as AuthTokenPayload & { sub?: string }

    if (payload.mode === 'temp-admin') {
      const valid = await isTempAdminSessionValid(payload)
      if (!valid) {
        return null
      }
    }

    if (typeof payload.userId === 'string') {
      return payload
    }

    if (typeof payload.sub === 'string') {
      return {
        ...payload,
        userId: payload.sub,
      }
    }

    return null
  } catch {
    return null
  }
}
