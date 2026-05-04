import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthenticatedUserId } from '@/lib/auth'
import {
  GROUP_CATEGORIES,
  GROUPS_PAGE_SIZE,
  MESSAGES,
} from '@/lib/constants'

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60)
}

async function generateUniqueSlug(base: string): Promise<string> {
  let slug = toSlug(base)
  if (!slug) slug = 'group'

  const existing = await prisma.group.findFirst({ where: { slug } })
  if (!existing) return slug

  // Append a short random suffix until unique
  for (let i = 0; i < 10; i++) {
    const candidate = `${slug}-${Math.random().toString(36).slice(2, 6)}`
    const clash = await prisma.group.findFirst({ where: { slug: candidate } })
    if (!clash) return candidate
  }
  return `${slug}-${Date.now()}`
}

const validCategories: string[] = GROUP_CATEGORIES.map((c) => c.value)

export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request)
    if (!userId) {
      return NextResponse.json({ error: MESSAGES.AUTH_REQUIRED }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') || ''
    const mine = searchParams.get('mine') === '1'
    const cursor = searchParams.get('cursor') || undefined

    const where: Record<string, unknown> = { status: 'active' }

    if (category && validCategories.includes(category)) {
      where.category = category
    }

    if (mine) {
      where.members = { some: { userId } }
    } else {
      where.isPublic = true
    }

    const groups = await prisma.group.findMany({
      where: where as never,
      orderBy: { createdAt: 'desc' },
      take: GROUPS_PAGE_SIZE + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: {
        _count: { select: { members: true } },
        members: {
          where: { userId },
          select: { role: true },
          take: 1,
        },
      },
    })

    const hasMore = groups.length > GROUPS_PAGE_SIZE
    const page = hasMore ? groups.slice(0, GROUPS_PAGE_SIZE) : groups

    return NextResponse.json({
      groups: page.map((g) => ({
        id: g.id,
        name: g.name,
        slug: g.slug,
        description: g.description,
        category: g.category,
        coverUrl: g.coverUrl,
        isPublic: g.isPublic,
        memberCount: g._count.members,
        createdAt: g.createdAt.toISOString(),
        memberRole: g.members[0]?.role ?? null,
      })),
      hasMore,
      nextCursor: hasMore ? page[page.length - 1].id : null,
    })
  } catch (error) {
    console.error('[GET /api/groups]', error)
    return NextResponse.json({ error: MESSAGES.ERROR_GENERAL }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request)
    if (!userId) {
      return NextResponse.json({ error: MESSAGES.AUTH_REQUIRED }, { status: 401 })
    }

    const body = await request.json()
    const name = typeof body.name === 'string' ? body.name.trim() : ''
    const description = typeof body.description === 'string' ? body.description.trim() || null : null
    const rawCategory = typeof body.category === 'string' ? body.category.trim() : 'general'
    const category = validCategories.includes(rawCategory) ? rawCategory : 'general'
    const isPublic = body.isPublic !== false

    if (!name) {
      return NextResponse.json({ error: MESSAGES.GROUP_NAME_REQUIRED }, { status: 400 })
    }

    const slug = await generateUniqueSlug(name)

    const group = await prisma.group.create({
      data: {
        name,
        slug,
        description,
        category,
        isPublic,
        creatorId: userId,
        members: {
          create: { userId, role: 'owner' },
        },
      },
      include: {
        _count: { select: { members: true } },
      },
    })

    return NextResponse.json(
      {
        message: MESSAGES.GROUP_CREATED,
        group: {
          id: group.id,
          name: group.name,
          slug: group.slug,
          description: group.description,
          category: group.category,
          coverUrl: group.coverUrl,
          isPublic: group.isPublic,
          memberCount: group._count.members,
          createdAt: group.createdAt.toISOString(),
          memberRole: 'owner',
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[POST /api/groups]', error)
    return NextResponse.json({ error: MESSAGES.ERROR_GENERAL }, { status: 500 })
  }
}
