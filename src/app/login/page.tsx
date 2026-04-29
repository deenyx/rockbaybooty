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
  const verified = searchParams?.get('verified') === '1'
  const directCredentialsMode = searchParams?.get('mode') === 'credentials'
  const prefilledIdentifier = searchParams?.get('identifier') || ''

  const [entryPin, setEntryPin] = useState('')
  const [identifier, setIdentifier] = useState(prefilledIdentifier)
  const [secret, setSecret] = useState('')
  const [secretType, setSecretType] = useState<'password' | 'passcode'>('password')
  const [stage, setStage] = useState<'pin' | 'credentials'>(
    directCredentialsMode ? 'credentials' : 'pin'
  )
  const [error, setError] = useState(urlError)
  const [status, setStatus] = useState<'idle' | 'loading'>('idle')

  async function handlePinSubmit(e: React.FormEvent) {
    e.preventDefault()
    const code = entryPin.trim()

    if (!code) {
      setError(MESSAGES.ENTRY_PIN_REQUIRED)
      return
    }

    setStatus('loading')
    setError('')

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode: code, returnTo }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || MESSAGES.LOGIN_INVALID)
        setStatus('idle')
        return
      }

      if (data.requiresCredentials || code === '5555') {
        setStage('credentials')
        setStatus('idle')
        setError('')
        return
      }

      router.push(data.returnTo || ROUTES.DASHBOARD)
    } catch {
      setError('Network error. Please try again.')
      setStatus('idle')
    }
  }

  async function handleCredentialSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!identifier.trim() || !secret.trim()) {
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
          passcode: '5555',
          identifier: identifier.trim().toLowerCase(),
          secret: secret.trim(),
          secretType,
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

        {stage === 'pin' ? (
          <form
            onSubmit={handlePinSubmit}
            className="w-full max-w-xs space-y-5 rounded-2xl border border-white/10 bg-black/45 p-6 shadow-[0_20px_55px_rgba(0,0,0,0.55)] backdrop-blur-md"
          >
            {verified && (
              <p className="rounded-xl border border-emerald-300/35 bg-emerald-400/12 px-3 py-2 text-center text-[11px] text-emerald-100">
                Email verified. Use your entry PIN to continue.
              </p>
            )}

            <div>
              <span
                className="block text-center text-[8px] uppercase tracking-[0.28em] text-yellow-400 mb-2"
                style={{ fontFamily: CP }}
              >
                Entry PIN
              </span>
              <input
                type="password"
                autoFocus
                inputMode="numeric"
                autoComplete="off"
                maxLength={4}
                value={entryPin}
                onChange={(e) => {
                  setEntryPin(e.target.value.replace(/\D/g, '').slice(0, 4))
                  setError('')
                }}
                placeholder="0000"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-center text-2xl tracking-[0.4em] text-stone-100 outline-none placeholder:text-stone-700 focus:border-pink-400/40 focus:ring-1 focus:ring-pink-400/15 transition"
                style={{ fontFamily: CP }}
              />
              <p className="mt-2 text-center text-[10px] tracking-wide text-stone-400" style={{ fontFamily: CP }}>
                No code = 0000
            
              </p>
            </div>

            {error && <ErrorMsg msg={error} />}

            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full rounded-full border border-pink-300/20 bg-gradient-to-r from-pink-600/90 to-rose-700/90 py-3 text-sm tracking-wide text-stone-100 transition hover:brightness-110 disabled:opacity-60 disabled:cursor-wait"
              style={{ fontFamily: CP }}
            >
              {status === 'loading' ? 'checking…' : 'continue'}
            </button>

            <p className="text-center text-[9px] uppercase tracking-[0.2em] text-stone-600" style={{ fontFamily: CP }}>
              <Link href={ROUTES.WELCOME} className="hover:text-stone-400 transition-colors">
                ← back
              </Link>
            </p>
          </form>
        ) : (
          <form
            onSubmit={handleCredentialSubmit}
            className="w-full max-w-xs space-y-5 rounded-2xl border border-white/10 bg-black/45 p-6 shadow-[0_20px_55px_rgba(0,0,0,0.55)] backdrop-blur-md"
          >
            {directCredentialsMode && (
              <p className="rounded-xl border border-amber-300/30 bg-amber-300/10 px-3 py-2 text-center text-[11px] text-amber-100">
                Existing account detected. Log in with your email and password.
              </p>
            )}

            <p className="rounded-xl border border-sky-300/30 bg-sky-400/10 px-3 py-2 text-center text-[11px] text-sky-100">
              Entry PIN accepted. Log in with your user ID or email.
            </p>

            <div>
              <span className="mb-2 block text-center text-[8px] uppercase tracking-[0.28em] text-sky-200" style={{ fontFamily: CP }}>
                User ID or Email
              </span>
              <input
                type="text"
                autoComplete="username"
                value={identifier}
                onChange={(e) => {
                  setIdentifier(e.target.value)
                  setError('')
                }}
                placeholder="username or you@example.com"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center text-sm tracking-[0.03em] text-stone-100 outline-none placeholder:text-stone-500 focus:border-pink-400/40 focus:ring-1 focus:ring-pink-400/15 transition"
                style={{ fontFamily: CP }}
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSecretType('password')
                    setError('')
                  }}
                  className={`rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.18em] transition ${
                    secretType === 'password'
                      ? 'border border-white/30 bg-white/10 text-stone-100'
                      : 'border border-white/10 text-stone-400 hover:text-stone-200'
                  }`}
                >
                  Password
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSecretType('passcode')
                    setError('')
                  }}
                  className={`rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.18em] transition ${
                    secretType === 'passcode'
                      ? 'border border-white/30 bg-white/10 text-stone-100'
                      : 'border border-white/10 text-stone-400 hover:text-stone-200'
                  }`}
                >
                  Passcode
                </button>
                </div>
                <Link
                  href={ROUTES.FORGOT}
                  className="text-[10px] uppercase tracking-[0.14em] text-stone-500 transition-colors hover:text-stone-300"
                >
                  Forgot?
                </Link>
              </div>
              <input
                type={secretType === 'password' ? 'password' : 'text'}
                autoComplete={secretType === 'password' ? 'current-password' : 'off'}
                value={secret}
                onChange={(e) => {
                  setSecret(secretType === 'passcode' ? e.target.value.toUpperCase() : e.target.value)
                  setError('')
                }}
                placeholder={secretType === 'password' ? 'your password' : 'your passcode'}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center text-sm tracking-[0.08em] text-stone-100 outline-none placeholder:text-stone-500 focus:border-pink-400/40 focus:ring-1 focus:ring-pink-400/15 transition"
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

            <p className="text-center text-[9px] uppercase tracking-[0.2em] text-stone-600" style={{ fontFamily: CP }}>
              <button
                type="button"
                onClick={() => {
                  setStage('pin')
                  setSecret('')
                  setIdentifier('')
                  setError('')
                }}
                className="hover:text-stone-400 transition-colors"
              >
                ← change pin
              </button>
            </p>
          </form>
        )}
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