import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthenticatedUserId } from '@/lib/auth'
import { MESSAGES } from '@/lib/constants'

async function requireAdmin(request: NextRequest) {
  const userId = await getAuthenticatedUserId(request)
  if (!userId) return null
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { isAdmin: true } })
  return user?.isAdmin ? userId : null
}

const PAGE_SIZE = 30

// GET /api/admin/groups — list all groups with member/post counts
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
      { name: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } },
    ]
  }

  const groups = await prisma.group.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: PAGE_SIZE + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: {
      _count: { select: { members: true, posts: true } },
      members: {
        where: { role: 'owner' },
        take: 1,
        include: {
          user: { select: { id: true, username: true, displayName: true } },
        },
      },
    },
  })

  const hasMore = groups.length > PAGE_SIZE
  const items = hasMore ? groups.slice(0, PAGE_SIZE) : groups
  const nextCursor = hasMore ? items[items.length - 1].id : null

  return NextResponse.json({
    groups: items.map((g) => ({
      id: g.id,
      name: g.name,
      slug: g.slug,
      category: g.category,
      status: g.status,
      isPublic: g.isPublic,
      createdAt: g.createdAt.toISOString(),
      memberCount: g._count.members,
      postCount: g._count.posts,
      owner: g.members[0]?.user ?? null,
    })),
    nextCursor,
  })
}

// PATCH /api/admin/groups — close or reopen a group
export async function PATCH(request: NextRequest) {
  const adminId = await requireAdmin(request)
  if (!adminId) return NextResponse.json({ error: MESSAGES.AUTH_REQUIRED }, { status: 403 })

  const body = await request.json().catch(() => ({}))
  const { groupId, action } = body as { groupId?: string; action?: string }

  if (!groupId || !['close', 'reopen', 'delete'].includes(action ?? '')) {
    return NextResponse.json({ error: MESSAGES.FIELD_REQUIRED }, { status: 400 })
  }

  const newStatus = action === 'close' ? 'closed' : action === 'delete' ? 'deleted' : 'active'

  const updated = await prisma.group.update({
    where: { id: groupId },
    data: { status: newStatus },
  })

  return NextResponse.json({ group: { id: updated.id, status: updated.status } })
}
