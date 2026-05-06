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
