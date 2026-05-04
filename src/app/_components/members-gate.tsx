'use client'

import Link from 'next/link'
import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'

import { validatePasscode } from '@/lib/api'
import {
  MESSAGES,
  PASSCODE_LENGTH,
  QUICK_JOIN_PIN,
  QUICK_JOIN_QUERY_PARAM,
  ROUTES,
} from '@/lib/constants'

type MembersGateProps = {
  initialError?: string
  returnTo?: string
  verified?: boolean
}

const CP = "Copperplate, 'Copperplate Gothic Light', fantasy"
const PASSCODE_PATTERN = /^[A-Z0-9]{6,8}$/

const cardCls =
  'w-[min(92vw,34rem)] rounded-[1.8rem] border border-white/15 bg-black/45 p-5 backdrop-blur-md sm:p-6'

const inputCls =
  'w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-stone-100 outline-none placeholder:text-stone-500 focus:border-sky-300/60 focus:ring-1 focus:ring-sky-300/20 transition'

const actionButtonCls =
  'inline-flex w-full items-center justify-center rounded-full border border-sky-300/25 bg-gradient-to-r from-sky-500/90 to-indigo-600/90 px-4 py-2.5 text-sm font-semibold tracking-[0.04em] text-white transition hover:brightness-110 disabled:cursor-wait disabled:opacity-70'

function ErrorMessage({ message }: { message: string }) {
  return (
    <p className="rounded-xl border border-rose-500/30 bg-rose-950/40 px-3 py-2 text-center text-xs text-rose-200">
      {message}
    </p>
  )
}

export default function MembersGate({ initialError = '' }: MembersGateProps) {
  const router = useRouter()

  const [identity, setIdentity] = useState('')
  const [passcode, setPasscode] = useState('')
  const [quickPin, setQuickPin] = useState('')
  const [error, setError] = useState(initialError)
  const [quickPinError, setQuickPinError] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading'>('idle')

  const handlePrimarySubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const normalizedIdentity = identity.trim()
    const normalizedPasscode = passcode.replace(/[^a-z0-9]/gi, '').toUpperCase()

    setPasscode(normalizedPasscode)

    if (!normalizedIdentity) {
      setError('Name or User ID is required')
      return
    }

    if (!PASSCODE_PATTERN.test(normalizedPasscode) || normalizedPasscode.length < PASSCODE_LENGTH) {
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
    } catch (submitError) {
      setError(
        submitError instanceof Error && submitError.message
          ? submitError.message
          : MESSAGES.PASSCODE_GATE_INVALID
      )
      setStatus('idle')
    }
  }

  const handleQuickPinSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const cleanedPin = quickPin.replace(/\D/g, '')
    setQuickPin(cleanedPin)

    if (cleanedPin.length !== 4) {
      setQuickPinError('PIN must be exactly 4 digits')
      return
    }

    if (cleanedPin !== QUICK_JOIN_PIN) {
      setQuickPinError('Invalid PIN')
      return
    }

    setQuickPinError('')

    const params = new URLSearchParams({
      [QUICK_JOIN_QUERY_PARAM]: '1',
      pin: QUICK_JOIN_PIN,
    })

    router.push(`${ROUTES.ONBOARDING}?${params.toString()}`)
  }

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.2em] text-stone-300">
        <Link href={ROUTES.LOGIN} className="hover:text-white transition-colors">Log In</Link>
        <span className="text-stone-500">•</span>
        <Link href={ROUTES.SIGNUP} className="hover:text-white transition-colors">Sign Up</Link>
      </div>

      <div className={cardCls}>
        <div className="grid gap-5 sm:grid-cols-[1.4fr_1fr]">
          <form onSubmit={handlePrimarySubmit} className="space-y-3">
            <p className="text-[10px] uppercase tracking-[0.24em] text-stone-400" style={{ fontFamily: CP }}>
              Member Login
            </p>

              <label className="space-y-1">
                <span className="block text-[9px] uppercase tracking-[0.22em] text-stone-500" style={{ fontFamily: CP }}>
                  Name / User ID
                </span>
                <input
                  type="text"
                  autoComplete="username"
                  value={identity}
                  onChange={(event) => {
                    setIdentity(event.target.value)
                    setError('')
                  }}
                  placeholder="your name or userid"
                  className={inputCls}
                />
              </label>

              <label className="space-y-1">
                <span className="block text-[9px] uppercase tracking-[0.22em] text-stone-500" style={{ fontFamily: CP }}>
                  Passcode / Password
                </span>
                <input
                  type="text"
                  inputMode="text"
                  autoComplete="one-time-code"
                  maxLength={8}
                  value={passcode}
                  onChange={(event) => {
                    const normalized = event.target.value.replace(/[^a-z0-9]/gi, '').toUpperCase()
                    setPasscode(normalized)
                    setError('')
                  }}
                  placeholder="AB12CD"
                  className={inputCls + ' text-center tracking-[0.2em]'}
                />
              </label>

              {error && <ErrorMessage message={error} />}

            <button type="submit" disabled={status !== 'idle'} className={actionButtonCls}>
              {status === 'loading' ? 'Checking...' : 'Continue to onboarding'}
            </button>
          </form>

          <form onSubmit={handleQuickPinSubmit} className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.02] p-3">
            <p className="text-[10px] uppercase tracking-[0.2em] text-stone-400" style={{ fontFamily: CP }}>
              I have PIN
            </p>

            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={quickPin}
              onChange={(event) => {
                setQuickPin(event.target.value.replace(/\D/g, '').slice(0, 4))
                setQuickPinError('')
              }}
              placeholder="0000"
              className={inputCls + ' text-center text-base tracking-[0.45em]'}
            />

            {quickPinError && <ErrorMessage message={quickPinError} />}

            <button
              type="submit"
              className="inline-flex w-full items-center justify-center rounded-full border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-stone-100 transition hover:bg-white/15"
            >
              Quick join
            </button>

            <p className="text-center text-[9px] uppercase tracking-[0.18em] text-stone-500" style={{ fontFamily: CP }}>
              Temporary PIN: {QUICK_JOIN_PIN}
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
