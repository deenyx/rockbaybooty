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

// GET /api/admin/members — paginated member list with optional search and status filter
export async function GET(request: NextRequest) {
  const adminId = await requireAdmin(request)
  if (!adminId) return NextResponse.json({ error: MESSAGES.AUTH_REQUIRED }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')?.trim() ?? ''
  const status = searchParams.get('status') ?? ''
  const cursor = searchParams.get('cursor') ?? undefined

  const where = {
    ...(status ? { status } : {}),
    ...(q
      ? {
          OR: [
            { username: { contains: q, mode: 'insensitive' as const } },
            { displayName: { contains: q, mode: 'insensitive' as const } },
            { email: { contains: q, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  }

  const users = await prisma.user.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: PAGE_SIZE + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: {
      id: true,
      username: true,
      displayName: true,
      email: true,
      status: true,
      createdAt: true,
    },
  })

  const hasMore = users.length > PAGE_SIZE
  const items = hasMore ? users.slice(0, PAGE_SIZE) : users
  const nextCursor = hasMore ? items[items.length - 1].id : null

  return NextResponse.json({
    members: items.map((u) => ({
      id: u.id,
      username: u.username,
      displayName: u.displayName,
      email: u.email,
      status: u.status,
      isVerified: false,
      createdAt: u.createdAt.toISOString(),
      lastActiveAt: null,
      avatarUrl: null,
      reportCount: 0,
    })),
    nextCursor,
  })
}
