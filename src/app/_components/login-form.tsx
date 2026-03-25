'use client'

import { FormEvent, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

import { loginWithPasscode } from '@/lib/api'
import { MESSAGES, ROUTES } from '@/lib/constants'

const PASSCODE_PATTERN = /^[A-Z0-9]{6,8}$/

export default function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnTo = searchParams.get('returnTo') || ROUTES.DASHBOARD

  const [passcode, setPasscode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const normalizedPasscode = passcode.replace(/[^a-z0-9]/gi, '').toUpperCase()
    setPasscode(normalizedPasscode)

    if (!PASSCODE_PATTERN.test(normalizedPasscode)) {
      setError(MESSAGES.LOGIN_INVALID)
      return
    }

    setError('')
    setIsLoading(true)

    try {
      await loginWithPasscode(normalizedPasscode)
      router.push(returnTo)
      router.refresh()
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : MESSAGES.LOGIN_INVALID
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#060304] px-4 py-12 text-stone-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(197,126,61,0.2),transparent_30%),radial-gradient(circle_at_bottom,rgba(128,25,52,0.26),transparent_45%),linear-gradient(180deg,#060304_0%,#14080c_55%,#060304_100%)]" />

      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-[2rem] border border-white/10 bg-[#140b0e]/95 p-6 shadow-[0_30px_120px_rgba(0,0,0,0.65)] sm:p-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(197,126,61,0.24),transparent_32%),radial-gradient(circle_at_bottom,rgba(128,25,52,0.24),transparent_40%)]" />

        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-[0.34em] text-amber-200/70">
            Member Login
          </p>
          <h1 className="mt-3 font-[family:var(--font-display)] text-4xl leading-none text-stone-100">
            Welcome Back
          </h1>
          <p className="mt-4 text-sm leading-6 text-stone-300/80">
            Enter your personal passcode to continue to your private dashboard.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label
                htmlFor="passcode"
                className="mb-2 block text-xs font-semibold uppercase tracking-[0.3em] text-stone-400"
              >
                Passcode
              </label>
              <input
                id="passcode"
                name="passcode"
                type="text"
                minLength={6}
                maxLength={8}
                pattern="[A-Za-z0-9]{6,8}"
                autoComplete="one-time-code"
                placeholder="AB12CD"
                value={passcode}
                onChange={(event) => {
                  setPasscode(event.target.value.toUpperCase())
                  if (error) {
                    setError('')
                  }
                }}
                className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-4 text-center text-lg font-semibold tracking-[0.45em] text-stone-100 outline-none transition placeholder:text-stone-500 focus:border-amber-200/60 focus:ring-2 focus:ring-amber-200/20"
              />
            </div>

            {error && (
              <p className="rounded-2xl border border-[#b03d53]/35 bg-[#4d1421]/45 px-4 py-3 text-sm text-[#ffced5]">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="relative inline-flex w-full items-center justify-center rounded-full border border-amber-200/20 bg-gradient-to-r from-[#8c1f43] via-[#a0354f] to-[#6d102e] px-5 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-stone-100 transition hover:brightness-110 disabled:cursor-wait disabled:opacity-85"
            >
              {isLoading && (
                <span className="mr-3 h-4 w-4 animate-spin rounded-full border-2 border-stone-300/25 border-t-stone-100" />
              )}
              {isLoading ? 'Signing in' : 'Enter'}
            </button>
          </form>

          <p className="mt-6 text-center text-xs uppercase tracking-[0.24em] text-stone-400/90">
            18+ only • Verified adults only • Discreet & private
          </p>
        </div>
      </div>
    </main>
  )
}