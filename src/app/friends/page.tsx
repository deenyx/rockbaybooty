'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

import OnlineDot from '@/app/_components/online-dot'
import TopQuickNav from '@/app/_components/top-quick-nav'
import { ROUTES } from '@/lib/constants'

type FriendEntry = {
  friendshipId: string
  since: string
  member: {
    id: string
    username: string
    displayName: string
    avatarUrl: string | null
    isOnline: boolean
    lastActiveAt: string | null
  }
}

type PendingEntry = {
  id: string
  createdAt: string
  direction: 'incoming' | 'outgoing'
  member: {
    id: string
    username: string
    displayName: string
    avatarUrl: string | null
  }
}

function getInitials(name: string) {
  return name.split(' ').map((p) => p[0]).filter(Boolean).join('').slice(0, 2).toUpperCase()
}

function Avatar({ url, name, size = 10 }: { url: string | null; name: string; size?: number }) {
  const cls = `h-${size} w-${size} rounded-xl border border-white/15 bg-white/[0.04] object-cover flex-shrink-0`
  if (url) return <img src={url} alt={name} className={cls} />
  return (
    <div className={`${cls} flex items-center justify-center text-sm font-semibold text-stone-300`}>
      {getInitials(name)}
    </div>
  )
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
}

export default function FriendsPage() {
  const [tab, setTab] = useState<'friends' | 'pending'>('friends')
  const [friends, setFriends] = useState<FriendEntry[]>([])
  const [incoming, setIncoming] = useState<PendingEntry[]>([])
  const [outgoing, setOutgoing] = useState<PendingEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionState, setActionState] = useState<Record<string, string>>({})

  async function loadAll() {
    setIsLoading(true)
    setError('')
    try {
      const [fr, rq] = await Promise.all([
        fetch('/api/friends').then((r) => r.json()),
        fetch('/api/friends/requests').then((r) => r.json()),
      ])
      setFriends(fr.friends ?? [])
      setIncoming(rq.incoming ?? [])
      setOutgoing(rq.outgoing ?? [])
    } catch {
      setError('Failed to load')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { void loadAll() }, [])

  async function handleDecision(friendshipId: string, action: 'accept' | 'decline' | 'cancel') {
    setActionState((p) => ({ ...p, [friendshipId]: 'loading' }))
    try {
      const res = await fetch('/api/friends/requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendshipId, action }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        setActionState((p) => ({ ...p, [friendshipId]: d.error ?? 'Error' }))
        return
      }
      // Re-fetch after state change
      await loadAll()
      setActionState((p) => { const n = { ...p }; delete n[friendshipId]; return n })
    } catch {
      setActionState((p) => ({ ...p, [friendshipId]: 'Error' }))
    }
  }

  const pendingCount = incoming.length + outgoing.length

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#090b10] text-stone-100">
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20"
        style={{ backgroundImage: "url('/welcome2.jpg')" }}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#090b10]/60 to-[#090b10]/95" />

      <TopQuickNav className="left-4 right-4 md:left-6 md:right-6" />

      <main className="relative z-10 mx-auto max-w-2xl px-4 pb-20 pt-20 sm:px-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="font-[var(--font-display)] text-3xl text-stone-100">Friends</h1>
          <Link
            href={ROUTES.SEARCH}
            className="rounded-xl border border-white/15 bg-white/[0.04] px-4 py-2 text-xs uppercase tracking-widest text-stone-300 transition hover:border-white/25 hover:text-stone-100"
          >
            Find people
          </Link>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-1 rounded-2xl border border-white/10 bg-black/20 p-1 backdrop-blur-xl">
          {([
            { key: 'friends', label: `Friends${friends.length > 0 ? ` (${friends.length})` : ''}` },
            { key: 'pending', label: `Requests${pendingCount > 0 ? ` (${pendingCount})` : ''}` },
          ] as const).map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`flex-1 rounded-xl py-2 text-xs uppercase tracking-[0.18em] transition ${tab === key ? 'bg-white/[0.08] text-stone-100' : 'text-stone-400 hover:text-stone-200'}`}
            >
              {label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-amber-400/30 border-t-amber-400" />
          </div>
        ) : error ? (
          <p className="text-center text-sm text-rose-400">{error}</p>
        ) : tab === 'friends' ? (
          friends.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-black/20 p-12 text-center backdrop-blur-xl">
              <p className="text-stone-400">No friends yet.</p>
              <Link href={ROUTES.SEARCH} className="mt-4 inline-block text-xs text-amber-400 hover:underline">
                Discover members →
              </Link>
            </div>
          ) : (
            <ul className="space-y-2">
              {friends.map((f) => (
                <li key={f.friendshipId}>
                  <Link
                    href={`/u/${f.member.username}`}
                    className="flex items-center gap-4 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 backdrop-blur-xl transition hover:border-white/20 hover:bg-white/[0.03]"
                  >
                    <div className="relative flex-shrink-0">
                      <Avatar url={f.member.avatarUrl} name={f.member.displayName || f.member.username} />
                      <OnlineDot
                        lastActiveAt={f.member.lastActiveAt}
                        size="md"
                        className="absolute -bottom-0.5 -right-0.5"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-stone-100">
                        {f.member.displayName || f.member.username}
                      </p>
                      <p className="text-[11px] text-stone-500">@{f.member.username}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] uppercase tracking-widest text-stone-500">
                        {f.member.isOnline ? (
                          <span className="text-emerald-400">Online</span>
                        ) : (
                          'Offline'
                        )}
                      </p>
                      <p className="mt-0.5 text-[10px] text-stone-600">since {formatDate(f.since)}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )
        ) : (
          // Pending tab
          <div className="space-y-6">
            {incoming.length > 0 && (
              <section>
                <p className="mb-3 text-[10px] uppercase tracking-[0.22em] text-stone-400">Incoming requests</p>
                <ul className="space-y-2">
                  {incoming.map((r) => (
                    <li key={r.id} className="flex items-center gap-4 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 backdrop-blur-xl">
                      <Link href={`/u/${r.member.username}`} className="flex-shrink-0">
                        <Avatar url={r.member.avatarUrl} name={r.member.displayName || r.member.username} />
                      </Link>
                      <div className="min-w-0 flex-1">
                        <Link href={`/u/${r.member.username}`}>
                          <p className="truncate font-medium text-stone-100 hover:underline">
                            {r.member.displayName || r.member.username}
                          </p>
                        </Link>
                        <p className="text-[11px] text-stone-500">@{r.member.username}</p>
                      </div>
                      {actionState[r.id] && actionState[r.id] !== 'loading' ? (
                        <p className="text-xs text-rose-400">{actionState[r.id]}</p>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            disabled={actionState[r.id] === 'loading'}
                            onClick={() => void handleDecision(r.id, 'accept')}
                            className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-400 transition hover:bg-emerald-500/20 disabled:opacity-50"
                          >
                            Accept
                          </button>
                          <button
                            type="button"
                            disabled={actionState[r.id] === 'loading'}
                            onClick={() => void handleDecision(r.id, 'decline')}
                            className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-stone-400 transition hover:border-white/20 hover:text-stone-200 disabled:opacity-50"
                          >
                            Decline
                          </button>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {outgoing.length > 0 && (
              <section>
                <p className="mb-3 text-[10px] uppercase tracking-[0.22em] text-stone-400">Sent requests</p>
                <ul className="space-y-2">
                  {outgoing.map((r) => (
                    <li key={r.id} className="flex items-center gap-4 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 backdrop-blur-xl">
                      <Link href={`/u/${r.member.username}`} className="flex-shrink-0">
                        <Avatar url={r.member.avatarUrl} name={r.member.displayName || r.member.username} />
                      </Link>
                      <div className="min-w-0 flex-1">
                        <Link href={`/u/${r.member.username}`}>
                          <p className="truncate font-medium text-stone-100 hover:underline">
                            {r.member.displayName || r.member.username}
                          </p>
                        </Link>
                        <p className="text-[11px] text-stone-500">@{r.member.username}</p>
                      </div>
                      {actionState[r.id] && actionState[r.id] !== 'loading' ? (
                        <p className="text-xs text-rose-400">{actionState[r.id]}</p>
                      ) : (
                        <button
                          type="button"
                          disabled={actionState[r.id] === 'loading'}
                          onClick={() => void handleDecision(r.id, 'cancel')}
                          className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-stone-400 transition hover:border-rose-500/30 hover:text-rose-400 disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {incoming.length === 0 && outgoing.length === 0 && (
              <div className="rounded-3xl border border-white/10 bg-black/20 p-12 text-center backdrop-blur-xl">
                <p className="text-stone-400">No pending requests.</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
