import { NextRequest, NextResponse } from 'next/server'

import { getAuthenticatedUserId } from '@/lib/auth'
import { MESSAGES } from '@/lib/constants'
import prisma from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request)
    if (!userId) {
      return NextResponse.json({ error: MESSAGES.AUTH_REQUIRED }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const imageUrl = typeof body.imageUrl === 'string' ? body.imageUrl.trim() : ''

    if (!imageUrl || (!imageUrl.startsWith('https://') && !imageUrl.startsWith('http://'))) {
      return NextResponse.json({ error: 'A valid ID image URL is required.' }, { status: 400 })
    }

    const verification = await prisma.identityVerification.upsert({
      where: { userId },
      create: {
        userId,
        imageUrl,
        status: 'pending',
      },
      update: {
        imageUrl,
        status: 'pending',
        reviewNotes: null,
        reviewedBy: null,
        reviewedAt: null,
      },
      select: {
        id: true,
        status: true,
        imageUrl: true,
        createdAt: true,
        reviewedAt: true,
        reviewNotes: true,
      },
    })

    return NextResponse.json({
      message: 'Photo ID submitted. Verification is now pending review.',
      verification,
    })
  } catch (error) {
    console.error('[POST /api/member/verification/photo-id]', error)
    return NextResponse.json({ error: MESSAGES.ERROR_GENERAL }, { status: 500 })
  }
}
