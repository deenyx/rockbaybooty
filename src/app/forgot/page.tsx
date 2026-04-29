'use client'

import Link from 'next/link'
import { useState } from 'react'

import { MESSAGES, ROUTES } from '@/lib/constants'

export default function ForgotPage() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle')
  const [message, setMessage] = useState('')

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus('loading')
    setMessage('')

    try {
      const response = await fetch('/api/auth/request-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      })

      const data = await response.json()

      if (!response.ok) {
        setMessage(data.error || MESSAGES.ERROR_GENERAL)
        setStatus('idle')
        return
      }

      setMessage(data.message || MESSAGES.RESET_REQUEST_SENT)
      setStatus('success')
    } catch {
      setMessage(MESSAGES.ERROR_GENERAL)
      setStatus('idle')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-slate-100">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-black/40 p-6 backdrop-blur-md">
        <h1 className="text-center text-xl tracking-[0.18em]">Recover Account</h1>
        <p className="mt-3 text-center text-sm text-stone-400">
          Reset your password and login PIN using your email.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none placeholder:text-stone-500 focus:border-sky-300/45"
          />

          {message && (
            <p className="rounded-xl border border-sky-300/30 bg-sky-400/10 px-3 py-2 text-sm text-sky-100">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full rounded-full border border-pink-300/20 bg-gradient-to-r from-pink-600/90 to-rose-700/90 py-3 text-sm tracking-wide transition hover:brightness-110 disabled:opacity-60"
          >
            {status === 'loading' ? 'sending...' : 'Send Reset Link'}
          </button>
        </form>

        <p className="mt-4 text-center text-xs uppercase tracking-[0.16em] text-stone-500">
          <Link href={ROUTES.LOGIN} className="hover:text-stone-300 transition-colors">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  )
}
