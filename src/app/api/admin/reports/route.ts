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

const PAGE_SIZE = 25

// GET /api/admin/reports — list reports with optional status filter
export async function GET(request: NextRequest) {
  const adminId = await requireAdmin(request)
  if (!adminId) return NextResponse.json({ error: MESSAGES.AUTH_REQUIRED }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') ?? 'pending'
  const cursor = searchParams.get('cursor') ?? undefined

  const reports = await prisma.report.findMany({
    where: { status },
    orderBy: { createdAt: 'desc' },
    take: PAGE_SIZE + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: {
      reporter: { select: { id: true, username: true, displayName: true } },
      reported: {
        select: {
          id: true,
          username: true,
          displayName: true,
          status: true,
          isVerified: true,
          profile: { select: { avatarUrl: true } },
        },
      },
    },
  })

  const hasMore = reports.length > PAGE_SIZE
  const items = hasMore ? reports.slice(0, PAGE_SIZE) : reports
  const nextCursor = hasMore ? items[items.length - 1].id : null

  return NextResponse.json({
    reports: items.map((r) => ({
      id: r.id,
      reason: r.reason,
      details: r.details,
      status: r.status,
      createdAt: r.createdAt.toISOString(),
      reviewedAt: r.reviewedAt?.toISOString() ?? null,
      reporter: r.reporter,
      reported: {
        id: r.reported.id,
        username: r.reported.username,
        displayName: r.reported.displayName,
        accountStatus: r.reported.status,
        isVerified: r.reported.isVerified,
        avatarUrl: r.reported.profile?.avatarUrl ?? null,
      },
    })),
    nextCursor,
  })
}

// PATCH /api/admin/reports — update report status
export async function PATCH(request: NextRequest) {
  const adminId = await requireAdmin(request)
  if (!adminId) return NextResponse.json({ error: MESSAGES.AUTH_REQUIRED }, { status: 403 })

  const body = await request.json().catch(() => ({}))
  const { reportId, status } = body as { reportId?: string; status?: string }

  if (!reportId || !['reviewed', 'dismissed', 'actioned'].includes(status ?? '')) {
    return NextResponse.json({ error: MESSAGES.FIELD_REQUIRED }, { status: 400 })
  }

  const updated = await prisma.report.update({
    where: { id: reportId },
    data: { status, reviewedAt: new Date(), reviewedBy: adminId },
  })

  return NextResponse.json({ report: { id: updated.id, status: updated.status } })
}
