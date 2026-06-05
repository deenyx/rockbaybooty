import { NextRequest, NextResponse } from 'next/server'

import { getAuthenticatedUserId } from '@/lib/auth'
import { MESSAGES } from '@/lib/constants'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const actorId = await getAuthenticatedUserId(request)

    if (!actorId) {
      return NextResponse.json({ error: MESSAGES.AUTH_REQUIRED }, { status: 401 })
    }

    const actor = await prisma.user.findUnique({
      where: { id: actorId },
      select: { role: true },
    })

    if (!actor || (actor.role !== 'ADMIN' && actor.role !== 'SUPREME_ADMIN')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const takeParam = Number.parseInt(request.nextUrl.searchParams.get('take') || '50', 10)
    const take = Number.isFinite(takeParam) ? Math.min(Math.max(takeParam, 1), 200) : 50

    const logs = await prisma.adminAuditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take,
      select: {
        id: true,
        action: true,
        reason: true,
        targetUserId: true,
        beforeState: true,
        afterState: true,
        createdAt: true,
        actor: {
          select: {
            id: true,
            username: true,
            displayName: true,
          },
        },
      },
    })

    return NextResponse.json({ logs }, { status: 200 })
  } catch (error) {
    console.error('Failed to fetch admin audit logs:', error)
    return NextResponse.json({ error: MESSAGES.ERROR_GENERAL }, { status: 500 })
  }
}