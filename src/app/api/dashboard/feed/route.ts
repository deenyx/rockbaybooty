import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthenticatedUserId } from '@/lib/auth'
import { MESSAGES } from '@/lib/constants'

export const dynamic = 'force-dynamic'

const ONLINE_THRESHOLD_MS = 5 * 60 * 1000

export async function GET(request: NextRequest) {
  const userId = await getAuthenticatedUserId(request)
  if (!userId) return NextResponse.json({ error: MESSAGES.AUTH_REQUIRED }, { status: 401 })

  // Get blocked user IDs to exclude
  const blocks = await prisma.block.findMany({
    where: { OR: [{ blockerId: userId }, { blockedId: userId }] },
    select: { blockerId: true, blockedId: true },
  })
  const blockedIds = new Set(blocks.flatMap((b) => [b.blockerId, b.blockedId]))
  blockedIds.delete(userId)

  const onlineCutoff = new Date(Date.now() - ONLINE_THRESHOLD_MS)

  // Recently active members (online now), excluding self and blocked
  const onlineMembers = await prisma.user.findMany({
    where: {
      id: { not: userId, notIn: [...blockedIds] },
      status: 'active',
      lastActiveAt: { gte: onlineCutoff },
      profile: { showOnlineStatus: true },
    },
    orderBy: { lastActiveAt: 'desc' },
    take: 12,
    select: {
      id: true,
      username: true,
      displayName: true,
      lastActiveAt: true,
      isVerified: true,
      profile: {
        select: { avatarUrl: true, city: true, country: true, gender: true },
      },
    },
  })

  // New members (joined in last 7 days), excluding online ones already
  const onlineIds = new Set(onlineMembers.map((m) => m.id))
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const newMembers = await prisma.user.findMany({
    where: {
      id: { not: userId, notIn: [...blockedIds, ...onlineIds] },
      status: 'active',
      createdAt: { gte: sevenDaysAgo },
    },
    orderBy: { createdAt: 'desc' },
    take: 8,
    select: {
      id: true,
      username: true,
      displayName: true,
      createdAt: true,
      isVerified: true,
      profile: {
        select: { avatarUrl: true, city: true, country: true, gender: true },
      },
    },
  })

  // Recent group posts across groups user is a member of
  const memberGroupIds = await prisma.groupMember.findMany({
    where: { userId },
    select: { groupId: true },
  })
  const groupIds = memberGroupIds.map((g) => g.groupId)

  const recentGroupPosts = groupIds.length > 0
    ? await prisma.groupPost.findMany({
        where: { groupId: { in: groupIds }, status: 'active' },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          body: true,
          createdAt: true,
          group: { select: { id: true, name: true, slug: true } },
          author: {
            select: {
              id: true,
              username: true,
              displayName: true,
              profile: { select: { avatarUrl: true } },
            },
          },
        },
      })
    : []

  function serializeMember(m: typeof onlineMembers[number] & { createdAt?: Date }) {
    return {
      id: m.id,
      username: m.username,
      displayName: m.displayName,
      avatarUrl: m.profile?.avatarUrl ?? null,
      city: m.profile?.city ?? null,
      country: m.profile?.country ?? null,
      gender: m.profile?.gender ?? null,
      isVerified: m.isVerified,
      lastActiveAt: 'lastActiveAt' in m && m.lastActiveAt ? m.lastActiveAt.toISOString() : null,
      createdAt: 'createdAt' in m && (m as { createdAt?: Date }).createdAt
        ? (m as { createdAt: Date }).createdAt.toISOString()
        : null,
    }
  }

  return NextResponse.json({
    onlineMembers: onlineMembers.map(serializeMember),
    newMembers: newMembers.map((m) => serializeMember({ ...m, lastActiveAt: null })),
    recentGroupPosts: recentGroupPosts.map((p) => ({
      id: p.id,
      body: p.body.slice(0, 160),
      createdAt: p.createdAt.toISOString(),
      group: p.group,
      author: {
        id: p.author.id,
        username: p.author.username,
        displayName: p.author.displayName,
        avatarUrl: p.author.profile?.avatarUrl ?? null,
      },
    })),
  })
}
