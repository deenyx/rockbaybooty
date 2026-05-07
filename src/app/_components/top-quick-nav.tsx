'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'

import { MEMBER_MENU_ITEMS } from '@/lib/constants'

type TopQuickNavProps = {
  className?: string
}

function getActiveLabel(pathname: string): string {
  const match = MEMBER_MENU_ITEMS.find((item) => {
    return pathname === item.href || pathname.startsWith(`${item.href}/`)
  })
  return match?.label ?? MEMBER_MENU_ITEMS[0].label
}

function NotificationBell() {
  const [unread, setUnread] = useState(0)
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<
    { id: string; title: string; body: string | null; link: string | null; isRead: boolean; createdAt: string }[]
  >([])
  const ref = useRef<HTMLDivElement>(null)

  async function loadNotifications() {
    try {
      const res = await fetch('/api/notifications')
      if (!res.ok) return
      const data = await res.json()
      setNotifications(data.notifications ?? [])
      setUnread(data.unreadCount ?? 0)
    } catch {
      // silently ignore
    }
  }

  useEffect(() => {
    void loadNotifications()
    const interval = setInterval(() => void loadNotifications(), 30_000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  async function handleOpen() {
    setOpen((v) => !v)
    if (!open && unread > 0) {
      try {
        await fetch('/api/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) })
        setUnread(0)
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
      } catch {
        // ignore
      }
    }
  }

  function formatRelative(iso: string) {
    const diff = Date.now() - new Date(iso).getTime()
    const m = Math.floor(diff / 60_000)
    if (m < 1) return 'just now'
    if (m < 60) return `${m}m ago`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h}h ago`
    return new Date(iso).toLocaleDateString()
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => void handleOpen()}
        aria-label="Notifications"
        className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-[#0f121a]/90 text-stone-400 shadow-[0_8px_24px_rgba(0,0,0,0.4)] backdrop-blur-xl transition hover:border-white/25 hover:text-stone-200"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-2 w-72 overflow-hidden rounded-2xl border border-white/15 bg-[#0f121a]/95 shadow-[0_18px_40px_rgba(0,0,0,0.55)] backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-stone-400">Notifications</p>
          </div>
          {notifications.length === 0 ? (
            <p className="px-4 py-6 text-center text-xs text-stone-500">No notifications yet</p>
          ) : (
            <ul className="max-h-80 overflow-y-auto divide-y divide-white/5">
              {notifications.map((n) => (
                <li key={n.id}>
                  {n.link ? (
                    <Link href={n.link} onClick={() => setOpen(false)} className="block px-4 py-3 hover:bg-white/[0.04] transition">
                      <p className="text-sm font-medium text-stone-100">{n.title}</p>
                      {n.body && <p className="mt-0.5 text-xs text-stone-400 line-clamp-2">{n.body}</p>}
                      <p className="mt-1 text-[10px] text-stone-600">{formatRelative(n.createdAt)}</p>
                    </Link>
                  ) : (
                    <div className="px-4 py-3">
                      <p className="text-sm font-medium text-stone-100">{n.title}</p>
                      {n.body && <p className="mt-0.5 text-xs text-stone-400 line-clamp-2">{n.body}</p>}
                      <p className="mt-1 text-[10px] text-stone-600">{formatRelative(n.createdAt)}</p>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

export default function TopQuickNav({ className = '' }: TopQuickNavProps) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const activeLabel = getActiveLabel(pathname)

  // Presence heartbeat — keeps lastActiveAt fresh every 2 minutes
  useEffect(() => {
    function ping() {
      fetch('/api/ping', { method: 'POST' }).catch(() => {})
    }
    ping()
    const id = setInterval(ping, 2 * 60 * 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    fetch('/api/admin/reports?status=pending&cursor=none', { method: 'GET' })
      .then((r) => { if (r.ok) setIsAdmin(true) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  return (
    <div className={`fixed top-3 z-40 flex items-center gap-2 ${className}`}>
      <div ref={ref}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="Open navigation menu"
          aria-expanded={open}
          className="flex items-center gap-2 rounded-2xl border border-white/15 bg-[#0f121a]/90 px-3 py-2 shadow-[0_8px_24px_rgba(0,0,0,0.4)] backdrop-blur-xl transition hover:border-white/25 hover:bg-[#0f121a]"
        >
          {/* hamburger */}
          <span className="flex h-4 w-4 flex-col justify-between">
            <span className={`block h-px w-full bg-stone-400 transition-all ${open ? 'translate-y-[7px] rotate-45' : ''}`} />
            <span className={`block h-px w-full bg-stone-400 transition-all ${open ? 'opacity-0' : ''}`} />
            <span className={`block h-px w-full bg-stone-400 transition-all ${open ? '-translate-y-[7px] -rotate-45' : ''}`} />
          </span>
          <span className="text-xs font-medium text-stone-300">{activeLabel}</span>
        </button>

        {open && (
          <div className="absolute left-0 top-full mt-2 w-44 overflow-hidden rounded-2xl border border-white/15 bg-[#0f121a]/95 py-1 shadow-[0_18px_40px_rgba(0,0,0,0.55)] backdrop-blur-xl">
            {MEMBER_MENU_ITEMS.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`block px-4 py-2.5 text-sm transition ${
                    active
                      ? 'bg-white/[0.07] text-stone-100'
                      : 'text-stone-400 hover:bg-white/[0.04] hover:text-stone-100'
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}
            {isAdmin && (
              <Link
                href="/admin"
                onClick={() => setOpen(false)}
                className={`block border-t border-white/10 px-4 py-2.5 text-sm transition ${
                  pathname === '/admin'
                    ? 'bg-white/[0.07] text-stone-100'
                    : 'text-rose-400 hover:bg-white/[0.04] hover:text-rose-300'
                }`}
              >
                Admin
              </Link>
            )}
          </div>
        )}
      </div>

      <NotificationBell />
    </div>
  )
}