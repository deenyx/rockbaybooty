'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'

import { ROUTES } from '@/lib/constants'

const CP = "Copperplate, 'Copperplate Gothic Light', fantasy"

export default function AdminAuthPage() {
  const router = useRouter()
  const [passphrase, setPassphrase] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!passphrase.trim()) {
      setError('Passphrase is required')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/admin-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passphrase: passphrase.trim() }),
      })

      const data = await response.json()
      if (!response.ok) {
        setError(data.error || 'Access denied')
        setLoading(false)
        return
      }

      router.push(data.returnTo || ROUTES.ADMIN)
    } catch {
      setError('Network error. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="relative isolate min-h-screen overflow-hidden bg-[#020617] text-slate-100">
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 20% 18%, rgba(56,189,248,0.22), transparent 38%), radial-gradient(circle at 82% 16%, rgba(244,114,182,0.18), transparent 38%), linear-gradient(180deg, rgba(2,6,23,0.75), rgba(2,6,23,0.98))',
        }}
      />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-black/45 p-6 shadow-[0_20px_55px_rgba(0,0,0,0.55)] backdrop-blur-md">
          <h1 className="text-center text-xl tracking-[0.2em] text-stone-100" style={{ fontFamily: CP }}>
            Admin Auth
          </h1>
          <p className="mt-2 text-center text-xs tracking-wide text-stone-400" style={{ fontFamily: CP }}>
            Enter passphrase
          </p>

          <form className="mt-6 space-y-4" onSubmit={onSubmit}>
            <label className="block space-y-2">
              <span className="block text-center text-[10px] uppercase tracking-[0.22em] text-stone-400" style={{ fontFamily: CP }}>
                Passphrase
              </span>
              <input
                type="password"
                autoFocus
                autoComplete="off"
                value={passphrase}
                onChange={(event) => {
                  setPassphrase(event.target.value)
                  if (error) setError('')
                }}
                placeholder="passphrase"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center text-sm tracking-[0.08em] text-stone-100 outline-none placeholder:text-stone-600 focus:border-sky-300/45"
                style={{ fontFamily: CP }}
              />
            </label>

            {error && (
              <p className="rounded-xl border border-rose-500/25 bg-rose-950/50 px-3 py-2 text-center text-xs text-rose-300">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full border border-sky-300/25 bg-gradient-to-r from-sky-500/85 to-cyan-600/85 py-3 text-sm tracking-[0.16em] text-stone-100 transition hover:brightness-110 disabled:cursor-wait disabled:opacity-70"
              style={{ fontFamily: CP }}
            >
              {loading ? 'authorizing...' : 'continue'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
