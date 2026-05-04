import { NextRequest, NextResponse } from 'next/server'

import { getAuthenticatedUserId } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { MESSAGES, REPORT_REASONS } from '@/lib/constants'

// POST /api/member/report — report a user
export async function POST(request: NextRequest) {
  try {
    const currentUserId = await getAuthenticatedUserId(request)

    if (!currentUserId) {
      return NextResponse.json({ error: MESSAGES.AUTH_REQUIRED }, { status: 401 })
    }

    const body = await request.json()
    const targetId = typeof body.targetId === 'string' ? body.targetId.trim() : ''
    const reason = typeof body.reason === 'string' ? body.reason.trim() : ''
    const details = typeof body.details === 'string' ? body.details.trim().slice(0, 1000) : undefined

    if (!targetId) {
      return NextResponse.json({ error: 'targetId is required' }, { status: 400 })
    }

    if (targetId === currentUserId) {
      return NextResponse.json({ error: 'Cannot report yourself' }, { status: 400 })
    }

    if (!REPORT_REASONS.includes(reason as typeof REPORT_REASONS[number])) {
      return NextResponse.json({ error: 'Invalid reason' }, { status: 400 })
    }

    // Verify target user exists
    const target = await prisma.user.findUnique({ where: { id: targetId }, select: { id: true } })
    if (!target) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Allow one pending report per reporter/reported pair to avoid spam
    const existing = await prisma.report.findFirst({
      where: { reporterId: currentUserId, reportedId: targetId, status: 'pending' },
    })

    if (existing) {
      return NextResponse.json({ message: 'Report already submitted', reportId: existing.id })
    }

    const report = await prisma.report.create({
      data: {
        reporterId: currentUserId,
        reportedId: targetId,
        reason,
        details: details || null,
      },
    })

    return NextResponse.json({ message: 'Report submitted', reportId: report.id }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
