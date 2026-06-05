import { NextRequest, NextResponse } from 'next/server'
import { AccessToken, RoomServiceClient } from 'livekit-server-sdk'

import { getAuthenticatedUserId } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { MESSAGES } from '@/lib/constants'

const CAMERA_ROOM_NAME = 'camera-studio'

function requireLiveKitEnv() {
  const url = process.env.LIVEKIT_URL
  const apiKey = process.env.LIVEKIT_API_KEY
  const apiSecret = process.env.LIVEKIT_API_SECRET

  if (!url || !apiKey || !apiSecret) {
    return null
  }

  return { url, apiKey, apiSecret }
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request)

    if (!userId) {
      return NextResponse.json({ error: MESSAGES.AUTH_REQUIRED }, { status: 401 })
    }

    const env = requireLiveKitEnv()
    if (!env) {
      return NextResponse.json({ error: MESSAGES.ROOM_UNAVAILABLE }, { status: 503 })
    }

    const role = request.nextUrl.searchParams.get('role') === 'viewer' ? 'viewer' : 'host'

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, displayName: true, accountName: true },
    })

    if (!user) {
      return NextResponse.json({ error: MESSAGES.LOGIN_INVALID }, { status: 404 })
    }

    const identity = user.id
    const name = user.displayName || user.username
    const token = new AccessToken(env.apiKey, env.apiSecret, {
      identity,
      name,
    })

    token.addGrant({
      roomJoin: true,
      room: CAMERA_ROOM_NAME,
      canPublish: role === 'host',
      canSubscribe: true,
      canPublishData: true,
    })

    // Best effort room creation so the first broadcaster does not depend on manual setup.
    const roomService = new RoomServiceClient(env.url, env.apiKey, env.apiSecret)
    await roomService.createRoom({ name: CAMERA_ROOM_NAME }).catch(() => undefined)

    return NextResponse.json({
      token: await token.toJwt(),
      roomName: CAMERA_ROOM_NAME,
      role,
      livekitUrl: env.url,
      participantName: name,
      participantIdentity: identity,
      accountName: user.accountName,
    })
  } catch (error) {
    console.error('Failed to issue camera token:', error)
    return NextResponse.json({ error: MESSAGES.ERROR_GENERAL }, { status: 500 })
  }
}
