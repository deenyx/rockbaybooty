import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthTokenPayload } from '@/lib/auth'
import { MESSAGES } from '@/lib/constants'

async function requireAdmin(request: NextRequest) {
  const payload = await getAuthTokenPayload(request)
  if (!payload?.userId) return null
  if (payload.mode === 'temp-admin') return payload.userId
  const user = await prisma.user.findUnique({ where: { id: payload.userId }, select: { isAdmin: true } })
  return user?.isAdmin ? payload.userId : null
}

// GET /api/admin/stats — summary counts for the admin dashboard
export async function GET(request: NextRequest) {
  const adminId = await requireAdmin(request)
  if (!adminId) return NextResponse.json({ error: MESSAGES.AUTH_REQUIRED }, { status: 403 })

  const [
    totalUsers,
    activeUsers,
    suspendedUsers,
    pendingReports,
    totalReports,
    newUsersToday,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { status: 'active' } }),
    prisma.user.count({ where: { status: 'suspended' } }),
    prisma.report.count({ where: { status: 'pending' } }),
    prisma.report.count(),
    prisma.user.count({
      where: {
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    }),
  ])

  return NextResponse.json({
    totalUsers,
    activeUsers,
    suspendedUsers,
    pendingReports,
    totalReports,
    newUsersToday,
  })
}
