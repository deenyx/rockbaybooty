'use client'

import Link from 'next/link'
import { useMemo, useState, type FormEvent } from 'react'

import { onboard } from '@/lib/api'
import {
  GENDER_OPTIONS,
  INTEREST_TAG_OPTIONS,
  KINK_OPTIONS,
  LOOKING_FOR_OPTIONS,
  MIN_AGE,
  ORIENTATION_OPTIONS,
  ROUTES,
} from '@/lib/constants'

type FormState = {
  displayName: string
  username: string
  email: string
  password: string
  dateOfBirth: string
  city: string
  state: string
  country: string
  gender: string
  genderOther: string
  sexualOrientation: string
  orientationOther: string
  bio: string
  avatarUrl: string
  adultContentConfirmed: boolean
}

type OnboardingClientProps = {
  passcode: string
  quickJoin: boolean
}

const INITIAL_FORM: FormState = {
  displayName: '',
  username: '',
  email: '',
  password: '',
  dateOfBirth: '',
  city: '',
  state: '',
  country: '',
  gender: '',
  genderOther: '',
  sexualOrientation: '',
  orientationOther: '',
  bio: '',
  avatarUrl: '',
  adultContentConfirmed: false,
}

const CP = "Copperplate, 'Copperplate Gothic Light', fantasy"

