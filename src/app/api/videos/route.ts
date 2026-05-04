import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

import { MESSAGES } from '@/lib/constants'
import { getAuthenticatedUserId } from '@/lib/auth'

export const dynamic = 'force-dynamic'

const DEFAULT_LIMIT = 24
const MAX_LIMIT = 60

function parseLimit(value: string | null): number {
  const parsed = Number.parseInt(value || '', 10)

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_LIMIT
  }

  return Math.min(parsed, MAX_LIMIT)
}

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

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const mine = searchParams.get('mine') === 'true'
    const limit = parseLimit(searchParams.get('limit'))
    const q = searchParams.get('q')?.trim() || ''

    if (mine) {
      const userId = await getAuthenticatedUserId(request)

      if (!userId) {
        return NextResponse.json({ error: MESSAGES.AUTH_REQUIRED }, { status: 401 })
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          status: true,
          isPremium: true,
        },
      })

      if (!user || user.status !== 'active') {
        return NextResponse.json({ error: MESSAGES.AUTH_REQUIRED }, { status: 401 })
      }

      const videos = await prisma.video.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
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

      return NextResponse.json({
        videos: videos.map(serializeVideo),
        isPremium: user.isPremium,
      })
    }

    const videos = await prisma.video.findMany({
      where: {
        isPublic: true,
        ...(q
          ? {
              OR: [
                {
                  title: {
                    contains: q,
                    mode: 'insensitive',
                  },
                },
                {
                  description: {
                    contains: q,
                    mode: 'insensitive',
                  },
                },
                {
                  user: {
                    displayName: {
                      contains: q,
                      mode: 'insensitive',
                    },
                  },
                },
                {
                  user: {
                    username: {
                      contains: q,
                      mode: 'insensitive',
                    },
                  },
                },
              ],
            }
          : {}),
      },
      take: limit,
      orderBy: [
        { createdAt: 'desc' },
      ],
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

    return NextResponse.json({ videos: videos.map(serializeVideo) })
  } catch (error) {
    console.error('Video listing error:', error)
    return NextResponse.json({ error: MESSAGES.ERROR_GENERAL }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request)

    if (!userId) {
      return NextResponse.json({ error: MESSAGES.AUTH_REQUIRED }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        status: true,
        isPremium: true,
      },
    })

    if (!user || user.status !== 'active') {
      return NextResponse.json({ error: MESSAGES.AUTH_REQUIRED }, { status: 401 })
    }

    const body = await request.json()

    const title = normalizeString(body.title)
    const description = normalizeString(body.description)
    const videoUrl = normalizeString(body.videoUrl)
    const thumbnailUrl = normalizeString(body.thumbnailUrl)
    const isPublic = body.isPublic === true

    if (!title || !videoUrl) {
      return NextResponse.json({ error: MESSAGES.FIELD_REQUIRED }, { status: 400 })
    }

    if (isPublic && !user.isPremium) {
      return NextResponse.json({ error: MESSAGES.VIDEO_PREMIUM_REQUIRED }, { status: 403 })
    }

    const video = await prisma.video.create({
      data: {
        userId: user.id,
        title,
        description: description || null,
        videoUrl,
        thumbnailUrl: thumbnailUrl || null,
        isPublic,
      },
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

    return NextResponse.json({ video: serializeVideo(video) }, { status: 201 })
  } catch (error) {
    console.error('Video create error:', error)
    return NextResponse.json({ error: MESSAGES.ERROR_GENERAL }, { status: 500 })
  }
}
