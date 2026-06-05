import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { AUTH_COOKIE_NAME, ROUTES } from '@/lib/constants'
import prisma from '@/lib/prisma'
import type { AuthTokenPayload } from '@/lib/types'
import MemberLayout from '@/app/_layouts/member-layout'

import DashboardClient from './_components/dashboard-client'

const DEFAULT_MEMBER_ID = 'default-member'

function getTokenPayload(token: string): AuthTokenPayload | null {
  const jwtSecret = process.env.JWT_SECRET
  if (!jwtSecret) {
    return null
  }

  try {
    const payload = jwt.verify(token, jwtSecret) as AuthTokenPayload
    return payload
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
  const cookieStore = await cookies()
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value

  if (!token) {
    redirect(`${ROUTES.LOGIN}?returnTo=${encodeURIComponent(ROUTES.DASHBOARD)}`)
  }

  const payload = getTokenPayload(token)
  if (!payload) {
    redirect(`${ROUTES.LOGIN}?returnTo=${encodeURIComponent(ROUTES.DASHBOARD)}`)
  }

  const userId =
    (typeof payload.userId === 'string' && payload.userId) ||
    (typeof payload.sub === 'string' && payload.sub) ||
    null

  if (!userId) {
    redirect(`${ROUTES.LOGIN}?returnTo=${encodeURIComponent(ROUTES.DASHBOARD)}`)
  }

  if (payload.mode === 'default-member' || userId === DEFAULT_MEMBER_ID) {
    const burnerUsername = payload.username || 'defaultuser'
    const burnerDisplay = burnerUsername

    return (
      <MemberLayout
        initialUser={{
          username: burnerUsername,
          firstName: 'Member',
          displayName: burnerDisplay,
        }}
        isBurner={true}
      >
        <DashboardClient
          initialData={{
            user: {
              id: userId,
              username: burnerUsername,
              accountName: '#preview',
              firstName: 'Member',
              displayName: burnerDisplay,
              personalCode: payload.personalCode || '9999',
            },
            profile: {
              age: null,
              location: 'Preview mode',
              bio: 'Default member position. Feed and live API pulls are disabled in this mode.',
              lookingFor: ['Curious'],
              interests: ['Open-minded'],
              avatarUrl: '',
              city: '',
              state: '',
              country: '',
              gender: '',
              genderOther: '',
              sexualOrientation: '',
              orientationOther: '',
            },
          }}
        />
      </MemberLayout>
    )
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      accountName: true,
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
    <MemberLayout
      initialUser={{
        username: user.username,
        firstName: user.firstName || user.displayName || user.username,
        displayName: user.displayName,
        avatarUrl: user.profile?.avatarUrl ?? undefined,
      }}
    >
      <DashboardClient
        initialData={{
          user: {
            id: user.id,
            username: user.username,
            accountName: user.accountName,
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
    </MemberLayout>
  )
}
