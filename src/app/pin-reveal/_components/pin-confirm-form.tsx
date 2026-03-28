'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'

const CP = "Copperplate, 'Copperplate Gothic Light', fantasy"

const inputCls =
  'w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center text-sm text-stone-100 outline-none placeholder:text-stone-600 focus:border-pink-400/40 focus:ring-1 focus:ring-pink-400/15 transition'

const submitCls =
  'w-full rounded-full border border-pink-300/20 bg-gradient-to-r from-pink-600/90 to-rose-700/90 py-3 text-sm tracking-wide text-stone-100 transition hover:brightness-110 disabled:opacity-60 disabled:cursor-wait'

export default function PinConfirmForm({
  expectedPin,
  expectedFirstName,
}: {
  expectedPin: string
  expectedFirstName: string
}) {
  const router = useRouter()
  const [pin, setPin] = useState('')
  const [firstName, setFirstName] = useState('')
  const [error, setError] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'done'>('idle')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setStatus('loading')
    setError('')

    try {
      const res = await fetch('/api/auth/confirm-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pin.trim(), firstName: firstName.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Could not confirm. Please try again.')
        setStatus('idle')
        return
      }
      setStatus('done')
      router.push('/welcome')
    } catch {
      setError('Network error. Please try again.')
      setStatus('idle')
    }
  }

  if (status === 'done') {
    return (
      <p className="text-center text-sm text-stone-400" style={{ fontFamily: CP }}>
        confirmed — redirecting…
      </p>
    )
  }

  // Hint: show first letter of the expected values so user can verify
  const pinHint = expectedPin.slice(0, 1) + '···'
  const nameHint = expectedFirstName.charAt(0).toUpperCase() + '…'

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p
        className="text-center text-[9px] uppercase tracking-[0.24em] text-stone-500"
        style={{ fontFamily: CP }}
      >
        confirm you wrote it down
      </p>

      <div>
        <label
          className="block mb-1 text-[8px] uppercase tracking-[0.28em] text-stone-600"
          style={{ fontFamily: CP }}
          htmlFor="confirmFirstName"
        >
          First name
        </label>
        <input
          id="confirmFirstName"
          type="text"
          required
          autoComplete="off"
          autoFocus
          value={firstName}
          onChange={(e) => { setFirstName(e.target.value); setError('') }}
          placeholder={nameHint}
          className={inputCls}
          style={{ fontFamily: CP }}
        />
      </div>

      <div>
        <label
          className="block mb-1 text-[8px] uppercase tracking-[0.28em] text-stone-600"
          style={{ fontFamily: CP }}
          htmlFor="confirmPin"
        >
          PIN
        </label>
        <input
          id="confirmPin"
          type="text"
          inputMode="numeric"
          required
          maxLength={4}
          autoComplete="off"
          value={pin}
          onChange={(e) => { setPin(e.target.value.replace(/\D/g, '').slice(0, 4)); setError('') }}
          placeholder={pinHint}
          className={inputCls + ' tracking-[0.5em]'}
          style={{ fontFamily: CP }}
        />
      </div>

      {error && (
        <p className="rounded-xl border border-rose-500/25 bg-rose-950/50 px-3 py-2 text-center text-[10px] text-rose-300">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={status !== 'idle'}
        className={submitCls}
        style={{ fontFamily: CP }}
      >
        {status === 'loading' ? 'confirming…' : "i've saved my PIN"}
      </button>
    </form>
  )
}
