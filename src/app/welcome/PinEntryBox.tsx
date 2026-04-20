'use client'

import { FormEvent, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

import { MESSAGES, ROUTES } from '@/lib/constants'

type LoginResponse = {
  error?: string
  returnTo?: string
  requiresCredentials?: boolean
}

const CP = "Copperplate, 'Copperplate Gothic Light', fantasy"

/** 3×3 dot grid — universally recognised as a PIN/keypad symbol */
function KeypadIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-8 w-8" fill="currentColor" aria-hidden="true">
      <circle cx="5"  cy="5"  r="1.5" />
      <circle cx="12" cy="5"  r="1.5" />
      <circle cx="19" cy="5"  r="1.5" />
      <circle cx="5"  cy="12" r="1.5" />
      <circle cx="12" cy="12" r="1.5" />
      <circle cx="19" cy="12" r="1.5" />
      <circle cx="5"  cy="19" r="1.5" />
      <circle cx="12" cy="19" r="1.5" />
      <circle cx="19" cy="19" r="1.5" />
    </svg>
  )
}

export default function PinEntryBox() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading'>('idle')
  const inputRef = useRef<HTMLInputElement>(null)

  function toggleOpen() {
    setOpen((prev) => {
      if (!prev) setTimeout(() => inputRef.current?.focus(), 50)
      return !prev
    })
    setError('')
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!pin) {
      setError(MESSAGES.ENTRY_PIN_REQUIRED)
      return
    }

    setStatus('loading')
    setError('')

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode: pin }),
      })

      const data = (await response.json()) as LoginResponse

      if (!response.ok) {
        setError(data.error || MESSAGES.LOGIN_INVALID)
        setStatus('idle')
        return
      }

      if (pin === '0000') {
        router.push(ROUTES.SIGNUP)
        return
      }

      if (pin === '5555' || data.requiresCredentials) {
        router.push(ROUTES.LOGIN)
        return
      }

      router.push(data.returnTo || ROUTES.LOGIN)
    } catch {
      setError(MESSAGES.ERROR_GENERAL)
      setStatus('idle')
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Keypad icon button — always visible */}
      <button
        type="button"
        aria-label="Open PIN entry"
        onClick={toggleOpen}
        className="inline-flex h-24 w-24 items-center justify-center rounded-2xl border-2 border-white/70 bg-black/70 text-white shadow-[0_0_40px_rgba(255,255,255,0.18),0_8px_32px_rgba(0,0,0,0.7)] backdrop-blur-sm transition hover:scale-105 hover:border-white hover:shadow-[0_0_55px_rgba(255,255,255,0.28)] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
      >
        <KeypadIcon />
      </button>

      {/* Always-visible hint */}
      <p
        className="text-[11px] tracking-[0.18em] text-white/70 select-none drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]"
        style={{ fontFamily: CP }}
      >
        No pin = 0000
      </p>

      {/* Collapsible PIN form */}
      {open && (
        <form
          onSubmit={handleSubmit}
          className="w-72 space-y-3 rounded-2xl border border-white/15 bg-black/60 p-5 shadow-[0_18px_48px_rgba(0,0,0,0.55)] backdrop-blur-md"
        >
          <label
            className="block text-center text-[10px] uppercase tracking-[0.26em] text-stone-200"
            style={{ fontFamily: CP }}
          >
            PIN
          </label>

          <input
            ref={inputRef}
            type="password"
            inputMode="numeric"
            autoComplete="off"
            maxLength={4}
            value={pin}
            onChange={(e) => {
              setPin(e.target.value.replace(/\D/g, '').slice(0, 4))
              if (error) setError('')
            }}
            placeholder="••••"
            className="w-full rounded-xl border border-white/15 bg-white/8 px-4 py-3 text-center text-xl tracking-[0.4em] text-stone-100 outline-none placeholder:text-stone-500 focus:border-sky-300/45 focus:ring-1 focus:ring-sky-200/25 transition"
            style={{ fontFamily: CP }}
          />

          {error && (
            <p className="rounded-lg border border-rose-400/35 bg-rose-950/45 px-3 py-2 text-center text-[11px] text-rose-200">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full rounded-xl border border-white/20 bg-white/10 py-2.5 text-xs uppercase tracking-[0.22em] text-stone-100 transition hover:bg-white/18 disabled:cursor-wait disabled:opacity-60"
            style={{ fontFamily: CP }}
          >
            {status === 'loading' ? 'Checking…' : 'Enter'}
          </button>
        </form>
      )}
    </div>
  )
}