import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthenticatedUserId } from '@/lib/auth'
import { AUTH_COOKIE_NAME, MESSAGES } from '@/lib/constants'
import jwt from 'jsonwebtoken'
import type { AuthTokenPayload } from '@/lib/types'

export const dynamic = 'force-dynamic'

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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = await getAuthenticatedUserId(request)
  if (!userId) {
    return NextResponse.json({ error: MESSAGES.AUTH_REQUIRED }, { status: 401 })
  }
  if (isDefaultMember(request)) {
    return NextResponse.json({ error: 'Full membership required' }, { status: 403 })
  }

  const listing = await prisma.classified.findFirst({
    where: { id: params.id, status: { not: 'deleted' } },
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

  if (!listing) {
    return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
  }

  return NextResponse.json({ listing: serializeListing(listing) })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = await getAuthenticatedUserId(request)
  if (!userId) {
    return NextResponse.json({ error: MESSAGES.AUTH_REQUIRED }, { status: 401 })
  }

  const listing = await prisma.classified.findFirst({
    where: { id: params.id, status: { not: 'deleted' } },
    select: { id: true, userId: true },
  })

  if (!listing) {
    return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
  }
  if (listing.userId !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await prisma.classified.update({
    where: { id: params.id },
    data: { status: 'deleted' },
  })

  return NextResponse.json({ message: 'Listing deleted' })
}
