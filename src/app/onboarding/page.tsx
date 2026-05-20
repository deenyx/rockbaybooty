import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import OnboardingClient from '@/app/onboarding/_components/onboarding-client'
import { AUTH_COOKIE_NAME, ROUTES, SESSION_MODE_DEFAULT_MEMBER } from '@/lib/constants'
import prisma from '@/lib/prisma'
import type { AuthTokenPayload } from '@/lib/types'

type OnboardingPageProps = {
  searchParams?: {
    passcode?: string
    quickJoin?: string
  }
}

function getTokenPayload(token: string): AuthTokenPayload | null {
  const jwtSecret = process.env.JWT_SECRET
  if (!jwtSecret) {
    return null
  }

  try {
    return jwt.verify(token, jwtSecret) as AuthTokenPayload
  } catch {
    return null
  }
}

export default async function OnboardingPage({ searchParams }: OnboardingPageProps) {
  const cookieStore = await cookies()
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value

  if (token) {
    const payload = getTokenPayload(token)

    if (payload) {
      const userId =
        (typeof payload.userId === 'string' && payload.userId) ||
        (typeof payload.sub === 'string' && payload.sub) ||
        null

      if (payload.mode === SESSION_MODE_DEFAULT_MEMBER || !userId) {
        redirect(ROUTES.DASHBOARD)
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { onboardingStep: true },
      })

      if (user?.onboardingStep === 'completed') {
        redirect(ROUTES.DASHBOARD)
      }
    }
  }

  const passcode = searchParams?.passcode ?? ''
  const quickJoin = searchParams?.quickJoin === '1'

  return <OnboardingClient passcode={passcode} quickJoin={quickJoin} />
}
