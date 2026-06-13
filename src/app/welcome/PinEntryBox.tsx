'use client'

import { FormEvent, useEffect, useRef, useState } from 'react'
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
  const [status, setStatus] = useState<'idle' | 'loading'>('idle')
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  function playKeyFeedback() {
    if (typeof window === 'undefined') return

    if ('vibrate' in navigator) {
      navigator.vibrate(12)
    }

    const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AudioContextClass) return

    const context = new AudioContextClass()
    const oscillator = context.createOscillator()
    const gainNode = context.createGain()

    oscillator.type = 'sine'
    oscillator.frequency.value = 760
    gainNode.gain.value = 0.025

    oscillator.connect(gainNode)
    gainNode.connect(context.destination)

    oscillator.start()
    gainNode.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.05)
    oscillator.stop(context.currentTime + 0.05)
    oscillator.onended = () => {
      void context.close()
    }
  }

  async function submitPin(code: string) {
    if (!code) {
      setError('Enter code')
      return
    }

    setStatus('loading')

    if (code === '0000') {
      router.push(ROUTES.SIGNUP)
      return
    }

    if (code === '5555') {
      router.push(ROUTES.LOGIN)
      return
    }

    if (code === '9999' || code === '3333') {
      setError('')

      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ passcode: code, returnTo: ROUTES.DASHBOARD }),
        })

        const data = await res.json()

        if (!res.ok) {
          setError(data.error || 'Invalid code')
          setStatus('idle')
          return
        }

        if (data.promptNametag) {
          router.push(`${ROUTES.ME_PROFILE}?prompt=nametag`)
          return
        }

        router.push(data.returnTo || ROUTES.DASHBOARD)
        return
      } catch {
        setError('Unable to continue. Please try again.')
        setStatus('idle')
        return
      }
    }

    setError('Invalid code')
    setStatus('idle')
  }

  useEffect(() => {
    if (open && pin.length === 4 && status === 'idle') {
      void submitPin(pin)
    }
  }, [open, pin, status])

  function appendDigit(digit: string) {
    setPin((previousPin) => {
      if (previousPin.length >= 4 || status === 'loading') return previousPin
      return `${previousPin}${digit}`
    })
    playKeyFeedback()
    if (error) setError('')
  }

  function removeDigit() {
    if (status === 'loading') return
    setPin((previousPin) => previousPin.slice(0, -1))
    playKeyFeedback()
    if (error) setError('')
  }

  function clearPin() {
    if (status === 'loading') return
    setPin('')
    playKeyFeedback()
    if (error) setError('')
  }

  function openPanel() {
    setOpen(true)
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  function closePanel() {
    setOpen(false)
    setError('')
  }

  function toggleOpen() {
    setOpen((prev) => {
      const next = !prev
      if (next) {
        setTimeout(() => inputRef.current?.focus(), 50)
      }
      if (!next) {
        setError('')
      }
      return next
    })
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void submitPin(pin)
  }

  return (
    <div
      ref={containerRef}
      className="relative flex flex-col items-center"
      onMouseEnter={openPanel}
      onMouseLeave={closePanel}
      onFocusCapture={openPanel}
      onBlurCapture={(event) => {
        const nextTarget = event.relatedTarget as Node | null
        if (!containerRef.current?.contains(nextTarget)) {
          closePanel()
        }
      }}
    >
      {open && (
        <button
          type="button"
          aria-label="Close PIN entry"
          onClick={closePanel}
          className="fixed inset-0 z-20 bg-black/60 sm:hidden"
        />
      )}

      {open && (
        <form
          onSubmit={handleSubmit}
          className="fixed inset-x-2 bottom-2 z-30 rounded-3xl border border-white/20 bg-black/90 p-4 shadow-[0_16px_44px_rgba(0,0,0,0.6)] backdrop-blur-md sm:absolute sm:left-1/2 sm:top-full sm:mt-2 sm:w-64 sm:-translate-x-1/2 sm:rounded-2xl"
        >
          <label
            className="mb-1 block text-center text-[10px] uppercase tracking-[0.24em] text-stone-100"
            style={{ fontFamily: CP }}
          >
            PIN
          </label>
          <p
            className="mb-2 text-center text-[8px] tracking-[0.14em] text-red-400/80 select-none"
            style={{ fontFamily: CP }}
          >
            ENTER ACCESS CODE
          </p>

          <div className="mb-3 grid grid-cols-4 gap-2">
            {Array.from({ length: 4 }).map((_, index) => {
              const hasDigit = index < pin.length
              return (
                <div
                  key={index}
                  className="flex h-12 items-center justify-center rounded-lg border border-white/20 bg-white/10 text-xl text-stone-100"
                  aria-hidden="true"
                >
                  {hasDigit ? '•' : ''}
                </div>
              )
            })}
          </div>

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
            className="sr-only"
            aria-label="PIN input"
          />

          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
              <button
                key={digit}
                type="button"
                onClick={() => appendDigit(String(digit))}
                disabled={status === 'loading'}
                className="h-12 rounded-lg border border-white/20 bg-white/10 text-base font-semibold text-stone-100 transition hover:bg-white/20 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                style={{ fontFamily: CP }}
              >
                {digit}
              </button>
            ))}
            <button
              type="button"
              onClick={clearPin}
              disabled={status === 'loading'}
              className="h-12 rounded-lg border border-white/20 bg-white/10 text-[10px] uppercase tracking-[0.2em] text-stone-200 transition hover:bg-white/20 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              style={{ fontFamily: CP }}
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => appendDigit('0')}
              disabled={status === 'loading'}
              className="h-12 rounded-lg border border-white/20 bg-white/10 text-base font-semibold text-stone-100 transition hover:bg-white/20 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              style={{ fontFamily: CP }}
            >
              0
            </button>
            <button
              type="button"
              onClick={removeDigit}
              disabled={status === 'loading'}
              className="h-12 rounded-lg border border-white/20 bg-white/10 text-[10px] uppercase tracking-[0.2em] text-stone-200 transition hover:bg-white/20 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              style={{ fontFamily: CP }}
            >
              Delete
            </button>
          </div>

          {error && (
            <p className="mt-2 text-center text-[10px] text-rose-300" style={{ fontFamily: CP }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={status === 'loading'}
            className="mt-3 w-full rounded-lg border border-white/20 bg-white/10 py-3 text-xs uppercase tracking-[0.24em] text-stone-100 transition hover:bg-white/20 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            style={{ fontFamily: CP }}
          >
            {status === 'loading' ? 'Checking...' : 'Enter'}
          </button>
        </form>
      )}

      <button
        type="button"
        aria-label="Open PIN entry"
        onClick={toggleOpen}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/20 bg-black/30 text-white/50 backdrop-blur-sm transition hover:border-white/40 hover:text-white/80 active:scale-95 focus-visible:outline-none"
      >
        <KeypadIcon />
      </button>
    </div>
  )
}