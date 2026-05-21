'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

import { MESSAGES, MIN_AGE, ROUTES } from '@/lib/constants'

const CP = "Copperplate, 'Copperplate Gothic Light', fantasy"

type RegisterResponse = {
  message?: string
  error?: string
}

type NameAvailabilityResponse = {
  available?: boolean
  error?: string
}

function getServerError(errorCode: string | null): string {
  if (errorCode === 'expired') return MESSAGES.TOKEN_EXPIRED
  if (errorCode === 'invalid_name') return MESSAGES.NAME_MISMATCH
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
  const [error, setError] = useState(getServerError(searchParams.get('error')))
  const [successMessage, setSuccessMessage] = useState('')
  const [nameStatus, setNameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle')

  const maxDob = useMemo(() => {
    const now = new Date()
    now.setFullYear(now.getFullYear() - MIN_AGE)
    return now.toISOString().split('T')[0]
  }, [])

  const validateForm = (): string => {
    if (!name.trim() || !email.trim() || !dateOfBirth || !password || !confirmPassword) return MESSAGES.FIELD_REQUIRED
    if (nameStatus === 'taken') return MESSAGES.NAME_EXISTS
    if (nameStatus === 'checking') return 'Please wait while we check your name'

    const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim().toLowerCase())
    if (!validEmail) return MESSAGES.INVALID_EMAIL

    const dob = new Date(`${dateOfBirth}T00:00:00.000Z`)
    if (Number.isNaN(dob.getTime())) return MESSAGES.INVALID_DATE_OF_BIRTH

    const ageDate = new Date()
    ageDate.setFullYear(ageDate.getFullYear() - MIN_AGE)
    if (dob > ageDate) return MESSAGES.INVALID_DATE_OF_BIRTH

    if (password.length < 8) return MESSAGES.PASSWORD_MIN_LENGTH

    if (password !== confirmPassword) return 'Passwords do not match'

    return ''
  }

  useEffect(() => {
    const normalizedName = name.trim().replace(/\s+/g, ' ')

    if (!normalizedName) {
      setNameStatus('idle')
      return
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(async () => {
      try {
        setNameStatus('checking')

        const response = await fetch('/api/auth/check-name', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: normalizedName }),
          signal: controller.signal,
        })

        const data = (await response.json()) as NameAvailabilityResponse

        if (!response.ok || typeof data.available !== 'boolean') {
          setNameStatus('idle')
          return
        }

        setNameStatus(data.available ? 'available' : 'taken')
      } catch {
        if (!controller.signal.aborted) {
          setNameStatus('idle')
        }
      }
    }, 350)

    return () => {
      controller.abort()
      clearTimeout(timeoutId)
    }
  }, [name])

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
          name: name.trim().replace(/\s+/g, ' '),
          email: email.trim().toLowerCase(),
          dateOfBirth,
          password,
        }),
      })

      const data = (await response.json()) as RegisterResponse

      if (!response.ok) {
        setError(data.error || MESSAGES.ERROR_GENERAL)
        setStatus('idle')
        return
      }

      setSuccessMessage(data.message || MESSAGES.EMAIL_SENT)
      setStatus('success')
    } catch {
      setError(MESSAGES.ERROR_GENERAL)
      setStatus('idle')
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#020617] text-slate-100">
      <div className="absolute inset-0">
        <Image
          src="/welcome2.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
          style={{ objectPosition: 'center 18%' }}
        />
      </div>

      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 18% 16%, rgba(56,189,248,0.18), transparent 42%), radial-gradient(circle at 82% 14%, rgba(244,114,182,0.15), transparent 36%), linear-gradient(180deg, rgba(2,6,23,0.72), rgba(2,6,23,0.97))',
        }}
      />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10">
        <div className="w-full max-w-xs rounded-2xl border border-white/8 bg-black/25 p-5 shadow-[0_12px_35px_rgba(0,0,0,0.4)] backdrop-blur-sm sm:p-6">
          <h1
            className="text-center text-xl tracking- text-stone-100"
            style={{ fontFamily: CP }}
          >
            Sign Up
          </h1>
          <p className="mt-2 text-center text-xs text-stone-300" style={{ fontFamily: CP }}>
             Create your account below.
          </p>

          {status === 'success' ? (
            <div className="mt-6 space-y-4">
              <p className="rounded-xl border border-emerald-300/35 bg-emerald-400/12 px-4 py-3 text-sm text-emerald-100">
                {successMessage}
              </p>

              <p className="rounded-xl border border-sky-300/30 bg-sky-400/10 px-4 py-3 text-center text-[11px] text-sky-100">
                After email verification, return to the login screen and continue with your username/email and password.
              </p>

              <div className="grid gap-2 sm:grid-cols-2">
                <Link
                  href={ROUTES.LOGIN}
                  className="inline-flex items-center justify-center rounded-full border border-white/25 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking- text-stone-100 transition hover:bg-white/15"
                >
                  Go To Login
                </Link>
                <Link
                  href={ROUTES.WELCOME}
                  className="inline-flex items-center justify-center rounded-full border border-sky-300/25 bg-sky-400/10 px-4 py-2 text-xs font-semibold uppercase tracking- text-sky-100 transition hover:bg-sky-300/15"
                >
                  Back To Welcome
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <label className="block space-y-1">
                <span className="block text- uppercase tracking- text-stone-400" style={{ fontFamily: CP }}>
                  Name
                </span>
                <input
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setError(''); }}
                    placeholder="My name is..."
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-stone-100 outline-none placeholder:text-stone-500 focus:border-pink-400/40 focus:ring-1 focus:ring-pink-400/15 transition"
                />
                {nameStatus === 'checking' && (
                  <p className="text- text-stone-500">Checking name availability...</p>
                )}
                {nameStatus === 'available' && (
                  <p className="text- text-emerald-300">Name is available.</p>
                )}
                {nameStatus === 'taken' && (
                  <p className="text- text-rose-300">{MESSAGES.NAME_EXISTS}</p>
                )}
              </label>

              <label className="block space-y-1">
                <span className="block text- uppercase tracking- text-stone-400" style={{ fontFamily: CP }}>
                  Email
                </span>
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-stone-100 outline-none placeholder:text-stone-500 focus:border-pink-400/40 focus:ring-1 focus:ring-pink-400/15 transition"
                />
              </label>

              <label className="block space-y-1">
                <span className="block text- uppercase tracking-[0.22em] text-stone-400" style={{ fontFamily: CP }}>
                  Date Of Birth
                </span>
                <input
                  type="date"
                  max={maxDob}
                  value={dateOfBirth}
                  onChange={(e) => { setDateOfBirth(e.target.value); setError(''); }}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-stone-100 outline-none focus:border-pink-400/40 focus:ring-1 focus:ring-pink-400/15 transition"
                />
                <p className="text- text-stone-500">Must be at least {MIN_AGE}+ years old.</p>
              </label>

              <label className="block space-y-1">
                <span className="block text- uppercase tracking-[0.22em] text-stone-400" style={{ fontFamily: CP }}>
                  Password
                </span>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  placeholder="At least 8 characters"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-stone-100 outline-none placeholder:text-stone-500 focus:border-pink-400/40 focus:ring-1 focus:ring-pink-400/15 transition"
                />
              </label>

              <label className="block space-y-1">
                <span className="block text- uppercase tracking-[0.22em] text-stone-400" style={{ fontFamily: CP }}>
                  Confirm Password
                </span>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                  placeholder="Re-enter password"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-stone-100 outline-none placeholder:text-stone-500 focus:border-pink-400/40 focus:ring-1 focus:ring-pink-400/15 transition"
                />
              </label>

              {error && (
                <p className="rounded-xl border border-rose-500/25 bg-rose-950/50 px-3 py-2 text-center text- text-rose-300">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={status === 'loading' || nameStatus === 'checking' || nameStatus === 'taken'}
                className="w-full rounded-full border border-pink-300/20 bg-gradient-to-r from-pink-600/90 to-rose-700/90 py-3 text-sm tracking-wide text-stone-100 transition hover:brightness-110 disabled:cursor-wait disabled:opacity-70"
                style={{ fontFamily: CP }}
              >
                {status === 'loading' ? 'creating account...' : 'create account'}
              </button>

              <p className="text-center text- uppercase tracking- text-stone-500" style={{ fontFamily: CP }}>
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
