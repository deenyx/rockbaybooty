import { AccessToken } from 'livekit-server-sdk'
import jwt from 'jsonwebtoken'
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

import { AUTH_COOKIE_NAME, CHAT_ROOM_NAME, MESSAGES } from '@/lib/constants'
import type { AuthTokenPayload } from '@/lib/types'

export const dynamic = 'force-dynamic'

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

async function getAuthenticatedUserId(request: NextRequest): Promise<string | null> {
  const jwtSecret = process.env.JWT_SECRET

  if (!jwtSecret) {
    return null
  }

  const cookieToken = request.cookies.get(AUTH_COOKIE_NAME)?.value
  const headerToken = getBearerToken(request.headers.get('authorization'))
  const token = cookieToken || headerToken

  if (!token) {
    return null
  }

  try {
    const payload = jwt.verify(token, jwtSecret) as AuthTokenPayload & { sub?: string }

    if (typeof payload.userId === 'string') {
      return payload.userId
    }

    return typeof payload.sub === 'string' ? payload.sub : null
  } catch {
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request)

    if (!userId) {
      return NextResponse.json(
        { error: MESSAGES.AUTH_REQUIRED },
        { status: 401 }
      )
    }

    const apiKey = process.env.LIVEKIT_API_KEY
    const apiSecret = process.env.LIVEKIT_API_SECRET
    const wsUrl = process.env.LIVEKIT_URL

    if (!apiKey || !apiSecret || !wsUrl) {
      return NextResponse.json(
        { error: MESSAGES.ROOM_UNAVAILABLE },
        { status: 503 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        username: true,
        displayName: true,
        profile: {
          select: { avatarUrl: true },
        },
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: MESSAGES.AUTH_REQUIRED },
        { status: 401 }
      )
    }

    const identity = userId
    const displayName = user.displayName || user.username
    const avatarUrl = user.profile?.avatarUrl || ''

    const at = new AccessToken(apiKey, apiSecret, {
      identity,
      name: displayName,
      metadata: JSON.stringify({ avatarUrl }),
      ttl: 7200, // 2 hours in seconds
    })

    at.addGrant({
      roomJoin: true,
      room: CHAT_ROOM_NAME,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    })

    const token = await at.toJwt()

    return NextResponse.json({ token, wsUrl })
  } catch (error) {
    console.error('Chat token generation error:', error)
    return NextResponse.json(
      { error: MESSAGES.ERROR_GENERAL },
      { status: 500 }
    )
  }
}
