'use client'

import Link from 'next/link'
import { FormEvent, useEffect, useState } from 'react'

import TopQuickNav from '@/app/_components/top-quick-nav'
import { fetchMemberProfile, fetchProfileOptions, updateMemberProfile } from '@/lib/api'
import {
  MAX_PROFILE_PHOTO_BYTES,
  ROUTES,
  SOCIAL_PLATFORMS,
  SOCIAL_LINK_VISIBILITY_OPTIONS,
} from '@/lib/constants'
import { PROFILE_OPTION_DEFAULTS } from '@/lib/profile-options'

type ProfileForm = {
  displayName: string
  avatarUrl: string
  city: string
  state: string
  country: string
  gender: string
  genderOther: string
  pronouns: string
  sexualOrientation: string
  orientationOther: string
  intentions: string
  lookingFor: string[]
  interests: string[]
  bio: string
  twitterUrl: string
  fetlifeUrl: string
  onlyfansUrl: string
  pornhubUrl: string
  tumblrUrl: string
  instagramUrl: string
  socialLinksVisibility: string
}

const EMPTY_FORM: ProfileForm = {
  displayName: '',
  avatarUrl: '',
  city: '',
  state: '',
  country: '',
  gender: '',
  genderOther: '',
  pronouns: '',
  sexualOrientation: '',
  orientationOther: '',
  intentions: '',
  lookingFor: [],
  interests: [],
  bio: '',
  twitterUrl: '',
  fetlifeUrl: '',
  onlyfansUrl: '',
  pornhubUrl: '',
  tumblrUrl: '',
  instagramUrl: '',
  socialLinksVisibility: 'members',
}

function toggleArrayItem(arr: string[], item: string): string[] {
  return arr.includes(item) ? arr.filter((v) => v !== item) : [...arr, item]
}

