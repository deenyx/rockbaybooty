import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthenticatedUserId } from '@/lib/auth'
import { MESSAGES } from '@/lib/constants'

async function requireAdmin(request: NextRequest) {
  const userId = await getAuthenticatedUserId(request)
  if (!userId) return null
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { isAdmin: true } })
  return user?.isAdmin ? userId : null
}

// PATCH /api/admin/users/[id] — suspend, unsuspend, or delete a user account
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const adminId = await requireAdmin(request)
  if (!adminId) return NextResponse.json({ error: MESSAGES.AUTH_REQUIRED }, { status: 403 })

  const body = await request.json().catch(() => ({}))
  const { action } = body as { action?: string }

  if (!['suspend', 'unsuspend', 'delete', 'verify', 'unverify'].includes(action ?? '')) {
    return NextResponse.json({ error: MESSAGES.FIELD_REQUIRED }, { status: 400 })
  }

  const target = await prisma.user.findUnique({ where: { id: params.id }, select: { id: true, isAdmin: true } })
  if (!target) return NextResponse.json({ error: 'User not found.' }, { status: 404 })
  if (target.isAdmin) return NextResponse.json({ error: 'Cannot action another admin.' }, { status: 403 })

  if (action === 'verify' || action === 'unverify') {
    const updated = await prisma.user.update({
      where: { id: params.id },
      data: { isVerified: action === 'verify' },
      select: { id: true, username: true, isVerified: true },
    })
    return NextResponse.json({ user: updated })
  }

  const nextStatus = action === 'suspend' ? 'suspended' : action === 'delete' ? 'deleted' : 'active'
  const updated = await prisma.user.update({
    where: { id: params.id },
    data: { status: nextStatus },
    select: { id: true, username: true, status: true },
  })

  return NextResponse.json({ user: updated })
}
