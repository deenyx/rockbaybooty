import jwt from 'jsonwebtoken'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import TopQuickNav from '@/app/_components/top-quick-nav'
import { AUTH_COOKIE_NAME, ROUTES } from '@/lib/constants'
import type { AuthTokenPayload } from '@/lib/types'
import NewClassifiedForm from './_components/new-classified-form'

function getTokenPayload(token: string): AuthTokenPayload | null {
  const jwtSecret = process.env.JWT_SECRET
  if (!jwtSecret) return null
  try {
    return jwt.verify(token, jwtSecret) as AuthTokenPayload
  } catch {
    return null
  }
}

export default function NewClassifiedPage() {
  const token = cookies().get(AUTH_COOKIE_NAME)?.value

  if (!token) {
    redirect(`${ROUTES.LOGIN}?returnTo=${encodeURIComponent(ROUTES.CLASSIFIEDS_NEW)}`)
  }

  const payload = getTokenPayload(token)
  if (!payload) {
    redirect(`${ROUTES.LOGIN}?returnTo=${encodeURIComponent(ROUTES.CLASSIFIEDS_NEW)}`)
  }

  if (payload.mode === 'default-member') {
    redirect(ROUTES.DASHBOARD)
  }

  return (
    <div className="min-h-screen bg-[#080b11] text-stone-100">
      <TopQuickNav className="left-4" />

      <div className="mx-auto max-w-xl px-4 py-20">
        {/* Back link */}
        <Link
          href={ROUTES.CLASSIFIEDS}
          className="mb-6 inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-300 transition"
        >
          ← Back to classifieds
        </Link>

        <h1 className="mb-1 text-2xl font-bold text-white">Post a listing</h1>
        <p className="mb-8 text-sm text-stone-500">
          Visible to members only. Listings expire after 30 days.
        </p>

        <NewClassifiedForm />
      </div>
    </div>
  )
}
