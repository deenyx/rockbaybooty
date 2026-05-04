import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthenticatedUserId } from '@/lib/auth'
import { MESSAGES } from '@/lib/constants'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { slug: string; postId: string } }
) {
  try {
    const userId = await getAuthenticatedUserId(request)
    if (!userId) {
      return NextResponse.json({ error: MESSAGES.AUTH_REQUIRED }, { status: 401 })
    }

    const post = await prisma.groupPost.findUnique({
      where: { id: params.postId },
      include: {
        group: { select: { slug: true, status: true } },
      },
    })

    if (!post || post.status === 'deleted' || post.group.slug !== params.slug) {
      return NextResponse.json({ error: MESSAGES.GROUP_POST_NOT_FOUND }, { status: 404 })
    }

    // Allow author or a group moderator/owner to delete
    const isModerator =
      post.authorId !== userId &&
      (await prisma.groupMember.findFirst({
        where: {
          groupId: post.groupId,
          userId,
          role: { in: ['moderator', 'owner'] },
        },
      })) !== null

    if (post.authorId !== userId && !isModerator) {
      return NextResponse.json({ error: MESSAGES.GROUP_FORBIDDEN }, { status: 403 })
    }

    await prisma.groupPost.update({
      where: { id: post.id },
      data: { status: 'deleted' },
    })

    return NextResponse.json({ message: MESSAGES.GROUP_POST_DELETED })
  } catch (error) {
    console.error('[DELETE /api/groups/[slug]/posts/[postId]]', error)
    return NextResponse.json({ error: MESSAGES.ERROR_GENERAL }, { status: 500 })
  }
}
