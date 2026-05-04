import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthenticatedUserId } from '@/lib/auth'
import { MESSAGES } from '@/lib/constants'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const userId = await getAuthenticatedUserId(request)
  if (!userId) return NextResponse.json({ error: MESSAGES.AUTH_REQUIRED }, { status: 401 })

  const [
    friendsCount,
    pendingRequestsCount,
    groupsCount,
    unreadMessages,
    unreadNotifications,
    messageRequestsCount,
  ] = await Promise.all([
    prisma.friendship.count({
      where: {
        status: 'accepted',
        OR: [{ requesterId: userId }, { recipientId: userId }],
      },
    }),
    prisma.friendship.count({
      where: { recipientId: userId, status: 'pending' },
    }),
    prisma.groupMember.count({
      where: { userId },
    }),
    // Count messages sent to this user that are unread
    prisma.message.count({
      where: {
        recipientId: userId,
        readAt: null,
      },
    }),
    prisma.notification.count({
      where: { userId, isRead: false },
    }),
    prisma.messageRequest.count({
      where: { recipientId: userId, status: 'pending' },
    }),
  ])

  return NextResponse.json({
    friendsCount,
    pendingRequestsCount,
    groupsCount,
    unreadMessages,
    unreadNotifications,
    messageRequestsCount,
  })
}
