import jwt from 'jsonwebtoken'
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

import { AUTH_COOKIE_NAME, MESSAGES } from '@/lib/constants'
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

export async function POST(request: NextRequest) {
  try {
    const currentUserId = await getAuthenticatedUserId(request)

    if (!currentUserId) {
      return NextResponse.json({ error: MESSAGES.AUTH_REQUIRED }, { status: 401 })
    }

    const body = await request.json()
    const recipientId = typeof body.recipientId === 'string' ? body.recipientId.trim() : ''

    if (!recipientId) {
      return NextResponse.json({ error: MESSAGES.FIELD_REQUIRED }, { status: 400 })
    }

    if (recipientId === currentUserId) {
      return NextResponse.json({ error: MESSAGES.FRIEND_REQUEST_SELF }, { status: 400 })
    }

    const recipient = await prisma.user.findUnique({
      where: { id: recipientId },
      select: { id: true, status: true },
    })

    if (!recipient || recipient.status !== 'active') {
      return NextResponse.json({ error: MESSAGES.FRIEND_REQUEST_INVALID_TARGET }, { status: 404 })
    }

    const existing = await prisma.friendship.findMany({
      where: {
        OR: [
          { requesterId: currentUserId, recipientId },
          { requesterId: recipientId, recipientId: currentUserId },
        ],
      },
      orderBy: { updatedAt: 'desc' },
    })

    const accepted = existing.find((relationship) => relationship.status === 'accepted')

    if (accepted) {
      return NextResponse.json({ error: MESSAGES.FRIEND_REQUEST_ALREADY_FRIENDS }, { status: 409 })
    }

    const pending = existing.find((relationship) => relationship.status === 'pending')

    if (pending) {
      if (pending.requesterId === currentUserId) {
        return NextResponse.json({ error: MESSAGES.FRIEND_REQUEST_ALREADY_SENT }, { status: 409 })
      }

      return NextResponse.json({ error: MESSAGES.FRIEND_REQUEST_RECEIVED_PENDING }, { status: 409 })
    }

    const declined = existing.find((relationship) => relationship.status === 'declined')

    const friendship = declined
      ? await prisma.friendship.update({
          where: { id: declined.id },
          data: {
            requesterId: currentUserId,
            recipientId,
            status: 'pending',
          },
        })
      : await prisma.friendship.create({
          data: {
            requesterId: currentUserId,
            recipientId,
            status: 'pending',
          },
        })

    return NextResponse.json(
      {
        friendship: {
          id: friendship.id,
          requesterId: friendship.requesterId,
          recipientId: friendship.recipientId,
          status: friendship.status,
          createdAt: friendship.createdAt.toISOString(),
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Friend request error:', error)

    return NextResponse.json({ error: MESSAGES.ERROR_GENERAL }, { status: 500 })
  }
}
