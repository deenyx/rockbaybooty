import { NextRequest, NextResponse } from 'next/server'

import { getAuthTokenPayload } from '@/lib/auth'
import { MESSAGES } from '@/lib/constants'
import prisma from '@/lib/prisma'

async function requireAdmin(request: NextRequest) {
  const payload = await getAuthTokenPayload(request)
  if (!payload?.userId) return null
  if (payload.mode === 'temp-admin') return payload.userId

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { isAdmin: true },
  })

  return user?.isAdmin ? payload.userId : null
}

export async function GET(request: NextRequest) {
  const adminId = await requireAdmin(request)
  if (!adminId) return NextResponse.json({ error: MESSAGES.AUTH_REQUIRED }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') ?? 'pending'

  const verifications = await prisma.identityVerification.findMany({
    where: { status },
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          displayName: true,
          status: true,
          isVerified: true,
          profile: { select: { avatarUrl: true } },
        },
      },
      reviewer: {
        select: { id: true, username: true, displayName: true },
      },
    },
  })

  return NextResponse.json({
    verifications: verifications.map((verification) => ({
      id: verification.id,
      status: verification.status,
      imageUrl: verification.imageUrl,
      reviewNotes: verification.reviewNotes,
      createdAt: verification.createdAt.toISOString(),
      reviewedAt: verification.reviewedAt?.toISOString() ?? null,
      user: {
        id: verification.user.id,
        username: verification.user.username,
        displayName: verification.user.displayName,
        accountStatus: verification.user.status,
        isVerified: verification.user.isVerified,
        avatarUrl: verification.user.profile?.avatarUrl ?? null,
      },
      reviewer: verification.reviewer,
    })),
  })
}

export async function PATCH(request: NextRequest) {
  const adminId = await requireAdmin(request)
  if (!adminId) return NextResponse.json({ error: MESSAGES.AUTH_REQUIRED }, { status: 403 })

  const body = await request.json().catch(() => ({}))
  const verificationId = typeof body.verificationId === 'string' ? body.verificationId : ''
  const action = typeof body.action === 'string' ? body.action : ''
  const reviewNotes = typeof body.reviewNotes === 'string' ? body.reviewNotes.trim() : null

  if (!verificationId || !['approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: MESSAGES.FIELD_REQUIRED }, { status: 400 })
  }

  const verification = await prisma.identityVerification.findUnique({
    where: { id: verificationId },
    select: { id: true, userId: true, status: true },
  })

  if (!verification) {
    return NextResponse.json({ error: 'Verification not found.' }, { status: 404 })
  }

  const nextStatus = action === 'approve' ? 'approved' : 'rejected'

  await prisma.identityVerification.update({
    where: { id: verificationId },
    data: {
      status: nextStatus,
      reviewNotes,
      reviewedBy: adminId,
      reviewedAt: new Date(),
    },
  })

  await prisma.user.update({
    where: { id: verification.userId },
    data: { isVerified: action === 'approve' },
    select: { id: true },
  })

  return NextResponse.json({
    verification: {
      id: verification.id,
      status: nextStatus,
    },
  })
}
