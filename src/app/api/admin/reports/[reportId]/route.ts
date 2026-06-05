import { NextRequest, NextResponse } from 'next/server'

import { getAuthenticatedUserId } from '@/lib/auth'
import { MESSAGES } from '@/lib/constants'
import prisma from '@/lib/prisma'

type DecisionStatus = 'reviewed' | 'dismissed' | 'actioned'

function isDecisionStatus(value: unknown): value is DecisionStatus {
  return value === 'reviewed' || value === 'dismissed' || value === 'actioned'
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
) {
  try {
    const actorId = await getAuthenticatedUserId(request)

    if (!actorId) {
      return NextResponse.json({ error: MESSAGES.AUTH_REQUIRED }, { status: 401 })
    }

    const actor = await prisma.user.findUnique({
      where: { id: actorId },
      select: { id: true, role: true, username: true },
    })

    if (!actor || (actor.role !== 'ADMIN' && actor.role !== 'SUPREME_ADMIN')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = (await request.json().catch(() => null)) as {
      status?: unknown
      resolutionNote?: unknown
    } | null

    if (!body || !isDecisionStatus(body.status)) {
      return NextResponse.json({ error: 'Invalid moderation decision status' }, { status: 400 })
    }

    const { reportId } = await params

    if (!reportId) {
      return NextResponse.json({ error: 'Report id is required' }, { status: 400 })
    }

    const report = await prisma.report.findUnique({
      where: { id: reportId },
      select: {
        id: true,
        status: true,
        reason: true,
        targetId: true,
        reviewedById: true,
      },
    })

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    const nextResolutionNote =
      typeof body.resolutionNote === 'string' && body.resolutionNote.trim().length > 0
        ? body.resolutionNote.trim().slice(0, 800)
        : null

    const updated = await prisma.report.update({
      where: { id: report.id },
      data: {
        status: body.status,
        reviewedById: actor.id,
        reviewedAt: new Date(),
        resolutionNote: nextResolutionNote,
      },
      select: {
        id: true,
        status: true,
        reviewedAt: true,
        resolutionNote: true,
      },
    })

    await prisma.adminAuditLog.create({
      data: {
        actorUserId: actor.id,
        targetUserId: report.targetId,
        action: 'REPORT_STATUS_UPDATED',
        reason: nextResolutionNote || null,
        beforeState: {
          reportId: report.id,
          status: report.status,
          reviewedById: report.reviewedById,
          reason: report.reason,
        },
        afterState: {
          reportId: updated.id,
          status: updated.status,
          reviewedById: actor.id,
        },
      },
    })

    return NextResponse.json(
      {
        message: 'Report updated',
        report: updated,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Failed to update report decision:', error)
    return NextResponse.json({ error: MESSAGES.ERROR_GENERAL }, { status: 500 })
  }
}