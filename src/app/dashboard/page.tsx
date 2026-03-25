import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { AUTH_COOKIE_NAME, ROUTES } from '@/lib/constants'
import type { AuthTokenPayload } from '@/lib/types'

import DashboardClient from './_components/dashboard-client'

const prisma = new PrismaClient()

function getUserIdFromToken(token: string): string | null {
  const jwtSecret = process.env.JWT_SECRET
  if (!jwtSecret) {
    return null
  }

  try {
    const payload = jwt.verify(token, jwtSecret) as AuthTokenPayload

    if (typeof payload.userId === 'string' && payload.userId) {
      return payload.userId
    }

    // Backward compatibility for existing tokens.
    if (typeof payload.sub === 'string' && payload.sub) {
      return payload.sub
    }

    return null
  } catch {
    return null
  }
}

function calculateAgeFromDate(dateOfBirth: Date | null): number | null {
  if (!dateOfBirth) {
    return null
  }

  const now = new Date()
  let age = now.getFullYear() - dateOfBirth.getUTCFullYear()
  const monthDifference = now.getMonth() - dateOfBirth.getUTCMonth()
  const dayDifference = now.getDate() - dateOfBirth.getUTCDate()

  if (monthDifference < 0 || (monthDifference === 0 && dayDifference < 0)) {
    age -= 1
  }

  return age >= 0 ? age : null
}

export default async function DashboardPage() {
  const token = cookies().get(AUTH_COOKIE_NAME)?.value

  if (!token) {
    redirect(`${ROUTES.LOGIN}?returnTo=${encodeURIComponent(ROUTES.DASHBOARD)}`)
  }

  const userId = getUserIdFromToken(token)
  if (!userId) {
    redirect(`${ROUTES.LOGIN}?returnTo=${encodeURIComponent(ROUTES.DASHBOARD)}`)
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      firstName: true,
      displayName: true,
      personalCode: true,
      profile: {
        select: {
          age: true,
          dateOfBirth: true,
          city: true,
          state: true,
          country: true,
          location: true,
          bio: true,
          lookingFor: true,
          interests: true,
          avatarUrl: true,
          gender: true,
          genderOther: true,
          sexualOrientation: true,
          orientationOther: true,
        },
      },
    },
  })

  if (!user) {
    redirect(`${ROUTES.LOGIN}?returnTo=${encodeURIComponent(ROUTES.DASHBOARD)}`)
  }

  const age = user.profile?.age ?? calculateAgeFromDate(user.profile?.dateOfBirth ?? null)

  const location = user.profile?.location || [user.profile?.city, user.profile?.state, user.profile?.country].filter(Boolean).join(', ')

  return (
    <DashboardClient
      initialData={{
        user: {
          id: user.id,
          username: user.username,
          firstName: user.firstName || user.displayName || user.username,
          displayName: user.displayName,
          personalCode: user.personalCode,
        },
        profile: {
          age,
          location,
          bio: user.profile?.bio || '',
          lookingFor: user.profile?.lookingFor || [],
          interests: user.profile?.interests || [],
          avatarUrl: user.profile?.avatarUrl || '',
          city: user.profile?.city || '',
          state: user.profile?.state || '',
          country: user.profile?.country || '',
          gender: user.profile?.gender || '',
          genderOther: user.profile?.genderOther || '',
          sexualOrientation: user.profile?.sexualOrientation || '',
          orientationOther: user.profile?.orientationOther || '',
        },
      }}
    />
  )
}
