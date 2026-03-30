import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'
import { NextRequest, NextResponse } from 'next/server'

import { AUTH_COOKIE_NAME, MESSAGES } from '@/lib/constants'
import type { AuthTokenPayload } from '@/lib/types'

const prisma = new PrismaClient()

function getBearerToken(header: string | null): string | null {
  if (!header) return null
  const [scheme, token] = header.split(' ')
  if (scheme?.toLowerCase() !== 'bearer' || !token) return null
  return token
}

async function getAuthenticatedUserId(request: NextRequest): Promise<string | null> {
  const jwtSecret = process.env.JWT_SECRET
  if (!jwtSecret) return null

  const cookieToken = request.cookies.get(AUTH_COOKIE_NAME)?.value
  const authToken = getBearerToken(request.headers.get('authorization'))
  const token = cookieToken || authToken
  if (!token) return null

  try {
    const payload = jwt.verify(token, jwtSecret) as AuthTokenPayload
    return typeof payload.userId === 'string' ? payload.userId : null
  } catch {
    return null
  }
}

// GET /api/messages?with=<userId>  — fetch conversation thread
export async function GET(request: NextRequest) {
  try {
    const currentUserId = await getAuthenticatedUserId(request)
    if (!currentUserId) {
      return NextResponse.json({ error: MESSAGES.AUTH_REQUIRED }, { status: 401 })
    }

    const partnerId = request.nextUrl.searchParams.get('with')
    if (!partnerId) {
      return NextResponse.json({ error: 'Missing required parameter: with' }, { status: 400 })
    }

    const partner = await prisma.user.findUnique({
      where: { id: partnerId },
      select: {
        id: true,
        username: true,
        displayName: true,
        profile: { select: { avatarUrl: true } },
      },
    })

    if (!partner) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Mark unread messages from partner as read
    await prisma.message.updateMany({
      where: {
        senderId: partnerId,
        recipientId: currentUserId,
        readAt: null,
      },
      data: { readAt: new Date() },
    })

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: currentUserId, recipientId: partnerId },
          { senderId: partnerId, recipientId: currentUserId },
        ],
      },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        senderId: true,
        recipientId: true,
        body: true,
        readAt: true,
        createdAt: true,
      },
    })

    return NextResponse.json({
      messages: messages.map((m) => ({
        ...m,
        readAt: m.readAt?.toISOString() ?? null,
        createdAt: m.createdAt.toISOString(),
      })),
      partner: {
        id: partner.id,
        username: partner.username,
        displayName: partner.displayName,
        avatarUrl: partner.profile?.avatarUrl ?? null,
      },
    })
  } catch (error) {
    console.error('Messages fetch error:', error)
    return NextResponse.json({ error: MESSAGES.ERROR_GENERAL }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

// POST /api/messages  — send a message
export async function POST(request: NextRequest) {
  try {
    const currentUserId = await getAuthenticatedUserId(request)
    if (!currentUserId) {
      return NextResponse.json({ error: MESSAGES.AUTH_REQUIRED }, { status: 401 })
    }

    const body = await request.json()
    const recipientId = typeof body.recipientId === 'string' ? body.recipientId.trim() : ''
    const messageBody = typeof body.body === 'string' ? body.body.trim() : ''

    if (!recipientId) {
      return NextResponse.json({ error: 'recipientId is required' }, { status: 400 })
    }

    if (!messageBody) {
      return NextResponse.json({ error: 'Message body is required' }, { status: 400 })
    }

    if (messageBody.length > 2000) {
      return NextResponse.json({ error: 'Message must be 2000 characters or fewer' }, { status: 400 })
    }

    if (recipientId === currentUserId) {
      return NextResponse.json({ error: 'Cannot send a message to yourself' }, { status: 400 })
    }

    const recipient = await prisma.user.findUnique({
      where: { id: recipientId },
      select: { id: true },
    })

    if (!recipient) {
      return NextResponse.json({ error: 'Recipient not found' }, { status: 404 })
    }

    const message = await prisma.message.create({
      data: {
        senderId: currentUserId,
        recipientId,
        body: messageBody,
      },
      select: {
        id: true,
        senderId: true,
        recipientId: true,
        body: true,
        readAt: true,
        createdAt: true,
      },
    })

    return NextResponse.json(
      {
        message: {
          ...message,
          readAt: message.readAt?.toISOString() ?? null,
          createdAt: message.createdAt.toISOString(),
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Message send error:', error)
    return NextResponse.json({ error: MESSAGES.ERROR_GENERAL }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
