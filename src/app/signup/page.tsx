'use client'

import { useState, type FormEvent } from 'react'

const CP = "Copperplate, 'Copperplate Gothic Light', fantasy"

const inputCls =
  'w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-stone-100 outline-none placeholder:text-stone-600 focus:border-pink-400/40 focus:ring-1 focus:ring-pink-400/15 transition'

const submitCls =
  'w-full rounded-full border border-pink-300/20 bg-gradient-to-r from-pink-600/90 to-rose-700/90 py-3 text-sm tracking-wide text-stone-100 transition hover:brightness-110 disabled:opacity-60 disabled:cursor-wait'

export default function SignupPage() {
  const [firstName, setFirstName] = useState('')
  const [email, setEmail] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [error, setError] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent'>('idle')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const name = firstName.trim()
    const mail = email.trim().toLowerCase()
    const code = inviteCode.trim().toUpperCase()
    if (!name || !mail || !code) { setError('All fields are required.'); return }
    setStatus('loading')
    setError('')

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName: name, email: mail, inviteCode: code }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.')
        setStatus('idle')
        return
      }
      setStatus('sent')
    } catch {
      setError('Network error. Please try again.')
      setStatus('idle')
    }
  }

  return (
    <main className="min-h-screen bg-[#060304] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo / heading */}
        <div className="mb-8 text-center">
          <h1
            className="text-xl text-stone-200 tracking-[0.18em]"
            style={{ fontFamily: CP }}
          >
            request access
          </h1>
          <p
            className="mt-1 text-[9px] uppercase tracking-[0.22em] text-stone-600"
            style={{ fontFamily: CP }}
          >
            members only
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/55 px-8 py-8 backdrop-blur-md">
          {status === 'sent' ? (
            <div className="space-y-4 text-center">
              <p
                className="text-[9px] uppercase tracking-[0.28em] text-stone-500"
                style={{ fontFamily: CP }}
              >
                check your email
              </p>
              <p className="text-sm leading-relaxed text-stone-400" style={{ fontFamily: CP }}>
                We sent a verification link to{' '}
                <span className="text-pink-300">{email.trim().toLowerCase()}</span>.
                <br />
                Click it to receive your private login PIN.
              </p>
              <p
                className="text-[9px] leading-relaxed text-stone-600"
                style={{ fontFamily: CP }}
              >
                The link expires in 24 hours.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  className="block mb-1.5 text-[8px] uppercase tracking-[0.28em] text-stone-600"
                  style={{ fontFamily: CP }}
                  htmlFor="firstName"
                >
                  First name
                </label>
                <input
                  id="firstName"
                  type="text"
                  required
                  autoComplete="given-name"
                  autoFocus
                  value={firstName}
                  onChange={(e) => { setFirstName(e.target.value); setError('') }}
                  placeholder="your first name"
                  className={inputCls}
                  style={{ fontFamily: CP }}
                />
              </div>

              <div>
                <label
                  className="block mb-1.5 text-[8px] uppercase tracking-[0.28em] text-stone-600"
                  style={{ fontFamily: CP }}
                  htmlFor="inviteCode"
                >
                  Access code
                </label>
                <input
                  id="inviteCode"
                  type="text"
                  required
                  value={inviteCode}
                  onChange={(e) => { setInviteCode(e.target.value.toUpperCase()); setError('') }}
                  placeholder="enter your invite code"
                  className={inputCls}
                  style={{ fontFamily: CP }}
                />
              </div>

              <div>
                <label
                  className="block mb-1.5 text-[8px] uppercase tracking-[0.28em] text-stone-600"
                  style={{ fontFamily: CP }}
                  htmlFor="email"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError('') }}
                  placeholder="your@email.com"
                  className={inputCls}
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
                {status === 'loading' ? 'sending…' : 'send verification email'}
              </button>
            </form>
          )}
        </div>

        <p
          className="mt-6 text-center text-[9px] uppercase tracking-[0.22em] text-stone-600"
          style={{ fontFamily: CP }}
        >
          already have a pin?{' '}
          <a href="/welcome" className="text-pink-400/70 hover:text-pink-300 transition-colors">
            log in
          </a>
        </p>
      </div>
    </main>
  )
}
