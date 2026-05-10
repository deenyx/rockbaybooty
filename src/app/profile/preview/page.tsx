'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

import TopQuickNav from '@/app/_components/top-quick-nav'
import { fetchMemberProfile } from '@/lib/api'
import { ROUTES } from '@/lib/constants'

export default function ProfilePreviewPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [username, setUsername] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [bio, setBio] = useState('')
  const [city, setCity] = useState('')
  const [stateValue, setStateValue] = useState('')
  const [country, setCountry] = useState('')

  useEffect(() => {
    let mounted = true

    async function load() {
      try {
        const response = await fetchMemberProfile()
        if (!mounted) return

        setDisplayName(response.user.displayName || response.user.username)
        setUsername(response.user.username)
        setAvatarUrl(response.profile.avatarUrl || '')
        setBio(response.profile.bio || 'No bio added yet.')
        setCity(response.profile.city || '')
        setStateValue(response.profile.state || '')
        setCountry(response.profile.country || '')
      } catch (loadError) {
        if (!mounted) return
        setError(loadError instanceof Error ? loadError.message : 'Unable to load profile preview.')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    void load()

    return () => {
      mounted = false
    }
  }, [])

  const location = useMemo(() => [city, stateValue, country].filter(Boolean).join(', ') || 'Location hidden', [city, stateValue, country])

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#090b10] px-4 pb-8 pt-24 text-stone-100 sm:px-6 lg:px-8">
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30"
        style={{ backgroundImage: "url('/welcome2.jpg')" }}
      />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(8,11,18,0.7)_0%,rgba(6,8,12,0.84)_100%)]" />

      <TopQuickNav className="left-4 right-4 md:left-6 md:right-6" />

      <main className="relative z-10 mx-auto max-w-4xl space-y-6">
        <section className="rounded-3xl border border-white/10 bg-black/30 p-6 backdrop-blur-xl sm:p-8">
          <p className="text-xs uppercase tracking-[0.24em] text-stone-300/80">Profile</p>
          <h1 className="mt-3 font-[family:var(--font-display)] text-4xl text-stone-100 sm:text-5xl">Public Preview</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-stone-300 sm:text-base">
            Review how your profile card appears before people discover you.
          </p>
        </section>

        {loading ? (
          <div className="rounded-2xl border border-white/10 bg-black/30 p-6 text-sm text-stone-300 backdrop-blur">Loading preview...</div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-400/30 bg-rose-500/20 p-6 text-sm text-rose-100">{error}</div>
        ) : (
          <section className="rounded-3xl border border-white/10 bg-black/30 p-6 backdrop-blur-xl sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt={displayName} className="h-20 w-20 rounded-2xl border border-white/20 object-cover" />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-white/20 bg-white/[0.05] text-lg font-semibold text-stone-200">
                  {displayName.slice(0, 2).toUpperCase()}
                </div>
              )}
              <div>
                <h2 className="text-2xl font-semibold text-stone-100">{displayName}</h2>
                <p className="text-sm text-stone-400">@{username}</p>
                <p className="mt-1 text-sm text-stone-300">{location}</p>
              </div>
            </div>
            <p className="mt-5 text-sm leading-7 text-stone-300">{bio}</p>
          </section>
        )}

        <div className="flex flex-wrap gap-3">
          <Link href={ROUTES.PROFILE} className="rounded-xl border border-white/20 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-stone-100 transition hover:border-white/35 hover:bg-white/[0.1]">
            Edit profile
          </Link>
          <Link href={ROUTES.SEARCH} className="rounded-xl border border-white/20 px-4 py-2 text-sm text-stone-200 transition hover:border-white/35 hover:bg-white/[0.04]">
            Go to search
          </Link>
        </div>
      </main>
    </div>
  )
}
