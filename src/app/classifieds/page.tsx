import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { AUTH_COOKIE_NAME, ROUTES } from '@/lib/constants'
import type { AuthTokenPayload } from '@/lib/types'
import ClassifiedsClient from './_components/classifieds-client'

function getTokenPayload(token: string): AuthTokenPayload | null {
  const jwtSecret = process.env.JWT_SECRET
  if (!jwtSecret) return null
  try {
    return jwt.verify(token, jwtSecret) as AuthTokenPayload
  } catch {
    return null
  }
}

export default function ClassifiedsPage() {
  const token = cookies().get(AUTH_COOKIE_NAME)?.value

  if (!token) {
    redirect(`${ROUTES.LOGIN}?returnTo=${encodeURIComponent(ROUTES.CLASSIFIEDS)}`)
  }

  const payload = getTokenPayload(token)
  if (!payload) {
    redirect(`${ROUTES.LOGIN}?returnTo=${encodeURIComponent(ROUTES.CLASSIFIEDS)}`)
  }

  if (payload.mode === 'default-member') {
    redirect(ROUTES.DASHBOARD)
  }

  return <ClassifiedsClient />
}