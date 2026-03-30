'use client'

import Link from 'next/link'
import { useParams, usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

import { fetchConversationMessages, sendMessage } from '@/lib/api'
import { ROUTES } from '@/lib/constants'
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
  const [sendError, setSendError] = useState('')

  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!partnerId) return
    let cancelled = false

    async function load() {
      try {
        setIsLoading(true)
        setLoadError('')
        const result = await fetchConversationMessages(partnerId)
        if (!cancelled) {
          setData(result)
          setMessages(result.messages)
        }
      } catch (error) {
        if (!cancelled) {
          setLoadError(
            error instanceof Error ? error.message : 'Unable to load conversation.'
          )
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [partnerId])

  // Scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
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

        {/* Conversation panel */}
        <main className="flex flex-1 flex-col overflow-hidden rounded-3xl border border-white/10 bg-black/30 backdrop-blur-xl">
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-white/10 p-4 sm:p-5">
            <Link
              href={ROUTES.MESSAGESS}
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
                            isMine
                              ? 'rounded-br-sm bg-amber-400/25 text-amber-50'
                              : 'rounded-bl-sm bg-white/10 text-stone-100'
                          }`}
                        >
                          <p>{msg.body}</p>
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
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
