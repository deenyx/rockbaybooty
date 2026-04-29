'use client'

import { Suspense, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

import { MESSAGES, MIN_AGE, ROUTES } from '@/lib/constants'

const CP = "Copperplate, 'Copperplate Gothic Light', fantasy"

type RegisterResponse = {
  message?: string
  pin?: string
  error?: string
}

function getServerError(errorCode: string | null): string {
  if (errorCode === 'expired') {
    return MESSAGES.TOKEN_EXPIRED
  }

  if (errorCode === 'invalid_name') {
    return MESSAGES.NAME_MISMATCH
  }

  return ''
}

function SignupContent() {
  const searchParams = useSearchParams()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle')
  const [error, setError] = useState(getServerError(searchParams?.get('error') ?? null))
  const [successMessage, setSuccessMessage] = useState('')
  const [pin, setPin] = useState('')

  const maxDob = useMemo(() => {
    const now = new Date()
    now.setFullYear(now.getFullYear() - MIN_AGE)
    return now.toISOString().split('T')[0]
  }, [])

  const validateForm = (): string => {
    if (!name.trim() || !email.trim() || !dateOfBirth || !password || !confirmPassword) {
      return MESSAGES.FIELD_REQUIRED
    }

    const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim().toLowerCase())
    if (!validEmail) {
      return MESSAGES.INVALID_EMAIL
    }

    const dob = new Date(`${dateOfBirth}T00:00:00.000Z`)
    if (Number.isNaN(dob.getTime())) {
      return MESSAGES.INVALID_DATE_OF_BIRTH
    }

    const ageDate = new Date()
    ageDate.setFullYear(ageDate.getFullYear() - MIN_AGE)
    if (dob > ageDate) {
      return MESSAGES.INVALID_DATE_OF_BIRTH
    }

    if (password.length < 8) {
      return MESSAGES.PASSWORD_MIN_LENGTH
    }

    if (password !== confirmPassword) {
      return 'Passwords do not match'
    }

    return ''
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    setStatus('loading')
    setError('')

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          dateOfBirth,
          password,
        }),
      })

      const data = (await response.json()) as RegisterResponse

      if (!response.ok) {
        if (data.error === MESSAGES.EMAIL_EXISTS) {
          setError('This email already has an account. Use Log In below to continue.')
          setStatus('idle')
          return
        }

        setError(data.error || MESSAGES.ERROR_GENERAL)
        setStatus('idle')
        return
      }

      setSuccessMessage(data.message || MESSAGES.EMAIL_SENT)
      setPin(data.pin || '')
      setStatus('success')
    } catch {
      setError(MESSAGES.ERROR_GENERAL)
      setStatus('idle')
    }
  }

  return (
    <div
      className="relative isolate min-h-screen overflow-hidden bg-[#020617] text-slate-100"
      style={{ position: 'relative', minHeight: '100vh' }}
    >
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }}
      >
        <Image
          src="/welcome2.png"
          alt=""
          fill
          priority
          quality={95}
          sizes="100vw"
          className="object-cover"
          style={{ objectPosition: 'center 18%' }}
        />
      </div>

      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 0,
          pointerEvents: 'none',
          background:
            'radial-gradient(circle at 18% 16%, rgba(56,189,248,0.18), transparent 42%), radial-gradient(circle at 82% 14%, rgba(244,114,182,0.15), transparent 36%), linear-gradient(180deg, rgba(2,6,23,0.72), rgba(2,6,23,0.97))',
        }}
      />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10">
        <div className="w-full max-w-xs rounded-2xl border border-white/8 bg-black/25 p-5 shadow-[0_12px_35px_rgba(0,0,0,0.4)] backdrop-blur-sm sm:p-6">
          <h1
            className="text-center text-xl tracking-[0.2em] text-stone-100"
            style={{ fontFamily: CP }}
          >
            Sign Up
          </h1>
          {status === 'success' ? (
            <div className="mt-6 space-y-4">
              <p className="rounded-xl border border-emerald-300/35 bg-emerald-400/12 px-4 py-3 text-sm text-emerald-100">
                {successMessage}
              </p>

              {!!pin && (
                <div className="rounded-xl border border-amber-200/30 bg-amber-100/10 px-4 py-3 text-center">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-amber-100/80" style={{ fontFamily: CP }}>
                    Starter PIN
                  </p>
                  <p className="mt-2 text-2xl tracking-[0.35em] text-amber-100">{pin}</p>
                  <p className="mt-2 text-[11px] text-amber-100/90">
                    After email verification, enter 5555 on the welcome screen, then log in with your credentials.
                  </p>
                </div>
              )}

              <div className="grid gap-2">
                <Link
                  href={ROUTES.WELCOME}
                  className="inline-flex items-center justify-center rounded-full border border-sky-300/25 bg-sky-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-sky-100 transition hover:bg-sky-300/15"
                >
                  Back To Welcome
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <label className="block space-y-1">
                <span className="block text-[10px] uppercase tracking-[0.22em] text-stone-400" style={{ fontFamily: CP }}>
                  Name
                </span>
                <input
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value)
                    setError('')
                  }}
                  placeholder="Your first name"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-stone-100 outline-none placeholder:text-stone-500 focus:border-pink-400/40 focus:ring-1 focus:ring-pink-400/15 transition"
                />
              </label>

              <label className="block space-y-1">
                <span className="block text-[10px] uppercase tracking-[0.22em] text-stone-400" style={{ fontFamily: CP }}>
                  Email
                </span>
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value)
                    setError('')
                  }}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-stone-100 outline-none placeholder:text-stone-500 focus:border-pink-400/40 focus:ring-1 focus:ring-pink-400/15 transition"
                />
              </label>

              <label className="block space-y-1">
                <span className="block text-[10px] uppercase tracking-[0.22em] text-stone-400" style={{ fontFamily: CP }}>
                  Date Of Birth
                </span>
                <input
                  type="date"
                  max={maxDob}
                  value={dateOfBirth}
                  onChange={(event) => {
                    setDateOfBirth(event.target.value)
                    setError('')
                  }}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-stone-100 outline-none focus:border-pink-400/40 focus:ring-1 focus:ring-pink-400/15 transition"
                />
                <p className="text-[11px] text-stone-500">Must be at least {MIN_AGE}+ years old.</p>
              </label>

              <label className="block space-y-1">
                <span className="block text-[10px] uppercase tracking-[0.22em] text-stone-400" style={{ fontFamily: CP }}>
                  Password
                </span>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value)
                    setError('')
                  }}
                  placeholder="At least 8 characters"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-stone-100 outline-none placeholder:text-stone-500 focus:border-pink-400/40 focus:ring-1 focus:ring-pink-400/15 transition"
                />
              </label>

              <label className="block space-y-1">
                <span className="block text-[10px] uppercase tracking-[0.22em] text-stone-400" style={{ fontFamily: CP }}>
                  Confirm Password
                </span>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => {
                    setConfirmPassword(event.target.value)
                    setError('')
                  }}
                  placeholder="Re-enter password"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-stone-100 outline-none placeholder:text-stone-500 focus:border-pink-400/40 focus:ring-1 focus:ring-pink-400/15 transition"
                />
              </label>

              {error && (
                <p className="rounded-xl border border-rose-500/25 bg-rose-950/50 px-3 py-2 text-center text-[11px] text-rose-300">
                  {error}
                </p>
              )}

              {error.includes('already has an account') && email.trim() && (
                <Link
                  href={`${ROUTES.LOGIN}?mode=credentials&identifier=${encodeURIComponent(
                    email.trim().toLowerCase()
                  )}`}
                  className="inline-flex w-full items-center justify-center rounded-full border border-sky-300/30 bg-sky-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-sky-100 transition hover:bg-sky-300/15"
                >
                  Continue To Log In
                </Link>
              )}

              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full rounded-full border border-pink-300/20 bg-gradient-to-r from-pink-600/90 to-rose-700/90 py-3 text-sm tracking-wide text-stone-100 transition hover:brightness-110 disabled:cursor-wait disabled:opacity-70"
                style={{ fontFamily: CP }}
              >
                {status === 'loading' ? 'creating account...' : 'create account'}
              </button>

              <p className="text-center text-[10px] uppercase tracking-[0.2em] text-stone-500" style={{ fontFamily: CP }}>
                <Link href={ROUTES.LOGIN} className="hover:text-stone-300 transition-colors">
                  already a member? log in
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense>
      <SignupContent />
    </Suspense>
  )
}