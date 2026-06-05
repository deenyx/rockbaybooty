import { NextRequest, NextResponse } from 'next/server'

import { getAuthenticatedUserId } from '@/lib/auth'
import { MESSAGES } from '@/lib/constants'
import prisma from '@/lib/prisma'

type ReportStatusFilter = 'pending' | 'reviewed' | 'dismissed' | 'actioned'

const ALLOWED_STATUS = new Set<ReportStatusFilter>(['pending', 'reviewed', 'dismissed', 'actioned'])

export async function GET(request: NextRequest) {
  try {
    const actorId = await getAuthenticatedUserId(request)

    if (!actorId) {
      return NextResponse.json({ error: MESSAGES.AUTH_REQUIRED }, { status: 401 })
    }

    const actor = await prisma.user.findUnique({
      where: { id: actorId },
      select: { id: true, role: true },
    })

    if (!actor || (actor.role !== 'ADMIN' && actor.role !== 'SUPREME_ADMIN')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const statusParam = request.nextUrl.searchParams.get('status') || 'pending'
    const takeParam = Number.parseInt(request.nextUrl.searchParams.get('take') || '40', 10)
    const take = Number.isFinite(takeParam) ? Math.min(Math.max(takeParam, 1), 100) : 40
    const where = ALLOWED_STATUS.has(statusParam as ReportStatusFilter)
      ? { status: statusParam as ReportStatusFilter }
      : {}

    const reports = await prisma.report.findMany({
      where,
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
      take,
      select: {
        id: true,
        reason: true,
        details: true,
        status: true,
        createdAt: true,
        reviewedAt: true,
        resolutionNote: true,
        reporter: {
          select: {
            id: true,
            username: true,
            displayName: true,
          },
        },
        target: {
          select: {
            id: true,
            username: true,
            displayName: true,
            status: true,
          },
        },
        reviewedBy: {
          select: {
            id: true,
            username: true,
            displayName: true,
          },
        },
      },
    })

    return NextResponse.json({ reports }, { status: 200 })
  } catch (error) {
    console.error('Failed to fetch admin reports:', error)
    return NextResponse.json({ error: MESSAGES.ERROR_GENERAL }, { status: 500 })
  }
}