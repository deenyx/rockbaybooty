'use client'

import { FormEvent, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

import { ROUTES } from '@/lib/constants'

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
      setError('Enter PIN')
      return
    }

    if (pin === '0000') {
      router.push(ROUTES.SIGNUP)
      return
    }

    if (pin === '5555') {
      router.push(ROUTES.LOGIN)
      return
    }

    if (pin === '9999') {
      // Perform real login as defaultuser (dev bypass)
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ passcode: '9999' }),
        })
        if (res.ok) {
          // Success: go to dashboard or default area
          router.push(ROUTES.DASHBOARD)
          return
        } else {
          setError('Dev bypass failed. Try again.')
          return
        }
      } catch {
        setError('Network error. Try again.')
        return
      }
    }

    setError('Use 0000, 5555, or 9999')
  }

  return (
    <div className="relative flex flex-col items-center">
      {open && (
        <form
          onSubmit={handleSubmit}
          className="absolute top-10 left-1/2 -translate-x-1/2 w-36 rounded-xl border border-white/20 bg-black/70 p-3 shadow-[0_12px_30px_rgba(0,0,0,0.55)] backdrop-blur-md"
        >
          <label
            className="mb-2 block text-center text-[10px] uppercase tracking-[0.24em] text-stone-100"
            style={{ fontFamily: CP }}
          >
            PIN
          </label>
          <p
            className="mb-2 text-center text-[8px] tracking-[0.14em] text-red-400/80 select-none"
            style={{ fontFamily: CP }}
          >
            NO PIN = 0000
          </p>

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
            placeholder="0000"
            className="w-full rounded-md border border-white/20 bg-white/10 px-2 py-2 text-center text-base tracking-[0.35em] text-stone-100 outline-none placeholder:text-stone-500 focus:border-sky-300/45"
            style={{ fontFamily: CP }}
          />

          {error && (
            <p className="mt-2 text-center text-[10px] text-rose-300" style={{ fontFamily: CP }}>
              {error}
            </p>
          )}
        </form>
      )}

      <button
        type="button"
        aria-label="Open PIN entry"
        onClick={toggleOpen}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/20 bg-black/30 text-white/50 backdrop-blur-sm transition hover:border-white/40 hover:text-white/80 active:scale-95 focus-visible:outline-none"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
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
      </button>
    </div>
  )
}