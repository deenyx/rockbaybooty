'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'

import { NEW_MEMBER_PIN } from '@/lib/constants'

type Stage = 'entry' | 'member-confirm'

type MembersGateProps = {
  initialError?: string
  returnTo?: string
  verified?: boolean
}

const CP = "Copperplate, 'Copperplate Gothic Light', fantasy"

// ── Shared styles ──────────────────────────────────────────────────────────────

const inputCls =
  'w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-center text-sm text-stone-100 outline-none placeholder:text-stone-600 focus:border-pink-400/40 focus:ring-1 focus:ring-pink-400/15 transition'

const submitCls =
  'w-full rounded-full border border-pink-300/20 bg-gradient-to-r from-pink-600/90 to-rose-700/90 py-2.5 text-sm tracking-wide text-stone-100 transition hover:brightness-110 disabled:opacity-60 disabled:cursor-wait'

const backCls =
  'text-[9px] uppercase tracking-[0.22em] text-stone-600 hover:text-stone-400 transition-colors'

function fieldLabel(text: string, color: string = 'text-stone-600') {
  return (
    <span
      className={`block text-center text-[8px] uppercase tracking-[0.28em] ${color} mb-1`}
      style={{ fontFamily: CP }}
    >
      {text}
    </span>
  )
}

// ── Keypad SVG icon ────────────────────────────────────────────────────────────

function KeypadIcon() {
  return (
    <svg
      width="36"
      height="36"
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {[
        [6, 6], [18, 6], [30, 6],
        [6, 15], [18, 15], [30, 15],
        [6, 24], [18, 24], [30, 24],
        [18, 33],
      ].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="2.5" fill="currentColor" opacity="0.7" />
      ))}
    </svg>
  )
}

// ── Error display ──────────────────────────────────────────────────────────────

function ErrorMsg({ msg }: { msg: string }) {
  return (
    <p className="rounded-xl border border-rose-500/25 bg-rose-950/50 px-3 py-2 text-center text-[10px] text-rose-300">
      {msg}
    </p>
  )
}

// ── Hint message (green for PIN hint) ──────────────────────────────────────────

function HintMsg({ msg }: { msg: string }) {
  return (
    <p
      className="text-center text-[8px] uppercase tracking-[0.24em] text-green-400"
      style={{ fontFamily: CP }}
    >
      {msg}
    </p>
  )
}

// ── Stage: Entry — PIN input ───────────────────────────────────────────────────

function EntryStage({
  pin,
  onPinChange,
  error,
  wrongAttempts,
  verified,
}: {
  pin: string
  onPinChange: (v: string) => void
  error: string
  wrongAttempts: number
  verified: boolean
}) {
  return (
    <div className="space-y-4">
      <div>
        {fieldLabel('Enter Pin', 'text-yellow-400')}
        <input
          type="password"
          inputMode="numeric"
          maxLength={4}
          autoFocus
          value={pin}
          onChange={(e) => onPinChange(e.target.value)}
          placeholder="····"
          className={inputCls + ' text-xl tracking-[0.5em]'}
          style={{ fontFamily: CP }}
        />
      </div>

      {error && <ErrorMsg msg={error} />}

      {verified && !error && (
        <HintMsg msg={`email verified. enter ${NEW_MEMBER_PIN}, then your name`} />
      )}

      {wrongAttempts >= 2 && (
        <HintMsg msg="enter 0000 to sign up" />
      )}
    </div>
  )
}

// ── Stage: Member confirm — enter first name to log in ────────────────────────

