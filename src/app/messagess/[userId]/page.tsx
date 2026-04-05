'use client'

import Link from 'next/link'
import { useParams, usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

import TopQuickNav from '@/app/_components/top-quick-nav'
import { fetchConversationMessages, sendGesture, sendMessage } from '@/lib/api'
import { MESSAGING_POLL_INTERVAL_MS, ROUTES } from '@/lib/constants'
import type { ConversationMessagesResponse, DirectMessage } from '@/lib/types'

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

function formatTime(isoString: string) {
  return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function formatDate(isoString: string) {
  const date = new Date(isoString)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)

  if (date.toDateString() === today.toDateString()) return 'Today'
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatMessageBody(message: DirectMessage, isMine: boolean) {
  if (message.kind === 'poke') {
    return isMine ? 'You sent a poke' : 'Sent you a poke'
  }

  if (message.kind === 'wink') {
    return isMine ? 'You sent a wink' : 'Sent you a wink'
  }

  if (message.kind === 'wave') {
    return isMine ? 'You sent a wave' : 'Sent you a wave'
  }

  return message.body
}

export default function ConversationPage() {
  const params = useParams()
  const partnerId = typeof params.userId === 'string' ? params.userId : ''
  const pathname = usePathname()

  const [data, setData] = useState<ConversationMessagesResponse | null>(null)
  const [messages, setMessages] = useState<DirectMessage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [inputValue, setInputValue] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [activeGesture, setActiveGesture] = useState<'poke' | 'wink' | 'wave' | null>(null)
  const [showGestureMenu, setShowGestureMenu] = useState(false)
  const [sendError, setSendError] = useState('')

  const bottomRef = useRef<HTMLDivElement>(null)
  const previousMessageCountRef = useRef(0)

  useEffect(() => {
    if (!partnerId) return
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

        const result = await fetchConversationMessages(partnerId, abortController.signal)
        if (!cancelled) {
          setData(result)
          setMessages(result.messages)
        }
      } catch (error) {
        // Ignore abort errors silently
        if (error instanceof Error && error.name === 'AbortError') {
          return
        }

        if (!cancelled) {
          setLoadError(
            error instanceof Error ? error.message : 'Unable to load conversation.'
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
  }, [partnerId])

  // Only scroll when new messages are added.
  useEffect(() => {
    if (messages.length > previousMessageCountRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    previousMessageCountRef.current = messages.length
  }, [messages])

  async function handleSend() {
    const trimmed = inputValue.trim()
    if (!trimmed || isSending) return

    setSendError('')
    setIsSending(true)

    try {
      const result = await sendMessage(partnerId, trimmed)
      setMessages((prev) => [...prev, result.message])
      setInputValue('')
    } catch (error) {
      setSendError(
        error instanceof Error ? error.message : 'Failed to send message.'
      )
    } finally {
      setIsSending(false)
    }
  }

  async function handleGesture(kind: 'poke' | 'wink' | 'wave') {
    if (!partnerId || activeGesture) return

    setSendError('')
    setActiveGesture(kind)

    try {
      const result = await sendGesture(partnerId, kind)
      setMessages((prev) => [...prev, result.message])
      setShowGestureMenu(false)
    } catch (error) {
      setSendError(
        error instanceof Error ? error.message : 'Failed to send gesture.'
      )
    } finally {
      setActiveGesture(null)
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSend()
    }
  }

  // Group messages by date
  const groupedMessages: { date: string; msgs: DirectMessage[] }[] = []
  for (const msg of messages) {
    const label = formatDate(msg.createdAt)
    const last = groupedMessages[groupedMessages.length - 1]
    if (last?.date === label) {
      last.msgs.push(msg)
    } else {
      groupedMessages.push({ date: label, msgs: [msg] })
    }
  }

  const partner = data?.partner

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
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
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

        {/* Conversation panel */}
        <main className="flex flex-1 flex-col overflow-hidden rounded-3xl border border-white/10 bg-black/30 backdrop-blur-xl">
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-white/10 p-4 sm:p-5">
            <Link
              href={ROUTES.MESSAGESS}
              title="Back to all conversations"
              className="mr-1 rounded-lg border border-white/15 p-1.5 text-stone-300 transition hover:border-white/30 hover:text-white"
              aria-label="Back to conversations"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>

            {partner ? (
              <>
                {partner.avatarUrl ? (
                  <div
                    className="h-9 w-9 shrink-0 rounded-xl border border-white/20 bg-cover bg-center"
                    style={{ backgroundImage: `url(${partner.avatarUrl})` }}
                  />
                ) : (
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-amber-500/20 text-sm font-semibold text-amber-100">
                    {getInitials(partner.displayName || partner.username)}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-white">{partner.displayName}</p>
                  <p className="text-xs text-stone-400">@{partner.username}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowGestureMenu((current) => !current)}
                  disabled={Boolean(activeGesture)}
                  className="ml-auto rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-stone-200 transition hover:border-amber-100/50 hover:text-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {activeGesture ? 'Sending...' : 'Poke...'}
                </button>
              </>
            ) : (
              <div className="h-5 w-32 animate-pulse rounded bg-white/10" />
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5">
            {isLoading && (
              <div className="flex h-full items-center justify-center">
                <div className="h-7 w-7 animate-spin rounded-full border-2 border-amber-400/30 border-t-amber-400" />
              </div>
            )}

            {loadError && (
              <p className="rounded-xl border border-rose-400/35 bg-rose-500/20 p-4 text-sm text-rose-100">
                {loadError}
              </p>
            )}

            {!isLoading && !loadError && messages.length === 0 && (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                <p className="text-stone-300">No messages yet. Say hello!</p>
              </div>
            )}

            {groupedMessages.map(({ date, msgs }) => (
              <div key={date}>
                <div className="my-4 flex items-center gap-3">
                  <div className="h-px flex-1 bg-white/10" />
                  <span className="text-[11px] uppercase tracking-[0.16em] text-stone-500">{date}</span>
                  <div className="h-px flex-1 bg-white/10" />
                </div>

                <div className="space-y-2">
                  {msgs.map((msg) => {
                    const isMine = msg.senderId !== partnerId
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                            msg.kind === 'poke' || msg.kind === 'wink' || msg.kind === 'wave'
                              ? 'border border-amber-200/20 bg-amber-300/10 text-amber-100'
                              : isMine
                                ? 'rounded-br-sm bg-amber-400/25 text-amber-50'
                                : 'rounded-bl-sm bg-white/10 text-stone-100'
                          }`}
                        >
                          <p>{formatMessageBody(msg, isMine)}</p>
                          <p className={`mt-1 text-[10px] ${isMine ? 'text-amber-100/50' : 'text-stone-400'}`}>
                            {formatTime(msg.createdAt)}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="border-t border-white/10 p-4 sm:p-5">
            {sendError && (
              <p className="mb-2 text-sm text-rose-400">{sendError}</p>
            )}
            <div className="flex items-end gap-3">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Write a message… (Enter to send)"
                rows={1}
                className="flex-1 resize-none rounded-xl border border-white/15 bg-black/35 px-4 py-3 text-sm text-stone-100 outline-none transition placeholder:text-stone-400/80 focus:border-amber-200/45"
                style={{ maxHeight: '9rem', overflowY: 'auto' }}
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={!inputValue.trim() || isSending}
                className="rounded-xl border border-amber-200/40 bg-amber-300/20 px-4 py-3 text-sm font-semibold text-amber-100 transition hover:border-amber-100/70 hover:bg-amber-200/30 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSending ? (
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-amber-100/30 border-t-amber-100" />
                ) : (
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M22 2L11 13" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M22 2L15 22l-4-9-9-4 20-7z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
                <span className="sr-only">Send</span>
              </button>
              <button
                type="button"
                onClick={() => setShowGestureMenu((current) => !current)}
                disabled={Boolean(activeGesture)}
                className="rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm font-semibold text-stone-100 transition hover:border-amber-100/50 hover:text-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {activeGesture ? 'Sending...' : 'Poke...'}
              </button>
            </div>

            {showGestureMenu && (
              <div className="mt-3 grid grid-cols-3 gap-2 sm:max-w-xs">
                <button
                  type="button"
                  onClick={() => handleGesture('poke')}
                  disabled={Boolean(activeGesture)}
                  className="rounded-lg border border-amber-200/35 bg-amber-300/15 px-2.5 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-100 transition hover:bg-amber-300/25 disabled:opacity-50"
                >
                  Poke
                </button>
                <button
                  type="button"
                  onClick={() => handleGesture('wink')}
                  disabled={Boolean(activeGesture)}
                  className="rounded-lg border border-fuchsia-200/30 bg-fuchsia-300/10 px-2.5 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-fuchsia-100 transition hover:bg-fuchsia-300/20 disabled:opacity-50"
                >
                  Wink
                </button>
                <button
                  type="button"
                  onClick={() => handleGesture('wave')}
                  disabled={Boolean(activeGesture)}
                  className="rounded-lg border border-sky-200/30 bg-sky-300/10 px-2.5 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-sky-100 transition hover:bg-sky-300/20 disabled:opacity-50"
                >
                  Wave
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
