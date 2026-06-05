import { NextRequest, NextResponse } from 'next/server'

import { getAuthenticatedUserId } from '@/lib/auth'
import { MESSAGES } from '@/lib/constants'
import prisma from '@/lib/prisma'

type AllowedReason =
  | 'harassment'
  | 'explicit_content'
  | 'spam'
  | 'impersonation'
  | 'underage'
  | 'other'

const ALLOWED_REASONS = new Set<AllowedReason>([
  'harassment',
  'explicit_content',
  'spam',
  'impersonation',
  'underage',
  'other',
])

export async function POST(request: NextRequest) {
  try {
    const reporterId = await getAuthenticatedUserId(request)

    if (!reporterId) {
      return NextResponse.json({ error: MESSAGES.AUTH_REQUIRED }, { status: 401 })
    }

    const body = (await request.json().catch(() => null)) as {
      targetId?: unknown
      reason?: unknown
      details?: unknown
    } | null

    if (!body || typeof body.targetId !== 'string' || body.targetId.trim().length === 0) {
      return NextResponse.json({ error: MESSAGES.FIELD_REQUIRED }, { status: 400 })
    }

    if (typeof body.reason !== 'string' || !ALLOWED_REASONS.has(body.reason as AllowedReason)) {
      return NextResponse.json({ error: 'Invalid report reason' }, { status: 400 })
    }

    const reason = body.reason as AllowedReason

    if (body.targetId === reporterId) {
      return NextResponse.json({ error: 'You cannot report yourself' }, { status: 400 })
    }

    const target = await prisma.user.findUnique({
      where: { id: body.targetId },
      select: { id: true },
    })

    if (!target) {
      return NextResponse.json({ error: MESSAGES.FRIEND_REQUEST_INVALID_TARGET }, { status: 404 })
    }

    const report = await prisma.report.create({
      data: {
        reporterId,
        targetId: body.targetId,
        reason,
        details: typeof body.details === 'string' && body.details.trim() ? body.details.trim() : null,
      },
      select: { id: true },
    })

    return NextResponse.json(
      {
        message: 'Report submitted',
        reportId: report.id,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Failed to submit report:', error)
    return NextResponse.json({ error: MESSAGES.ERROR_GENERAL }, { status: 500 })
  }
}