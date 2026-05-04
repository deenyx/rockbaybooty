import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthenticatedUserId } from '@/lib/auth'
import { GROUP_POSTS_PAGE_SIZE, MAX_GROUP_POST_LENGTH, MESSAGES } from '@/lib/constants'

export async function GET(
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
      select: { id: true, status: true },
    })

    if (!group || group.status !== 'active') {
      return NextResponse.json({ error: MESSAGES.GROUP_NOT_FOUND }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const cursor = searchParams.get('cursor') || undefined

    const posts = await prisma.groupPost.findMany({
      where: { groupId: group.id, status: 'active' },
      orderBy: { createdAt: 'desc' },
      take: GROUP_POSTS_PAGE_SIZE + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
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
    })

    const hasMore = posts.length > GROUP_POSTS_PAGE_SIZE
    const page = hasMore ? posts.slice(0, GROUP_POSTS_PAGE_SIZE) : posts

    return NextResponse.json({
      posts: page.map((p) => ({
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
      hasMore,
      nextCursor: hasMore ? page[page.length - 1].id : null,
    })
  } catch (error) {
    console.error('[GET /api/groups/[slug]/posts]', error)
    return NextResponse.json({ error: MESSAGES.ERROR_GENERAL }, { status: 500 })
  }
}

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
      select: { id: true, name: true, slug: true, status: true },
    })

    if (!group || group.status !== 'active') {
      return NextResponse.json({ error: MESSAGES.GROUP_NOT_FOUND }, { status: 404 })
    }

    const membership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: group.id, userId } },
    })

    if (!membership) {
      return NextResponse.json({ error: MESSAGES.GROUP_NOT_MEMBER }, { status: 403 })
    }

    const body = await request.json()
    const postBody = typeof body.body === 'string' ? body.body.trim() : ''

    if (!postBody) {
      return NextResponse.json({ error: MESSAGES.GROUP_POST_BODY_REQUIRED }, { status: 400 })
    }

    if (postBody.length > MAX_GROUP_POST_LENGTH) {
      return NextResponse.json(
        { error: `Post must be ${MAX_GROUP_POST_LENGTH} characters or fewer` },
        { status: 400 }
      )
    }

    const post = await prisma.groupPost.create({
      data: { groupId: group.id, authorId: userId, body: postBody },
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
    })

    // Notify other group members (fire-and-forget)
    prisma.groupMember.findMany({
      where: { groupId: group.id, userId: { not: userId } },
      select: { userId: true },
    }).then((members) => {
      if (!members.length) return
      const name = post.author.displayName || post.author.username
      return prisma.notification.createMany({
        data: members.map((m) => ({
          userId: m.userId,
          type: 'group_post',
          title: `New post in ${group.name}`,
          body: `${name}: ${postBody.slice(0, 80)}`,
          link: `/groups/${group.slug}`,
        })),
      })
    }).catch(() => {/* non-fatal */})

    return NextResponse.json(
      {
        message: MESSAGES.GROUP_POST_CREATED,
        post: {
          id: post.id,
          groupId: post.groupId,
          body: post.body,
          createdAt: post.createdAt.toISOString(),
          updatedAt: post.updatedAt.toISOString(),
          author: {
            id: post.author.id,
            username: post.author.username,
            displayName: post.author.displayName,
            avatarUrl: post.author.profile?.avatarUrl ?? null,
          },
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[POST /api/groups/[slug]/posts]', error)
    return NextResponse.json({ error: MESSAGES.ERROR_GENERAL }, { status: 500 })
  }
}
