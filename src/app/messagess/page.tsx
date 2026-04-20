'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

import TopQuickNav from '@/app/_components/top-quick-nav'
import { decideFriendRequest, fetchConversations, fetchFriendRequests } from '@/lib/api'
import { MESSAGING_POLL_INTERVAL_MS, ROUTES } from '@/lib/constants'
import type { Conversation, DirectMessage, PendingFriendRequest } from '@/lib/types'

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
  if (message.kind === 'poke') return 'Sent a poke'
  if (message.kind === 'wink') return 'Sent a wink'
  if (message.kind === 'wave') return 'Sent a wave'
  return message.body
}

export default function MessagesPage() {
  const pathname = usePathname()
  const safePathname = pathname ?? ROUTES.MESSAGESS
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [incomingRequests, setIncomingRequests] = useState<PendingFriendRequest[]>([])
  const [outgoingRequests, setOutgoingRequests] = useState<PendingFriendRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [showPreviews, setShowPreviews] = useState(true)
  const [activeDecisionId, setActiveDecisionId] = useState<string | null>(null)
  const [decisionFeedback, setDecisionFeedback] = useState('')

  useEffect(() => {
    let cancelled = false
    let abortController: AbortController | null = null
    let isLoading_ = false
    let lastFocusTime = 0

    async function load(options?: { silent?: boolean }) {
      const silent = options?.silent === true

      // Guard: prevent overlapping requests
      if (isLoading_) return

      try {
        isLoading_ = true
        if (!silent) setIsLoading(true)
        setLoadError('')

        // Cancel previous request
        if (abortController) abortController.abort()
        abortController = new AbortController()

        const [conversationData, friendRequestData] = await Promise.all([
          fetchConversations(abortController.signal),
          fetchFriendRequests(abortController.signal),
        ])

        if (!cancelled) {
          setConversations(conversationData.conversations)
          setIncomingRequests(friendRequestData.incoming)
          setOutgoingRequests(friendRequestData.outgoing)
        }
      } catch (error) {
        // Ignore abort errors silently
        if (error instanceof Error && error.name === 'AbortError') {
          return
        }

        if (!cancelled) {
          setLoadError(
            error instanceof Error ? error.message : 'Unable to load messages.'
          )
        }
      } finally {
        isLoading_ = false
        if (!cancelled && !silent) setIsLoading(false)
      }
    }

    const refreshIfVisible = () => {
      if (document.visibilityState !== 'visible') return

      // Debounce focus events: skip if last focus was within 500ms
      const now = Date.now()
      if (now - lastFocusTime < 500) return

      lastFocusTime = now
      void load({ silent: true })
    }

    void load()

    const intervalId = window.setInterval(() => {
      refreshIfVisible()
    }, MESSAGING_POLL_INTERVAL_MS)

    window.addEventListener('focus', refreshIfVisible)
    document.addEventListener('visibilitychange', refreshIfVisible)

    return () => {
      cancelled = true
      window.clearInterval(intervalId)
      window.removeEventListener('focus', refreshIfVisible)
      document.removeEventListener('visibilitychange', refreshIfVisible)
      if (abortController) abortController.abort()
    }
  }, [])

  async function handleFriendDecision(friendshipId: string, action: 'accept' | 'decline' | 'cancel') {
    try {
      setActiveDecisionId(friendshipId)
      setDecisionFeedback('')
      await decideFriendRequest(friendshipId, action)

      if (action === 'cancel') {
        setOutgoingRequests((current) => current.filter((request) => request.id !== friendshipId))
        setDecisionFeedback('Friend request cancelled.')
      } else {
        setIncomingRequests((current) => current.filter((request) => request.id !== friendshipId))
        setDecisionFeedback(action === 'accept' ? 'Friend request accepted.' : 'Friend request declined.')
      }
    } catch (error) {
      setDecisionFeedback(error instanceof Error ? error.message : 'Unable to update friend request.')
    } finally {
      setActiveDecisionId(null)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#090b10] text-stone-100">
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat opacity-38"
        style={{ backgroundImage: "url('/welcome2.jpg')" }}
      />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(8,11,18,0.6)_0%,rgba(6,8,12,0.74)_100%)]" />

      <TopQuickNav className="left-4 right-4 md:left-6 md:right-6" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl gap-6 px-4 pb-6 pt-24 sm:px-6 lg:px-8">
        {/* Sidebar */}
        <aside className="hidden w-64 shrink-0 rounded-3xl border border-white/10 bg-[#0d1117]/78 p-5 backdrop-blur-md md:block">
          <p className="text-xs uppercase tracking-[0.22em] text-stone-300/80">Member Area</p>
          <h1 className="mt-3 font-[family:var(--font-display)] text-3xl text-stone-100">Messages</h1>

          <nav className="mt-8 space-y-2">
            {NAV_ITEMS.map((item) => {
              const active = safePathname === item.href || safePathname.startsWith(`${item.href}/`)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={`Open ${item.label}`}
                  className={`block rounded-xl px-4 py-3 text-sm transition ${
                    active
                      ? 'border border-white/20 bg-white/[0.08] text-stone-100'
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
          <header className="rounded-3xl border border-white/10 bg-black/20 p-4 backdrop-blur-lg sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-stone-300/80">Private</p>
                <h2 className="mt-2 font-[family:var(--font-display)] text-3xl text-stone-100">
                  Your Conversations
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setShowPreviews((current) => !current)}
                className="rounded-xl border border-white/20 bg-black/20 px-3 py-2 text-[11px] uppercase tracking-[0.14em] text-stone-200 transition hover:border-amber-100/35 hover:text-amber-100"
              >
                {showPreviews ? 'Hide previews' : 'Show previews'}
              </button>
            </div>
          </header>

          {loadError && (
            <p className="rounded-xl border border-rose-400/35 bg-rose-500/20 p-4 text-sm text-rose-100">
              {loadError}
            </p>
          )}

          {!isLoading && !loadError && (incomingRequests.length > 0 || outgoingRequests.length > 0) && (
            <section className="rounded-3xl border border-white/10 bg-black/20 p-4 backdrop-blur-lg sm:p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-amber-100/70">Friends</p>
                  <h3 className="mt-2 font-[family:var(--font-display)] text-2xl text-amber-100">
                    Pending requests
                  </h3>
                </div>
                <p className="text-xs uppercase tracking-[0.14em] text-stone-400">
                  {incomingRequests.length} incoming • {outgoingRequests.length} sent
                </p>
              </div>

              {decisionFeedback && (
                <p className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-stone-200">
                  {decisionFeedback}
                </p>
              )}

              {incomingRequests.length > 0 && (
                <div className="mt-5">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-stone-400">Incoming</p>
                  <ul className="mt-3 space-y-3">
                    {incomingRequests.map((request) => (
                      <li
                        key={request.id}
                        className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:flex-row sm:items-center"
                      >
                        <div className="flex min-w-0 flex-1 items-center gap-3">
                          {request.member.avatarUrl ? (
                            <div
                              className="h-11 w-11 shrink-0 rounded-2xl border border-white/20 bg-cover bg-center"
                              style={{ backgroundImage: `url(${request.member.avatarUrl})` }}
                            />
                          ) : (
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-amber-500/20 text-sm font-semibold text-amber-100">
                              {getInitials(request.member.displayName || request.member.username)}
                            </div>
                          )}

                          <div className="min-w-0">
                            <p className="truncate font-semibold text-white">{request.member.displayName}</p>
                            <p className="text-sm text-stone-300">@{request.member.username}</p>
                            <p className="text-xs text-stone-400">Requested {formatRelativeTime(request.createdAt)}</p>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleFriendDecision(request.id, 'decline')}
                            disabled={activeDecisionId === request.id}
                            className="rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-sm font-semibold text-stone-200 transition hover:border-white/35 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Decline
                          </button>
                          <button
                            type="button"
                            onClick={() => handleFriendDecision(request.id, 'accept')}
                            disabled={activeDecisionId === request.id}
                            className="rounded-xl border border-amber-200/40 bg-amber-300/20 px-3 py-2 text-sm font-semibold text-amber-100 transition hover:border-amber-100/70 hover:bg-amber-200/30 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {activeDecisionId === request.id ? 'Saving...' : 'Accept'}
                          </button>
                          <Link
                            href={`${ROUTES.MESSAGESS}/${request.member.id}`}
                            title={`Preview thread with ${request.member.displayName}`}
                            className="rounded-xl border border-white/20 bg-black/20 px-3 py-2 text-sm font-semibold text-stone-200 transition hover:border-white/35 hover:text-white"
                          >
                            Message
                          </Link>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {outgoingRequests.length > 0 && (
                <div className="mt-5">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-stone-400">Awaiting response</p>
                  <ul className="mt-3 space-y-3">
                    {outgoingRequests.map((request) => (
                      <li
                        key={request.id}
                        className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:flex-row sm:items-center"
                      >
                        <div className="flex min-w-0 flex-1 items-center gap-3">
                          {request.member.avatarUrl ? (
                            <div
                              className="h-11 w-11 shrink-0 rounded-2xl border border-white/20 bg-cover bg-center"
                              style={{ backgroundImage: `url(${request.member.avatarUrl})` }}
                            />
                          ) : (
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-amber-500/20 text-sm font-semibold text-amber-100">
                              {getInitials(request.member.displayName || request.member.username)}
                            </div>
                          )}

                          <div className="min-w-0 flex-1">
                            <p className="truncate font-semibold text-white">{request.member.displayName}</p>
                            <p className="text-sm text-stone-300">@{request.member.username}</p>
                            <p className="text-xs text-stone-400">Requested {formatRelativeTime(request.createdAt)}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="rounded-full border border-amber-200/30 bg-amber-300/15 px-3 py-1 text-[11px] uppercase tracking-[0.14em] text-amber-100">
                            Pending
                          </span>
                          <button
                            type="button"
                            onClick={() => handleFriendDecision(request.id, 'cancel')}
                            disabled={activeDecisionId === request.id}
                            className="rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-sm font-semibold text-stone-200 transition hover:border-white/35 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {activeDecisionId === request.id ? 'Cancelling...' : 'Cancel'}
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
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
                    title={`Preview conversation with ${conv.partnerDisplayName}`}
                    className="flex items-center gap-4 rounded-2xl border border-white/10 bg-black/20 p-3 backdrop-blur-lg transition hover:border-amber-100/30 hover:bg-black/30"
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
                      {showPreviews && (
                        <p className="mt-0.5 truncate text-sm text-stone-300">
                          {formatConversationPreview(conv.lastMessage)}
                        </p>
                      )}
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
