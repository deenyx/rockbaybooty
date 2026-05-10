"use client"

import Link from 'next/link'
import { useEffect, useState } from 'react'

import TopQuickNav from '@/app/_components/top-quick-nav'
import { fetchSafetySummary } from '@/lib/api'
import { ROUTES } from '@/lib/constants'

export default function SafetyPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [blocked, setBlocked] = useState<Array<{
    blockedId: string
    createdAt: string
    username: string
    displayName: string
    avatarUrl: string | null
  }>>([])
  const [reportCounts, setReportCounts] = useState({
    pending: 0,
    reviewed: 0,
    dismissed: 0,
    actioned: 0,
  })

  useEffect(() => {
    let mounted = true

    async function load() {
      try {
        const response = await fetchSafetySummary()
        if (!mounted) return
        setBlocked(response.blocked)
        setReportCounts(response.reportCounts)
      } catch (loadError) {
        if (!mounted) return
        setError(loadError instanceof Error ? loadError.message : 'Unable to load safety data.')
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
          <p className="text-xs uppercase tracking-[0.24em] text-stone-300/80">Trust & Safety</p>
          <h1 className="mt-3 font-[family:var(--font-display)] text-4xl text-stone-100 sm:text-5xl">Safety Center</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-stone-300 sm:text-base">
            A single place for blocking, reporting, and healthy community guidelines.
          </p>

          {!isLoading && !error && (
            <div className="mt-6 grid gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <p className="text-[10px] uppercase tracking-[0.16em] text-stone-400">Blocked</p>
                <p className="mt-1 text-2xl font-semibold text-stone-100">{blocked.length}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <p className="text-[10px] uppercase tracking-[0.16em] text-stone-400">Pending Reports</p>
                <p className="mt-1 text-2xl font-semibold text-stone-100">{reportCounts.pending}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <p className="text-[10px] uppercase tracking-[0.16em] text-stone-400">Reviewed</p>
                <p className="mt-1 text-2xl font-semibold text-stone-100">{reportCounts.reviewed}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <p className="text-[10px] uppercase tracking-[0.16em] text-stone-400">Actioned</p>
                <p className="mt-1 text-2xl font-semibold text-stone-100">{reportCounts.actioned}</p>
              </div>
            </div>
          )}
        </section>

        {error && (
          <p className="rounded-xl border border-rose-400/35 bg-rose-500/20 p-4 text-sm text-rose-100">{error}</p>
        )}

        {isLoading && (
          <div className="flex justify-center py-10">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-300/35 border-t-amber-100" />
          </div>
        )}

        {!isLoading && (
          <section className="grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl border border-white/10 bg-black/30 p-5 backdrop-blur">
            <h2 className="text-lg font-semibold text-stone-100">Report a member</h2>
            <p className="mt-2 text-sm text-stone-300">Fast path to submit harassment, spam, or impersonation reports.</p>
          </article>
          <article className="rounded-2xl border border-white/10 bg-black/30 p-5 backdrop-blur">
            <h2 className="text-lg font-semibold text-stone-100">Blocked users</h2>
            <p className="mt-2 text-sm text-stone-300">Review and manage your blocked list in one view.</p>
            {blocked.length > 0 && (
              <ul className="mt-3 space-y-1 text-xs text-stone-400">
                {blocked.slice(0, 5).map((entry) => (
                  <li key={entry.blockedId}>• {entry.displayName || entry.username}</li>
                ))}
              </ul>
            )}
          </article>
          <article className="rounded-2xl border border-white/10 bg-black/30 p-5 backdrop-blur">
            <h2 className="text-lg font-semibold text-stone-100">Safety tips</h2>
            <p className="mt-2 text-sm text-stone-300">Practical guidance for private, consent-forward interactions.</p>
          </article>
          </section>
        )}

        <div className="flex flex-wrap gap-3">
          <Link href={ROUTES.SETTINGS} className="rounded-xl border border-white/20 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-stone-100 transition hover:border-white/35 hover:bg-white/[0.1]">
            Open settings
          </Link>
          <Link href={ROUTES.NOTIFICATIONS} className="rounded-xl border border-white/20 px-4 py-2 text-sm text-stone-200 transition hover:border-white/35 hover:bg-white/[0.04]">
            View notifications
          </Link>
        </div>
      </main>
    </div>
  )
}
