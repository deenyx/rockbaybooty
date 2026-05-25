import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthTokenPayload } from '@/lib/auth'
import { MESSAGES } from '@/lib/constants'

async function requireAdmin(request: NextRequest) {
  const payload = await getAuthTokenPayload(request)
  if (!payload?.userId) return null
  if (payload.mode === 'temp-admin') return payload.userId
  const user = await prisma.user.findUnique({ where: { id: payload.userId }, select: { isAdmin: true } })
  return user?.isAdmin ? payload.userId : null
}

const PAGE_SIZE = 30

// GET /api/admin/classifieds — list all classifieds with optional status and search
export async function GET(request: NextRequest) {
  const adminId = await requireAdmin(request)
  if (!adminId) return NextResponse.json({ error: MESSAGES.AUTH_REQUIRED }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') ?? 'active'
  const cursor = searchParams.get('cursor') ?? undefined
  const q = searchParams.get('q')?.trim() ?? ''

  const where: Record<string, unknown> = { status }
  if (q) {
    where.OR = [
      { title: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } },
    ]
  }

  const classifieds = await prisma.classified.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: PAGE_SIZE + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: {
      user: {
        select: {
          id: true,
          username: true,
          displayName: true,
          profile: { select: { avatarUrl: true } },
        },
      },
    },
  })

  const hasMore = classifieds.length > PAGE_SIZE
  const items = hasMore ? classifieds.slice(0, PAGE_SIZE) : classifieds
  const nextCursor = hasMore ? items[items.length - 1].id : null

  return NextResponse.json({
    classifieds: items.map((c) => ({
      id: c.id,
      title: c.title,
      description: c.description,
      category: c.category,
      location: c.location,
      status: c.status,
      expiresAt: c.expiresAt.toISOString(),
      createdAt: c.createdAt.toISOString(),
      author: {
        id: c.user.id,
        username: c.user.username,
        displayName: c.user.displayName,
        avatarUrl: c.user.profile?.avatarUrl ?? null,
      },
    })),
    nextCursor,
  })
}

// PATCH /api/admin/classifieds — remove or restore a classified
export async function PATCH(request: NextRequest) {
  const adminId = await requireAdmin(request)
  if (!adminId) return NextResponse.json({ error: MESSAGES.AUTH_REQUIRED }, { status: 403 })

  const body = await request.json().catch(() => ({}))
  const { classifiedId, action } = body as { classifiedId?: string; action?: string }

  if (!classifiedId || !['remove', 'restore'].includes(action ?? '')) {
    return NextResponse.json({ error: MESSAGES.FIELD_REQUIRED }, { status: 400 })
  }

  const newStatus = action === 'remove' ? 'deleted' : 'active'

  const updated = await prisma.classified.update({
    where: { id: classifiedId },
    data: { status: newStatus },
  })

  return NextResponse.json({ classified: { id: updated.id, status: updated.status } })
}
