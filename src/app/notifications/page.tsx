'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import TopQuickNav from '@/app/_components/top-quick-nav'
import { ROUTES } from '@/lib/constants'

type Notification = {
  id: string
  type: string
  title: string
  body: string | null
  link: string | null
  isRead: boolean
  createdAt: string
}

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
  return new Date(iso).toLocaleDateString()
}

function typeIcon(type: string): string {
  switch (type) {
    case 'friend_request': return '👥'
    case 'message': return '💬'
    case 'message_request': return '📩'
    case 'group_post': return '📋'
    default: return '🔔'
  }
}

export default function NotificationsPage() {
  const router = useRouter()
  const [items, setItems] = useState<Notification[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  const load = useCallback(async (cursor?: string) => {
    const url = cursor ? `/api/notifications?cursor=${cursor}` : '/api/notifications'
    const res = await fetch(url)
    if (res.status === 401) { router.push(ROUTES.LOGIN); return }
    if (!res.ok) return
    const data = await res.json()
    setItems((prev) => cursor ? [...prev, ...data.notifications] : data.notifications)
    setNextCursor(data.nextCursor)
    setUnreadCount(data.unreadCount)
  }, [router])

  useEffect(() => {
    load().finally(() => setLoading(false))
  }, [load])

  // Mark all read when the page loads
  useEffect(() => {
    fetch('/api/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) })
      .then(() => setUnreadCount(0))
      .catch(() => {})
  }, [])

  async function markRead(id: string) {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: [id] }),
    })
    setItems((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n))
  }

  async function loadMore() {
    if (!nextCursor || loadingMore) return
    setLoadingMore(true)
    await load(nextCursor)
    setLoadingMore(false)
  }

  return (
    <div className="min-h-screen bg-[#090b10]">
      <TopQuickNav className="left-4 right-4 md:left-6 md:right-6" />

      <main className="mx-auto max-w-2xl px-4 pb-24 pt-20">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl text-amber-200">Notifications</h1>
            {unreadCount > 0 && (
              <p className="mt-0.5 text-sm text-stone-400">{unreadCount} unread</p>
            )}
          </div>
          {items.some((n) => !n.isRead) && (
            <button
              onClick={async () => {
                await fetch('/api/notifications', {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({}),
                })
                setItems((prev) => prev.map((n) => ({ ...n, isRead: true })))
                setUnreadCount(0)
              }}
              className="text-xs text-amber-400 hover:text-amber-300"
            >
              Mark all read
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-400/30 border-t-amber-400" />
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-white/5 bg-white/[0.03] px-6 py-16 text-center">
            <p className="text-2xl">🔔</p>
            <p className="mt-3 text-stone-400">No notifications yet</p>
          </div>
        ) : (
          <ul className="space-y-1">
            {items.map((n) => {
              const inner = (
                <div
                  className={`flex items-start gap-3 rounded-xl border px-4 py-3 transition-colors ${
                    n.isRead
                      ? 'border-white/5 bg-white/[0.03]'
                      : 'border-amber-400/20 bg-amber-400/5'
                  }`}
                >
                  <span className="mt-0.5 shrink-0 text-lg">{typeIcon(n.type)}</span>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm ${n.isRead ? 'text-stone-300' : 'font-medium text-amber-100'}`}>
                      {n.title}
                    </p>
                    {n.body && (
                      <p className="mt-0.5 truncate text-xs text-stone-500">{n.body}</p>
                    )}
                    <p className="mt-1 text-xs text-stone-600">{timeAgo(n.createdAt)}</p>
                  </div>
                  {!n.isRead && (
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-amber-400" />
                  )}
                </div>
              )

              return (
                <li key={n.id}>
                  {n.link ? (
                    <Link
                      href={n.link}
                      onClick={() => markRead(n.id)}
                      className="block"
                    >
                      {inner}
                    </Link>
                  ) : (
                    <div onClick={() => markRead(n.id)} className="cursor-default">
                      {inner}
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}

        {nextCursor && (
          <div className="mt-6 flex justify-center">
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="rounded-lg border border-white/10 px-5 py-2 text-sm text-stone-400 hover:border-white/20 hover:text-stone-200 disabled:opacity-40"
            >
              {loadingMore ? 'Loading…' : 'Load more'}
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
