import { redirect } from 'next/navigation'

import { ROUTES } from '@/lib/constants'

type LoginPageProps = {
  searchParams?: {
    returnTo?: string
    error?: string
  }
}

export default function LoginPage({ searchParams }: LoginPageProps) {
  const params = new URLSearchParams()

  if (searchParams?.returnTo) {
    params.set('returnTo', searchParams.returnTo)
  }

  if (searchParams?.error) {
    params.set('error', searchParams.error)
  }

  redirect(`${ROUTES.WELCOME}${params.toString() ? `?${params.toString()}` : ''}`)
}