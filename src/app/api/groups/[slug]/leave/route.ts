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
      select: { id: true, status: true, creatorId: true },
    })

    if (!group || group.status !== 'active') {
      return NextResponse.json({ error: MESSAGES.GROUP_NOT_FOUND }, { status: 404 })
    }

    if (group.creatorId === userId) {
      return NextResponse.json(
        { error: 'The group owner cannot leave the group' },
        { status: 400 }
      )
    }

    const membership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: group.id, userId } },
    })

    if (!membership) {
      return NextResponse.json({ error: MESSAGES.GROUP_NOT_MEMBER }, { status: 404 })
    }

    await prisma.groupMember.delete({
      where: { groupId_userId: { groupId: group.id, userId } },
    })

    return NextResponse.json({ message: MESSAGES.GROUP_LEFT })
  } catch (error) {
    console.error('[POST /api/groups/[slug]/leave]', error)
    return NextResponse.json({ error: MESSAGES.ERROR_GENERAL }, { status: 500 })
  }
}
