import jwt from 'jsonwebtoken'
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

import { AUTH_COOKIE_NAME, MESSAGES } from '@/lib/constants'
import type { AuthTokenPayload, FriendshipDecisionAction } from '@/lib/types'

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
  const authToken = getBearerToken(request.headers.get('authorization'))
  const token = cookieToken || authToken

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

function serializeFriendship(friendship: {
  id: string
  requesterId: string
  recipientId: string
  status: string
  createdAt: Date
}) {
  return {
    friendship: {
      id: friendship.id,
      requesterId: friendship.requesterId,
      recipientId: friendship.recipientId,
      status: friendship.status as 'pending' | 'accepted' | 'declined',
      createdAt: friendship.createdAt.toISOString(),
    },
  }
}

export async function GET(request: NextRequest) {
  try {
    const currentUserId = await getAuthenticatedUserId(request)

    if (!currentUserId) {
      return NextResponse.json({ error: MESSAGES.AUTH_REQUIRED }, { status: 401 })
    }

    const [incoming, outgoing] = await Promise.all([
      prisma.friendship.findMany({
        where: {
          recipientId: currentUserId,
          status: 'pending',
        },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          status: true,
          createdAt: true,
          requester: {
            select: {
              id: true,
              username: true,
              displayName: true,
              profile: { select: { avatarUrl: true } },
            },
          },
        },
      }),
      prisma.friendship.findMany({
        where: {
          requesterId: currentUserId,
          status: 'pending',
        },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          status: true,
          createdAt: true,
          recipient: {
            select: {
              id: true,
              username: true,
              displayName: true,
              profile: { select: { avatarUrl: true } },
            },
          },
        },
      }),
    ])

    return NextResponse.json({
      incoming: incoming.map((friendship) => ({
        id: friendship.id,
        createdAt: friendship.createdAt.toISOString(),
        status: 'pending' as const,
        direction: 'incoming' as const,
        member: {
          id: friendship.requester.id,
          username: friendship.requester.username,
          displayName: friendship.requester.displayName,
          avatarUrl: friendship.requester.profile?.avatarUrl ?? null,
        },
      })),
      outgoing: outgoing.map((friendship) => ({
        id: friendship.id,
        createdAt: friendship.createdAt.toISOString(),
        status: 'pending' as const,
        direction: 'outgoing' as const,
        member: {
          id: friendship.recipient.id,
          username: friendship.recipient.username,
          displayName: friendship.recipient.displayName,
          avatarUrl: friendship.recipient.profile?.avatarUrl ?? null,
        },
      })),
    })
  } catch (error) {
    console.error('Friend requests fetch error:', error)
    return NextResponse.json({ error: MESSAGES.ERROR_GENERAL }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const currentUserId = await getAuthenticatedUserId(request)

    if (!currentUserId) {
      return NextResponse.json({ error: MESSAGES.AUTH_REQUIRED }, { status: 401 })
    }

    const body = await request.json()
    const friendshipId = typeof body.friendshipId === 'string' ? body.friendshipId.trim() : ''
    const action = body.action as FriendshipDecisionAction | undefined

    if (!friendshipId || (action !== 'accept' && action !== 'decline' && action !== 'cancel')) {
      return NextResponse.json({ error: MESSAGES.FIELD_REQUIRED }, { status: 400 })
    }

    const friendship = await prisma.friendship.findUnique({
      where: { id: friendshipId },
      select: {
        id: true,
        requesterId: true,
        recipientId: true,
        status: true,
        createdAt: true,
      },
    })

    if (!friendship) {
      return NextResponse.json({ error: MESSAGES.FRIEND_REQUEST_NOT_FOUND }, { status: 404 })
    }

    if (friendship.status !== 'pending') {
      return NextResponse.json({ error: MESSAGES.FRIEND_REQUEST_NOT_PENDING }, { status: 409 })
    }

    if (action === 'cancel') {
      if (friendship.requesterId !== currentUserId) {
        return NextResponse.json({ error: MESSAGES.FRIEND_REQUEST_NO_PERMISSION }, { status: 403 })
      }
    } else if (friendship.recipientId !== currentUserId) {
      return NextResponse.json({ error: MESSAGES.FRIEND_REQUEST_NO_PERMISSION }, { status: 403 })
    }

    const nextStatus = action === 'accept' ? 'accepted' : 'declined'

    const updated = await prisma.friendship.update({
      where: { id: friendship.id },
      data: { status: nextStatus },
      select: {
        id: true,
        requesterId: true,
        recipientId: true,
        status: true,
        createdAt: true,
      },
    })

    return NextResponse.json(serializeFriendship(updated))
  } catch (error) {
    console.error('Friend request decision error:', error)
    return NextResponse.json({ error: MESSAGES.ERROR_GENERAL }, { status: 500 })
  }
}
