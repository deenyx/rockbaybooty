import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthenticatedUserId } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const userId = await getAuthenticatedUserId(request)
  if (!userId) return new NextResponse(null, { status: 204 })

  // Fire-and-forget — don't await to keep response fast
  prisma.user.update({
    where: { id: userId },
    data: { lastActiveAt: new Date() },
  }).catch(() => {/* non-fatal */})

  return new NextResponse(null, { status: 204 })
}
