"use client"

import Link from 'next/link'
import { useEffect, useState } from 'react'

import TopQuickNav from '@/app/_components/top-quick-nav'
import { fetchMembershipStatus } from '@/lib/api'
import { ROUTES } from '@/lib/constants'

const TIERS = [
  {
    name: 'Member',
    price: '$0',
    points: ['Profile + search', 'Direct messages', 'Community access'],
  },
  {
    name: 'Premium',
    price: '$19',
    points: ['Public video posting', 'Priority discovery placement', 'Early feature access'],
  },
]

export default function MembershipPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [status, setStatus] = useState<{
    isPremium: boolean
    isVerified: boolean
    memberSince: string
    totalVideos: number
    publicVideos: number
    totalViews: number
  } | null>(null)

  useEffect(() => {
    let mounted = true

    async function load() {
      try {
        const response = await fetchMembershipStatus()
        if (!mounted) return
        setStatus(response)
      } catch (loadError) {
        if (!mounted) return
        setError(loadError instanceof Error ? loadError.message : 'Unable to load membership status.')
      } finally {
        if (mounted) setIsLoading(false)
      }
    }

    void load()

    return () => {
      mounted = false
    }
  }, [])

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
          <p className="text-xs uppercase tracking-[0.24em] text-stone-300/80">Membership</p>
          <h1 className="mt-3 font-[family:var(--font-display)] text-4xl text-stone-100 sm:text-5xl">Plans & Perks</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-stone-300 sm:text-base">
            A dedicated space for plan details, billing status, and premium feature comparison.
          </p>

          {isLoading ? (
            <p className="mt-4 text-sm text-stone-300">Loading account status...</p>
          ) : error ? (
            <p className="mt-4 rounded-xl border border-rose-400/35 bg-rose-500/20 p-3 text-sm text-rose-100">{error}</p>
          ) : status ? (
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <p className="text-[10px] uppercase tracking-[0.16em] text-stone-400">Current Plan</p>
                <p className="mt-1 text-lg font-semibold text-stone-100">{status.isPremium ? 'Premium' : 'Member'}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <p className="text-[10px] uppercase tracking-[0.16em] text-stone-400">Member Since</p>
                <p className="mt-1 text-lg font-semibold text-stone-100">{new Date(status.memberSince).toLocaleDateString()}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <p className="text-[10px] uppercase tracking-[0.16em] text-stone-400">Verification</p>
                <p className="mt-1 text-lg font-semibold text-stone-100">{status.isVerified ? 'Verified' : 'Unverified'}</p>
              </div>
            </div>
          ) : null}
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          {TIERS.map((tier) => (
            <article key={tier.name} className="rounded-2xl border border-white/10 bg-black/30 p-5 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.16em] text-stone-400">{tier.name}</p>
              <p className="mt-2 text-3xl font-semibold text-stone-100">{tier.price}<span className="text-sm text-stone-400"> / mo</span></p>
              <ul className="mt-4 space-y-2 text-sm text-stone-300">
                {tier.points.map((point) => (
                  <li key={point}>• {point}</li>
                ))}
              </ul>
            </article>
          ))}
        </section>

        {status && (
          <section className="rounded-3xl border border-white/10 bg-black/30 p-6 backdrop-blur-xl">
            <p className="text-xs uppercase tracking-[0.16em] text-stone-400">Your Video Stats</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <p className="text-[10px] uppercase tracking-[0.16em] text-stone-400">Total Videos</p>
                <p className="mt-1 text-2xl font-semibold text-stone-100">{status.totalVideos}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <p className="text-[10px] uppercase tracking-[0.16em] text-stone-400">Public Videos</p>
                <p className="mt-1 text-2xl font-semibold text-stone-100">{status.publicVideos}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <p className="text-[10px] uppercase tracking-[0.16em] text-stone-400">Total Views</p>
                <p className="mt-1 text-2xl font-semibold text-stone-100">{status.totalViews}</p>
              </div>
            </div>
          </section>
        )}

        <div className="flex flex-wrap gap-3">
          <Link href={ROUTES.VIDEOS} className="rounded-xl border border-white/20 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-stone-100 transition hover:border-white/35 hover:bg-white/[0.1]">
            View premium video flow
          </Link>
          <Link href={ROUTES.SETTINGS} className="rounded-xl border border-white/20 px-4 py-2 text-sm text-stone-200 transition hover:border-white/35 hover:bg-white/[0.04]">
            Account settings
          </Link>
        </div>
      </main>
    </div>
  )
}
