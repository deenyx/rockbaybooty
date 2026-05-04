import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthenticatedUserId } from '@/lib/auth'
import { MESSAGES } from '@/lib/constants'

const PAGE_SIZE = 20

// GET /api/notifications — fetch latest notifications for current user
export async function GET(request: NextRequest) {
  const userId = await getAuthenticatedUserId(request)
  if (!userId) return NextResponse.json({ error: MESSAGES.AUTH_REQUIRED }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const cursor = searchParams.get('cursor') ?? undefined

  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: PAGE_SIZE + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  })

  const hasMore = notifications.length > PAGE_SIZE
  const items = hasMore ? notifications.slice(0, PAGE_SIZE) : notifications
  const nextCursor = hasMore ? items[items.length - 1].id : null

  const unreadCount = await prisma.notification.count({ where: { userId, isRead: false } })

  return NextResponse.json({
    notifications: items.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      body: n.body,
      link: n.link,
      isRead: n.isRead,
      createdAt: n.createdAt.toISOString(),
    })),
    unreadCount,
    nextCursor,
  })
}

// PATCH /api/notifications — mark notifications as read
export async function PATCH(request: NextRequest) {
  const userId = await getAuthenticatedUserId(request)
  if (!userId) return NextResponse.json({ error: MESSAGES.AUTH_REQUIRED }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const { ids } = body as { ids?: string[] }

  if (ids && ids.length > 0) {
    // Mark specific notifications read
    await prisma.notification.updateMany({
      where: { userId, id: { in: ids } },
      data: { isRead: true },
    })
  } else {
    // Mark all read
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    })
  }

  const unreadCount = await prisma.notification.count({ where: { userId, isRead: false } })
  return NextResponse.json({ unreadCount })
}
