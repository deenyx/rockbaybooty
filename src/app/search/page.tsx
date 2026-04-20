'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

import TopQuickNav from '@/app/_components/top-quick-nav'
import { searchMembers, sendFriendRequest, sendGesture } from '@/lib/api'
import {
  MEMBER_MENU_ITEMS,
  GENDER_OPTIONS,
  LOOKING_FOR_OPTIONS,
  MAX_AGE,
  MIN_AGE,
  ORIENTATION_OPTIONS,
  ROLE_OPTIONS,
  ROUTES,
  SEARCH_LOCATION_OPTIONS,
} from '@/lib/constants'
import type { MemberSearchFilters, MemberSearchResult } from '@/lib/types'

const NAV_ITEMS = [...MEMBER_MENU_ITEMS]

const INITIAL_FILTERS: MemberSearchFilters = {
  q: '',
  location: '',
  minAge: MIN_AGE,
  maxAge: MAX_AGE,
  gender: '',
  orientation: '',
  lookingFor: [],
  onlineOnly: false,
  hasPhoto: false,
  lastActive: 'any',
  limit: 24,
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

function asNumber(value: string, fallback: number) {
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) ? parsed : fallback
}

function NavIcon({ label }: { label: string }) {
  if (label === 'Dashboard') {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
        <path d="M3 13.5 12 4l9 9.5" />
        <path d="M5.5 11.5V20h13V11.5" />
      </svg>
    )
  }

  if (label === 'Search') {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
        <circle cx="11" cy="11" r="6.5" />
        <path d="m16 16 4.5 4.5" />
      </svg>
    )
  }

  if (label === 'Settings') {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06A1.65 1.65 0 0 0 15 19.4a1.65 1.65 0 0 0-1 .6 1.65 1.65 0 0 0-.33 1V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-.33-1 1.65 1.65 0 0 0-1-.6 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-.6-1 1.65 1.65 0 0 0-1-.33H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1-.33 1.65 1.65 0 0 0 .6-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-.6 1.65 1.65 0 0 0 .33-1V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 .33 1 1.65 1.65 0 0 0 1 .6 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c.2.36.31.76.33 1.17V10a2 2 0 0 1 0 4h-.09c-.41.02-.81.13-1.17.33z" />
      </svg>
    )
  }

  if (label === 'Messages') {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
        <rect x="3" y="5" width="18" height="14" rx="2.5" />
        <path d="m4.5 7 7.5 6 7.5-6" />
      </svg>
    )
  }

  if (label === 'Live Chat') {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
        <path d="M7.5 8.5a4.5 4.5 0 1 1 9 0v2.1a4.5 4.5 0 0 1-9 0z" />
        <path d="M12 16.8v2.7" />
        <path d="M9.5 19.5h5" />
      </svg>
    )
  }

  if (label === 'Videos') {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
        <rect x="3" y="6" width="13" height="12" rx="2" />
        <path d="m10 10 4 2-4 2z" />
        <path d="m16 10 5-3v10l-5-3" />
      </svg>
    )
  }

  if (label === 'Groups') {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
        <circle cx="8" cy="10" r="3" />
        <circle cx="16.5" cy="9" r="2.5" />
        <path d="M3.5 19c.8-2.6 2.8-4 5.8-4s5 1.4 5.7 4" />
        <path d="M13.5 18.8c.6-1.8 1.9-2.9 3.9-2.9 1.4 0 2.6.6 3.2 1.7" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5 19c1.2-3 3.5-4.5 7-4.5S17.8 16 19 19" />
    </svg>
  )
}

