import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

import { MESSAGES } from '@/lib/constants'
import { getAuthenticatedUserId } from '@/lib/auth'

export async function POST(
  request: NextRequest,
  { params }: { params: { videoId: string } }
) {
  try {
    const existing = await prisma.video.findUnique({
      where: { id: params.videoId },
      select: {
        id: true,
        userId: true,
        isPublic: true,
      },
    })

    if (!existing) {
      return NextResponse.json({ error: MESSAGES.VIDEO_NOT_FOUND }, { status: 404 })
    }

    if (!existing.isPublic) {
      const userId = await getAuthenticatedUserId(request)

      if (!userId) {
        return NextResponse.json({ error: MESSAGES.AUTH_REQUIRED }, { status: 401 })
      }
    }

    const updated = await prisma.video.update({
      where: { id: existing.id },
      data: {
        views: {
          increment: 1,
        },
      },
      select: {
        views: true,
      },
    })

    return NextResponse.json({ views: updated.views })
  } catch (error) {
    console.error('Video view update error:', error)
    return NextResponse.json({ error: MESSAGES.ERROR_GENERAL }, { status: 500 })
  }
}
