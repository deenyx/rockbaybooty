import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthenticatedUserId } from '@/lib/auth'
import { CLASSIFIED_CATEGORY_VALUES, CLASSIFIEDS_EXPIRY_DAYS, CLASSIFIEDS_MAX_PHOTOS, MESSAGES } from '@/lib/constants'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { AUTH_COOKIE_NAME } from '@/lib/constants'
import type { AuthTokenPayload } from '@/lib/types'

export const dynamic = 'force-dynamic'

const DEFAULT_LIMIT = 20
const MAX_LIMIT = 50

function isDefaultMember(request: NextRequest): boolean {
  const jwtSecret = process.env.JWT_SECRET
  if (!jwtSecret) return false
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value
  if (!token) return false
  try {
    const payload = jwt.verify(token, jwtSecret) as AuthTokenPayload
    return payload.mode === 'default-member'
  } catch {
    return false
  }
}

function serializeListing(listing: {
  id: string
  userId: string
  title: string
  description: string
  category: string
  location: string | null
  photos: string[]
  status: string
  expiresAt: Date
  createdAt: Date
  user: {
    id: string
    username: string
    displayName: string
    profile: { avatarUrl: string | null } | null
  }
}) {
  return {
    id: listing.id,
    userId: listing.userId,
    title: listing.title,
    description: listing.description,
    category: listing.category,
    location: listing.location,
    photos: listing.photos,
    status: listing.status,
    expiresAt: listing.expiresAt.toISOString(),
    createdAt: listing.createdAt.toISOString(),
    poster: {
      id: listing.user.id,
      username: listing.user.username,
      displayName: listing.user.displayName,
      avatarUrl: listing.user.profile?.avatarUrl ?? null,
    },
  }
}

export async function GET(request: NextRequest) {
  const userId = await getAuthenticatedUserId(request)
  if (!userId) {
    return NextResponse.json({ error: MESSAGES.AUTH_REQUIRED }, { status: 401 })
  }
  if (isDefaultMember(request)) {
    return NextResponse.json({ error: 'Full membership required' }, { status: 403 })
  }

  const { searchParams } = request.nextUrl
  const category = searchParams.get('category') || null
  const cursor = searchParams.get('cursor') || null
  const rawLimit = Number.parseInt(searchParams.get('limit') || '', 10)
  const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, MAX_LIMIT) : DEFAULT_LIMIT

  const now = new Date()

  const listings = await prisma.classified.findMany({
    where: {
      status: 'active',
      expiresAt: { gt: now },
      ...(category && CLASSIFIED_CATEGORY_VALUES.includes(category) ? { category } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: {
      user: {
        select: {
          id: true,
          username: true,
          displayName: true,
          profile: { select: { avatarUrl: true } },
        },
      },
    },
  })

  const hasMore = listings.length > limit
  const items = hasMore ? listings.slice(0, limit) : listings
  const nextCursor = hasMore ? items[items.length - 1].id : null

  return NextResponse.json({
    listings: items.map(serializeListing),
    nextCursor,
  })
}

export async function POST(request: NextRequest) {
  const userId = await getAuthenticatedUserId(request)
  if (!userId) {
    return NextResponse.json({ error: MESSAGES.AUTH_REQUIRED }, { status: 401 })
  }
  if (isDefaultMember(request)) {
    return NextResponse.json({ error: 'Full membership required' }, { status: 403 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const data = body as Record<string, unknown>
  const title = typeof data.title === 'string' ? data.title.trim() : ''
  const description = typeof data.description === 'string' ? data.description.trim() : ''
  const category = typeof data.category === 'string' ? data.category.trim().toLowerCase() : ''
  const location = typeof data.location === 'string' ? data.location.trim() : null
  const photos = Array.isArray(data.photos) ? data.photos.filter((p) => typeof p === 'string') : []

  if (!title) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 })
  }
  if (title.length > 120) {
    return NextResponse.json({ error: 'Title must be 120 characters or less' }, { status: 400 })
  }
  if (!description) {
    return NextResponse.json({ error: 'Description is required' }, { status: 400 })
  }
  if (description.length > 4000) {
    return NextResponse.json({ error: 'Description must be 4000 characters or less' }, { status: 400 })
  }
  if (!CLASSIFIED_CATEGORY_VALUES.includes(category)) {
    return NextResponse.json({ error: `Category must be one of: ${CLASSIFIED_CATEGORY_VALUES.join(', ')}` }, { status: 400 })
  }
  if (photos.length > CLASSIFIEDS_MAX_PHOTOS) {
    return NextResponse.json({ error: `Maximum ${CLASSIFIEDS_MAX_PHOTOS} photos allowed` }, { status: 400 })
  }

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + CLASSIFIEDS_EXPIRY_DAYS)

  const listing = await prisma.classified.create({
    data: {
      userId,
      title,
      description,
      category,
      location: location || null,
      photos,
      status: 'active',
      expiresAt,
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          displayName: true,
          profile: { select: { avatarUrl: true } },
        },
      },
    },
  })

  return NextResponse.json({ listing: serializeListing(listing) }, { status: 201 })
}
