'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'

import { validatePasscode } from '@/lib/api'
import { MESSAGES, PASSCODE_LENGTH, ROUTES } from '@/lib/constants'

const PASSCODE_PATTERN = /^[A-Z0-9]{6,8}$/

export default function LandingAccessGate() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [passcode, setPasscode] = useState('')
  const [error, setError] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading'>('idle')

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && status !== 'loading') {
        setIsOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, status])

  const closeModal = () => {
    if (status === 'loading') {
      return
    }

    setError('')
    setStatus('idle')
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
      router.push(`${ROUTES.ONBOARDING}?passcode=${encodeURIComponent(normalizedPasscode)}`)
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
          onClick={() => setIsOpen(true)}
          className="group inline-flex items-center justify-center gap-3 rounded-full border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold uppercase tracking-[0.28em] text-white shadow-[0_12px_40px_rgba(2,6,23,0.35)] transition duration-300 hover:-translate-y-0.5 hover:bg-white/16 focus:outline-none focus:ring-2 focus:ring-sky-300/70 focus:ring-offset-2 focus:ring-offset-slate-900"
        >
          Access
          <span className="text-base transition-transform duration-300 group-hover:translate-x-0.5">+</span>
        </button>

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
            className="relative z-10 w-full max-w-md overflow-hidden rounded-[2rem] border border-white/15 bg-slate-900/95 p-6 text-left shadow-[0_30px_120px_rgba(0,0,0,0.65)] sm:p-8"
          >
            <div className="relative flex items-start justify-between gap-6">
              <div>
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
                  className="w-full rounded-2xl border border-white/20 bg-slate-950/40 px-4 py-4 text-center text-lg font-semibold tracking-[0.45em] text-stone-100 outline-none transition placeholder:text-stone-500 focus:border-sky-300/70 focus:ring-2 focus:ring-sky-300/25"
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
                className="relative inline-flex w-full items-center justify-center rounded-full border border-sky-300/20 bg-gradient-to-r from-sky-700 to-blue-800 px-5 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-stone-100 transition hover:brightness-110 disabled:cursor-wait disabled:opacity-90"
              >
                {status === 'loading' && (
                  <span className="mr-3 h-4 w-4 animate-spin rounded-full border-2 border-stone-300/25 border-t-stone-100" />
                )}
                {status === 'loading' ? 'Verifying access' : 'Continue'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}