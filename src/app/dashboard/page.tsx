'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

import { fetchMemberProfile, updateMemberProfile } from '@/lib/api'
import {
  GENDER_OPTIONS,
  INTEREST_TAG_OPTIONS,
  LOOKING_FOR_OPTIONS,
  ORIENTATION_OPTIONS,
  ROUTES,
} from '@/lib/constants'
import type { MemberProfileResponse } from '@/lib/types'

type DraftProfile = {
  displayName: string
  city: string
  state: string
  country: string
  gender: string
  genderOther: string
  sexualOrientation: string
  orientationOther: string
  lookingFor: string[]
  bio: string
  interests: string[]
  avatarUrl: string
}

const NAV_ITEMS = [
  { label: 'Profile', href: ROUTES.PROFILE },
  { label: 'Search', href: ROUTES.SEARCH },
  { label: 'Messages', href: ROUTES.CHAT },
  { label: 'Groups', href: ROUTES.GROUPS },
  { label: 'Classifieds', href: ROUTES.CLASSIFIEDS },
]

const NEARBY_PLACEHOLDERS = [
  { name: 'Morgan, 29', city: 'Victoria', tags: ['Coffee', 'Conversation'] },
  { name: 'Jules, 34', city: 'Nanaimo', tags: ['Outdoors', 'Late-night chats'] },
  { name: 'Sky, 27', city: 'Saanich', tags: ['Kink-aware', 'Art nights'] },
  { name: 'Avery, 31', city: 'Esquimalt', tags: ['Long walks', 'Music'] },
]

function maskPersonalCode(code: string) {
  if (code.length < 4) {
    return '********'
  }

  return `${code.slice(0, 2)}****${code.slice(-2)}`
}

function buildDraft(data: MemberProfileResponse): DraftProfile {
  return {
    displayName: data.user.displayName,
    city: data.profile.city,
    state: data.profile.state,
    country: data.profile.country,
    gender: data.profile.gender,
    genderOther: data.profile.genderOther,
    sexualOrientation: data.profile.sexualOrientation,
    orientationOther: data.profile.orientationOther,
    lookingFor: data.profile.lookingFor,
    bio: data.profile.bio,
    interests: data.profile.interests,
    avatarUrl: data.profile.avatarUrl,
  }
}

