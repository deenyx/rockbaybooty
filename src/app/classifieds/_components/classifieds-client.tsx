'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'

import TopQuickNav from '@/app/_components/top-quick-nav'
import { CLASSIFIED_CATEGORIES, ROUTES } from '@/lib/constants'
import type { ClassifiedListing } from '@/lib/types'
import ClassifiedCard from './classified-card'

type Tab = 'all' | string

export default function ClassifiedsClient() {
  const [listings, setListings] = useState<ClassifiedListing[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<Tab>('all')

  const fetchListings = useCallback(
    async (category: Tab, cursor?: string) => {
      const params = new URLSearchParams()
      if (category !== 'all') params.set('category', category)
      if (cursor) params.set('cursor', cursor)

      const res = await fetch(`/api/classifieds?${params.toString()}`, { credentials: 'include' })

      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error((json as { error?: string }).error || 'Failed to load listings')
      }

      return res.json() as Promise<{ listings: ClassifiedListing[]; nextCursor: string | null }>
    },
    []
  )

  useEffect(() => {
    setLoading(true)
    setError('')
    setListings([])
    setNextCursor(null)

    fetchListings(activeTab)
      .then(({ listings: items, nextCursor: nc }) => {
        setListings(items)
        setNextCursor(nc)
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [activeTab, fetchListings])

  const loadMore = async () => {
    if (!nextCursor || loadingMore) return
    setLoadingMore(true)
    try {
      const { listings: more, nextCursor: nc } = await fetchListings(activeTab, nextCursor)
      setListings((prev) => [...prev, ...more])
      setNextCursor(nc)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load more')
    } finally {
      setLoadingMore(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#080b11] text-stone-100">
      <TopQuickNav className="left-4" />

      {/* Header */}
      <div className="border-b border-white/8 bg-[#0a0d14]/80 px-4 pb-4 pt-16 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-end justify-between gap-4">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-stone-500">Members Only</p>
            <h1 className="text-2xl font-bold text-white">Classifieds</h1>
          </div>
          <Link
            href={ROUTES.CLASSIFIEDS_NEW}
            className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-gradient-to-r from-rose-600/90 to-pink-700/90 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:brightness-110"
          >
            <span className="text-base leading-none">＋</span>
            Post a listing
          </Link>
        </div>

        {/* Category tabs */}
        <div className="mx-auto mt-4 flex max-w-5xl gap-1.5 overflow-x-auto pb-1">
          {[{ value: 'all', label: 'All' }, ...CLASSIFIED_CATEGORIES].map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setActiveTab(tab.value)}
              className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
                activeTab === tab.value
                  ? 'border-white/25 bg-white/15 text-white'
                  : 'border-white/8 bg-white/5 text-stone-400 hover:border-white/15 hover:text-stone-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <main className="mx-auto max-w-5xl px-4 py-8">
        {loading && (
          <div className="flex justify-center py-20 text-stone-500 text-sm">Loading listings…</div>
        )}

        {error && !loading && (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-950/40 px-4 py-3 text-sm text-rose-300">
            {error}
          </div>
        )}

        {!loading && !error && listings.length === 0 && (
          <div className="py-20 text-center">
            <p className="mb-2 text-4xl">📋</p>
            <p className="text-stone-400">No listings yet in this category.</p>
            <Link
              href={ROUTES.CLASSIFIEDS_NEW}
              className="mt-4 inline-block text-sm text-rose-400 underline underline-offset-4 hover:text-rose-300"
            >
              Be the first to post
            </Link>
          </div>
        )}

        {!loading && listings.length > 0 && (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {listings.map((listing) => (
                <ClassifiedCard key={listing.id} listing={listing} />
              ))}
            </div>

            {nextCursor && (
              <div className="mt-10 flex justify-center">
                <button
                  type="button"
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="rounded-full border border-white/15 bg-white/5 px-6 py-2.5 text-sm text-stone-300 transition hover:bg-white/10 disabled:opacity-50"
                >
                  {loadingMore ? 'Loading…' : 'Load more'}
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
