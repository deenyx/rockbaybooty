'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

import { searchMembers } from '@/lib/api'
import {
  GENDER_OPTIONS,
  MAX_AGE,
  MIN_AGE,
  ORIENTATION_OPTIONS,
  ROLE_OPTIONS,
  ROUTES,
} from '@/lib/constants'
import type { MemberSearchFilters, MemberSearchResult } from '@/lib/types'

const NAV_ITEMS = [
  { label: 'Profile', href: ROUTES.PROFILE },
  { label: 'Search', href: ROUTES.SEARCH },
  { label: 'Messages', href: ROUTES.CHAT },
  { label: 'Groups', href: ROUTES.GROUPS },
  { label: 'Classifieds', href: ROUTES.CLASSIFIEDS },
]

const INITIAL_FILTERS: MemberSearchFilters = {
  q: '',
  minAge: MIN_AGE,
  maxAge: MAX_AGE,
  gender: '',
  orientation: '',
  lookingFor: [],
  onlineOnly: false,
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

export default function SearchPage() {
  const pathname = usePathname()

  const [filters, setFilters] = useState<MemberSearchFilters>(INITIAL_FILTERS)
  const [results, setResults] = useState<MemberSearchResult[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const activeFilterCount = useMemo(() => {
    let count = 0

    if (filters.q?.trim()) {
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

    return count
  }, [filters])

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

  const setRoleFilter = (role: string) => {
    setFilters((current) => ({
      ...current,
      lookingFor: role ? [role] : [],
    }))
  }

  const resetFilters = () => {
    setFilters(INITIAL_FILTERS)
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(255,180,120,0.24),_transparent_40%),radial-gradient(circle_at_top_right,_rgba(255,125,95,0.2),_transparent_42%),linear-gradient(160deg,#12080b_8%,#220d13_48%,#3f141f_100%)] text-stone-100">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <aside className="hidden w-64 shrink-0 rounded-3xl border border-white/10 bg-black/30 p-5 backdrop-blur-xl md:block">
          <p className="text-xs uppercase tracking-[0.22em] text-amber-100/70">Member Area</p>
          <h1 className="mt-3 font-[family:var(--font-display)] text-3xl text-amber-100">Search</h1>

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

          <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-stone-300">
            <p className="uppercase tracking-[0.18em] text-amber-100/70">Discovery Tip</p>
            <p className="mt-2 leading-relaxed">
              Keep your profile public and interests updated to appear in more relevant searches.
            </p>
          </div>
        </aside>

        <main className="flex-1 space-y-5">
          <header className="rounded-3xl border border-white/10 bg-black/30 p-4 backdrop-blur-xl sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-amber-100/70">Member Search</p>
                <h2 className="mt-2 font-[family:var(--font-display)] text-3xl text-amber-100">
                  Find your next connection
                </h2>
              </div>

              <button
                type="button"
                onClick={resetFilters}
                className="rounded-xl border border-white/20 px-4 py-2 text-xs uppercase tracking-[0.15em] text-stone-200 transition hover:border-amber-100/35 hover:text-amber-100"
              >
                Reset filters
              </button>
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-black/35 p-3 sm:p-4">
              <label htmlFor="search-query" className="text-xs uppercase tracking-[0.16em] text-amber-100/75">
                Search name, location, interests
              </label>
              <input
                id="search-query"
                value={filters.q || ''}
                onChange={(event) => {
                  const value = event.target.value
                  setFilters((current) => ({ ...current, q: value }))
                }}
                placeholder="Try: alex, victoria, roleplay"
                className="mt-2 w-full rounded-xl border border-white/15 bg-black/35 px-4 py-3 text-sm text-stone-100 outline-none transition placeholder:text-stone-400/80 focus:border-amber-200/45"
              />
            </div>
          </header>

          <section className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
            <aside className="rounded-3xl border border-white/10 bg-black/30 p-4 backdrop-blur-xl sm:p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.2em] text-amber-100/70">Filters</p>
                <p className="text-xs text-stone-300">{activeFilterCount} active</p>
              </div>

              <div className="mt-5 space-y-5">
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
                        className="w-full rounded-lg border border-white/15 bg-black/35 px-3 py-2 text-sm outline-none transition focus:border-amber-200/45"
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
                        className="w-full rounded-lg border border-white/15 bg-black/35 px-3 py-2 text-sm outline-none transition focus:border-amber-200/45"
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
                    className="mt-2 w-full rounded-lg border border-white/15 bg-black/35 px-3 py-2 text-sm outline-none transition focus:border-amber-200/45"
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
                    className="mt-2 w-full rounded-lg border border-white/15 bg-black/35 px-3 py-2 text-sm outline-none transition focus:border-amber-200/45"
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
                    value={filters.lookingFor?.[0] || ''}
                    onChange={(event) => setRoleFilter(event.target.value)}
                    className="mt-2 w-full rounded-lg border border-white/15 bg-black/35 px-3 py-2 text-sm outline-none transition focus:border-amber-200/45"
                  >
                    <option value="">Any role</option>
                    {ROLE_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <label className="flex cursor-pointer items-center justify-between rounded-xl border border-white/15 bg-black/25 px-3 py-2">
                  <span className="text-sm text-stone-200">Online only</span>
                  <input
                    type="checkbox"
                    checked={filters.onlineOnly || false}
                    onChange={(event) => {
                      const checked = event.target.checked
                      setFilters((current) => ({ ...current, onlineOnly: checked }))
                    }}
                    className="h-4 w-4 rounded border-white/30 bg-transparent text-amber-200"
                  />
                </label>
              </div>
            </aside>

            <section>
              <div className="mb-3 flex items-center justify-between px-1">
                <p className="text-sm text-stone-200">{results.length} members shown</p>
                {isLoading && <p className="text-xs uppercase tracking-[0.15em] text-amber-100/75">Refreshing...</p>}
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
                    className="group rounded-3xl border border-white/15 bg-[linear-gradient(160deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] p-4 shadow-[0_14px_40px_rgba(0,0,0,0.35)] backdrop-blur transition hover:-translate-y-0.5 hover:border-amber-100/35"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {member.avatarUrl ? (
                          <div
                            className="h-14 w-14 rounded-2xl border border-white/20 bg-cover bg-center"
                            style={{ backgroundImage: `url(${member.avatarUrl})` }}
                          />
                        ) : (
                          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 bg-amber-500/20 text-lg font-semibold text-amber-100">
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
                          className="rounded-full border border-amber-100/30 bg-amber-300/15 px-2 py-1 text-[11px] text-amber-100"
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

                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        className="rounded-xl border border-amber-200/40 bg-amber-300/20 px-3 py-2 text-sm font-semibold text-amber-100 transition hover:border-amber-100/70 hover:bg-amber-200/30"
                        aria-label={`Message ${member.displayName}`}
                      >
                        Message
                      </button>

                      <button
                        type="button"
                        className="rounded-xl border border-white/25 bg-black/30 px-3 py-2 text-sm font-semibold text-stone-200 transition hover:border-white/40 hover:text-white"
                        aria-label={`Add ${member.displayName} as friend`}
                      >
                        Add Friend
                      </button>
                    </div>
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
    </div>
  )
}