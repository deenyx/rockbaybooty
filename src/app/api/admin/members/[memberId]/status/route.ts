import { NextRequest, NextResponse } from 'next/server'

import { MESSAGES } from '@/lib/constants'
import { getAuthenticatedUserId } from '@/lib/auth'
import prisma from '@/lib/prisma'

type AllowedStatus = 'active' | 'suspended'

function isAllowedStatus(value: unknown): value is AllowedStatus {
  return value === 'active' || value === 'suspended'
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
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

    const body = (await request.json().catch(() => null)) as { status?: unknown } | null

    if (!body || !isAllowedStatus(body.status)) {
      return NextResponse.json({ error: 'Invalid status payload' }, { status: 400 })
    }

    const { memberId } = await params

    if (!memberId) {
      return NextResponse.json({ error: 'Member id is required' }, { status: 400 })
    }

    if (memberId === actor.id) {
      return NextResponse.json({ error: 'You cannot change your own status' }, { status: 400 })
    }

    const target = await prisma.user.findUnique({
      where: { id: memberId },
      select: { id: true, role: true, status: true },
    })

    if (!target) {
      return NextResponse.json({ error: MESSAGES.FRIEND_REQUEST_INVALID_TARGET }, { status: 404 })
    }

    if (target.role === 'SUPREME_ADMIN' && actor.role !== 'SUPREME_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.user.update({
      where: { id: target.id },
      data: { status: body.status },
    })

    await prisma.adminAuditLog.create({
      data: {
        actorUserId: actor.id,
        targetUserId: target.id,
        action: 'MEMBER_STATUS_UPDATED',
        reason: `status -> ${body.status}`,
        beforeState: {
          status: target.status,
          role: target.role,
        },
        afterState: {
          status: body.status,
          role: target.role,
        },
      },
    })

    return NextResponse.json({
      message: body.status === 'active' ? 'Member reactivated' : 'Member suspended',
    })
  } catch (error) {
    console.error('Admin member status update failed:', error)
    return NextResponse.json({ error: MESSAGES.ERROR_GENERAL }, { status: 500 })
  }
}