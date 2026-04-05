'use client'

import Link from 'next/link'
import { FormEvent, useEffect, useState } from 'react'

import TopQuickNav from '@/app/_components/top-quick-nav'
import { fetchMemberProfile, updateMemberProfile } from '@/lib/api'
import {
  GENDER_OPTIONS,
  INTEREST_TAG_OPTIONS,
  LOOKING_FOR_OPTIONS,
  ORIENTATION_OPTIONS,
  ROUTES,
} from '@/lib/constants'

type ProfileForm = {
  displayName: string
  avatarUrl: string
  city: string
  state: string
  country: string
  gender: string
  genderOther: string
  sexualOrientation: string
  orientationOther: string
  lookingFor: string[]
  interests: string[]
  bio: string
}

const EMPTY_FORM: ProfileForm = {
  displayName: '',
  avatarUrl: '',
  city: '',
  state: '',
  country: '',
  gender: '',
  genderOther: '',
  sexualOrientation: '',
  orientationOther: '',
  lookingFor: [],
  interests: [],
  bio: '',
}

function toggleArrayItem(arr: string[], item: string): string[] {
  return arr.includes(item) ? arr.filter((v) => v !== item) : [...arr, item]
}

export default function ProfilePage() {
  const [form, setForm] = useState<ProfileForm>(EMPTY_FORM)
  const [username, setUsername] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    let mounted = true

    async function load() {
      try {
        const response = await fetchMemberProfile()

        if (!mounted) return

        setUsername(response.user.username)
        setForm({
          displayName: response.user.displayName || '',
          avatarUrl: response.profile.avatarUrl || '',
          city: response.profile.city || '',
          state: response.profile.state || '',
          country: response.profile.country || '',
          gender: response.profile.gender || '',
          genderOther: response.profile.genderOther || '',
          sexualOrientation: response.profile.sexualOrientation || '',
          orientationOther: response.profile.orientationOther || '',
          lookingFor: response.profile.lookingFor || [],
          interests: response.profile.interests || [],
          bio: response.profile.bio || '',
        })
      } catch (err) {
        if (!mounted) return
        setError(err instanceof Error ? err.message : 'Unable to load profile.')
      } finally {
        if (mounted) setIsLoading(false)
      }
    }

    void load()

    return () => {
      mounted = false
    }
  }, [])

  function handleChange(key: keyof ProfileForm, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setError('')
    setMessage('')
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (isSaving) return

    setIsSaving(true)
    setError('')
    setMessage('')

    try {
      await updateMemberProfile({
        displayName: form.displayName,
        avatarUrl: form.avatarUrl || undefined,
        city: form.city,
        state: form.state || undefined,
        country: form.country || undefined,
        gender: form.gender,
        genderOther: form.genderOther || undefined,
        sexualOrientation: form.sexualOrientation,
        orientationOther: form.orientationOther || undefined,
        lookingFor: form.lookingFor,
        interests: form.interests,
        bio: form.bio || undefined,
      })
      setMessage('Profile saved.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save profile.')
    } finally {
      setIsSaving(false)
    }
  }

  const inputCls =
    'w-full rounded-xl border border-white/15 bg-black/35 px-4 py-3 text-sm text-stone-100 placeholder-stone-500 outline-none transition focus:border-white/35 focus:bg-black/50'

  const selectCls =
    'w-full rounded-xl border border-white/15 bg-black/35 px-4 py-3 text-sm text-stone-100 outline-none transition focus:border-white/35 focus:bg-black/50'

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#090b10] px-4 pb-8 pt-24 text-stone-100 sm:px-6 lg:px-8">
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat opacity-38"
        style={{ backgroundImage: "url('/welcome2.jpg')" }}
      />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(8,11,18,0.7)_0%,rgba(6,8,12,0.84)_100%)]" />

      <TopQuickNav className="left-4 right-4 md:left-6 md:right-6" />

      <div className="relative z-10 mx-auto max-w-3xl space-y-6">

        {/* Header */}
        <section className="rounded-3xl border border-white/10 bg-black/35 p-6 backdrop-blur-xl sm:p-8">
          <p className="text-xs uppercase tracking-[0.24em] text-stone-300/80">Profile</p>
          <h1 className="mt-3 font-[family:var(--font-display)] text-4xl text-stone-100 sm:text-5xl">
            {username ? `@${username}` : 'Your profile'}
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-stone-300">
            Update how other members see you in search and on your profile card.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href={ROUTES.DASHBOARD}
              className="rounded-xl border border-white/20 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-stone-100 transition hover:border-white/35 hover:bg-white/[0.1]"
            >
              Back to dashboard
            </Link>
            <Link
              href={ROUTES.SETTINGS}
              className="rounded-xl border border-white/20 px-4 py-2 text-sm text-stone-200 transition hover:border-white/35 hover:bg-white/[0.04] hover:text-white"
            >
              Settings
            </Link>
          </div>
        </section>

        {isLoading ? (
          <div className="rounded-3xl border border-white/10 bg-black/30 p-8 backdrop-blur-xl">
            <p className="text-sm text-stone-400">Loading your profile&hellip;</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Identity */}
            <section className="rounded-3xl border border-white/10 bg-black/30 p-6 backdrop-blur-xl sm:p-7">
              <p className="text-[10px] uppercase tracking-[0.22em] text-stone-400">Identity</p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-xs text-stone-400" htmlFor="displayName">
                    Display name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    id="displayName"
                    type="text"
                    value={form.displayName}
                    onChange={(e) => handleChange('displayName', e.target.value)}
                    placeholder="How you appear to other members"
                    required
                    className={inputCls}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-xs text-stone-400" htmlFor="avatarUrl">
                    Avatar URL
                  </label>
                  <input
                    id="avatarUrl"
                    type="url"
                    value={form.avatarUrl}
                    onChange={(e) => handleChange('avatarUrl', e.target.value)}
                    placeholder="https://…"
                    className={inputCls}
                  />
                </div>
              </div>
            </section>

            {/* Location */}
            <section className="rounded-3xl border border-white/10 bg-black/30 p-6 backdrop-blur-xl sm:p-7">
              <p className="text-[10px] uppercase tracking-[0.22em] text-stone-400">Location</p>
              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-1.5 block text-xs text-stone-400" htmlFor="city">
                    City <span className="text-rose-400">*</span>
                  </label>
                  <input
                    id="city"
                    type="text"
                    value={form.city}
                    onChange={(e) => handleChange('city', e.target.value)}
                    placeholder="City"
                    required
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs text-stone-400" htmlFor="state">
                    State / Province
                  </label>
                  <input
                    id="state"
                    type="text"
                    value={form.state}
                    onChange={(e) => handleChange('state', e.target.value)}
                    placeholder="State"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs text-stone-400" htmlFor="country">
                    Country
                  </label>
                  <input
                    id="country"
                    type="text"
                    value={form.country}
                    onChange={(e) => handleChange('country', e.target.value)}
                    placeholder="Country"
                    className={inputCls}
                  />
                </div>
              </div>
            </section>

            {/* Gender & orientation */}
            <section className="rounded-3xl border border-white/10 bg-black/30 p-6 backdrop-blur-xl sm:p-7">
              <p className="text-[10px] uppercase tracking-[0.22em] text-stone-400">Gender &amp; orientation</p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs text-stone-400" htmlFor="gender">
                    Gender <span className="text-rose-400">*</span>
                  </label>
                  <select
                    id="gender"
                    value={form.gender}
                    onChange={(e) => handleChange('gender', e.target.value)}
                    required
                    className={selectCls}
                  >
                    <option value="" disabled className="bg-[#0f121a]">Select…</option>
                    {GENDER_OPTIONS.map((opt) => (
                      <option key={opt} value={opt} className="bg-[#0f121a]">{opt}</option>
                    ))}
                  </select>
                </div>
                {form.gender === 'Other' && (
                  <div>
                    <label className="mb-1.5 block text-xs text-stone-400" htmlFor="genderOther">
                      Describe your gender <span className="text-rose-400">*</span>
                    </label>
                    <input
                      id="genderOther"
                      type="text"
                      value={form.genderOther}
                      onChange={(e) => handleChange('genderOther', e.target.value)}
                      required
                      className={inputCls}
                    />
                  </div>
                )}
                <div>
                  <label className="mb-1.5 block text-xs text-stone-400" htmlFor="sexualOrientation">
                    Sexual orientation <span className="text-rose-400">*</span>
                  </label>
                  <select
                    id="sexualOrientation"
                    value={form.sexualOrientation}
                    onChange={(e) => handleChange('sexualOrientation', e.target.value)}
                    required
                    className={selectCls}
                  >
                    <option value="" disabled className="bg-[#0f121a]">Select…</option>
                    {ORIENTATION_OPTIONS.map((opt) => (
                      <option key={opt} value={opt} className="bg-[#0f121a]">{opt}</option>
                    ))}
                  </select>
                </div>
                {form.sexualOrientation === 'Other' && (
                  <div>
                    <label className="mb-1.5 block text-xs text-stone-400" htmlFor="orientationOther">
                      Describe your orientation <span className="text-rose-400">*</span>
                    </label>
                    <input
                      id="orientationOther"
                      type="text"
                      value={form.orientationOther}
                      onChange={(e) => handleChange('orientationOther', e.target.value)}
                      required
                      className={inputCls}
                    />
                  </div>
                )}
              </div>
            </section>

            {/* Looking for */}
            <section className="rounded-3xl border border-white/10 bg-black/30 p-6 backdrop-blur-xl sm:p-7">
              <p className="text-[10px] uppercase tracking-[0.22em] text-stone-400">
                Looking for <span className="text-rose-400">*</span>
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {LOOKING_FOR_OPTIONS.map((opt) => {
                  const active = form.lookingFor.includes(opt)
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          lookingFor: toggleArrayItem(prev.lookingFor, opt),
                        }))
                      }
                      className={`rounded-full border px-4 py-1.5 text-xs font-medium transition ${
                        active
                          ? 'border-amber-400/40 bg-amber-400/[0.12] text-amber-300'
                          : 'border-white/15 bg-white/[0.03] text-stone-300 hover:border-white/25 hover:text-stone-100'
                      }`}
                    >
                      {opt}
                    </button>
                  )
                })}
              </div>
            </section>

            {/* Interests */}
            <section className="rounded-3xl border border-white/10 bg-black/30 p-6 backdrop-blur-xl sm:p-7">
              <p className="text-[10px] uppercase tracking-[0.22em] text-stone-400">Interests</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {INTEREST_TAG_OPTIONS.map((opt) => {
                  const active = form.interests.includes(opt)
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          interests: toggleArrayItem(prev.interests, opt),
                        }))
                      }
                      className={`rounded-full border px-4 py-1.5 text-xs font-medium transition ${
                        active
                          ? 'border-white/30 bg-white/[0.09] text-stone-100'
                          : 'border-white/10 bg-white/[0.02] text-stone-400 hover:border-white/20 hover:text-stone-300'
                      }`}
                    >
                      {opt}
                    </button>
                  )
                })}
              </div>
            </section>

            {/* Bio */}
            <section className="rounded-3xl border border-white/10 bg-black/30 p-6 backdrop-blur-xl sm:p-7">
              <p className="text-[10px] uppercase tracking-[0.22em] text-stone-400">About you</p>
              <div className="mt-4">
                <label className="mb-1.5 block text-xs text-stone-400" htmlFor="bio">Bio</label>
                <textarea
                  id="bio"
                  value={form.bio}
                  onChange={(e) => handleChange('bio', e.target.value)}
                  placeholder="Tell other members a little about yourself…"
                  rows={4}
                  className={`${inputCls} resize-none`}
                />
              </div>
            </section>

            {/* Feedback & save */}
            {error && (
              <p className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
                {error}
              </p>
            )}
            {message && (
              <p className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
                {message}
              </p>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="rounded-xl border border-white/20 bg-white/[0.06] px-6 py-3 text-sm font-semibold text-stone-100 transition hover:border-white/35 hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSaving ? 'Saving…' : 'Save profile'}
              </button>
            </div>

          </form>
        )}
      </div>
    </div>
  )
}