export default function ProfilePage() {
  const [form, setForm] = useState<ProfileForm>(EMPTY_FORM)
  const [optionSets, setOptionSets] = useState(() => ({
    lookingFor: [...PROFILE_OPTION_DEFAULTS.lookingFor],
    intentions: [...PROFILE_OPTION_DEFAULTS.intentions],
    gender: [...PROFILE_OPTION_DEFAULTS.gender],
    pronouns: [...PROFILE_OPTION_DEFAULTS.pronouns],
    orientation: [...PROFILE_OPTION_DEFAULTS.orientation],
    interests: [...PROFILE_OPTION_DEFAULTS.interests],
    kinks: [...PROFILE_OPTION_DEFAULTS.kinks],
    roles: [...PROFILE_OPTION_DEFAULTS.roles],
  }))
  const [username, setUsername] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [photoUrls, setPhotoUrls] = useState<string[]>([])
  const [photoUploadError, setPhotoUploadError] = useState('')
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)

  useEffect(() => {
    let mounted = true

    async function load() {
      try {
        const [profileResult, optionsResult] = await Promise.allSettled([
          fetchMemberProfile(),
          fetchProfileOptions(),
        ])

        if (profileResult.status !== 'fulfilled') {
          throw profileResult.reason
        }

        const response = profileResult.value

        if (!mounted) return

        if (optionsResult.status === 'fulfilled') {
          setOptionSets(optionsResult.value.options)
        }

        setUsername(response.user.username)
        setPhotoUrls(response.profile.photoUrls ?? [])
        setForm({
          displayName: response.user.displayName || '',
          avatarUrl: response.profile.avatarUrl || '',
          city: response.profile.city || '',
          state: response.profile.state || '',
          country: response.profile.country || '',
          gender: response.profile.gender || '',
          genderOther: response.profile.genderOther || '',
          pronouns: response.profile.pronouns || '',
          sexualOrientation: response.profile.sexualOrientation || '',
          orientationOther: response.profile.orientationOther || '',
          intentions: response.profile.intentions || '',
          lookingFor: response.profile.lookingFor || [],
          interests: response.profile.interests || [],
          bio: response.profile.bio || '',
          twitterUrl: response.profile.twitterUrl || '',
          fetlifeUrl: response.profile.fetlifeUrl || '',
          onlyfansUrl: response.profile.onlyfansUrl || '',
          pornhubUrl: response.profile.pornhubUrl || '',
          tumblrUrl: response.profile.tumblrUrl || '',
          instagramUrl: response.profile.instagramUrl || '',
          socialLinksVisibility: response.profile.socialLinksVisibility || 'members',
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
        pronouns: form.pronouns || undefined,
        sexualOrientation: form.sexualOrientation,
        orientationOther: form.orientationOther || undefined,
        intentions: form.intentions || undefined,
        lookingFor: form.lookingFor,
        interests: form.interests,
        bio: form.bio || undefined,
        twitterUrl: form.twitterUrl || undefined,
        fetlifeUrl: form.fetlifeUrl || undefined,
        onlyfansUrl: form.onlyfansUrl || undefined,
        pornhubUrl: form.pornhubUrl || undefined,
        tumblrUrl: form.tumblrUrl || undefined,
        instagramUrl: form.instagramUrl || undefined,
        socialLinksVisibility: form.socialLinksVisibility,
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
                  <label className="mb-1.5 block text-xs text-stone-400">
                    Avatar
                  </label>
                  <div className="flex gap-2 items-start">
                    {form.avatarUrl && (
                      <img
                        src={form.avatarUrl}
                        alt=""
                        className="h-14 w-14 shrink-0 rounded-xl border border-white/15 object-cover"
                      />
                    )}
                    <div className="flex-1 space-y-2">
                      <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 bg-white/[0.02] p-2.5 text-xs text-stone-400 transition hover:border-white/35 hover:text-stone-200">
                        <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                          <path d="M12 5v14M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Upload from device
                        <input
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          onChange={async (e) => {
                            const file = e.target.files?.[0]
                            if (!file) return
                            if (file.size > MAX_PROFILE_PHOTO_BYTES) {
                              setError('Avatar too large. Max 5 MB.')
                              return
                            }
                            const reader = new FileReader()
                            reader.onload = (ev) => {
                              handleChange('avatarUrl', ev.target?.result as string)
                            }
                            reader.readAsDataURL(file)
                          }}
                        />
                      </label>
                      <input
                        id="avatarUrl"
                        type="url"
                        value={form.avatarUrl.startsWith('data:') ? '' : form.avatarUrl}
                        onChange={(e) => handleChange('avatarUrl', e.target.value)}
                        placeholder="Or paste image URL…"
                        className={inputCls}
                      />
                    </div>
                  </div>
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
                    {optionSets.gender.map((opt) => (
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
                  <label className="mb-1.5 block text-xs text-stone-400" htmlFor="pronouns">
                    Pronouns
                  </label>
                  <select
                    id="pronouns"
                    value={form.pronouns}
                    onChange={(e) => handleChange('pronouns', e.target.value)}
                    className={selectCls}
                  >
                    <option value="" className="bg-[#0f121a]">Select pronouns…</option>
                    {optionSets.pronouns.map((opt) => (
                      <option key={opt} value={opt} className="bg-[#0f121a]">{opt}</option>
                    ))}
                  </select>
                </div>
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
                    {optionSets.orientation.map((opt) => (
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
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-xs text-stone-400" htmlFor="intentions">
                    What brings you here?
                  </label>
                  <select
                    id="intentions"
                    value={form.intentions}
                    onChange={(e) => handleChange('intentions', e.target.value)}
                    className={selectCls}
                  >
                    <option value="" className="bg-[#0f121a]">Select an intention…</option>
                    {optionSets.intentions.map((opt) => (
                      <option key={opt} value={opt} className="bg-[#0f121a]">{opt}</option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            {/* Looking for */}
            <section className="rounded-3xl border border-white/10 bg-black/30 p-6 backdrop-blur-xl sm:p-7">
              <p className="text-[10px] uppercase tracking-[0.22em] text-stone-400">
                Looking for <span className="text-rose-400">*</span>
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {optionSets.lookingFor.map((opt) => {
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
                {optionSets.interests.map((opt) => {
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

            {/* Social links */}
            <section className="rounded-3xl border border-white/10 bg-black/30 p-6 backdrop-blur-xl sm:p-7">
              <p className="text-[10px] uppercase tracking-[0.22em] text-stone-400">Social &amp; adult links</p>
              <p className="mt-2 text-xs text-stone-500 leading-relaxed">
                Add links to your profiles on other platforms. You control who can see them.
              </p>
              <div className="mt-5 space-y-4">
                {SOCIAL_PLATFORMS.map(({ key, label, placeholder }) => (
                  <div key={key}>
                    <label className="mb-1.5 block text-xs text-stone-400" htmlFor={key}>{label}</label>
                    <input
                      id={key}
                      type="url"
                      value={form[key]}
                      onChange={(e) => handleChange(key, e.target.value)}
                      placeholder={placeholder}
                      className={inputCls}
                    />
                  </div>
                ))}
                <div>
                  <label className="mb-1.5 block text-xs text-stone-400" htmlFor="socialLinksVisibility">
                    Who can see these links?
                  </label>
                  <select
                    id="socialLinksVisibility"
                    value={form.socialLinksVisibility}
                    onChange={(e) => handleChange('socialLinksVisibility', e.target.value)}
                    className={selectCls}
                  >
                    {SOCIAL_LINK_VISIBILITY_OPTIONS.map(({ value, label }) => (
                      <option key={value} value={value} className="bg-[#0f121a]">{label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            {/* Feedback & save */}
            {/* Photo album */}
            <section className="rounded-3xl border border-white/10 bg-black/30 p-6 backdrop-blur-xl sm:p-7">
              <p className="text-[10px] uppercase tracking-[0.22em] text-stone-400">Photo album</p>
              <p className="mt-1 text-xs text-stone-500">Up to 9 photos. Click to remove. Paste a URL or upload a file.</p>

              {photoUrls.length > 0 && (
                <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {photoUrls.map((url) => (
                    <div key={url} className="relative group aspect-square">
                      <img src={url} alt="" className="h-full w-full rounded-xl border border-white/10 object-cover" />
                      <button
                        type="button"
                        title="Remove photo"
                        onClick={async () => {
                          try {
                            const res = await fetch('/api/photos', {
                              method: 'DELETE',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ url }),
                            })
                            const data = await res.json().catch(() => ({}))
                            if (res.ok) setPhotoUrls(data.photoUrls)
                          } catch { /* ignore */ }
                        }}
                        className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-[10px] text-white opacity-0 transition group-hover:opacity-100"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-4 space-y-3">
                {/* File upload */}
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 bg-white/[0.02] p-3 text-xs text-stone-400 transition hover:border-white/35 hover:text-stone-200">
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                    <path d="M12 5v14M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {isUploadingPhoto ? 'Uploading…' : 'Upload photo from device'}
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    disabled={isUploadingPhoto || photoUrls.length >= 9}
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      if (file.size > MAX_PROFILE_PHOTO_BYTES) {
                        setPhotoUploadError('Image too large. Max 5 MB.')
                        return
                      }
                      setIsUploadingPhoto(true)
                      setPhotoUploadError('')
                      try {
                        const reader = new FileReader()
                        reader.onload = async (ev) => {
                          const dataUrl = ev.target?.result as string
                          const res = await fetch('/api/photos', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ url: dataUrl }),
                          })
                          const data = await res.json().catch(() => ({}))
                          if (res.ok) {
                            setPhotoUrls(data.photoUrls)
                          } else {
                            setPhotoUploadError(data.error ?? 'Upload failed')
                          }
                          setIsUploadingPhoto(false)
                        }
                        reader.readAsDataURL(file)
                      } catch {
                        setPhotoUploadError('Upload failed')
                        setIsUploadingPhoto(false)
                      }
                    }}
                  />
                </label>

                {/* URL input */}
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="Or paste an image URL…"
                    disabled={isUploadingPhoto || photoUrls.length >= 9}
                    className="flex-1 rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-sm text-stone-100 outline-none placeholder:text-stone-500 focus:border-white/30 disabled:opacity-50"
                    onKeyDown={async (e) => {
                      if (e.key !== 'Enter') return
                      const url = (e.target as HTMLInputElement).value.trim()
                      if (!url) return
                      setIsUploadingPhoto(true)
                      setPhotoUploadError('')
                      try {
                        const res = await fetch('/api/photos', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ url }),
                        })
                        const data = await res.json().catch(() => ({}))
                        if (res.ok) {
                          setPhotoUrls(data.photoUrls)
                          ;(e.target as HTMLInputElement).value = ''
                        } else {
                          setPhotoUploadError(data.error ?? 'Failed to add')
                        }
                      } catch {
                        setPhotoUploadError('Failed to add')
                      } finally {
                        setIsUploadingPhoto(false)
                      }
                    }}
                  />
                </div>

                {photoUploadError && (
                  <p className="text-xs text-rose-400">{photoUploadError}</p>
                )}
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