export default function SearchPage() {
  const pathname = usePathname()
  const safePathname = pathname ?? ROUTES.SEARCH

  const [filters, setFilters] = useState<MemberSearchFilters>(INITIAL_FILTERS)
  const [showFilters, setShowFilters] = useState(false)
  const [results, setResults] = useState<MemberSearchResult[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [activeFriendId, setActiveFriendId] = useState<string | null>(null)
  const [activeGestureId, setActiveGestureId] = useState<string | null>(null)
  const [openGestureMenuId, setOpenGestureMenuId] = useState<string | null>(null)
  const [friendFeedback, setFriendFeedback] = useState<Record<string, string>>({})

  useEffect(() => {
    if (window.matchMedia('(min-width: 1024px)').matches) {
      setShowFilters(true)
    }
  }, [])

  const activeFilterCount = useMemo(() => {
    let count = 0

    if (filters.q?.trim()) {
      count += 1
    }

    if (filters.location) {
      count += 1
    }

    if ((filters.minAge ?? MIN_AGE) !== MIN_AGE || (filters.maxAge ?? MAX_AGE) !== MAX_AGE) {
      count += 1
    }

    if (filters.gender) {
      count += 1
    }

    if (filters.orientation) {
      count += 1
    }

    if (filters.onlineOnly) {
      count += 1
    }

    if (filters.lookingFor && filters.lookingFor.length > 0) {
      count += 1
    }

    if (filters.hasPhoto) {
      count += 1
    }

    if (filters.lastActive && filters.lastActive !== 'any') {
      count += 1
    }

    return count
  }, [filters])

  async function handleAddFriend(memberId: string) {
    try {
      setActiveFriendId(memberId)
      setFriendFeedback((current) => ({ ...current, [memberId]: '' }))
      await sendFriendRequest(memberId)

      setResults((current) =>
        current.map((member) =>
          member.id === memberId
            ? {
                ...member,
                friendshipStatus: 'outgoing_pending',
              }
            : member
        )
      )

      setFriendFeedback((current) => ({ ...current, [memberId]: 'Friend request sent.' }))
    } catch (error) {
      setFriendFeedback((current) => ({
        ...current,
        [memberId]: error instanceof Error ? error.message : 'Failed to send friend request.',
      }))
    } finally {
      setActiveFriendId(null)
    }
  }

  async function handleGesture(memberId: string, kind: 'poke' | 'wink' | 'wave') {
    try {
      setActiveGestureId(memberId)
      setFriendFeedback((current) => ({ ...current, [memberId]: '' }))
      await sendGesture(memberId, kind)
      const label = kind === 'wink' ? 'Wink sent.' : kind === 'wave' ? 'Wave sent.' : 'Poke sent.'
      setFriendFeedback((current) => ({ ...current, [memberId]: label }))
      setOpenGestureMenuId(null)
    } catch (error) {
      setFriendFeedback((current) => ({
        ...current,
        [memberId]: error instanceof Error ? error.message : 'Failed to send gesture.',
      }))
    } finally {
      setActiveGestureId(null)
    }
  }

  useEffect(() => {
    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      try {
        setIsLoading(true)
        setLoadError('')

        const response = await searchMembers(filters, controller.signal)
        setResults(response.members)
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return
        }

        setLoadError(
          error instanceof Error && error.message
            ? error.message
            : 'Unable to load member search right now.'
        )
      } finally {
        setIsLoading(false)
      }
    }, 280)

    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [filters])

  const toggleSeeking = (value: string) => {
    setFilters((current) => {
      const existing = current.lookingFor || []
      return {
        ...current,
        lookingFor: existing.includes(value)
          ? existing.filter((v) => v !== value)
          : [...existing, value],
      }
    })
  }

  const setRoleFilter = (role: string) => {
    setFilters((current) => {
      const withoutRole = (current.lookingFor || []).filter((v) => !ROLE_OPTIONS.includes(v))
      return {
        ...current,
        lookingFor: role ? [...withoutRole, role] : withoutRole,
      }
    })
  }

  const resetFilters = () => {
    setFilters(INITIAL_FILTERS)
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#090b10] text-stone-100">
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat opacity-38"
        style={{ backgroundImage: "url('/welcome2.jpg')" }}
      />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(8,11,18,0.6)_0%,rgba(6,8,12,0.74)_100%)]" />

      <TopQuickNav className="left-60 right-4 md:left-28 md:right-6" />

      <div className="group/sidebar fixed inset-y-0 left-0 z-30 flex w-56 overflow-hidden border-r border-white/10 bg-[#0d1117]/78 px-4 py-5 backdrop-blur-md md:w-[84px] md:hover:w-64 md:transition-[width] md:duration-300">
        <aside className="flex h-full w-full flex-col">
          <div className="px-2">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/[0.04] text-sm font-semibold text-stone-100 md:group-hover/sidebar:hidden">
              F
            </div>
            <p className="hidden font-[var(--font-display)] text-3xl leading-none text-stone-100 md:group-hover/sidebar:block">fuxem</p>
            <p className="mt-2 hidden text-[10px] uppercase tracking-[0.22em] text-stone-400 md:group-hover/sidebar:block">Private member lounge</p>
          </div>

          <nav className="mt-7 space-y-1.5">
            {NAV_ITEMS.map((item) => {
              const active = safePathname === item.href

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={`Open ${item.label}`}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${active
                    ? 'border border-white/20 bg-white/[0.08] text-stone-100'
                    : 'border border-transparent text-stone-300 hover:border-white/10 hover:bg-white/[0.03] hover:text-stone-100'
                    } md:justify-center md:px-0 md:group-hover/sidebar:justify-start md:group-hover/sidebar:px-3`}
                >
                  <span className="opacity-90">
                    <NavIcon label={item.label} />
                  </span>
                  <span className="hidden md:group-hover/sidebar:inline">{item.label}</span>
                </Link>
              )
            })}
          </nav>

          <div className="mt-auto rounded-2xl border border-white/10 bg-white/[0.03] p-3">
            <p className="hidden text-xs uppercase tracking-[0.18em] text-stone-400 md:group-hover/sidebar:block">Discovery Tip</p>
            <p className="hidden pt-2 text-xs leading-relaxed text-stone-300 md:group-hover/sidebar:block">
              Keep your profile public and interests updated to appear in more relevant searches.
            </p>
          </div>
        </aside>
      </div>

      <main className="relative z-10 mx-auto w-full space-y-5 px-4 pb-16 pt-24 pl-60 sm:px-6 md:pl-28 md:pr-8 md:pt-24">
          <header className="rounded-3xl border border-white/12 bg-black/30 p-4 backdrop-blur-lg sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-stone-300/80">Member Search</p>
                <h2 className="mt-2 font-[family:var(--font-display)] text-3xl text-stone-100">
                  Find your next connection
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={ROUTES.MESSAGESS}
                  title="Open your inbox"
                  className="text-sm font-medium text-stone-300 underline decoration-white/25 underline-offset-4 transition hover:text-white hover:decoration-white"
                >
                  Inbox
                </Link>
                <Link
                  href={ROUTES.PROFILE}
                  title="Edit your profile"
                  className="text-sm font-medium text-stone-300 underline decoration-white/25 underline-offset-4 transition hover:text-white hover:decoration-white"
                >
                  Edit Profile
                </Link>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-sm font-medium text-stone-300 underline decoration-white/25 underline-offset-4 transition hover:text-white hover:decoration-white"
                >
                  Reset filters
                </button>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-white/12 bg-black/25 p-3 sm:p-4">
              <label htmlFor="search-query" className="text-xs uppercase tracking-[0.16em] text-stone-300/80">
                Search by name or username
              </label>
              <input
                id="search-query"
                value={filters.q || ''}
                onChange={(event) => {
                  const value = event.target.value
                  setFilters((current) => ({ ...current, q: value }))
                }}
                placeholder="Try: alex, @ravenluxe"
                  className="mt-2 w-full rounded-xl border border-white/15 bg-black/35 px-4 py-3 text-sm text-stone-100 outline-none transition placeholder:text-stone-400/80 focus:border-white/35"
              />
            </div>
          </header>

          <section className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
            <aside className="rounded-3xl border border-white/10 bg-black/20 p-4 backdrop-blur-lg sm:p-5">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-stone-300/80">Filters</p>
                  <p className="text-xs text-stone-300">{activeFilterCount} active</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowFilters((current) => !current)}
                  className="rounded-lg border border-white/20 bg-black/20 px-3 py-1.5 text-[11px] uppercase tracking-[0.14em] text-stone-200 transition hover:border-white/35 hover:text-white"
                >
                  {showFilters ? 'Hide' : 'Show'}
                </button>
              </div>

              {showFilters && (
                <div className="mt-5 space-y-5">
                <div>
                  <label className="text-xs uppercase tracking-[0.16em] text-stone-300" htmlFor="location-filter">
                    Location
                  </label>
                  <select
                    id="location-filter"
                    value={filters.location || ''}
                    onChange={(event) => {
                      const value = event.target.value
                      setFilters((current) => ({ ...current, location: value }))
                    }}
                    className="mt-2 w-full rounded-lg border border-white/15 bg-black/35 px-3 py-2 text-sm outline-none transition focus:border-white/35"
                  >
                    <option value="">Any location</option>
                    {SEARCH_LOCATION_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-stone-300">Age range</p>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <label className="space-y-1">
                      <span className="text-[11px] uppercase tracking-[0.12em] text-stone-400">Min</span>
                      <input
                        type="number"
                        min={MIN_AGE}
                        max={MAX_AGE}
                        value={filters.minAge ?? MIN_AGE}
                        onChange={(event) => {
                          const value = asNumber(event.target.value, MIN_AGE)
                          setFilters((current) => ({ ...current, minAge: value }))
                        }}
                        className="w-full rounded-lg border border-white/15 bg-black/35 px-3 py-2 text-sm outline-none transition focus:border-white/35"
                      />
                    </label>

                    <label className="space-y-1">
                      <span className="text-[11px] uppercase tracking-[0.12em] text-stone-400">Max</span>
                      <input
                        type="number"
                        min={MIN_AGE}
                        max={MAX_AGE}
                        value={filters.maxAge ?? MAX_AGE}
                        onChange={(event) => {
                          const value = asNumber(event.target.value, MAX_AGE)
                          setFilters((current) => ({ ...current, maxAge: value }))
                        }}
                        className="w-full rounded-lg border border-white/15 bg-black/35 px-3 py-2 text-sm outline-none transition focus:border-white/35"
                      />
                    </label>
                  </div>
                </div>

                <div>
                  <label className="text-xs uppercase tracking-[0.16em] text-stone-300" htmlFor="gender-filter">
                    Gender
                  </label>
                  <select
                    id="gender-filter"
                    value={filters.gender || ''}
                    onChange={(event) => {
                      const value = event.target.value
                      setFilters((current) => ({ ...current, gender: value }))
                    }}
                    className="mt-2 w-full rounded-lg border border-white/15 bg-black/35 px-3 py-2 text-sm outline-none transition focus:border-white/35"
                  >
                    <option value="">Any gender</option>
                    {GENDER_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    className="text-xs uppercase tracking-[0.16em] text-stone-300"
                    htmlFor="orientation-filter"
                  >
                    Orientation
                  </label>
                  <select
                    id="orientation-filter"
                    value={filters.orientation || ''}
                    onChange={(event) => {
                      const value = event.target.value
                      setFilters((current) => ({ ...current, orientation: value }))
                    }}
                    className="mt-2 w-full rounded-lg border border-white/15 bg-black/35 px-3 py-2 text-sm outline-none transition focus:border-white/35"
                  >
                    <option value="">Any orientation</option>
                    {ORIENTATION_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs uppercase tracking-[0.16em] text-stone-300" htmlFor="role-filter">
                    Role
                  </label>
                  <select
                    id="role-filter"
                    value={(filters.lookingFor || []).find((v) => ROLE_OPTIONS.includes(v)) || ''}
                    onChange={(event) => setRoleFilter(event.target.value)}
                    className="mt-2 w-full rounded-lg border border-white/15 bg-black/35 px-3 py-2 text-sm outline-none transition focus:border-white/35"
                  >
                    <option value="">Any role</option>
                    {ROLE_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-stone-300">Seeking</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {LOOKING_FOR_OPTIONS.map((option) => {
                      const active = (filters.lookingFor || []).includes(option)
                      return (
                        <button
                          key={option}
                          type="button"
                          onClick={() => toggleSeeking(option)}
                          className={`rounded-full px-3 py-1 text-[11px] transition ${
                            active
                              ? 'border border-white/40 bg-white/15 text-stone-100'
                              : 'border border-white/15 bg-black/20 text-stone-300 hover:border-white/30 hover:text-stone-100'
                          }`}
                        >
                          {option}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <label className="text-xs uppercase tracking-[0.16em] text-stone-300" htmlFor="last-active-filter">
                    Last active
                  </label>
                  <select
                    id="last-active-filter"
                    value={filters.lastActive || 'any'}
                    onChange={(event) => {
                      const value = event.target.value as 'today' | 'week' | 'any'
                      setFilters((current) => ({ ...current, lastActive: value }))
                    }}
                    className="mt-2 w-full rounded-lg border border-white/15 bg-black/35 px-3 py-2 text-sm outline-none transition focus:border-white/35"
                  >
                    <option value="any">Any time</option>
                    <option value="today">Today</option>
                    <option value="week">This week</option>
                  </select>
                </div>

                <label className="flex cursor-pointer items-center justify-between rounded-xl border border-white/15 bg-black/25 px-3 py-2">
                  <span className="text-sm text-stone-200">Has photo</span>
                  <input
                    type="checkbox"
                    checked={filters.hasPhoto || false}
                    onChange={(event) => {
                      const checked = event.target.checked
                      setFilters((current) => ({ ...current, hasPhoto: checked }))
                    }}
                    className="h-4 w-4 rounded border-white/30 bg-transparent text-stone-100"
                  />
                </label>

                <label className="flex cursor-pointer items-center justify-between rounded-xl border border-white/15 bg-black/25 px-3 py-2">
                  <span className="text-sm text-stone-200">Online only</span>
                  <input
                    type="checkbox"
                    checked={filters.onlineOnly || false}
                    onChange={(event) => {
                      const checked = event.target.checked
                      setFilters((current) => ({ ...current, onlineOnly: checked }))
                    }}
                    className="h-4 w-4 rounded border-white/30 bg-transparent text-stone-100"
                  />
                </label>
                </div>
              )}
            </aside>

            <section>
              <div className="mb-3 flex items-center justify-between px-1">
                <p className="text-sm text-stone-200">{results.length} members shown</p>
                {isLoading && (
                  <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.15em] text-stone-200">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/25 border-t-white" />
                    Refreshing...
                  </div>
                )}
              </div>

              {loadError && (
                <p className="mb-4 rounded-xl border border-rose-400/35 bg-rose-500/20 p-4 text-sm text-rose-100">
                  {loadError}
                </p>
              )}

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {results.map((member) => (
                  <article
                    key={member.id}
                    className="group rounded-3xl border border-white/12 bg-black/30 p-4 shadow-[0_8px_22px_rgba(0,0,0,0.22)] backdrop-blur-md transition hover:-translate-y-0.5 hover:border-white/25"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {member.avatarUrl ? (
                          <div
                            className="h-14 w-14 rounded-2xl border border-white/20 bg-cover bg-center"
                            style={{ backgroundImage: `url(${member.avatarUrl})` }}
                          />
                        ) : (
                          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-lg font-semibold text-stone-100">
                            {getInitials(member.displayName || member.username)}
                          </div>
                        )}

                        <div>
                          <p className="font-semibold text-white">{member.displayName}</p>
                          <p className="text-sm text-stone-300">@{member.username}</p>
                        </div>
                      </div>

                      {member.isOnline ? (
                        <span className="rounded-full border border-emerald-200/40 bg-emerald-500/20 px-2 py-1 text-[10px] uppercase tracking-[0.15em] text-emerald-100">
                          Online
                        </span>
                      ) : (
                        <span className="rounded-full border border-white/20 bg-white/10 px-2 py-1 text-[10px] uppercase tracking-[0.15em] text-stone-300">
                          Recently active
                        </span>
                      )}
                    </div>

                    <div className="mt-4 space-y-1 text-sm text-stone-200">
                      <p>{member.location || 'Location hidden'}</p>
                      <p>{member.age ? `${member.age} years old` : 'Age hidden'}</p>
                    </div>

                    <p className="mt-3 min-h-[3.75rem] text-sm leading-relaxed text-stone-300">
                      {member.bio || 'No bio yet, but open to conversation.'}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {member.lookingFor.slice(0, 1).map((item) => (
                        <span
                          key={`${member.id}-${item}`}
                          className="rounded-full border border-white/20 bg-white/10 px-2 py-1 text-[11px] text-stone-100"
                        >
                          {item}
                        </span>
                      ))}
                      {member.interests.slice(0, 2).map((item) => (
                        <span
                          key={`${member.id}-interest-${item}`}
                          className="rounded-full border border-white/20 bg-white/10 px-2 py-1 text-[11px] text-stone-200"
                        >
                          {item}
                        </span>
                      ))}
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-2">
                      <Link
                        href={`${ROUTES.MESSAGESS}/${member.id}`}
                        title={`Preview chat with ${member.displayName}`}
                        className="rounded-xl border border-white/20 bg-white/[0.05] px-3 py-2 text-center text-xs font-semibold uppercase tracking-[0.12em] text-stone-100 transition hover:border-white/35 hover:bg-white/[0.08]"
                        aria-label={`Message ${member.displayName}`}
                      >
                        Message
                      </Link>

                      <button
                        type="button"
                        onClick={() => handleAddFriend(member.id)}
                        disabled={
                          activeFriendId === member.id ||
                          member.friendshipStatus === 'friends' ||
                          member.friendshipStatus === 'outgoing_pending' ||
                          member.friendshipStatus === 'incoming_pending'
                        }
                        className="rounded-xl border border-white/25 bg-black/25 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-stone-200 transition hover:border-white/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label={`Add ${member.displayName} as a friend`}
                      >
                        {activeFriendId === member.id
                          ? 'Sending...'
                          : member.friendshipStatus === 'friends'
                            ? 'Friends'
                            : member.friendshipStatus === 'outgoing_pending'
                              ? 'Pending'
                              : member.friendshipStatus === 'incoming_pending'
                                ? 'Respond in Inbox'
                                : 'Add'}
                      </button>

                      <button
                        type="button"
                        onClick={() => setOpenGestureMenuId((current) => current === member.id ? null : member.id)}
                        disabled={activeGestureId === member.id}
                        title={`Send a quick gesture to ${member.displayName}`}
                        className="rounded-xl border border-rose-200/30 bg-rose-400/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-rose-100 transition hover:border-rose-200/50 hover:bg-rose-400/20 disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label={`Gesture options for ${member.displayName}`}
                      >
                        {activeGestureId === member.id ? 'Sending...' : 'Poke...'}
                      </button>
                    </div>

                    {openGestureMenuId === member.id && (
                      <div className="mt-2 grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => handleGesture(member.id, 'poke')}
                          disabled={activeGestureId === member.id}
                          className="rounded-lg border border-amber-200/35 bg-amber-300/15 px-2 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-100 transition hover:bg-amber-300/25 disabled:opacity-50"
                        >
                          Poke
                        </button>
                        <button
                          type="button"
                          onClick={() => handleGesture(member.id, 'wink')}
                          disabled={activeGestureId === member.id}
                          className="rounded-lg border border-fuchsia-200/30 bg-fuchsia-300/10 px-2 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-fuchsia-100 transition hover:bg-fuchsia-300/20 disabled:opacity-50"
                        >
                          Wink
                        </button>
                        <button
                          type="button"
                          onClick={() => handleGesture(member.id, 'wave')}
                          disabled={activeGestureId === member.id}
                          className="rounded-lg border border-sky-200/30 bg-sky-300/10 px-2 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-sky-100 transition hover:bg-sky-300/20 disabled:opacity-50"
                        >
                          Wave
                        </button>
                      </div>
                    )}

                    {friendFeedback[member.id] && (
                      <p className="mt-2 text-xs text-stone-300">{friendFeedback[member.id]}</p>
                    )}
                  </article>
                ))}
              </div>

              {!isLoading && results.length === 0 && !loadError && (
                <div className="mt-4 rounded-2xl border border-white/10 bg-black/25 p-8 text-center">
                  <p className="text-lg font-semibold text-stone-100">No members match these filters yet</p>
                  <p className="mt-2 text-sm text-stone-300">Try widening the age range or clearing the role filter.</p>
                </div>
              )}
            </section>
          </section>
        </main>
    </div>
  )
}