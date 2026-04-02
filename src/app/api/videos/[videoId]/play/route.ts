import jwt from 'jsonwebtoken'
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

import { MESSAGES } from '@/lib/constants'
import { getAuthenticatedUserId } from '@/lib/auth'

type PlaybackTokenPayload = {
  videoId: string
  purpose: 'public-playback'
}

export async function GET(
  request: NextRequest,
  { params }: { params: { videoId: string } }
) {
  try {
    const video = await prisma.video.findUnique({
      where: { id: params.videoId },
      select: {
        id: true,
        isPublic: true,
        videoUrl: true,
      },
    })

    if (!video) {
      return NextResponse.json({ error: MESSAGES.VIDEO_NOT_FOUND }, { status: 404 })
    }

    if (video.isPublic) {
      const token = request.nextUrl.searchParams.get('token')
      const jwtSecret = process.env.JWT_SECRET

      if (!token || !jwtSecret) {
        return NextResponse.json({ error: MESSAGES.AUTH_REQUIRED }, { status: 401 })
      }

      try {
        const payload = jwt.verify(token, jwtSecret) as PlaybackTokenPayload

        if (payload.videoId !== params.videoId || payload.purpose !== 'public-playback') {
          return NextResponse.json({ error: MESSAGES.AUTH_REQUIRED }, { status: 401 })
        }
      } catch {
        return NextResponse.json({ error: MESSAGES.AUTH_REQUIRED }, { status: 401 })
      }
    } else {
      const userId = await getAuthenticatedUserId(request)

      if (!userId) {
        return NextResponse.json({ error: MESSAGES.AUTH_REQUIRED }, { status: 401 })
      }
    }

    return NextResponse.redirect(video.videoUrl, 307)
  } catch (error) {
    console.error('Video playback proxy error:', error)
    return NextResponse.json({ error: MESSAGES.ERROR_GENERAL }, { status: 500 })
  }
}
