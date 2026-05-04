import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'
import { notFound, redirect } from 'next/navigation'

import TopQuickNav from '@/app/_components/top-quick-nav'
import { AUTH_COOKIE_NAME, ROUTES } from '@/lib/constants'
import prisma from '@/lib/prisma'
import type { AuthTokenPayload, ClassifiedListing } from '@/lib/types'
import ClassifiedDetail from './_components/classified-detail'

function getTokenPayload(token: string): AuthTokenPayload | null {
  const jwtSecret = process.env.JWT_SECRET
  if (!jwtSecret) return null
  try {
    return jwt.verify(token, jwtSecret) as AuthTokenPayload
  } catch {
    return null
  }
}

type Props = { params: { id: string } }

export default async function ClassifiedDetailPage({ params }: Props) {
  const token = cookies().get(AUTH_COOKIE_NAME)?.value
  if (!token) {
    redirect(`${ROUTES.LOGIN}?returnTo=${encodeURIComponent(`/classifieds/${params.id}`)}`)
  }

  const payload = getTokenPayload(token)
  if (!payload) {
    redirect(`${ROUTES.LOGIN}?returnTo=${encodeURIComponent(`/classifieds/${params.id}`)}`)
  }

  if (payload.mode === 'default-member') {
    redirect(ROUTES.DASHBOARD)
  }

  const currentUserId =
    (typeof payload.userId === 'string' && payload.userId) ||
    (typeof payload.sub === 'string' && payload.sub) ||
    null

  if (!currentUserId) {
    redirect(`${ROUTES.LOGIN}?returnTo=${encodeURIComponent(`/classifieds/${params.id}`)}`)
  }

  const raw = await prisma.classified.findFirst({
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

  if (!raw) notFound()

  const listing: ClassifiedListing = {
    id: raw.id,
    userId: raw.userId,
    title: raw.title,
    description: raw.description,
    category: raw.category,
    location: raw.location,
    photos: raw.photos,
    status: raw.status,
    expiresAt: raw.expiresAt.toISOString(),
    createdAt: raw.createdAt.toISOString(),
    poster: {
      id: raw.user.id,
      username: raw.user.username,
      displayName: raw.user.displayName,
      avatarUrl: raw.user.profile?.avatarUrl ?? null,
    },
  }

  return (
    <>
      <TopQuickNav className="left-4" />
      <ClassifiedDetail listing={listing} currentUserId={currentUserId} />
    </>
  )
}
