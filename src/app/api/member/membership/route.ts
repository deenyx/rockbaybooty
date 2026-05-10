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

  const [user, videoStats] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        isPremium: true,
        isVerified: true,
        createdAt: true,
      },
    }),
    prisma.video.aggregate({
      where: { userId },
      _count: { id: true },
      _sum: {
        views: true,
      },
    }),
  ])

  if (!user) {
    return NextResponse.json({ error: MESSAGES.AUTH_REQUIRED }, { status: 401 })
  }

  const publicVideos = await prisma.video.count({
    where: { userId, isPublic: true },
  })

  return NextResponse.json({
    isPremium: user.isPremium,
    isVerified: user.isVerified,
    memberSince: user.createdAt.toISOString(),
    totalVideos: videoStats._count.id,
    publicVideos,
    totalViews: videoStats._sum.views || 0,
  })
}