export default function OnboardingClient({ passcode, quickJoin }: OnboardingClientProps) {
  const [form, setForm] = useState<FormState>(INITIAL_FORM)
  const [lookingFor, setLookingFor] = useState<string[]>([])
  const [interests, setInterests] = useState<string[]>([])
  const [kinks, setKinks] = useState<string[]>([])
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle')
  const [error, setError] = useState('')
  const [personalCode, setPersonalCode] = useState('')

  const maxDob = useMemo(() => {
    const now = new Date()
    now.setFullYear(now.getFullYear() - MIN_AGE)
    return now.toISOString().split('T')[0]
  }, [])

  const toggleFromList = (
    value: string,
    values: string[],
    setter: (next: string[]) => void,
    maxSelections?: number
  ) => {
    const hasValue = values.includes(value)

    if (hasValue) {
      setter(values.filter((entry) => entry !== value))
      return
    }

    if (typeof maxSelections === 'number' && values.length >= maxSelections) {
      return
    }

    setter([...values, value])
  }

  const handleFieldChange = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }))
    setError('')
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (lookingFor.length === 0) {
      setError('Choose at least one Looking For option.')
      return
    }

    if (kinks.length === 0) {
      setError('Choose at least one kink.')
      return
    }

    setStatus('loading')
    setError('')

    try {
      const result = await onboard({
        passcode: passcode || undefined,
        displayName: form.displayName,
        username: form.username,
        email: form.email || undefined,
        password: form.password,
        dateOfBirth: form.dateOfBirth,
        city: form.city,
        state: form.state || undefined,
        country: form.country || undefined,
        gender: form.gender,
        genderOther: form.genderOther || undefined,
        sexualOrientation: form.sexualOrientation,
        orientationOther: form.orientationOther || undefined,
        lookingFor,
        bio: form.bio || undefined,
        interests,
        kinks,
        avatarUrl: form.avatarUrl || undefined,
        adultContentConfirmed: form.adultContentConfirmed,
      })

      setPersonalCode(result.personalCode)
      setStatus('success')
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Could not complete onboarding.')
      setStatus('idle')
    }
  }

  if (status === 'success') {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center px-4 py-10 text-stone-100">
        <div className="w-full rounded-3xl border border-emerald-300/25 bg-emerald-500/10 p-8 text-center shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur">
          <p className="text-xs uppercase tracking-[0.28em] text-emerald-100/80" style={{ fontFamily: CP }}>
            Onboarding Complete
          </p>
          <h1 className="mt-3 text-3xl font-semibold">Your account is ready</h1>
          <p className="mt-4 text-sm text-emerald-100/90">Keep this personal code safe.</p>
          <p className="mt-3 text-2xl tracking-[0.28em] text-emerald-100">{personalCode}</p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={ROUTES.DASHBOARD}
              className="inline-flex items-center justify-center rounded-full border border-emerald-200/45 bg-emerald-300/20 px-5 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-50 transition hover:bg-emerald-300/30"
            >
              Enter Dashboard
            </Link>
            <Link
              href={ROUTES.LOGIN}
              className="inline-flex items-center justify-center rounded-full border border-white/20 px-5 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-stone-100 transition hover:bg-white/10"
            >
              Go To Login
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-slate-950 px-4 py-10 text-stone-100">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_15%,rgba(56,189,248,0.18),transparent_35%),radial-gradient(circle_at_85%_10%,rgba(244,114,182,0.2),transparent_30%),radial-gradient(circle_at_50%_90%,rgba(34,197,94,0.12),transparent_40%)]" />

      <div className="mx-auto w-full max-w-3xl rounded-3xl border border-white/10 bg-black/35 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur sm:p-8">
        <p className="text-xs uppercase tracking-[0.28em] text-stone-400" style={{ fontFamily: CP }}>
          Complete Your Profile
        </p>
        <h1 className="mt-2 text-3xl font-semibold">Onboarding</h1>

        {(passcode || quickJoin) && (
          <p className="mt-3 rounded-xl border border-sky-300/30 bg-sky-500/10 px-3 py-2 text-xs text-sky-100">
            Access mode: {quickJoin ? 'Quick join' : 'Passcode'} {passcode ? `(${passcode})` : ''}
          </p>
        )}

        <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1">
              <span className="text-xs uppercase tracking-[0.16em] text-stone-400">Display Name</span>
              <input
                required
                value={form.displayName}
                onChange={(event) => handleFieldChange('displayName', event.target.value)}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
              />
            </label>

            <label className="grid gap-1">
              <span className="text-xs uppercase tracking-[0.16em] text-stone-400">User ID</span>
              <input
                required
                pattern="[A-Za-z0-9_]{3,20}"
                value={form.username}
                onChange={(event) => handleFieldChange('username', event.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
              />
            </label>

            <label className="grid gap-1">
              <span className="text-xs uppercase tracking-[0.16em] text-stone-400">Email (optional)</span>
              <input
                type="email"
                value={form.email}
                onChange={(event) => handleFieldChange('email', event.target.value)}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
              />
            </label>

            <label className="grid gap-1">
              <span className="text-xs uppercase tracking-[0.16em] text-stone-400">Password</span>
              <input
                required
                minLength={8}
                type="password"
                value={form.password}
                onChange={(event) => handleFieldChange('password', event.target.value)}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
              />
            </label>

            <label className="grid gap-1">
              <span className="text-xs uppercase tracking-[0.16em] text-stone-400">Date Of Birth</span>
              <input
                required
                type="date"
                max={maxDob}
                value={form.dateOfBirth}
                onChange={(event) => handleFieldChange('dateOfBirth', event.target.value)}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
              />
            </label>

            <label className="grid gap-1">
              <span className="text-xs uppercase tracking-[0.16em] text-stone-400">City</span>
              <input
                required
                value={form.city}
                onChange={(event) => handleFieldChange('city', event.target.value)}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
              />
            </label>

            <label className="grid gap-1">
              <span className="text-xs uppercase tracking-[0.16em] text-stone-400">State</span>
              <input
                value={form.state}
                onChange={(event) => handleFieldChange('state', event.target.value)}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
              />
            </label>

            <label className="grid gap-1">
              <span className="text-xs uppercase tracking-[0.16em] text-stone-400">Country</span>
              <input
                value={form.country}
                onChange={(event) => handleFieldChange('country', event.target.value)}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
              />
            </label>

            <label className="grid gap-1">
              <span className="text-xs uppercase tracking-[0.16em] text-stone-400">Gender</span>
              <select
                required
                value={form.gender}
                onChange={(event) => handleFieldChange('gender', event.target.value)}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
              >
                <option value="">Select</option>
                {GENDER_OPTIONS.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </label>

            <label className="grid gap-1">
              <span className="text-xs uppercase tracking-[0.16em] text-stone-400">Orientation</span>
              <select
                required
                value={form.sexualOrientation}
                onChange={(event) => handleFieldChange('sexualOrientation', event.target.value)}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
              >
                <option value="">Select</option>
                {ORIENTATION_OPTIONS.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </label>

            {form.gender === 'Other' && (
              <label className="grid gap-1 sm:col-span-2">
                <span className="text-xs uppercase tracking-[0.16em] text-stone-400">Gender (Other)</span>
                <input
                  required
                  value={form.genderOther}
                  onChange={(event) => handleFieldChange('genderOther', event.target.value)}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
                />
              </label>
            )}

            {form.sexualOrientation === 'Other' && (
              <label className="grid gap-1 sm:col-span-2">
                <span className="text-xs uppercase tracking-[0.16em] text-stone-400">Orientation (Other)</span>
                <input
                  required
                  value={form.orientationOther}
                  onChange={(event) => handleFieldChange('orientationOther', event.target.value)}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
                />
              </label>
            )}

            <label className="grid gap-1 sm:col-span-2">
              <span className="text-xs uppercase tracking-[0.16em] text-stone-400">Avatar URL (optional)</span>
              <input
                type="url"
                value={form.avatarUrl}
                onChange={(event) => handleFieldChange('avatarUrl', event.target.value)}
                placeholder="https://..."
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
              />
            </label>
          </div>

          <fieldset className="grid gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-3">
            <legend className="px-1 text-xs uppercase tracking-[0.16em] text-stone-400">Looking For (pick up to 3)</legend>
            <div className="flex flex-wrap gap-2">
              {LOOKING_FOR_OPTIONS.map((option) => {
                const selected = lookingFor.includes(option)

                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => toggleFromList(option, lookingFor, setLookingFor, 3)}
                    className={`rounded-full border px-3 py-1 text-xs transition ${selected ? 'border-sky-300/70 bg-sky-400/20 text-sky-100' : 'border-white/15 bg-white/5 text-stone-300 hover:bg-white/10'}`}
                  >
                    {option}
                  </button>
                )
              })}
            </div>
          </fieldset>

          <fieldset className="grid gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-3">
            <legend className="px-1 text-xs uppercase tracking-[0.16em] text-stone-400">Interests (optional)</legend>
            <div className="flex flex-wrap gap-2">
              {INTEREST_TAG_OPTIONS.map((option) => {
                const selected = interests.includes(option)

                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => toggleFromList(option, interests, setInterests)}
                    className={`rounded-full border px-3 py-1 text-xs transition ${selected ? 'border-emerald-300/70 bg-emerald-400/20 text-emerald-100' : 'border-white/15 bg-white/5 text-stone-300 hover:bg-white/10'}`}
                  >
                    {option}
                  </button>
                )
              })}
            </div>
          </fieldset>

          <fieldset className="grid gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-3">
            <legend className="px-1 text-xs uppercase tracking-[0.16em] text-stone-400">Kinks (pick at least 1)</legend>
            <div className="flex flex-wrap gap-2">
              {KINK_OPTIONS.map((option) => {
                const selected = kinks.includes(option)

                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => toggleFromList(option, kinks, setKinks)}
                    className={`rounded-full border px-3 py-1 text-xs transition ${selected ? 'border-fuchsia-300/70 bg-fuchsia-400/20 text-fuchsia-100' : 'border-white/15 bg-white/5 text-stone-300 hover:bg-white/10'}`}
                  >
                    {option}
                  </button>
                )
              })}
            </div>
          </fieldset>

          <label className="grid gap-1">
            <span className="text-xs uppercase tracking-[0.16em] text-stone-400">Bio (optional)</span>
            <textarea
              value={form.bio}
              onChange={(event) => handleFieldChange('bio', event.target.value)}
              rows={4}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
            />
          </label>

          <label className="inline-flex items-center gap-2 text-xs text-stone-200">
            <input
              required
              type="checkbox"
              checked={form.adultContentConfirmed}
              onChange={(event) => handleFieldChange('adultContentConfirmed', event.target.checked)}
              className="h-4 w-4 rounded border-white/20 bg-white/10"
            />
            I confirm I am an adult and consent to viewing adult-oriented content.
          </label>

          {error && (
            <p className="rounded-xl border border-rose-500/30 bg-rose-950/40 px-3 py-2 text-sm text-rose-200">
              {error}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={status === 'loading'}
              className="inline-flex items-center justify-center rounded-full border border-sky-300/25 bg-gradient-to-r from-sky-500/90 to-indigo-600/90 px-5 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white transition hover:brightness-110 disabled:cursor-wait disabled:opacity-70"
            >
              {status === 'loading' ? 'Submitting...' : 'Finish Onboarding'}
            </button>
            <Link href={ROUTES.WELCOME} className="text-xs uppercase tracking-[0.16em] text-stone-300 hover:text-white">
              Back
            </Link>
          </div>
        </form>
      </div>
    </main>
  )
}