'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useState } from 'react'

import { MESSAGES, ROUTES } from '@/lib/constants'

export default function ResetPage() {
  const searchParams = useSearchParams()
  const token = searchParams?.get('token') || ''

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loginPin, setLoginPin] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle')
  const [message, setMessage] = useState('')

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!token) {
      setMessage(MESSAGES.RESET_TOKEN_INVALID)
      return
    }

    if (password !== confirmPassword) {
      setMessage('Passwords do not match')
      return
    }

    setStatus('loading')
    setMessage('')

    try {
      const response = await fetch('/api/auth/reset-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          password,
          loginPin,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setMessage(data.error || MESSAGES.ERROR_GENERAL)
        setStatus('idle')
        return
      }

      setMessage(data.message || MESSAGES.RESET_SUCCESS)
      setStatus('success')
    } catch {
      setMessage(MESSAGES.ERROR_GENERAL)
      setStatus('idle')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-slate-100">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-black/40 p-6 backdrop-blur-md">
        <h1 className="text-center text-xl tracking-[0.18em]">Reset Credentials</h1>
        <p className="mt-3 text-center text-sm text-stone-400">
          Set a new password and a new 4-digit login PIN.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <input
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="New password"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none placeholder:text-stone-500 focus:border-sky-300/45"
          />

          <input
            type="password"
            autoComplete="new-password"
            required
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Confirm password"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none placeholder:text-stone-500 focus:border-sky-300/45"
          />

          <input
            type="password"
            inputMode="numeric"
            maxLength={4}
            required
            value={loginPin}
            onChange={(event) => setLoginPin(event.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="4-digit PIN"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm tracking-[0.2em] outline-none placeholder:text-stone-500 focus:border-sky-300/45"
          />

          {message && (
            <p className="rounded-xl border border-sky-300/30 bg-sky-400/10 px-3 py-2 text-sm text-sky-100">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={status === 'loading' || status === 'success'}
            className="w-full rounded-full border border-pink-300/20 bg-gradient-to-r from-pink-600/90 to-rose-700/90 py-3 text-sm tracking-wide transition hover:brightness-110 disabled:opacity-60"
          >
            {status === 'loading' ? 'updating...' : 'Update Credentials'}
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
