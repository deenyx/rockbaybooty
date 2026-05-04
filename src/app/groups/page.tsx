'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

import TopQuickNav from '@/app/_components/top-quick-nav'
import { GROUP_CATEGORIES, ROUTES } from '@/lib/constants'
import type { GroupSummary } from '@/lib/types'

function getInitials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function CategoryBadge({ value }: { value: string }) {
  const cat = GROUP_CATEGORIES.find((c) => c.value === value)
  return (
    <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-widest text-stone-400">
      {cat?.label ?? value}
    </span>
  )
}

export default function GroupsPage() {
  const [groups, setGroups] = useState<GroupSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'all' | 'mine'>('all')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [joiningId, setJoiningId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<Record<string, string>>({})

  async function load(tab: 'all' | 'mine', cat: string) {
    try {
      setIsLoading(true)
      setError('')
      const params = new URLSearchParams()
      if (tab === 'mine') params.set('mine', '1')
      if (cat) params.set('category', cat)
      const res = await fetch(`/api/groups?${params.toString()}`)
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to load groups')
      }
      const data = await res.json()
      setGroups(data.groups)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load groups')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void load(activeTab, categoryFilter)
  }, [activeTab, categoryFilter])

  async function handleJoin(slug: string, groupId: string) {
    try {
      setJoiningId(groupId)
      const res = await fetch(`/api/groups/${slug}/join`, { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Failed to join')
      setFeedback((prev) => ({ ...prev, [groupId]: 'Joined!' }))
      setGroups((prev) =>
        prev.map((g) =>
          g.id === groupId
            ? { ...g, memberRole: 'member', memberCount: g.memberCount + 1 }
            : g
        )
      )
    } catch (err) {
      setFeedback((prev) => ({
        ...prev,
        [groupId]: err instanceof Error ? err.message : 'Error',
      }))
    } finally {
      setJoiningId(null)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#090b10] text-stone-100">
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20"
        style={{ backgroundImage: "url('/welcome2.jpg')" }}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#090b10]/60 to-[#090b10]/95" />

      <TopQuickNav className="left-4 right-4 md:left-6 md:right-6" />

      <main className="relative z-10 mx-auto max-w-4xl px-4 pb-16 pt-20 sm:px-6">
        {/* Header */}
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-stone-400">Community</p>
            <h1 className="mt-1 font-[family:var(--font-display)] text-4xl text-stone-100">
              Groups
            </h1>
          </div>
          <Link
            href={ROUTES.GROUPS_NEW}
            className="rounded-xl border border-white/20 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-stone-100 transition hover:border-white/35 hover:bg-white/[0.1]"
          >
            + New group
          </Link>
        </div>

        {/* Tabs */}
        <div className="mt-6 flex gap-1 rounded-2xl border border-white/10 bg-white/[0.04] p-1">
          {(['all', 'mine'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`flex-1 rounded-xl py-2 text-sm font-medium transition ${
                activeTab === tab
                  ? 'bg-white/10 text-stone-100'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              {tab === 'all' ? 'All groups' : 'My groups'}
            </button>
          ))}
        </div>

        {/* Category filter */}
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCategoryFilter('')}
            className={`rounded-full border px-3 py-1 text-xs transition ${
              categoryFilter === ''
                ? 'border-white/30 bg-white/10 text-white'
                : 'border-white/10 text-stone-400 hover:border-white/20 hover:text-stone-200'
            }`}
          >
            All
          </button>
          {GROUP_CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => setCategoryFilter(cat.value)}
              className={`rounded-full border px-3 py-1 text-xs transition ${
                categoryFilter === cat.value
                  ? 'border-white/30 bg-white/10 text-white'
                  : 'border-white/10 text-stone-400 hover:border-white/20 hover:text-stone-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="mt-12 flex justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
          </div>
        ) : error ? (
          <p className="mt-12 text-center text-sm text-rose-400">{error}</p>
        ) : groups.length === 0 ? (
          <div className="mt-12 rounded-3xl border border-dashed border-white/10 p-10 text-center">
            <p className="text-stone-400">
              {activeTab === 'mine'
                ? "You haven't joined any groups yet."
                : 'No groups found. Be the first to create one.'}
            </p>
            <Link
              href={ROUTES.GROUPS_NEW}
              className="mt-4 inline-block rounded-xl border border-white/20 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-stone-100 transition hover:border-white/35 hover:bg-white/[0.1]"
            >
              Create a group
            </Link>
          </div>
        ) : (
          <ul className="mt-6 grid gap-4 sm:grid-cols-2">
            {groups.map((group) => (
              <li
                key={group.id}
                className="flex flex-col rounded-3xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur transition hover:border-white/20"
              >
                {/* Cover / avatar */}
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-lg font-bold text-stone-200">
                    {group.coverUrl ? (
                      <img
                        src={group.coverUrl}
                        alt=""
                        className="h-12 w-12 rounded-2xl object-cover"
                      />
                    ) : (
                      getInitials(group.name)
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        href={`/groups/${group.slug}`}
                        className="font-semibold text-stone-100 hover:underline truncate"
                      >
                        {group.name}
                      </Link>
                      <CategoryBadge value={group.category} />
                      {group.memberRole && (
                        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] uppercase tracking-widest text-emerald-400">
                          {group.memberRole === 'owner' ? 'Owner' : group.memberRole === 'moderator' ? 'Mod' : 'Member'}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-stone-400">
                      {group.memberCount} {group.memberCount === 1 ? 'member' : 'members'}
                    </p>
                  </div>
                </div>

                {group.description && (
                  <p className="mt-3 text-sm leading-6 text-stone-300 line-clamp-2">
                    {group.description}
                  </p>
                )}

                <div className="mt-4 flex items-center justify-between gap-2">
                  <Link
                    href={`/groups/${group.slug}`}
                    className="text-xs text-stone-400 underline underline-offset-2 hover:text-stone-200"
                  >
                    View group →
                  </Link>
                  {feedback[group.id] ? (
                    <span className="text-xs text-emerald-400">{feedback[group.id]}</span>
                  ) : group.memberRole ? null : (
                    <button
                      type="button"
                      disabled={joiningId === group.id}
                      onClick={() => void handleJoin(group.slug, group.id)}
                      className="rounded-xl border border-white/20 bg-white/[0.06] px-3 py-1.5 text-xs font-semibold text-stone-100 transition hover:border-white/35 hover:bg-white/10 disabled:cursor-wait disabled:opacity-50"
                    >
                      {joiningId === group.id ? 'Joining…' : 'Join'}
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  )
}