function MemberConfirmStage({
  firstName,
  onFirstNameChange,
  onSubmit,
  onBack,
  status,
  error,
}: {
  firstName: string
  onFirstNameChange: (v: string) => void
  onSubmit: (e: FormEvent) => void
  onBack: () => void
  status: 'idle' | 'loading'
  error: string
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <p
        className="text-center text-[9px] uppercase tracking-[0.24em] text-stone-500"
        style={{ fontFamily: CP }}
      >
        welcome back
      </p>

      <div>
        {fieldLabel('Name')}
        <input
          type="text"
          required
          autoComplete="name"
          autoFocus
          value={firstName}
          onChange={(e) => onFirstNameChange(e.target.value)}
          placeholder="what name?"
          className={inputCls}
          style={{ fontFamily: CP }}
        />
      </div>

      {error && <ErrorMsg msg={error} />}

      <button
        type="submit"
        disabled={status !== 'idle'}
        className={submitCls}
        style={{ fontFamily: CP }}
      >
        {status === 'loading' ? 'entering…' : 'enter'}
      </button>

      <div className="text-center">
        <button type="button" onClick={onBack} className={backCls} style={{ fontFamily: CP }}>
          ← back
        </button>
      </div>
    </form>
  )
}

// ── Root component ─────────────────────────────────────────────────────────────

export default function MembersGate({ initialError = '', returnTo = '/dashboard', verified = false }: MembersGateProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [stage, setStage] = useState<Stage>('entry')
  const [pin, setPin] = useState('')
  const [firstName, setFirstName] = useState('')
  const [error, setError] = useState(initialError)
  const [status, setStatus] = useState<'idle' | 'loading'>('idle')
  const [wrongAttempts, setWrongAttempts] = useState(0)

  function reset() {
    setStage('entry')
    setPin('')
    setFirstName('')
    setError('')
    setStatus('idle')
    setWrongAttempts(0)
  }

  function toggleOpen() {
    if (isOpen) reset()
    setIsOpen((v) => !v)
  }

  function handlePinChange(value: string) {
    const cleaned = value.replace(/\D/g, '').slice(0, 4)
    setPin(cleaned)
    setError('')

    if (cleaned.length === 4) {
      if (cleaned === '0000') {
        // Reserved: send to signup flow
        globalThis.location.assign('/signup')
        return
      }

      if (cleaned === '9999') {
        void loginWithPasscodeOnly(cleaned)
        return
      }

      setStage('member-confirm')
    } else {
      setStage('entry')
    }
  }

  async function loginWithPasscodeOnly(passcode: string) {
    setStatus('loading')
    setError('')

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode, returnTo }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Could not log in. Please try again.')
        setStatus('idle')
        return
      }

      router.push(data.returnTo || '/dashboard')
    } catch {
      setError('Network error. Please try again.')
      setStatus('idle')
    }
  }

  async function handleLogin(e: FormEvent) {
    e.preventDefault()
    const name = firstName.trim()
    if (!name) { setError('Please enter your first name.'); return }
    setStatus('loading')
    setError('')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin, name, returnTo }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'PIN or name not recognised.')
        setWrongAttempts((prev) => prev + 1)
        setStatus('idle')
        return
      }
      router.push(data.returnTo || '/dashboard')
    } catch {
      setError('Network error. Please try again.')
      setStatus('idle')
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Keypad icon trigger */}
      <button
        type="button"
        onClick={toggleOpen}
        aria-label={isOpen ? 'Close login panel' : 'Open login panel'}
        className="text-stone-400 opacity-50 transition hover:opacity-80"
      >
        <KeypadIcon />
      </button>

      {/* Accordion panel */}
      {isOpen && (
        <div className="w-[260px] rounded-2xl border border-white/10 bg-black/55 px-6 py-6 backdrop-blur-md">
          {stage === 'entry' && (
            <EntryStage
              pin={pin}
              onPinChange={handlePinChange}
              error={error}
              wrongAttempts={wrongAttempts}
              verified={verified}
            />
          )}
          {stage === 'member-confirm' && (
            <MemberConfirmStage
              firstName={firstName}
              onFirstNameChange={setFirstName}
              onSubmit={handleLogin}
              onBack={() => { reset() }}
              status={status}
              error={error}
            />
          )}
        </div>
      )}
    </div>
  )
}
