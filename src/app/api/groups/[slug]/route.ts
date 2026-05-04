import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthenticatedUserId } from '@/lib/auth'
import { GROUP_POSTS_PAGE_SIZE, MESSAGES } from '@/lib/constants'

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const userId = await getAuthenticatedUserId(request)
    if (!userId) {
      return NextResponse.json({ error: MESSAGES.AUTH_REQUIRED }, { status: 401 })
    }

    const { slug } = params

    const group = await prisma.group.findUnique({
      where: { slug },
      include: {
        _count: { select: { members: true } },
        members: {
          where: { userId },
          select: { role: true },
          take: 1,
        },
        posts: {
          where: { status: 'active' },
          orderBy: { createdAt: 'desc' },
          take: GROUP_POSTS_PAGE_SIZE,
          include: {
            author: {
              select: {
                id: true,
                username: true,
                displayName: true,
                profile: { select: { avatarUrl: true } },
              },
            },
          },
        },
      },
    })

    if (!group || group.status !== 'active') {
      return NextResponse.json({ error: MESSAGES.GROUP_NOT_FOUND }, { status: 404 })
    }

    return NextResponse.json({
      group: {
        id: group.id,
        name: group.name,
        slug: group.slug,
        description: group.description,
        category: group.category,
        coverUrl: group.coverUrl,
        isPublic: group.isPublic,
        creatorId: group.creatorId,
        memberCount: group._count.members,
        createdAt: group.createdAt.toISOString(),
        memberRole: group.members[0]?.role ?? null,
        currentUserId: userId,
        recentPosts: group.posts.map((p) => ({
          id: p.id,
          groupId: p.groupId,
          body: p.body,
          createdAt: p.createdAt.toISOString(),
          updatedAt: p.updatedAt.toISOString(),
          author: {
            id: p.author.id,
            username: p.author.username,
            displayName: p.author.displayName,
            avatarUrl: p.author.profile?.avatarUrl ?? null,
          },
        })),
      },
    })
  } catch (error) {
    console.error('[GET /api/groups/[slug]]', error)
    return NextResponse.json({ error: MESSAGES.ERROR_GENERAL }, { status: 500 })
  }
}
