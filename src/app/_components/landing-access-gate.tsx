'use client'

import Link from 'next/link'
import { useMemo, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'

import { validatePasscode } from '@/lib/api'
import { MESSAGES, MIN_AGE, PASSCODE_LENGTH, ROUTES } from '@/lib/constants'

const PASSCODE_PATTERN = /^[A-Z0-9]{6,8}$/
const KEYPAD_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'CLR', '0', 'DEL']

function formatDateInputValue(date: Date): string {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function isAtLeastMinimumAge(dateOfBirth: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) {
    return false
  }

  const dob = new Date(`${dateOfBirth}T00:00:00.000Z`)
  const today = new Date()
  let age = today.getUTCFullYear() - dob.getUTCFullYear()
  const monthDiff = today.getUTCMonth() - dob.getUTCMonth()
  const dayDiff = today.getUTCDate() - dob.getUTCDate()

  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age -= 1
  }

  return Number.isFinite(age) && age >= MIN_AGE
}

export default function LandingAccessGate() {
  const router = useRouter()
  const [isCodeEntryOpen, setIsCodeEntryOpen] = useState(false)
  const [passcode, setPasscode] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [error, setError] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading'>('idle')

  const maxBirthDate = useMemo(() => {
    const maxDate = new Date()
    maxDate.setUTCFullYear(maxDate.getUTCFullYear() - MIN_AGE)
    return formatDateInputValue(maxDate)
  }, [])

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

    if (!isAtLeastMinimumAge(dateOfBirth)) {
      setError(MESSAGES.INVALID_DATE_OF_BIRTH)
      return
    }

    setError('')
    setStatus('loading')

    try {
      await validatePasscode(normalizedPasscode)
      const params = new URLSearchParams({
        passcode: normalizedPasscode,
        dob: dateOfBirth,
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
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <Link
          href={ROUTES.LOGIN}
          className="inline-flex items-center justify-center rounded-full border border-white/30 bg-black/35 px-5 py-3 text-xs font-semibold uppercase tracking-[0.28em] text-stone-100 transition hover:border-white/45 hover:bg-black/55"
        >
          I have a key
        </Link>

        <button
          type="button"
          onClick={() => {
            setIsCodeEntryOpen((currentValue) => !currentValue)
            setError('')
          }}
          className="inline-flex items-center justify-center rounded-full border border-sky-300/30 bg-sky-400/10 px-5 py-3 text-xs font-semibold uppercase tracking-[0.28em] text-sky-100 transition hover:border-sky-200/55 hover:bg-sky-300/15"
        >
          {isCodeEntryOpen ? 'Hide code panel' : 'Enter code'}
        </button>
      </div>

      {isCodeEntryOpen && (
        <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl border border-white/15 bg-black/35 p-5 backdrop-blur-md sm:p-6">
          <p className="text-xs uppercase tracking-[0.24em] text-stone-400">Guest entry</p>

          <div className="space-y-2">
            <label htmlFor="passcode" className="block text-xs font-semibold uppercase tracking-[0.24em] text-stone-300">
              Building code
            </label>
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

          <div className="space-y-2">
            <label htmlFor="dateOfBirth" className="block text-xs font-semibold uppercase tracking-[0.24em] text-stone-300">
              Birthdate
            </label>
            <input
              id="dateOfBirth"
              name="dateOfBirth"
              type="date"
              required
              max={maxBirthDate}
              value={dateOfBirth}
              onChange={(event) => {
                setDateOfBirth(event.target.value)
                setError('')
              }}
              className="w-full rounded-2xl border border-white/20 bg-slate-950/50 px-4 py-3 text-sm text-stone-100 outline-none transition focus:border-sky-300/70 focus:ring-2 focus:ring-sky-300/25"
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
            className="inline-flex w-full items-center justify-center rounded-full border border-sky-300/25 bg-gradient-to-r from-sky-700/90 to-blue-800/90 px-5 py-3 text-xs font-semibold uppercase tracking-[0.24em] text-stone-100 transition hover:brightness-110 disabled:cursor-wait disabled:opacity-80"
          >
            {status === 'loading' ? 'Calling upstairs...' : 'Request buzz-in'}
          </button>
        </form>
      )}
    </div>
  )
}