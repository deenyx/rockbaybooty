import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'
import { NextRequest, NextResponse } from 'next/server'

import { AUTH_COOKIE_NAME, MESSAGES } from '@/lib/constants'
import type { AuthTokenPayload } from '@/lib/types'

export const dynamic = 'force-dynamic'

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

// GET /api/messages/conversations  — list all conversation threads
export async function GET(request: NextRequest) {
  try {
    const currentUserId = await getAuthenticatedUserId(request)
    if (!currentUserId) {
      return NextResponse.json({ error: MESSAGES.AUTH_REQUIRED }, { status: 401 })
    }

    // Fetch all messages involving the current user, newest first
    const allMessages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: currentUserId },
          { recipientId: currentUserId },
        ],
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        senderId: true,
        recipientId: true,
        kind: true,
        body: true,
        readAt: true,
        createdAt: true,
      },
    })

    // Group by conversation partner, keeping only the latest message per thread
    const threadMap = new Map<
      string,
      {
        partnerId: string
        lastMessage: typeof allMessages[number]
        unreadCount: number
      }
    >()

    for (const msg of allMessages) {
      const partnerId = msg.senderId === currentUserId ? msg.recipientId : msg.senderId

      if (!threadMap.has(partnerId)) {
        threadMap.set(partnerId, {
          partnerId,
          lastMessage: msg,
          unreadCount: 0,
        })
      }

      // Count unread messages from partner
      if (msg.recipientId === currentUserId && msg.readAt === null) {
        const thread = threadMap.get(partnerId)!
        thread.unreadCount += 1
      }
    }

    if (threadMap.size === 0) {
      return NextResponse.json({ conversations: [] })
    }

    // Fetch partner profiles
    const partnerIds = Array.from(threadMap.keys())
    const partners = await prisma.user.findMany({
      where: { id: { in: partnerIds } },
      select: {
        id: true,
        username: true,
        displayName: true,
        profile: { select: { avatarUrl: true } },
      },
    })

    const partnerMap = new Map(partners.map((p) => [p.id, p]))

    const conversations = Array.from(threadMap.values())
      .filter((t) => partnerMap.has(t.partnerId))
      .map((t) => {
        const partner = partnerMap.get(t.partnerId)!
        const lm = t.lastMessage
        return {
          partnerId: partner.id,
          partnerUsername: partner.username,
          partnerDisplayName: partner.displayName,
          partnerAvatarUrl: partner.profile?.avatarUrl ?? null,
          lastMessage: {
            id: lm.id,
            senderId: lm.senderId,
            recipientId: lm.recipientId,
            kind: lm.kind,
            body: lm.body,
            readAt: lm.readAt?.toISOString() ?? null,
            createdAt: lm.createdAt.toISOString(),
          },
          unreadCount: t.unreadCount,
        }
      })
      // Sort by most recent first
      .sort((a, b) =>
        b.lastMessage.createdAt.localeCompare(a.lastMessage.createdAt)
      )

    return NextResponse.json({ conversations })
  } catch (error) {
    console.error('Conversations fetch error:', error)
    return NextResponse.json({ error: MESSAGES.ERROR_GENERAL }, { status: 500 })
  }
}