function textInitials(value: string) {
  return value
    .split(' ')
    .map((part) => part.trim()[0])
    .filter(Boolean)
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export default function Dashboard() {
  const pathname = usePathname()
  const router = useRouter()

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [profileData, setProfileData] = useState<MemberProfileResponse | null>(null)
  const [draft, setDraft] = useState<DraftProfile | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const locationLabel = useMemo(() => {
    if (!profileData) {
      return ''
    }

    return [
      profileData.profile.city,
      profileData.profile.state,
      profileData.profile.country,
    ]
      .filter(Boolean)
      .join(', ')
  }, [profileData])

  useEffect(() => {
    let mounted = true

    const loadProfile = async () => {
      try {
        setIsLoading(true)
        const response = await fetchMemberProfile()

        if (!mounted) {
          return
        }

        setProfileData(response)
        setDraft(buildDraft(response))
      } catch (error) {
        if (!mounted) {
          return
        }

        setLoadError(
          error instanceof Error && error.message
            ? error.message
            : 'Unable to load your dashboard right now.'
        )
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    loadProfile()

    return () => {
      mounted = false
    }
  }, [])

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.replace(ROUTES.LOGIN)
  }

  const toggleMultiSelect = (
    key: 'lookingFor' | 'interests',
    value: string
  ) => {
    if (!draft) {
      return
    }

    const isSelected = draft[key].includes(value)
    const nextValues = isSelected
      ? draft[key].filter((item) => item !== value)
      : [...draft[key], value]

    setDraft({
      ...draft,
      [key]: nextValues,
    })
  }

  const submitProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!draft) {
      return
    }

    setSubmitError('')

    if (!draft.displayName || !draft.city || !draft.gender || !draft.sexualOrientation) {
      setSubmitError('Display name, city, gender, and orientation are required.')
      return
    }

    if (draft.lookingFor.length === 0) {
      setSubmitError('Please choose at least one Looking For option.')
      return
    }

    if (draft.gender === 'Other' && !draft.genderOther.trim()) {
      setSubmitError('Please provide your custom gender value.')
      return
    }

    if (draft.sexualOrientation === 'Other' && !draft.orientationOther.trim()) {
      setSubmitError('Please provide your custom orientation value.')
      return
    }

    try {
      setIsSaving(true)
      const response = await updateMemberProfile({
        displayName: draft.displayName,
        city: draft.city,
        state: draft.state,
        country: draft.country,
        gender: draft.gender,
        genderOther: draft.genderOther,
        sexualOrientation: draft.sexualOrientation,
        orientationOther: draft.orientationOther,
        lookingFor: draft.lookingFor,
        bio: draft.bio,
        interests: draft.interests,
        avatarUrl: draft.avatarUrl,
      })

      setProfileData(response)
      setDraft(buildDraft(response))
      setIsModalOpen(false)
    } catch (error) {
      setSubmitError(
        error instanceof Error && error.message
          ? error.message
          : 'Unable to save profile changes right now.'
      )
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading || !profileData || !draft) {
    return (
      <div className="min-h-screen bg-[#090507] p-8 text-stone-100">
        <div className="mx-auto max-w-6xl animate-pulse space-y-6">
          <div className="h-8 w-56 rounded bg-white/10" />
          <div className="h-32 rounded-2xl bg-white/10" />
          <div className="h-64 rounded-2xl bg-white/10" />
        </div>

        {loadError && (
          <p className="mx-auto mt-6 max-w-6xl rounded-xl border border-rose-400/35 bg-rose-500/20 p-4 text-sm text-rose-100">
            {loadError}
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,180,0,0.22),_transparent_38%),linear-gradient(160deg,#0b0608_20%,#1a0b10_58%,#3b1314_100%)] text-stone-100">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <aside className="hidden w-64 shrink-0 rounded-3xl border border-white/10 bg-black/30 p-5 backdrop-blur-xl md:block">
          <p className="text-xs uppercase tracking-[0.22em] text-amber-100/70">Member Area</p>
          <h1 className="mt-3 font-[family:var(--font-display)] text-3xl text-amber-100">Dashboard</h1>

          <nav className="mt-8 space-y-2">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block rounded-xl px-4 py-3 text-sm transition ${
                    active
                      ? 'bg-amber-200/20 text-amber-100'
                      : 'text-stone-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <button
            type="button"
            onClick={handleLogout}
            className="mt-8 w-full rounded-xl border border-white/15 px-4 py-3 text-left text-sm text-stone-200 transition hover:border-rose-200/45 hover:bg-rose-500/20 hover:text-rose-100"
          >
            Logout
          </button>
        </aside>

        <main className="flex-1 space-y-6">
          <header className="rounded-3xl border border-white/10 bg-black/35 p-5 backdrop-blur-xl sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-amber-100/70">Welcome back</p>
                <h2 className="mt-2 font-[family:var(--font-display)] text-3xl text-amber-100">
                  {profileData.user.displayName}
                </h2>
              </div>

              <div className="flex items-center gap-3">
                {profileData.profile.avatarUrl ? (
                  <div
                    className="h-12 w-12 rounded-full border border-white/20 bg-cover bg-center"
                    style={{ backgroundImage: `url(${profileData.profile.avatarUrl})` }}
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-amber-500/20 text-sm font-semibold text-amber-100">
                    {textInitials(profileData.user.displayName || profileData.user.username)}
                  </div>
                )}

                <div className="text-right">
                  <p className="text-sm font-semibold text-stone-100">@{profileData.user.username}</p>
                  <p className="text-xs text-stone-300">
                    Personal passcode: {maskPersonalCode(profileData.user.personalCode)}
                  </p>
                </div>
              </div>
            </div>
          </header>

          <section className="grid gap-4 sm:grid-cols-2">
            <article className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.22em] text-amber-100/70">Quick Stat</p>
              <p className="mt-2 text-3xl font-semibold text-white">3</p>
              <p className="mt-1 text-sm text-stone-300">new messages</p>
            </article>

            <article className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.22em] text-amber-100/70">Quick Stat</p>
              <p className="mt-2 text-3xl font-semibold text-white">12</p>
              <p className="mt-1 text-sm text-stone-300">members online</p>
            </article>
          </section>

          <section className="rounded-3xl border border-white/10 bg-black/30 p-5 backdrop-blur-xl sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-amber-100/70">Section 1</p>
                <h3 className="mt-2 font-[family:var(--font-display)] text-2xl text-amber-100">Your Profile</h3>
              </div>

              <button
                type="button"
                onClick={() => {
                  setDraft(buildDraft(profileData))
                  setSubmitError('')
                  setIsModalOpen(true)
                }}
                className="rounded-xl border border-white/20 px-4 py-2 text-sm font-semibold text-stone-100 transition hover:border-amber-200/40 hover:bg-amber-200/15"
              >
                Edit profile
              </button>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-stone-400">Location</p>
                <p className="mt-1 text-sm text-stone-100">{locationLabel || 'Not set'}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-stone-400">Looking For</p>
                <p className="mt-1 text-sm text-stone-100">
                  {profileData.profile.lookingFor.length > 0
                    ? profileData.profile.lookingFor.join(', ')
                    : 'Not set'}
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4 sm:col-span-2">
                <p className="text-xs uppercase tracking-[0.18em] text-stone-400">Bio</p>
                <p className="mt-1 text-sm text-stone-100">{profileData.profile.bio || 'No bio yet.'}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4 sm:col-span-2">
                <p className="text-xs uppercase tracking-[0.18em] text-stone-400">Interests</p>
                <p className="mt-1 text-sm text-stone-100">
                  {profileData.profile.interests.length > 0
                    ? profileData.profile.interests.join(', ')
                    : 'No interests selected'}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-black/30 p-5 backdrop-blur-xl sm:p-6">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-amber-100/70">Section 2</p>
              <h3 className="mt-2 font-[family:var(--font-display)] text-2xl text-amber-100">Members Near You</h3>
              <p className="mt-2 text-sm text-stone-300">
                Placeholder cards for now. Real nearby member search will plug in next.
              </p>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {NEARBY_PLACEHOLDERS.map((member) => (
                <article
                  key={`${member.name}-${member.city}`}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4"
                >
                  <div className="h-36 rounded-xl border border-dashed border-white/20 bg-black/20" />
                  <p className="mt-4 text-sm font-semibold text-stone-100">{member.name}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.15em] text-stone-400">{member.city}</p>
                  <p className="mt-2 text-xs text-stone-300">{member.tags.join(' • ')}</p>
                </article>
              ))}
            </div>
          </section>
        </main>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm">
          <div className="my-6 w-full max-w-2xl rounded-3xl border border-white/15 bg-[#120b0d] p-6 shadow-2xl">
            <div className="flex items-center justify-between gap-4">
              <h3 className="font-[family:var(--font-display)] text-3xl text-amber-100">Edit Profile</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg border border-white/15 px-3 py-1 text-xs uppercase tracking-[0.18em] text-stone-300 transition hover:border-white/30 hover:text-white"
              >
                Close
              </button>
            </div>

            <form onSubmit={submitProfile} className="mt-6 space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-sm text-stone-200">
                  <span>Display name</span>
                  <input
                    value={draft.displayName}
                    onChange={(event) => setDraft({ ...draft, displayName: event.target.value })}
                    className="input-field border-white/15 bg-black/35 text-stone-100 placeholder:text-stone-500"
                    required
                  />
                </label>

                <label className="space-y-2 text-sm text-stone-200">
                  <span>Avatar URL (optional)</span>
                  <input
                    value={draft.avatarUrl}
                    onChange={(event) => setDraft({ ...draft, avatarUrl: event.target.value })}
                    className="input-field border-white/15 bg-black/35 text-stone-100 placeholder:text-stone-500"
                    placeholder="https://..."
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <label className="space-y-2 text-sm text-stone-200">
                  <span>City</span>
                  <input
                    value={draft.city}
                    onChange={(event) => setDraft({ ...draft, city: event.target.value })}
                    className="input-field border-white/15 bg-black/35 text-stone-100"
                    required
                  />
                </label>
                <label className="space-y-2 text-sm text-stone-200">
                  <span>State</span>
                  <input
                    value={draft.state}
                    onChange={(event) => setDraft({ ...draft, state: event.target.value })}
                    className="input-field border-white/15 bg-black/35 text-stone-100"
                  />
                </label>
                <label className="space-y-2 text-sm text-stone-200">
                  <span>Country</span>
                  <input
                    value={draft.country}
                    onChange={(event) => setDraft({ ...draft, country: event.target.value })}
                    className="input-field border-white/15 bg-black/35 text-stone-100"
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-sm text-stone-200">
                  <span>Gender</span>
                  <select
                    value={draft.gender}
                    onChange={(event) => setDraft({ ...draft, gender: event.target.value })}
                    className="input-field border-white/15 bg-black/35 text-stone-100"
                    required
                  >
                    <option value="">Select</option>
                    {GENDER_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-2 text-sm text-stone-200">
                  <span>Sexual orientation</span>
                  <select
                    value={draft.sexualOrientation}
                    onChange={(event) =>
                      setDraft({ ...draft, sexualOrientation: event.target.value })
                    }
                    className="input-field border-white/15 bg-black/35 text-stone-100"
                    required
                  >
                    <option value="">Select</option>
                    {ORIENTATION_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {draft.gender === 'Other' && (
                <label className="space-y-2 text-sm text-stone-200">
                  <span>Gender (other)</span>
                  <input
                    value={draft.genderOther}
                    onChange={(event) => setDraft({ ...draft, genderOther: event.target.value })}
                    className="input-field border-white/15 bg-black/35 text-stone-100"
                    required
                  />
                </label>
              )}

              {draft.sexualOrientation === 'Other' && (
                <label className="space-y-2 text-sm text-stone-200">
                  <span>Orientation (other)</span>
                  <input
                    value={draft.orientationOther}
                    onChange={(event) =>
                      setDraft({ ...draft, orientationOther: event.target.value })
                    }
                    className="input-field border-white/15 bg-black/35 text-stone-100"
                    required
                  />
                </label>
              )}

              <div className="space-y-3">
                <p className="text-sm text-stone-200">Looking for</p>
                <div className="flex flex-wrap gap-2">
                  {LOOKING_FOR_OPTIONS.map((option) => {
                    const selected = draft.lookingFor.includes(option)

                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => toggleMultiSelect('lookingFor', option)}
                        className={`rounded-full border px-3 py-1.5 text-xs uppercase tracking-[0.12em] transition ${
                          selected
                            ? 'border-amber-200/45 bg-amber-300/20 text-amber-100'
                            : 'border-white/20 text-stone-300 hover:border-white/35 hover:text-white'
                        }`}
                      >
                        {option}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm text-stone-200">Interests</p>
                <div className="flex flex-wrap gap-2">
                  {INTEREST_TAG_OPTIONS.map((tag) => {
                    const selected = draft.interests.includes(tag)

                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleMultiSelect('interests', tag)}
                        className={`rounded-full border px-3 py-1.5 text-xs uppercase tracking-[0.12em] transition ${
                          selected
                            ? 'border-amber-200/45 bg-amber-300/20 text-amber-100'
                            : 'border-white/20 text-stone-300 hover:border-white/35 hover:text-white'
                        }`}
                      >
                        {tag}
                      </button>
                    )
                  })}
                </div>
              </div>

              <label className="space-y-2 text-sm text-stone-200">
                <span>Bio</span>
                <textarea
                  value={draft.bio}
                  onChange={(event) => setDraft({ ...draft, bio: event.target.value })}
                  className="input-field min-h-28 border-white/15 bg-black/35 text-stone-100"
                  placeholder="Tell people a little about yourself"
                />
              </label>

              {submitError && (
                <p className="rounded-xl border border-rose-400/35 bg-rose-500/20 p-3 text-sm text-rose-100">
                  {submitError}
                </p>
              )}

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-white/20 px-4 py-2 text-sm text-stone-200 transition hover:border-white/35 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-xl border border-amber-200/35 bg-amber-300/20 px-4 py-2 text-sm font-semibold text-amber-100 transition hover:bg-amber-300/30 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSaving ? 'Saving...' : 'Save changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
