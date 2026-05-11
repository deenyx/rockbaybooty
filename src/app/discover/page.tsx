"use client"

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

import TopQuickNav from '@/app/_components/top-quick-nav'
import { fetchDiscover } from '@/lib/api'
import { ROUTES } from '@/lib/constants'
import type { DiscoverMember } from '@/lib/types'

export default function DiscoverPage() {
  const [onlineMembers, setOnlineMembers] = useState<DiscoverMember[]>([])
  const [newMembers, setNewMembers] = useState<DiscoverMember[]>([])
  const [trendingInterests, setTrendingInterests] = useState<Array<{ label: string; count: number }>>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true

    async function load() {
      try {
        const response = await fetchDiscover()
        if (!mounted) return

        setOnlineMembers(response.onlineMembers)
        setNewMembers(response.newMembers)
        setTrendingInterests(response.trendingInterests)
      } catch (loadError) {
        if (!mounted) return
        setError(loadError instanceof Error ? loadError.message : 'Unable to load discover feed right now.')
      } finally {
        if (mounted) setIsLoading(false)
      }
    }

    void load()

    return () => {
      mounted = false
    }
  }, [])

  const headlineStats = useMemo(() => {
    return [
      { label: 'Online now', value: onlineMembers.length },
      { label: 'New this week', value: newMembers.length },
      { label: 'Trending tags', value: trendingInterests.length },
    ]
  }, [onlineMembers.length, newMembers.length, trendingInterests.length])

  function getDisplayName(member: DiscoverMember) {
    return member.displayName || member.username
  }

  function getLocation(member: DiscoverMember) {
    return [member.city, member.country].filter(Boolean).join(', ') || 'Location hidden'
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#090b10] px-4 pb-8 pt-24 text-stone-100 sm:px-6 lg:px-8">
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30"
        style={{ backgroundImage: "url('/welcome2.jpg')" }}
      />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(8,11,18,0.7)_0%,rgba(6,8,12,0.84)_100%)]" />

      <TopQuickNav className="left-4 right-4 md:left-6 md:right-6" />

      <main className="relative z-10 mx-auto max-w-5xl space-y-6">
        <section className="rounded-3xl border border-white/10 bg-black/30 p-6 backdrop-blur-xl sm:p-8">
          <p className="text-xs uppercase tracking-[0.24em] text-stone-300/80">Discover</p>
          <h1 className="mt-3 font-[family:var(--font-display)] text-4xl text-stone-100 sm:text-5xl">Now Active</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-stone-300 sm:text-base">
            A fast browse surface for who is online, who joined recently, and what is trending right now.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {headlineStats.map((stat) => (
              <div key={stat.label} className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <p className="text-[10px] uppercase tracking-[0.16em] text-stone-400">{stat.label}</p>
                <p className="mt-1 text-2xl font-semibold text-stone-100">{stat.value}</p>
              </div>
            ))}
          </div>
        </section>

        {error && (
          <p className="rounded-xl border border-rose-400/35 bg-rose-500/20 p-4 text-sm text-rose-100">
            {error}
          </p>
        )}

        {isLoading ? (
          <div className="flex justify-center py-10">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-300/35 border-t-amber-100" />
          </div>
        ) : (
          <>
            <section className="rounded-3xl border border-white/10 bg-black/30 p-6 backdrop-blur-xl">
              <p className="text-xs uppercase tracking-[0.16em] text-stone-400">Members</p>
              <h2 className="mt-2 text-2xl font-semibold text-stone-100">Online right now</h2>
              {onlineMembers.length === 0 ? (
                <p className="mt-3 text-sm text-stone-300">No members are online right now.</p>
              ) : (
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {onlineMembers.map((member) => (
                    <Link
                      key={member.id}
                      href={`/u/${member.username}`}
                      className="rounded-xl border border-white/10 bg-white/[0.03] p-3 transition hover:border-white/25"
                    >
                      <p className="font-semibold text-stone-100">{getDisplayName(member)}</p>
                      <p className="text-xs text-stone-400">@{member.username}</p>
                      <p className="mt-1 text-xs text-stone-400">{getLocation(member)}</p>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-3xl border border-white/10 bg-black/30 p-6 backdrop-blur-xl">
              <p className="text-xs uppercase tracking-[0.16em] text-stone-400">Fresh Faces</p>
              <h2 className="mt-2 text-2xl font-semibold text-stone-100">Newest profiles</h2>
              {newMembers.length === 0 ? (
                <p className="mt-3 text-sm text-stone-300">No new members found in the past week.</p>
              ) : (
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {newMembers.map((member) => (
                    <Link
                      key={member.id}
                      href={`/u/${member.username}`}
                      className="rounded-xl border border-white/10 bg-white/[0.03] p-3 transition hover:border-white/25"
                    >
                      <p className="font-semibold text-stone-100">{getDisplayName(member)}</p>
                      <p className="text-xs text-stone-400">@{member.username}</p>
                      <p className="mt-1 text-xs text-stone-400">{getLocation(member)}</p>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-3xl border border-white/10 bg-black/30 p-6 backdrop-blur-xl">
              <p className="text-xs uppercase tracking-[0.16em] text-stone-400">Hot Topics</p>
              <h2 className="mt-2 text-2xl font-semibold text-stone-100">Trending tags</h2>
              {trendingInterests.length === 0 ? (
                <p className="mt-3 text-sm text-stone-300">Not enough activity yet to calculate trends.</p>
              ) : (
                <div className="mt-4 flex flex-wrap gap-2">
                  {trendingInterests.map((interest) => (
                    <span
                      key={interest.label}
                      className="rounded-full border border-white/20 bg-white/[0.04] px-3 py-1 text-xs text-stone-200"
                    >
                      {interest.label} · {interest.count}
                    </span>
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        <div className="flex flex-wrap gap-3">
          <Link href={ROUTES.SEARCH} className="rounded-xl border border-white/20 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-stone-100 transition hover:border-white/35 hover:bg-white/[0.1]">
            Open full search
          </Link>
          <Link href={ROUTES.GROUPS} className="rounded-xl border border-white/20 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-stone-100 transition hover:border-white/35 hover:bg-white/[0.1]">
            Browse groups
          </Link>
          <Link href={ROUTES.DASHBOARD} className="rounded-xl border border-white/20 px-4 py-2 text-sm text-stone-200 transition hover:border-white/35 hover:bg-white/[0.04]">
            Back to dashboard
          </Link>
        </div>
      </main>
    </div>
  )
}
