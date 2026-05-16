'use client'

import { Suspense, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

import { MESSAGES, ROUTES } from '@/lib/constants'

const CP = "Copperplate, 'Copperplate Gothic Light', fantasy"

function ErrorMsg({ msg }: { msg: string }) {
  return (
    <p className="rounded-xl border border-rose-500/25 bg-rose-950/50 px-3 py-2 text-center text-[11px] text-rose-300">
      {msg}
    </p>
  )
}

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnTo = searchParams?.get('returnTo') || ROUTES.DASHBOARD
  const urlError = searchParams?.get('error') || ''
  const prefilledIdentifier = searchParams?.get('identifier') || ''

  const [identifier, setIdentifier] = useState(prefilledIdentifier)
  const [secret, setSecret] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [error, setError] = useState(urlError)
  const [status, setStatus] = useState<'idle' | 'loading'>('idle')

  async function handleCredentialSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!identifier.trim() || !secret.trim() || !dateOfBirth) {
      setError(MESSAGES.LOGIN_CREDENTIALS_REQUIRED)
      return
    }

    setStatus('loading')
    setError('')

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: identifier.trim().toLowerCase(),
          secret: secret.trim(),
          dateOfBirth,
          returnTo,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || MESSAGES.LOGIN_INVALID)
        setStatus('idle')
        return
      }

      router.push(data.returnTo || ROUTES.DASHBOARD)
    } catch {
      setError('Network error. Please try again.')
      setStatus('idle')
    }
  }

  async function handleBurnerAccess() {
    setStatus('loading')
    setError('')

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode: '9999', returnTo }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || MESSAGES.LOGIN_INVALID)
        setStatus('idle')
        return
      }

      router.push(data.returnTo || ROUTES.DASHBOARD)
    } catch {
      setError('Network error. Please try again.')
      setStatus('idle')
    }
  }

  return (
    <div className="relative isolate min-h-screen overflow-hidden bg-[#020617] text-slate-100">
      <div className="absolute inset-0">
        <Image
          src="/welcome2.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
          style={{ objectPosition: 'center 18%', filter: 'saturate(1.08) contrast(1.02)' }}
        />
      </div>
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 18% 16%, rgba(56,189,248,0.18), transparent 42%), radial-gradient(circle at 82% 14%, rgba(244,114,182,0.15), transparent 36%), linear-gradient(180deg, rgba(2,6,23,0.72), rgba(2,6,23,0.97))',
        }}
      />

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center gap-8 px-4">
        <div className="text-center">
          <h1
            className="text-2xl tracking-[0.22em] text-stone-100/85 select-none"
            style={{ fontFamily: CP }}
          >
            Members Only
          </h1>
        </div>

        <form
          onSubmit={handleCredentialSubmit}
          className="w-full max-w-xs space-y-5 rounded-2xl border border-white/10 bg-black/45 p-6 shadow-[0_20px_55px_rgba(0,0,0,0.55)] backdrop-blur-md"
        >
          <p className="rounded-xl border border-sky-300/30 bg-sky-400/10 px-3 py-2 text-center text-[11px] text-sky-100">
            Log in with your user ID, password, and date of birth.
          </p>

          <div>
            <span className="mb-2 block text-center text-[8px] uppercase tracking-[0.28em] text-sky-200" style={{ fontFamily: CP }}>
              User ID
            </span>
            <input
              type="text"
              autoComplete="username"
              value={identifier}
              onChange={(e) => {
                setIdentifier(e.target.value)
                setError('')
              }}
              placeholder="your screen name"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center text-sm tracking-[0.03em] text-stone-100 outline-none placeholder:text-stone-500 focus:border-pink-400/40 focus:ring-1 focus:ring-pink-400/15 transition"
              style={{ fontFamily: CP }}
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-[10px] uppercase tracking-[0.18em] text-stone-300">Password</span>
              <Link
                href={ROUTES.FORGOT}
                className="text-[10px] uppercase tracking-[0.14em] text-stone-500 transition-colors hover:text-stone-300"
              >
                Forgot?
              </Link>
            </div>
            <input
              type="password"
              autoComplete="current-password"
              value={secret}
              onChange={(e) => {
                setSecret(e.target.value)
                setError('')
              }}
              placeholder="your password"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center text-sm tracking-[0.08em] text-stone-100 outline-none placeholder:text-stone-500 focus:border-pink-400/40 focus:ring-1 focus:ring-pink-400/15 transition"
              style={{ fontFamily: CP }}
            />
          </div>

          <div>
            <span className="mb-2 block text-center text-[8px] uppercase tracking-[0.28em] text-sky-200" style={{ fontFamily: CP }}>
              Date Of Birth
            </span>
            <input
              type="date"
              value={dateOfBirth}
              onChange={(e) => {
                setDateOfBirth(e.target.value)
                setError('')
              }}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center text-sm tracking-[0.03em] text-stone-100 outline-none placeholder:text-stone-500 focus:border-pink-400/40 focus:ring-1 focus:ring-pink-400/15 transition"
              style={{ fontFamily: CP }}
            />
          </div>

          {error && <ErrorMsg msg={error} />}

          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full rounded-full border border-pink-300/20 bg-gradient-to-r from-pink-600/90 to-rose-700/90 py-3 text-sm tracking-wide text-stone-100 transition hover:brightness-110 disabled:opacity-60 disabled:cursor-wait"
            style={{ fontFamily: CP }}
          >
            {status === 'loading' ? 'entering…' : 'log in'}
          </button>

          <button
            type="button"
            onClick={handleBurnerAccess}
            disabled={status === 'loading'}
            className="w-full rounded-full border border-amber-300/25 bg-amber-500/15 py-2.5 text-xs tracking-[0.14em] uppercase text-amber-100 transition hover:bg-amber-500/20 disabled:opacity-60 disabled:cursor-wait"
            style={{ fontFamily: CP }}
          >
            Enter Default Mode
          </button>

          <p className="text-center text-[9px] uppercase tracking-[0.2em] text-stone-600" style={{ fontFamily: CP }}>
            <Link href={ROUTES.WELCOME} className="hover:text-stone-400 transition-colors">
              ← back
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  )
}