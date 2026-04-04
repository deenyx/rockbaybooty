'use client'

import { Suspense, useState } from 'react'
import Image from 'next/image'
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
  const returnTo = searchParams.get('returnTo') || ROUTES.DASHBOARD
  const urlError = searchParams.get('error') || ''

  const [passcode, setPasscode] = useState('')
  const [error, setError] = useState(urlError)
  const [status, setStatus] = useState<'idle' | 'loading'>('idle')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const code = passcode.trim().toUpperCase()
    if (!code) {
      setError(MESSAGES.PASSCODE_REQUIRED)
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
          onSubmit={handleSubmit}
          className="w-full max-w-xs space-y-5 rounded-2xl border border-white/10 bg-black/45 p-6 shadow-[0_20px_55px_rgba(0,0,0,0.55)] backdrop-blur-md"
        >
          <div>
            <span
              className="block text-center text-[8px] uppercase tracking-[0.28em] text-yellow-400 mb-2"
              style={{ fontFamily: CP }}
            >
              PIN
            </span>
            <input
              type="password"
              autoFocus
              autoComplete="off"
              spellCheck={false}
              maxLength={12}
              value={passcode}
              onChange={(e) => {
                setPasscode(e.target.value.toUpperCase())
                setError('')
              }}
              placeholder="············"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-center text-2xl tracking-[0.4em] text-stone-100 outline-none placeholder:text-stone-700 focus:border-pink-400/40 focus:ring-1 focus:ring-pink-400/15 transition"
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
            {status === 'loading' ? 'entering…' : 'enter'}
          </button>

          <p
            className="text-center text-[9px] uppercase tracking-[0.2em] text-stone-600"
            style={{ fontFamily: CP }}
          >
            <a href={ROUTES.WELCOME} className="hover:text-stone-400 transition-colors">
              ← back
            </a>
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