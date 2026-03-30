'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { fetchConversations } from '@/lib/api'
import { ROUTES } from '@/lib/constants'
import type { Conversation } from '@/lib/types'

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

type DashboardClientProps = {
  initialData: DashboardViewData
}

const DEFAULT_MEMBER_ID = 'default-member'
const SUPERNOVA_URL = 'https://www.youtube.com/watch?v=tI-5uv4wryI'
const SUPERNOVA_EMBED_URL = 'https://www.youtube-nocookie.com/embed/tI-5uv4wryI?autoplay=1&rel=0'

// ─── Moon phase astronomy ─────────────────────────────────────────────────
const SYNODIC_MONTH = 29.530588853

type MoonData = { phase: number; illumination: number; phaseName: string }

function computeMoonPhase(date: Date): MoonData {
  const anchor = new Date('2000-01-06T18:14:00Z')
  const elapsed = (date.getTime() - anchor.getTime()) / 86_400_000
  const phase = ((elapsed % SYNODIC_MONTH) + SYNODIC_MONTH) % SYNODIC_MONTH
  const illumination = (1 - Math.cos((phase / SYNODIC_MONTH) * 2 * Math.PI)) / 2
  let phaseName: string
  if (phase < 1.0)        phaseName = 'New Moon'
  else if (phase < 7.38)  phaseName = 'Waxing Crescent'
  else if (phase < 8.38)  phaseName = 'First Quarter'
  else if (phase < 14.77) phaseName = 'Waxing Gibbous'
  else if (phase < 15.77) phaseName = 'Full Moon'
  else if (phase < 22.14) phaseName = 'Waning Gibbous'
  else if (phase < 23.14) phaseName = 'Last Quarter'
  else                    phaseName = 'Waning Crescent'
  return { phase, illumination, phaseName }
}

// Each path: outer limb (full semicircle) + terminator ellipse arc back
function buildMoonPath(phase: number, r = 44): string | null {
  if (phase < 1.0 || phase > 28.53) return null
  const theta = (phase / SYNODIC_MONTH) * 2 * Math.PI
  const k = Math.cos(theta)
  const tx = Math.abs(r * k)
  const isWaxing = phase <= 14.765
  const top    = `50 ${50 - r}`
  const bottom = `50 ${50 + r}`
  if (isWaxing) {
    const sweep = k >= 0 ? 0 : 1
    return `M ${top} A ${r} ${r} 0 1 1 ${bottom} A ${tx.toFixed(2)} ${r} 0 0 ${sweep} ${top} Z`
  }
  const sweep = k >= 0 ? 1 : 0
  return `M ${top} A ${r} ${r} 0 1 0 ${bottom} A ${tx.toFixed(2)} ${r} 0 0 ${sweep} ${top} Z`
}

