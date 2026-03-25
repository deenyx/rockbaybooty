'use client'

import { FormEvent, useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

import { updateMemberProfile } from '@/lib/api'
import {
  GENDER_OPTIONS,
  INTEREST_TAG_OPTIONS,
  LOOKING_FOR_OPTIONS,
  ORIENTATION_OPTIONS,
  ROUTES,
} from '@/lib/constants'

type DashboardClientProps = {
  initialData: DashboardViewData
}

type DashboardViewData = {
  user: {
    id: string
    username: string
    firstName: string
    displayName: string
    personalCode: string
  }
  profile: {
    age: number | null
    location: string
    bio: string
    lookingFor: string[]
    interests: string[]
    avatarUrl: string
    city: string
    state: string
    country: string
    gender: string
    genderOther: string
    sexualOrientation: string
    orientationOther: string
  }
}

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

const SIDEBAR_ITEMS = [
  { label: 'Dashboard', href: ROUTES.DASHBOARD },
  { label: 'Search', href: ROUTES.SEARCH },
  { label: 'Messages', href: ROUTES.CHAT },
  { label: 'Groups', href: ROUTES.GROUPS },
  { label: 'Profile', href: ROUTES.PROFILE },
]

const ONLINE_MEMBERS_TEASER = [
  { name: 'NoirNova', status: 'Online now', vibe: 'Late-night chats' },
  { name: 'VelvetPulse', status: 'Active 5m ago', vibe: 'Flirty banter' },
  { name: 'CrimsonEcho', status: 'Online now', vibe: 'After-dark plans' },
]

function maskPersonalCode(personalCode: string) {
  if (personalCode.length < 4) {
    return '********'
  }

  return `${personalCode.slice(0, 2)}****${personalCode.slice(-2)}`
}

function getInitials(value: string) {
  return value
    .split(' ')
    .map((part) => part.trim()[0])
    .filter(Boolean)
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function createDraft(data: DashboardViewData): DraftProfile {
  return {
    displayName: data.user.displayName,
    city: data.profile.city,
    state: data.profile.state,
    country: data.profile.country,
    gender: data.profile.gender,
    genderOther: data.profile.genderOther,
    sexualOrientation: data.profile.sexualOrientation,
    orientationOther: data.profile.orientationOther,
    lookingFor: [...data.profile.lookingFor],
    bio: data.profile.bio,
    interests: [...data.profile.interests],
    avatarUrl: data.profile.avatarUrl,
  }
}

export default function DashboardClient({ initialData }: DashboardClientProps) {
  const pathname = usePathname()
  const router = useRouter()

  const [data, setData] = useState<DashboardViewData>(initialData)
  const [draft, setDraft] = useState<DraftProfile>(() => createDraft(initialData))
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isCopying, setIsCopying] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const lookingForLabel = useMemo(() => {
    return data.profile.lookingFor.length > 0
      ? data.profile.lookingFor.join(', ')
      : 'No preferences selected'
  }, [data.profile.lookingFor])

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.replace(ROUTES.HOME)
    router.refresh()
  }

  const handleCopyPasscode = async () => {
    await navigator.clipboard.writeText(data.user.personalCode)
    setIsCopying(true)
    setTimeout(() => setIsCopying(false), 1200)
  }

  const toggleMultiSelect = (key: 'lookingFor' | 'interests', value: string) => {
    const isSelected = draft[key].includes(value)
    const nextValues = isSelected
      ? draft[key].filter((item) => item !== value)
      : [...draft[key], value]

    setDraft((previous) => ({
      ...previous,
      [key]: nextValues,
    }))
  }

  const openModal = () => {
    setSubmitError('')
    setDraft(createDraft(data))
    setIsModalOpen(true)
  }

  const submitProfileUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitError('')

    if (!draft.displayName || !draft.city || !draft.gender || !draft.sexualOrientation) {
      setSubmitError('Display name, city, gender, and orientation are required.')
      return
    }

    if (draft.lookingFor.length === 0) {
      setSubmitError('Select at least one Looking For option.')
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

      const updated = await updateMemberProfile({
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

      const location = [
        updated.profile.city,
        updated.profile.state,
        updated.profile.country,
      ]
        .filter(Boolean)
        .join(', ')

      setData((previous) => ({
        ...previous,
        user: {
          ...previous.user,
          displayName: updated.user.displayName,
        },
        profile: {
          ...previous.profile,
          location,
          bio: updated.profile.bio,
          lookingFor: updated.profile.lookingFor,
          interests: updated.profile.interests,
          avatarUrl: updated.profile.avatarUrl,
          city: updated.profile.city,
          state: updated.profile.state,
          country: updated.profile.country,
          gender: updated.profile.gender,
          genderOther: updated.profile.genderOther,
          sexualOrientation: updated.profile.sexualOrientation,
          orientationOther: updated.profile.orientationOther,
        },
      }))

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

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(122,17,45,0.38),_transparent_38%),linear-gradient(155deg,#050305_18%,#13070d_52%,#2e0b16_100%)] text-stone-100">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl gap-5 px-4 py-5 sm:px-6 lg:px-8">
        <aside className="hidden w-64 shrink-0 rounded-3xl border border-white/10 bg-black/35 p-5 backdrop-blur-xl md:block">
          <p className="text-xs uppercase tracking-[0.24em] text-rose-200/70">Private Menu</p>
          <h1 className="mt-3 font-[family:var(--font-display)] text-3xl text-rose-100">Dashboard</h1>

          <nav className="mt-7 space-y-2">
            {SIDEBAR_ITEMS.map((item) => {
              const isActive = pathname === item.href

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block rounded-xl px-4 py-3 text-sm transition ${
                    isActive
                      ? 'border border-rose-200/30 bg-rose-200/15 text-rose-100'
                      : 'border border-transparent text-stone-300 hover:border-white/20 hover:bg-white/5 hover:text-white'
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
            className="mt-8 w-full rounded-xl border border-white/20 bg-black/25 px-4 py-3 text-left text-sm font-semibold text-stone-200 transition hover:border-rose-300/45 hover:bg-rose-700/25 hover:text-rose-100"
          >
            Logout
          </button>
        </aside>

        <main className="flex-1 space-y-5">
          <header className="rounded-3xl border border-white/10 bg-black/35 p-5 backdrop-blur-xl sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-rose-200/70">Welcome back</p>
                <h2 className="mt-2 font-[family:var(--font-display)] text-3xl text-rose-100 sm:text-4xl">
                  {data.user.firstName}
                </h2>
              </div>

              <div className="flex items-center gap-3">
                {data.profile.avatarUrl ? (
                  <div
                    className="h-14 w-14 rounded-full border border-white/20 bg-cover bg-center"
                    style={{ backgroundImage: `url(${data.profile.avatarUrl})` }}
                  />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/20 bg-rose-400/20 text-sm font-semibold text-rose-100">
                    {getInitials(data.user.displayName || data.user.username)}
                  </div>
                )}

                <div className="text-right">
                  <p className="text-sm font-semibold text-stone-100">@{data.user.username}</p>
                  <p className="text-xs text-stone-300">Private member space</p>
                </div>
              </div>
            </div>
          </header>

          <section className="rounded-3xl border border-white/10 bg-black/35 p-5 backdrop-blur-xl sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-rose-200/70">Personal Passcode</p>
                <p className="mt-2 font-mono text-2xl tracking-[0.22em] text-rose-100 sm:text-3xl">
                  {maskPersonalCode(data.user.personalCode)}
                </p>
              </div>

              <button
                type="button"
                onClick={handleCopyPasscode}
                className="rounded-xl border border-rose-200/30 bg-rose-800/20 px-5 py-3 text-sm font-semibold text-rose-100 transition hover:bg-rose-800/30"
              >
                {isCopying ? 'Copied' : 'Copy passcode'}
              </button>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <article className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-stone-400">Age</p>
                <p className="mt-2 text-xl font-semibold text-stone-100">
                  {typeof data.profile.age === 'number' ? data.profile.age : 'Not set'}
                </p>
              </article>

              <article className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:col-span-2">
                <p className="text-xs uppercase tracking-[0.14em] text-stone-400">Location</p>
                <p className="mt-2 text-sm text-stone-100">{data.profile.location || 'Not set'}</p>
              </article>

              <article className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-stone-400">Looking For</p>
                <p className="mt-2 text-sm text-stone-100">{lookingForLabel}</p>
              </article>

              <article className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:col-span-2 lg:col-span-4">
                <p className="text-xs uppercase tracking-[0.14em] text-stone-400">Bio</p>
                <p className="mt-2 text-sm text-stone-100">{data.profile.bio || 'No bio written yet.'}</p>
              </article>
            </div>

            <button
              type="button"
              onClick={openModal}
              className="mt-6 inline-flex w-full items-center justify-center rounded-xl border border-rose-200/35 bg-gradient-to-r from-[#511428] via-[#6a1932] to-[#3c101f] px-5 py-4 text-sm font-semibold uppercase tracking-[0.16em] text-rose-100 transition hover:brightness-110 sm:w-auto"
            >
              Edit Profile
            </button>
          </section>

          <section className="rounded-3xl border border-white/10 bg-black/35 p-5 backdrop-blur-xl sm:p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-rose-200/70">Members Online</p>
            <h3 className="mt-2 font-[family:var(--font-display)] text-2xl text-rose-100">Tonight's energy</h3>
            <p className="mt-2 text-sm text-stone-300">
              Teaser list for now. Real-time online member discovery can be connected next.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {ONLINE_MEMBERS_TEASER.map((member) => (
                <article key={member.name} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="h-32 rounded-xl border border-dashed border-white/15 bg-black/20" />
                  <p className="mt-4 text-sm font-semibold text-stone-100">{member.name}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.14em] text-rose-200/75">{member.status}</p>
                  <p className="mt-2 text-xs text-stone-300">{member.vibe}</p>
                </article>
              ))}
            </div>
          </section>
        </main>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/75 p-4 backdrop-blur-sm">
          <div className="my-6 w-full max-w-2xl rounded-3xl border border-white/15 bg-[#12090d] p-6 shadow-2xl">
            <div className="flex items-center justify-between gap-4">
              <h3 className="font-[family:var(--font-display)] text-3xl text-rose-100">Edit Profile</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg border border-white/20 px-3 py-1 text-xs uppercase tracking-[0.16em] text-stone-300 transition hover:text-white"
              >
                Close
              </button>
            </div>

            <form onSubmit={submitProfileUpdate} className="mt-6 space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-sm text-stone-200">
                  <span>Display name</span>
                  <input
                    value={draft.displayName}
                    onChange={(event) => setDraft({ ...draft, displayName: event.target.value })}
                    className="w-full rounded-xl border border-white/15 bg-black/40 px-4 py-2.5 text-stone-100 outline-none focus:border-rose-300/40"
                    required
                  />
                </label>

                <label className="space-y-2 text-sm text-stone-200">
                  <span>Avatar URL</span>
                  <input
                    value={draft.avatarUrl}
                    onChange={(event) => setDraft({ ...draft, avatarUrl: event.target.value })}
                    className="w-full rounded-xl border border-white/15 bg-black/40 px-4 py-2.5 text-stone-100 outline-none focus:border-rose-300/40"
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
                    className="w-full rounded-xl border border-white/15 bg-black/40 px-4 py-2.5 text-stone-100 outline-none focus:border-rose-300/40"
                    required
                  />
                </label>

                <label className="space-y-2 text-sm text-stone-200">
                  <span>State</span>
                  <input
                    value={draft.state}
                    onChange={(event) => setDraft({ ...draft, state: event.target.value })}
                    className="w-full rounded-xl border border-white/15 bg-black/40 px-4 py-2.5 text-stone-100 outline-none focus:border-rose-300/40"
                  />
                </label>

                <label className="space-y-2 text-sm text-stone-200">
                  <span>Country</span>
                  <input
                    value={draft.country}
                    onChange={(event) => setDraft({ ...draft, country: event.target.value })}
                    className="w-full rounded-xl border border-white/15 bg-black/40 px-4 py-2.5 text-stone-100 outline-none focus:border-rose-300/40"
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-sm text-stone-200">
                  <span>Gender</span>
                  <select
                    value={draft.gender}
                    onChange={(event) => setDraft({ ...draft, gender: event.target.value })}
                    className="w-full rounded-xl border border-white/15 bg-black/40 px-4 py-2.5 text-stone-100 outline-none focus:border-rose-300/40"
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
                    onChange={(event) => setDraft({ ...draft, sexualOrientation: event.target.value })}
                    className="w-full rounded-xl border border-white/15 bg-black/40 px-4 py-2.5 text-stone-100 outline-none focus:border-rose-300/40"
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
                    className="w-full rounded-xl border border-white/15 bg-black/40 px-4 py-2.5 text-stone-100 outline-none focus:border-rose-300/40"
                    required
                  />
                </label>
              )}

              {draft.sexualOrientation === 'Other' && (
                <label className="space-y-2 text-sm text-stone-200">
                  <span>Orientation (other)</span>
                  <input
                    value={draft.orientationOther}
                    onChange={(event) => setDraft({ ...draft, orientationOther: event.target.value })}
                    className="w-full rounded-xl border border-white/15 bg-black/40 px-4 py-2.5 text-stone-100 outline-none focus:border-rose-300/40"
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
                            ? 'border-rose-200/40 bg-rose-500/20 text-rose-100'
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
                            ? 'border-rose-200/40 bg-rose-500/20 text-rose-100'
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
                  className="min-h-28 w-full rounded-xl border border-white/15 bg-black/40 px-4 py-2.5 text-stone-100 outline-none focus:border-rose-300/40"
                  placeholder="Tell people a little about yourself"
                />
              </label>

              {submitError && (
                <p className="rounded-xl border border-rose-400/35 bg-rose-600/25 p-3 text-sm text-rose-100">
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
                  className="rounded-xl border border-rose-200/40 bg-rose-700/25 px-4 py-2 text-sm font-semibold text-rose-100 transition hover:bg-rose-700/35 disabled:cursor-not-allowed disabled:opacity-70"
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
