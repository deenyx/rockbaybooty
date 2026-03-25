'use client'

import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'

import { validatePasscode } from '@/lib/api'
import { MESSAGES, PASSCODE_LENGTH, ROUTES } from '@/lib/constants'

const PASSCODE_PATTERN = /^[A-Z0-9]{6,8}$/

const CONFETTI_PIECES = Array.from({ length: 14 }, (_, index) => ({
  id: index,
  left: `${8 + index * 6}%`,
  delay: `${index * 40}ms`,
  rotation: `${index % 2 === 0 ? 1 : -1}${110 + index * 9}deg`,
  xOffset: `${index % 2 === 0 ? 42 + index * 3 : -38 - index * 2}px`,
}))

export default function LandingAccessGate() {
  const router = useRouter()
  const timeoutsRef = useRef<number[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [passcode, setPasscode] = useState('')
  const [error, setError] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle')

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && status !== 'loading') {
        closeModal()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, status])

  useEffect(() => {
    return () => {
      clearTimers()
    }
  }, [])

  const clearTimers = () => {
    timeoutsRef.current.forEach((timeout) => window.clearTimeout(timeout))
    timeoutsRef.current = []
  }

  const resetState = () => {
    clearTimers()
    setStatus('idle')
    setError('')
  }

  const openModal = () => {
    resetState()
    setPasscode('')
    setIsOpen(true)
  }

  const closeModal = () => {
    if (status === 'loading') {
      return
    }

    resetState()
    setPasscode('')
    setIsOpen(false)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const normalizedPasscode = passcode.replace(/[^a-z0-9]/gi, '').toUpperCase()
    setPasscode(normalizedPasscode)

    if (!PASSCODE_PATTERN.test(normalizedPasscode)) {
      setError(MESSAGES.PASSCODE_GATE_INVALID)
      return
    }

    setError('')
    setStatus('loading')

    try {
      await validatePasscode(normalizedPasscode)

      const successTimeout = window.setTimeout(() => {
        setStatus('success')
      }, 700)

      const redirectTimeout = window.setTimeout(() => {
        router.push(`${ROUTES.ONBOARDING}?passcode=${encodeURIComponent(normalizedPasscode)}`)
      }, 1450)

      timeoutsRef.current = [successTimeout, redirectTimeout]
    } catch (error) {
      setStatus('idle')
      setError(
        error instanceof Error && error.message
          ? error.message
          : MESSAGES.PASSCODE_GATE_INVALID
      )
    }
  }

  return (
    <>
      <div className="flex flex-col items-start gap-4">
        <button
          type="button"
          onClick={openModal}
          className="group inline-flex items-center justify-center gap-3 rounded-full border border-amber-200/30 bg-gradient-to-r from-[#b7793d] via-[#d8bc7a] to-[#b7793d] px-6 py-3 text-sm font-semibold uppercase tracking-[0.28em] text-[#14090b] shadow-[0_18px_55px_rgba(167,108,46,0.28)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_70px_rgba(167,108,46,0.36)] focus:outline-none focus:ring-2 focus:ring-amber-200/70 focus:ring-offset-2 focus:ring-offset-[#11080a] animate-glow-pulse"
        >
          Join Now
          <span className="text-base transition-transform duration-300 group-hover:translate-x-0.5">+</span>
        </button>

        <p className="max-w-md text-sm text-stone-300/75">
          Entry is reserved for verified adults with an active invite code. Codes must be 6 to 8 letters or numbers.
        </p>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 py-8 backdrop-blur-md">
          <button
            type="button"
            aria-label="Close passcode modal"
            onClick={closeModal}
            className="absolute inset-0 cursor-default"
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="invite-gate-title"
            className="relative z-10 w-full max-w-md overflow-hidden rounded-[2rem] border border-white/10 bg-[#140b0e]/95 p-6 text-left shadow-[0_30px_120px_rgba(0,0,0,0.65)] sm:p-8"
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(197,126,61,0.24),transparent_32%),radial-gradient(circle_at_bottom,rgba(128,25,52,0.24),transparent_40%)]" />
            <div className="relative flex items-start justify-between gap-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.34em] text-amber-200/70">
                  Invite Gate
                </p>
                <h2
                  id="invite-gate-title"
                  className="mt-3 font-[family:var(--font-display)] text-3xl leading-none text-stone-100"
                >
                  Enter your passcode
                </h2>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="rounded-full border border-white/10 px-3 py-1 text-sm text-stone-300 transition hover:border-white/20 hover:text-white"
              >
                Close
              </button>
            </div>

            <p className="relative mt-4 text-sm leading-6 text-stone-300/80">
              Private access starts with a valid member code. We keep the experience discreet, adult-only, and invite-led.
            </p>

            <form onSubmit={handleSubmit} className="relative mt-8 space-y-4">
              <div>
                <label htmlFor="passcode" className="mb-2 block text-xs font-semibold uppercase tracking-[0.3em] text-stone-400">
                  Passcode
                </label>
                <input
                  id="passcode"
                  name="passcode"
                  type="text"
                  inputMode="text"
                  autoComplete="one-time-code"
                  minLength={PASSCODE_LENGTH}
                  maxLength={8}
                  pattern="[A-Za-z0-9]{6,8}"
                  placeholder="AB12CD"
                  value={passcode}
                  onChange={(event) => {
                    setPasscode(event.target.value.toUpperCase())
                    if (error) {
                      setError('')
                    }
                  }}
                  className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-4 text-center text-lg font-semibold tracking-[0.45em] text-stone-100 outline-none transition placeholder:text-stone-500 focus:border-amber-200/60 focus:ring-2 focus:ring-amber-200/20"
                />
              </div>

              {error && (
                <p className="rounded-2xl border border-[#b03d53]/35 bg-[#4d1421]/45 px-4 py-3 text-sm text-[#ffced5]">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={status !== 'idle'}
                className="relative inline-flex w-full items-center justify-center rounded-full border border-amber-200/20 bg-gradient-to-r from-[#8c1f43] via-[#a0354f] to-[#6d102e] px-5 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-stone-100 transition hover:brightness-110 disabled:cursor-wait disabled:opacity-90"
              >
                {status === 'loading' && (
                  <span className="mr-3 h-4 w-4 animate-spin rounded-full border-2 border-stone-300/25 border-t-stone-100" />
                )}
                {status === 'loading' ? 'Verifying access' : status === 'success' ? 'Access granted' : 'Unlock onboarding'}
              </button>
            </form>

            <div className="relative mt-5 flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.24em] text-stone-400/90">
              <span className="rounded-full border border-white/10 px-3 py-1">18+ only</span>
              <span className="rounded-full border border-white/10 px-3 py-1">Invite required</span>
              <span className="rounded-full border border-white/10 px-3 py-1">No public profiles</span>
            </div>

            {status === 'success' && (
              <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[2rem]">
                <div className="absolute inset-x-10 bottom-16 top-16 rounded-full bg-amber-200/20 blur-3xl animate-rise-fade" />
                <div className="absolute inset-x-16 inset-y-20 rounded-full border border-amber-100/30 animate-rise-fade" />
                {CONFETTI_PIECES.map((piece) => (
                  <span
                    key={piece.id}
                    className="absolute top-1/2 h-3 w-2 rounded-full bg-gradient-to-b from-[#f6d68f] via-[#d59a4b] to-[#8c1f43] opacity-0 animate-confetti-fall"
                    style={{
                      left: piece.left,
                      animationDelay: piece.delay,
                      ['--confetti-rotate' as string]: piece.rotation,
                      ['--confetti-x' as string]: piece.xOffset,
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}