import { Suspense } from 'react'

import LoginForm from '@/app/_components/login-form'

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#060304] text-stone-200">
          <p className="text-sm uppercase tracking-[0.28em]">Loading secure entry...</p>
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  )
}