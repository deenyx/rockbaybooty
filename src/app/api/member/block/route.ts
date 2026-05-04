import { NextRequest, NextResponse } from 'next/server'

import { getAuthenticatedUserId } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { MESSAGES } from '@/lib/constants'

// POST /api/member/block — block a user
export async function POST(request: NextRequest) {
  try {
    const currentUserId = await getAuthenticatedUserId(request)

    if (!currentUserId) {
      return NextResponse.json({ error: MESSAGES.AUTH_REQUIRED }, { status: 401 })
    }

    const body = await request.json()
    const targetId = typeof body.targetId === 'string' ? body.targetId.trim() : ''

    if (!targetId) {
      return NextResponse.json({ error: 'targetId is required' }, { status: 400 })
    }

    if (targetId === currentUserId) {
      return NextResponse.json({ error: 'Cannot block yourself' }, { status: 400 })
    }

    // Verify target user exists
    const target = await prisma.user.findUnique({ where: { id: targetId }, select: { id: true } })
    if (!target) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Upsert — idempotent
    await prisma.block.upsert({
      where: { blockerId_blockedId: { blockerId: currentUserId, blockedId: targetId } },
      create: { blockerId: currentUserId, blockedId: targetId },
      update: {},
    })

    return NextResponse.json({ message: 'User blocked' })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/member/block — unblock a user
export async function DELETE(request: NextRequest) {
  try {
    const currentUserId = await getAuthenticatedUserId(request)

    if (!currentUserId) {
      return NextResponse.json({ error: MESSAGES.AUTH_REQUIRED }, { status: 401 })
    }

    const body = await request.json()
    const targetId = typeof body.targetId === 'string' ? body.targetId.trim() : ''

    if (!targetId) {
      return NextResponse.json({ error: 'targetId is required' }, { status: 400 })
    }

    await prisma.block.deleteMany({
      where: { blockerId: currentUserId, blockedId: targetId },
    })

    return NextResponse.json({ message: 'User unblocked' })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET /api/member/block — get list of blocked user IDs
export async function GET(request: NextRequest) {
  try {
    const currentUserId = await getAuthenticatedUserId(request)

    if (!currentUserId) {
      return NextResponse.json({ error: MESSAGES.AUTH_REQUIRED }, { status: 401 })
    }

    const blocks = await prisma.block.findMany({
      where: { blockerId: currentUserId },
      select: { blockedId: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ blocked: blocks })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