function MoonWidget({ city }: { city: string }) {
  const [moon, setMoon] = useState<MoonData | null>(null)
  useEffect(() => { setMoon(computeMoonPhase(new Date())) }, [])
  if (!moon) return null
  const moonPath = buildMoonPath(moon.phase)
  const illumPct = Math.round(moon.illumination * 100)
  const locationLabel = city.trim() || 'tonight'
  const isNearFull = moon.illumination > 0.85
  return (
    <div className="fixed bottom-8 right-6 z-20 flex w-32 flex-col items-center gap-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-md sm:right-8">
      <svg
        viewBox="0 0 100 100"
        className="h-[4.5rem] w-[4.5rem]"
        aria-label={`${moon.phaseName}, ${illumPct}% illuminated`}
        role="img"
      >
        <circle cx="50" cy="50" r="44" fill="rgba(30,20,10,0.05)" stroke="rgba(100,80,40,0.2)" strokeWidth="0.7" />
        {isNearFull && (
          <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(180,140,50,0.4)" strokeWidth="5" />
        )}
        {moonPath ? (
          <path d={moonPath} fill="rgba(50,35,10,0.80)" />
        ) : (
          <circle cx="50" cy="50" r="44" fill="rgba(30,20,10,0.08)" />
        )}
      </svg>
      <div className="w-full text-center">
        <p className="text-[9px] uppercase tracking-[0.22em] leading-tight text-stone-500">{moon.phaseName}</p>
        <p className="mt-1 text-[11px] font-medium tabular-nums text-stone-700">{illumPct}%</p>
        <p className="mt-1.5 truncate text-[8px] uppercase tracking-[0.14em] text-stone-400">{locationLabel}</p>
      </div>
    </div>
  )
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((part) => part.trim()[0])
    .filter(Boolean)
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function formatRelativeTime(isoString: string) {
  const diff = Date.now() - new Date(isoString).getTime()
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(isoString).toLocaleDateString()
}

function buildNextSteps(data: DashboardViewData) {
  const steps: string[] = []

  if (!data.profile.bio.trim()) {
    steps.push('Write a short bio so people know your vibe before they message you.')
  }

  if (!data.profile.avatarUrl.trim()) {
    steps.push('Add a profile photo to stand out in search and direct messages.')
  }

  if (!data.profile.location.trim()) {
    steps.push('Set your city or region so nearby members can find you faster.')
  }

  if (data.profile.interests.length < 3) {
    steps.push('Add a few more interests to improve search matches and profile depth.')
  }

  if (data.profile.lookingFor.length === 0) {
    steps.push('Pick what you are looking for so the app can frame better introductions.')
  }

  return steps.slice(0, 3)
}

function getGreetingForTime(date = new Date()) {
  const hour = date.getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

function getHeaderName(user: DashboardViewData['user']) {
  const candidates = [user.firstName, user.displayName, user.username]
    .map((value) => value.trim())
    .filter(Boolean)

  const preferredName = candidates.find(
    (value) => {
      const normalized = value.toLowerCase()
      return normalized !== 'default' && normalized !== 'default-member' && !normalized.startsWith('default')
    }
  )

  return preferredName ?? 'default user'
}

export default function DashboardClient({ initialData }: DashboardClientProps) {
  const [isSoundboardOpen, setIsSoundboardOpen] = useState(false)
  const [playerInstanceKey, setPlayerInstanceKey] = useState(0)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [isConversationsLoading, setIsConversationsLoading] = useState(
    initialData.user.id !== DEFAULT_MEMBER_ID
  )
  const [conversationsError, setConversationsError] = useState('')
  const [lastConversationSync, setLastConversationSync] = useState<Date | null>(null)

  const completionChecks = useMemo(
    () => [
      Boolean(initialData.profile.bio.trim()),
      Boolean(initialData.profile.avatarUrl.trim()),
      Boolean(initialData.profile.location.trim()),
      initialData.profile.interests.length >= 3,
      initialData.profile.lookingFor.length > 0,
    ],
    [initialData]
  )

  const profileCompletion = Math.round(
    (completionChecks.filter(Boolean).length / completionChecks.length) * 100
  )

  const nextSteps = useMemo(() => buildNextSteps(initialData), [initialData])
  const headerGreeting = useMemo(() => getGreetingForTime(), [])
  const headerName = useMemo(() => getHeaderName(initialData.user), [initialData.user])

  const loadConversations = useCallback(
    async (options?: { silent?: boolean }) => {
      const isSilent = options?.silent ?? false

      if (initialData.user.id === DEFAULT_MEMBER_ID) {
        setIsConversationsLoading(false)
        return
      }

      try {
        if (!isSilent) {
          setIsConversationsLoading(true)
        }
        setConversationsError('')
        const data = await fetchConversations()
        setConversations(data.conversations.slice(0, 4))
        setLastConversationSync(new Date())
      } catch (error) {
        setConversationsError(
          error instanceof Error ? error.message : 'Unable to load recent conversations.'
        )
      } finally {
        if (!isSilent) {
          setIsConversationsLoading(false)
        }
      }
    },
    [initialData.user.id]
  )

  useEffect(() => {
    if (initialData.user.id === DEFAULT_MEMBER_ID) {
      setIsConversationsLoading(false)
      return
    }

    void loadConversations()

    const intervalId = window.setInterval(() => {
      void loadConversations({ silent: true })
    }, 20_000)

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        void loadConversations({ silent: true })
      }
    }

    const handleWindowFocus = () => {
      void loadConversations({ silent: true })
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleWindowFocus)

    return () => {
      window.clearInterval(intervalId)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleWindowFocus)
    }
  }, [initialData.user.id, loadConversations])

  const toggleSoundboard = () => {
    setIsSoundboardOpen((previous) => {
      const next = !previous
      if (next) {
        // Force a fresh iframe mount so the track starts on open.
        setPlayerInstanceKey((value) => value + 1)
      }
      return next
    })
  }

  return (
    <div className="relative min-h-screen bg-[#f5f0eb] text-stone-800">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(#9a7a5a_1px,transparent_1px)] bg-[size:24px_24px] opacity-[0.04]" />

      <button
        type="button"
        onClick={toggleSoundboard}
        aria-label="Toggle Champagne Supernova soundboard"
        title="Champagne Supernova Soundboard"
        className="fixed left-5 top-20 z-40 inline-flex h-10 w-10 items-center justify-center rounded-full border border-stone-300 bg-white text-amber-700 shadow-md transition hover:scale-105 hover:border-amber-400 hover:bg-amber-50"
      >
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
          <circle cx="12" cy="12" r="4.6" />
          <ellipse cx="12" cy="12" rx="9" ry="3.2" transform="rotate(-20 12 12)" />
          <path d="M16.5 8.2a1.2 1.2 0 1 0 0.01 0" />
        </svg>
      </button>

      {isSoundboardOpen && (
        <section className="fixed left-5 top-36 z-40 w-[min(92vw,320px)] rounded-2xl border border-stone-200 bg-white p-3 shadow-lg">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] uppercase tracking-[0.16em] text-amber-700">Soundboard</p>
            <button
              type="button"
              onClick={() => setIsSoundboardOpen(false)}
              className="rounded-md border border-stone-200 px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-stone-500 transition hover:text-stone-800"
            >
              Close
            </button>
          </div>

          <p className="mt-1 text-xs text-stone-600">Oasis - Champagne Supernova</p>

          <div className="mt-3 overflow-hidden rounded-xl border border-stone-200">
            <iframe
              key={playerInstanceKey}
              src={SUPERNOVA_EMBED_URL}
              title="Oasis - Champagne Supernova"
              className="h-44 w-full"
              allow="autoplay; encrypted-media; picture-in-picture"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </div>

          <a
            href={SUPERNOVA_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex text-[10px] uppercase tracking-[0.14em] text-amber-700 transition hover:text-amber-600"
          >
            Open on YouTube
          </a>
        </section>
      )}

      <div className="relative z-10">
        <header className="fixed left-0 right-0 top-0 z-30 flex items-center justify-between gap-4 border-b border-stone-200 bg-white/95 px-5 py-3 shadow-sm backdrop-blur-sm sm:px-8">
          <div className="inline-flex items-center gap-2.5">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-700">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
                <path d="M12 5.2a5.8 5.8 0 1 0 0 11.6 5.8 5.8 0 0 0 0-11.6Z" />
                <path d="M3.2 13.4c.5 1.5 4 2.5 8.5 2.5 5 0 9-1.3 9-3s-4-3-9-3c-3.6 0-6.6.7-8 1.9a1.1 1.1 0 0 0-.5 1.6Z" opacity="0.72" />
                <circle cx="17.7" cy="7.7" r="1.25" />
              </svg>
            </span>
            <p className="text-[10px] uppercase tracking-[0.2em] text-stone-500">
              {headerGreeting}, <span className="font-semibold text-stone-700">{headerName}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={ROUTES.MESSAGESS}
              className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-stone-50 px-3.5 py-1.5 text-[10px] font-medium uppercase tracking-[0.18em] text-stone-600 shadow-sm transition hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700"
            >
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2Z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              Inbox
            </Link>
            <Link
              href={ROUTES.CHAT}
              className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-stone-50 px-3.5 py-1.5 text-[10px] font-medium uppercase tracking-[0.18em] text-stone-600 shadow-sm transition hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700"
            >
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              Chat
            </Link>
            <Link
              href={ROUTES.PROFILE}
              className="ml-1 inline-flex h-8 w-8 items-center justify-center rounded-full border border-stone-200 bg-amber-100 text-xs font-semibold text-amber-800 shadow-sm transition hover:border-amber-300 hover:bg-amber-200"
              aria-label="Your profile"
              title="Your profile"
            >
              {getInitials(initialData.user.displayName || initialData.user.username)}
            </Link>
          </div>
        </header>

        <main className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-6 px-5 pb-12 pt-16 sm:px-8 lg:grid-cols-[280px_1fr]">
          <aside className="space-y-5">
            <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
              <p className="text-[11px] uppercase tracking-[0.22em] text-amber-700">Your Profile</p>
              <div className="mt-3 flex items-center gap-3">
                {initialData.profile.avatarUrl ? (
                  <div
                    className="h-14 w-14 flex-none rounded-2xl border border-stone-200 bg-cover bg-center"
                    style={{ backgroundImage: `url(${initialData.profile.avatarUrl})` }}
                  />
                ) : (
                  <div className="flex h-14 w-14 flex-none items-center justify-center rounded-2xl border border-stone-200 bg-amber-100 text-lg font-semibold text-amber-700">
                    {getInitials(initialData.user.displayName || initialData.user.username)}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate font-semibold text-stone-800">{initialData.user.displayName || initialData.user.username}</p>
                  {initialData.profile.location && (
                    <p className="truncate text-xs text-stone-500">{initialData.profile.location}</p>
                  )}
                  {initialData.profile.age && (
                    <p className="text-xs text-stone-400">{initialData.profile.age} yrs</p>
                  )}
                </div>
              </div>
              {initialData.profile.bio && (
                <p className="mt-3 line-clamp-3 text-sm leading-6 text-stone-600">{initialData.profile.bio}</p>
              )}
              <div className="mt-4">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="uppercase tracking-[0.18em] text-stone-500">Completion</span>
                  <span className="font-semibold text-amber-700">{profileCompletion}%</span>
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-stone-100">
                  <div
                    className="h-full rounded-full bg-amber-500 transition-all"
                    style={{ width: `${profileCompletion}%` }}
                  />
                </div>
              </div>
              <Link
                href={ROUTES.PROFILE}
                className="mt-4 block rounded-xl border border-stone-200 bg-stone-50 py-2 text-center text-[11px] font-medium uppercase tracking-[0.18em] text-stone-600 transition hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700"
              >
                Edit profile
              </Link>
            </section>

            <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
              <p className="text-[11px] uppercase tracking-[0.22em] text-amber-700">Navigate</p>
              <nav className="mt-3 space-y-1">
                <Link href={ROUTES.SEARCH} className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-stone-600 transition hover:bg-amber-50 hover:text-amber-700">
                  <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
                  Search Members
                </Link>
                <Link href={ROUTES.GROUPS} className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-stone-600 transition hover:bg-amber-50 hover:text-amber-700">
                  <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                  Groups
                </Link>
                <Link href={ROUTES.CLASSIFIEDS} className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-stone-600 transition hover:bg-amber-50 hover:text-amber-700">
                  <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>
                  Classifieds
                </Link>
              </nav>
            </section>
          </aside>

          <div className="space-y-5">
            <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
                <p className="text-[11px] uppercase tracking-[0.22em] text-amber-700">Recent Conversations</p>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <h2 className="text-2xl font-semibold text-stone-800">Inbox</h2>
                  <Link
                    href={ROUTES.MESSAGESS}
                    className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-700 transition hover:text-amber-600"
                  >
                    View all
                  </Link>
                </div>

                {initialData.user.id !== DEFAULT_MEMBER_ID && (
                  <p className="mt-2 text-[11px] uppercase tracking-[0.14em] text-stone-400">
                    Auto-refresh every 20s
                    {lastConversationSync ? ` • Synced ${formatRelativeTime(lastConversationSync.toISOString())}` : ''}
                  </p>
                )}

                {initialData.user.id === DEFAULT_MEMBER_ID && (
                  <p className="mt-5 rounded-2xl border border-stone-100 bg-stone-50 p-4 text-sm leading-6 text-stone-500">
                    Preview mode does not load live inbox data. Sign in with a real member account to see conversations here.
                  </p>
                )}

                {initialData.user.id !== DEFAULT_MEMBER_ID && isConversationsLoading && (
                  <div className="mt-5 flex justify-center py-8">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-400/30 border-t-amber-400" />
                  </div>
                )}

                {initialData.user.id !== DEFAULT_MEMBER_ID && !isConversationsLoading && conversationsError && (
                  <p className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                    {conversationsError}
                  </p>
                )}

                {initialData.user.id !== DEFAULT_MEMBER_ID && !isConversationsLoading && !conversationsError && conversations.length === 0 && (
                  <div className="mt-5 rounded-2xl border border-stone-100 bg-stone-50 p-5">
                    <p className="text-sm font-medium text-stone-700">No messages yet</p>
                    <p className="mt-2 text-sm leading-6 text-stone-500">Browse members and start the first conversation from search.</p>
                  </div>
                )}

                {conversations.length > 0 && (
                  <ul className="mt-5 space-y-3">
                    {conversations.map((conversation) => (
                      <li key={conversation.partnerId}>
                        <Link
                          href={`${ROUTES.MESSAGESS}/${conversation.partnerId}`}
                          className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3 transition hover:border-amber-200/35 hover:bg-white/[0.06]"
                        >
                          {conversation.partnerAvatarUrl ? (
                            <div
                              className="h-11 w-11 flex-none rounded-2xl border border-white/15 bg-cover bg-center"
                              style={{ backgroundImage: `url(${conversation.partnerAvatarUrl})` }}
                            />
                          ) : (
                            <div className="flex h-11 w-11 flex-none items-center justify-center rounded-2xl border border-white/15 bg-amber-500/15 text-sm font-semibold text-amber-100">
                              {getInitials(conversation.partnerDisplayName || conversation.partnerUsername)}
                            </div>
                          )}

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-3">
                              <p className="truncate text-sm font-semibold text-stone-100">
                                {conversation.partnerDisplayName}
                              </p>
                              <p className="shrink-0 text-[11px] text-stone-500">
                                {formatRelativeTime(conversation.lastMessage.createdAt)}
                              </p>
                            </div>
                            <p className="mt-1 truncate text-sm text-stone-400">
                              {conversation.lastMessage.body}
                            </p>
                          </div>

                          {conversation.unreadCount > 0 && (
                            <span className="flex h-5 min-w-[1.25rem] flex-none items-center justify-center rounded-full bg-amber-400 px-1.5 text-[11px] font-bold text-black">
                              {conversation.unreadCount}
                            </span>
                          )}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
            </section>

            <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
              <p className="text-[11px] uppercase tracking-[0.22em] text-amber-700">Next Steps</p>
              <h2 className="mt-2 text-2xl font-semibold text-stone-800">Tighten the profile</h2>

              {nextSteps.length > 0 ? (
                <ul className="mt-5 space-y-3">
                  {nextSteps.map((step) => (
                    <li key={step} className="rounded-2xl border border-stone-100 bg-stone-50 p-4 text-sm leading-6 text-stone-600">
                      {step}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-800">
                  Your profile is in strong shape. Use search or the live room to turn that into actual conversations.
                </p>
              )}
            </section>
          </div>
        </main>
      </div>

      {/* Moon phase widget — location from member profile */}
      <MoonWidget city={initialData.profile.city} />
    </div>
  )
}
