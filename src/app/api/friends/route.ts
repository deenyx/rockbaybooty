import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthenticatedUserId } from '@/lib/auth'
import { MESSAGES } from '@/lib/constants'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request)
    if (!userId) {
      return NextResponse.json({ error: MESSAGES.AUTH_REQUIRED }, { status: 401 })
    }

    const friendships = await prisma.friendship.findMany({
      where: {
        status: 'accepted',
        OR: [{ requesterId: userId }, { recipientId: userId }],
      },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        requesterId: true,
        recipientId: true,
        createdAt: true,
        updatedAt: true,
        requester: {
          select: {
            id: true,
            username: true,
            displayName: true,
            lastActiveAt: true,
            profile: { select: { avatarUrl: true, showOnlineStatus: true } },
          },
        },
        recipient: {
          select: {
            id: true,
            username: true,
            displayName: true,
            lastActiveAt: true,
            profile: { select: { avatarUrl: true, showOnlineStatus: true } },
          },
        },
      },
    })

    const ONLINE_THRESHOLD_MS = 5 * 60 * 1000

    const friends = friendships.map((f) => {
      const other = f.requesterId === userId ? f.recipient : f.requester
      const showOnline = other.profile?.showOnlineStatus !== false
      const lastActiveAt =
        showOnline && other.lastActiveAt
          ? other.lastActiveAt.toISOString()
          : null
      const isOnline =
        showOnline &&
        other.lastActiveAt != null &&
        Date.now() - other.lastActiveAt.getTime() < ONLINE_THRESHOLD_MS

      return {
        friendshipId: f.id,
        since: f.updatedAt.toISOString(),
        member: {
          id: other.id,
          username: other.username,
          displayName: other.displayName,
          avatarUrl: other.profile?.avatarUrl ?? null,
          isOnline,
          lastActiveAt,
        },
      }
    })

    return NextResponse.json({ friends })
  } catch (error) {
    console.error('Friends list error:', error)
    return NextResponse.json({ error: MESSAGES.ERROR_GENERAL }, { status: 500 })
  }
}
