'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

import { fetchConversations } from '@/lib/api'
import { ROUTES } from '@/lib/constants'
import type { Conversation, DirectMessage } from '@/lib/types'

const NAV_ITEMS = [
  { label: 'Profile', href: ROUTES.PROFILE },
  { label: 'Search', href: ROUTES.SEARCH },
  { label: 'Messages', href: ROUTES.MESSAGESS },
  { label: 'Groups', href: ROUTES.GROUPS },
  { label: 'Classifieds', href: ROUTES.CLASSIFIEDS },
]

function getInitials(name: string) {
  return name
    .split(' ')
    .map((part) => part.trim()[0])
    .filter(Boolean)
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function formatRelativeTime(isoString: string) {
  const diff = Date.now() - new Date(isoString).getTime()
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(isoString).toLocaleDateString()
}

function formatConversationPreview(message: DirectMessage) {
  return message.kind === 'poke' ? 'Sent a poke' : message.body
}

export default function MessagesPage() {
  const pathname = usePathname()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        setIsLoading(true)
        setLoadError('')
        const data = await fetchConversations()
        if (!cancelled) setConversations(data.conversations)
      } catch (error) {
        if (!cancelled) {
          setLoadError(
            error instanceof Error ? error.message : 'Unable to load messages.'
          )
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [])

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(255,180,120,0.24),_transparent_40%),radial-gradient(circle_at_top_right,_rgba(255,125,95,0.2),_transparent_42%),linear-gradient(160deg,#12080b_8%,#220d13_48%,#3f141f_100%)] text-stone-100">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:px-8">
        {/* Sidebar */}
        <aside className="hidden w-64 shrink-0 rounded-3xl border border-white/10 bg-black/30 p-5 backdrop-blur-xl md:block">
          <p className="text-xs uppercase tracking-[0.22em] text-amber-100/70">Member Area</p>
          <h1 className="mt-3 font-[family:var(--font-display)] text-3xl text-amber-100">Messages</h1>

          <nav className="mt-8 space-y-2">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
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
        </aside>

        {/* Main */}
        <main className="flex-1 space-y-5">
          <header className="rounded-3xl border border-white/10 bg-black/30 p-4 backdrop-blur-xl sm:p-5">
            <p className="text-xs uppercase tracking-[0.22em] text-amber-100/70">Private</p>
            <h2 className="mt-2 font-[family:var(--font-display)] text-3xl text-amber-100">
              Your Conversations
            </h2>
          </header>

          {loadError && (
            <p className="rounded-xl border border-rose-400/35 bg-rose-500/20 p-4 text-sm text-rose-100">
              {loadError}
            </p>
          )}

          {isLoading && (
            <div className="flex justify-center py-16">
              <div className="h-7 w-7 animate-spin rounded-full border-2 border-amber-400/30 border-t-amber-400" />
            </div>
          )}

          {!isLoading && !loadError && conversations.length === 0 && (
            <div className="rounded-2xl border border-white/10 bg-black/25 p-10 text-center">
              <p className="text-lg font-semibold text-stone-100">No conversations yet</p>
              <p className="mt-2 text-sm text-stone-300">
                Find a member and send them a message to start a conversation.
              </p>
              <Link
                href={ROUTES.SEARCH}
                className="mt-5 inline-flex rounded-xl border border-amber-200/40 bg-amber-300/20 px-5 py-2.5 text-sm font-semibold text-amber-100 transition hover:border-amber-100/70 hover:bg-amber-200/30"
              >
                Browse Members
              </Link>
            </div>
          )}

          {!isLoading && conversations.length > 0 && (
            <ul className="space-y-3">
              {conversations.map((conv) => (
                <li key={conv.partnerId}>
                  <Link
                    href={`${ROUTES.MESSAGESS}/${conv.partnerId}`}
                    className="flex items-center gap-4 rounded-2xl border border-white/10 bg-black/30 p-4 backdrop-blur-xl transition hover:border-amber-100/30 hover:bg-black/40"
                  >
                    {/* Avatar */}
                    {conv.partnerAvatarUrl ? (
                      <div
                        className="h-12 w-12 shrink-0 rounded-2xl border border-white/20 bg-cover bg-center"
                        style={{ backgroundImage: `url(${conv.partnerAvatarUrl})` }}
                      />
                    ) : (
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-amber-500/20 text-base font-semibold text-amber-100">
                        {getInitials(conv.partnerDisplayName || conv.partnerUsername)}
                      </div>
                    )}

                    {/* Text */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate font-semibold text-white">
                          {conv.partnerDisplayName}
                        </p>
                        <p className="shrink-0 text-[11px] text-stone-400">
                          {formatRelativeTime(conv.lastMessage.createdAt)}
                        </p>
                      </div>
                      <p className="mt-0.5 truncate text-sm text-stone-300">
                        {formatConversationPreview(conv.lastMessage)}
                      </p>
                    </div>

                    {/* Unread badge */}
                    {conv.unreadCount > 0 && (
                      <span className="ml-2 flex h-5 min-w-[1.25rem] shrink-0 items-center justify-center rounded-full bg-amber-400 px-1.5 text-[11px] font-bold text-black">
                        {conv.unreadCount}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </main>
      </div>
    </div>
  )
}
