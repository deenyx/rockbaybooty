import { NextRequest, NextResponse } from 'next/server'

import { getAuthenticatedUserId } from '@/lib/auth'
import { MESSAGES } from '@/lib/constants'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const userId = await getAuthenticatedUserId(request)

  if (!userId) {
    return NextResponse.json({ error: MESSAGES.AUTH_REQUIRED }, { status: 401 })
  }

  const [blocks, reportCounts] = await Promise.all([
    prisma.block.findMany({
      where: { blockerId: userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        blockedId: true,
        createdAt: true,
        blocked: {
          select: {
            username: true,
            displayName: true,
            profile: { select: { avatarUrl: true } },
          },
        },
      },
    }),
    prisma.report.groupBy({
      by: ['status'],
      where: { reporterId: userId },
      _count: { _all: true },
    }),
  ])

  const statusCounts: Record<string, number> = {}
  for (const row of reportCounts) {
    statusCounts[row.status] = row._count._all
  }

  return NextResponse.json({
    blocked: blocks.map((entry) => ({
      blockedId: entry.blockedId,
      createdAt: entry.createdAt.toISOString(),
      username: entry.blocked.username,
      displayName: entry.blocked.displayName,
      avatarUrl: entry.blocked.profile?.avatarUrl ?? null,
    })),
    reportCounts: {
      pending: statusCounts.pending || 0,
      reviewed: statusCounts.reviewed || 0,
      dismissed: statusCounts.dismissed || 0,
      actioned: statusCounts.actioned || 0,
    },
  })
}
