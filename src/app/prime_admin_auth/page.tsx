'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'

import { ROUTES } from '@/lib/constants'

const CP = "Copperplate, 'Copperplate Gothic Light', fantasy"

export default function PrimeAdminAuthPage() {
  const router = useRouter()
  const [breakglas, setBreakglas] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!breakglas.trim()) {
      setError('Break-glass secret is required')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/prime-admin-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ breakglas: breakglas.trim() }),
      })

      const data = await response.json()
      if (!response.ok) {
        setError(data.error || 'Access denied')
        setLoading(false)
        return
      }

      router.push(data.returnTo || ROUTES.ADMIN_AUTH)
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
            'radial-gradient(circle at 22% 18%, rgba(34,197,94,0.2), transparent 38%), radial-gradient(circle at 82% 14%, rgba(56,189,248,0.2), transparent 38%), linear-gradient(180deg, rgba(2,6,23,0.75), rgba(2,6,23,0.98))',
        }}
      />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-black/45 p-6 shadow-[0_20px_55px_rgba(0,0,0,0.55)] backdrop-blur-md">
          <h1 className="text-center text-xl tracking-[0.2em] text-stone-100" style={{ fontFamily: CP }}>
            Prime Admin
          </h1>
          <p className="mt-2 text-center text-xs tracking-wide text-stone-400" style={{ fontFamily: CP }}>
            Unlock break-glass control
          </p>

          <form className="mt-6 space-y-4" onSubmit={onSubmit}>
            <label className="block space-y-2">
              <span className="block text-center text-[10px] uppercase tracking-[0.22em] text-stone-400" style={{ fontFamily: CP }}>
                breakglas
              </span>
              <input
                type="password"
                autoFocus
                autoComplete="off"
                value={breakglas}
                onChange={(event) => {
                  setBreakglas(event.target.value)
                  if (error) setError('')
                }}
                placeholder="breakglas"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center text-sm tracking-[0.06em] text-stone-100 outline-none placeholder:text-stone-600 focus:border-emerald-300/45"
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
              className="w-full rounded-full border border-emerald-300/25 bg-gradient-to-r from-emerald-500/85 to-teal-600/85 py-3 text-sm tracking-[0.16em] text-stone-100 transition hover:brightness-110 disabled:cursor-wait disabled:opacity-70"
              style={{ fontFamily: CP }}
            >
              {loading ? 'unlocking...' : 'unlock'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
