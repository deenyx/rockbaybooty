import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthenticatedUserId } from '@/lib/auth'
import { MESSAGES } from '@/lib/constants'

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const userId = await getAuthenticatedUserId(request)
    if (!userId) {
      return NextResponse.json({ error: MESSAGES.AUTH_REQUIRED }, { status: 401 })
    }

    const group = await prisma.group.findUnique({
      where: { slug: params.slug },
      select: { id: true, status: true, isPublic: true },
    })

    if (!group || group.status !== 'active') {
      return NextResponse.json({ error: MESSAGES.GROUP_NOT_FOUND }, { status: 404 })
    }

    const existing = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: group.id, userId } },
    })

    if (existing) {
      return NextResponse.json({ error: MESSAGES.GROUP_ALREADY_MEMBER }, { status: 409 })
    }

    await prisma.groupMember.create({
      data: { groupId: group.id, userId, role: 'member' },
    })

    return NextResponse.json({ message: MESSAGES.GROUP_JOINED })
  } catch (error) {
    console.error('[POST /api/groups/[slug]/join]', error)
    return NextResponse.json({ error: MESSAGES.ERROR_GENERAL }, { status: 500 })
  }
}
