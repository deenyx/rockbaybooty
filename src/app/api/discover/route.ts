import { NextRequest, NextResponse } from 'next/server'

import { getAuthenticatedUserId } from '@/lib/auth'
import { MESSAGES } from '@/lib/constants'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const ONLINE_THRESHOLD_MS = 5 * 60 * 1000
const TRENDING_WINDOW_DAYS = 30

export async function GET(request: NextRequest) {
  const userId = await getAuthenticatedUserId(request)

  if (!userId) {
    return NextResponse.json({ error: MESSAGES.AUTH_REQUIRED }, { status: 401 })
  }

  const blocks = await prisma.block.findMany({
    where: { OR: [{ blockerId: userId }, { blockedId: userId }] },
    select: { blockerId: true, blockedId: true },
  })

  const blockedIds = new Set(blocks.flatMap((block) => [block.blockerId, block.blockedId]))
  blockedIds.delete(userId)

  const onlineCutoff = new Date(Date.now() - ONLINE_THRESHOLD_MS)
  const newCutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const trendCutoff = new Date(Date.now() - TRENDING_WINDOW_DAYS * 24 * 60 * 60 * 1000)

  const [onlineMembers, newMembers, interestSnapshots] = await Promise.all([
    prisma.user.findMany({
      where: {
        id: { not: userId, notIn: [...blockedIds] },
        status: 'active',
        lastActiveAt: { gte: onlineCutoff },
        profile: { showOnlineStatus: true },
      },
      orderBy: { lastActiveAt: 'desc' },
      take: 18,
      select: {
        id: true,
        username: true,
        displayName: true,
        lastActiveAt: true,
        profile: {
          select: {
            avatarUrl: true,
            city: true,
            country: true,
          },
        },
      },
    }),
    prisma.user.findMany({
      where: {
        id: { not: userId, notIn: [...blockedIds] },
        status: 'active',
        createdAt: { gte: newCutoff },
      },
      orderBy: { createdAt: 'desc' },
      take: 18,
      select: {
        id: true,
        username: true,
        displayName: true,
        createdAt: true,
        profile: {
          select: {
            avatarUrl: true,
            city: true,
            country: true,
          },
        },
      },
    }),
    prisma.profile.findMany({
      where: {
        userId: { not: userId, notIn: [...blockedIds] },
        updatedAt: { gte: trendCutoff },
        user: { status: 'active' },
      },
      take: 400,
      select: { interests: true },
    }),
  ])

  const interestsCount = new Map<string, number>()

  for (const snapshot of interestSnapshots) {
    for (const interest of snapshot.interests) {
      const normalized = interest.trim()
      if (!normalized) continue
      interestsCount.set(normalized, (interestsCount.get(normalized) || 0) + 1)
    }
  }

  const trendingInterests = [...interestsCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([label, count]) => ({ label, count }))

  return NextResponse.json({
    onlineMembers: onlineMembers.map((member) => ({
      id: member.id,
      username: member.username,
      displayName: member.displayName,
      avatarUrl: member.profile?.avatarUrl ?? null,
      city: member.profile?.city ?? null,
      country: member.profile?.country ?? null,
      lastActiveAt: member.lastActiveAt?.toISOString() ?? null,
      createdAt: null,
    })),
    newMembers: newMembers.map((member) => ({
      id: member.id,
      username: member.username,
      displayName: member.displayName,
      avatarUrl: member.profile?.avatarUrl ?? null,
      city: member.profile?.city ?? null,
      country: member.profile?.country ?? null,
      lastActiveAt: null,
      createdAt: member.createdAt.toISOString(),
    })),
    trendingInterests,
  })
}
