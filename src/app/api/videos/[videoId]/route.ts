import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

import { MESSAGES } from '@/lib/constants'
import { getAuthenticatedUserId } from '@/lib/auth'

function normalizeString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function serializeVideo(video: {
  id: string
  userId: string
  title: string
  description: string | null
  videoUrl: string
  thumbnailUrl: string | null
  isPublic: boolean
  views: number
  createdAt: Date
  updatedAt: Date
  user: {
    id: string
    username: string
    displayName: string
    profile: { avatarUrl: string | null } | null
  }
}) {
  return {
    id: video.id,
    userId: video.userId,
    title: video.title,
    description: video.description,
    videoUrl: video.videoUrl,
    thumbnailUrl: video.thumbnailUrl,
    isPublic: video.isPublic,
    views: video.views,
    createdAt: video.createdAt.toISOString(),
    updatedAt: video.updatedAt.toISOString(),
    user: {
      id: video.user.id,
      username: video.user.username,
      displayName: video.user.displayName,
      avatarUrl: video.user.profile?.avatarUrl ?? null,
    },
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { videoId: string } }
) {
  try {
    const userId = await getAuthenticatedUserId(request)

    if (!userId) {
      return NextResponse.json({ error: MESSAGES.AUTH_REQUIRED }, { status: 401 })
    }

    const existing = await prisma.video.findUnique({
      where: { id: params.videoId },
      select: {
        id: true,
        userId: true,
      },
    })

    if (!existing) {
      return NextResponse.json({ error: MESSAGES.VIDEO_NOT_FOUND }, { status: 404 })
    }

    if (existing.userId !== userId) {
      return NextResponse.json({ error: MESSAGES.VIDEO_FORBIDDEN }, { status: 403 })
    }

    const body = await request.json()

    const title = normalizeString(body.title)
    const description = normalizeString(body.description)
    const videoUrl = normalizeString(body.videoUrl)
    const thumbnailUrl = normalizeString(body.thumbnailUrl)
    const hasIsPublic = typeof body.isPublic === 'boolean'
    const isPublic = body.isPublic === true

    if (body.title !== undefined && !title) {
      return NextResponse.json({ error: MESSAGES.FIELD_REQUIRED }, { status: 400 })
    }

    if (body.videoUrl !== undefined && !videoUrl) {
      return NextResponse.json({ error: MESSAGES.FIELD_REQUIRED }, { status: 400 })
    }

    if (hasIsPublic && isPublic) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          isPremium: true,
        },
      })

      if (!user?.isPremium) {
        return NextResponse.json({ error: MESSAGES.VIDEO_PREMIUM_REQUIRED }, { status: 403 })
      }
    }

    const data: {
      title?: string
      description?: string | null
      videoUrl?: string
      thumbnailUrl?: string | null
      isPublic?: boolean
    } = {}

    if (body.title !== undefined) {
      data.title = title
    }

    if (body.description !== undefined) {
      data.description = description || null
    }

    if (body.videoUrl !== undefined) {
      data.videoUrl = videoUrl
    }

    if (body.thumbnailUrl !== undefined) {
      data.thumbnailUrl = thumbnailUrl || null
    }

    if (hasIsPublic) {
      data.isPublic = isPublic
    }

    const video = await prisma.video.update({
      where: { id: existing.id },
      data,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            profile: {
              select: {
                avatarUrl: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json({ video: serializeVideo(video) })
  } catch (error) {
    console.error('Video update error:', error)
    return NextResponse.json({ error: MESSAGES.ERROR_GENERAL }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { videoId: string } }
) {
  try {
    const userId = await getAuthenticatedUserId(request)

    if (!userId) {
      return NextResponse.json({ error: MESSAGES.AUTH_REQUIRED }, { status: 401 })
    }

    const existing = await prisma.video.findUnique({
      where: { id: params.videoId },
      select: {
        id: true,
        userId: true,
      },
    })

    if (!existing) {
      return NextResponse.json({ error: MESSAGES.VIDEO_NOT_FOUND }, { status: 404 })
    }

    if (existing.userId !== userId) {
      return NextResponse.json({ error: MESSAGES.VIDEO_FORBIDDEN }, { status: 403 })
    }

    await prisma.video.delete({ where: { id: existing.id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Video delete error:', error)
    return NextResponse.json({ error: MESSAGES.ERROR_GENERAL }, { status: 500 })
  }
}
