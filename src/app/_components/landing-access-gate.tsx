'use client'

import Link from 'next/link'
import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'

import { validatePasscode } from '@/lib/api'
import { MESSAGES, PASSCODE_LENGTH, ROUTES } from '@/lib/constants'

const PASSCODE_PATTERN = /^[A-Z0-9]{6,8}$/
const KEYPAD_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'CLR', '0', 'DEL']

export default function LandingAccessGate() {
  const router = useRouter()
  const [isCodeEntryOpen, setIsCodeEntryOpen] = useState(false)
  const [passcode, setPasscode] = useState('')
  const [error, setError] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading'>('idle')

  const handleKeypadPress = (value: string) => {
    if (status === 'loading') {
      return
    }

    setError('')

    if (value === 'CLR') {
      setPasscode('')
      return
    }

    if (value === 'DEL') {
      setPasscode((previousValue) => previousValue.slice(0, -1))
      return
    }

    setPasscode((previousValue) => {
      if (previousValue.length >= 8) {
        return previousValue
      }

      return `${previousValue}${value}`
    })
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
      const params = new URLSearchParams({
        passcode: normalizedPasscode,
      })

      router.push(`${ROUTES.ONBOARDING}?${params.toString()}`)
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
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-2">
        <Link
          href={ROUTES.LOGIN}
          className="inline-flex items-center justify-center rounded-full border border-white/30 bg-black/35 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-100 transition hover:border-white/45 hover:bg-black/55"
        >
          Get a key
        </Link>

        <button
          type="button"
          onClick={() => {
            setIsCodeEntryOpen((currentValue) => !currentValue)
            setError('')
          }}
          className="inline-flex items-center justify-center rounded-full border border-sky-300/30 bg-sky-400/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-100 transition hover:border-sky-200/55 hover:bg-sky-300/15"
        >
          {isCodeEntryOpen ? 'Hide code panel' : 'Enter code'}
        </button>
      </div>

      {isCodeEntryOpen && (
        <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl border border-white/15 bg-black/35 p-5 backdrop-blur-md sm:p-6">
          <p className="text-xs uppercase tracking-[0.24em] text-stone-400">Guest entry</p>

          <div className="space-y-2">
            <input
              id="passcode"
              name="passcode"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              minLength={PASSCODE_LENGTH}
              maxLength={8}
              pattern="[A-Za-z0-9]{6,8}"
              placeholder="AB12CD"
              value={passcode}
              onChange={(event) => {
                const normalized = event.target.value.replace(/[^a-z0-9]/gi, '').toUpperCase()
                setPasscode(normalized)
                setError('')
              }}
              className="w-full rounded-2xl border border-white/20 bg-slate-950/50 px-4 py-3 text-center text-lg font-semibold tracking-[0.45em] text-stone-100 outline-none transition placeholder:text-stone-500 focus:border-sky-300/70 focus:ring-2 focus:ring-sky-300/25"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            {KEYPAD_KEYS.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => handleKeypadPress(key)}
                className="rounded-xl border border-white/15 bg-black/35 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-stone-200 transition hover:border-white/30 hover:bg-black/50"
              >
                {key}
              </button>
            ))}
          </div>

          {error && (
            <p className="rounded-2xl border border-[#b03d53]/35 bg-[#4d1421]/45 px-4 py-3 text-sm text-[#ffced5]">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={status !== 'idle'}
            className="inline-flex w-full items-center justify-center rounded-full border border-pink-300/25 bg-gradient-to-r from-pink-600/90 to-rose-700/90 px-5 py-2.5 font-[family:var(--font-display)] text-lg italic font-semibold tracking-wide text-stone-100 transition hover:brightness-110 disabled:cursor-wait disabled:opacity-80"
          >
            {status === 'loading' ? 'Calling upstairs...' : 'Request buzz-in'}
          </button>
        </form>
      )}
    </div>
  )
}