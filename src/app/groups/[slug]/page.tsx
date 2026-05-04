'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

import TopQuickNav from '@/app/_components/top-quick-nav'
import { GROUP_CATEGORIES, MAX_GROUP_POST_LENGTH, ROUTES } from '@/lib/constants'
import type { GroupDetail, GroupPostItem } from '@/lib/types'

function formatRelativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60_000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return new Date(iso).toLocaleDateString()
}

function getInitials(name: string) {
  return name.split(' ').map((p) => p[0]).filter(Boolean).join('').slice(0, 2).toUpperCase()
}

export default function GroupDetailPage() {
  const params = useParams()
  const slug = typeof params?.slug === 'string' ? params.slug : ''

  const [group, setGroup] = useState<GroupDetail | null>(null)
  const [posts, setPosts] = useState<GroupPostItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isMember, setIsMember] = useState(false)
  const [memberRole, setMemberRole] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [isJoining, setIsJoining] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)
  const [actionFeedback, setActionFeedback] = useState('')
  const [postBody, setPostBody] = useState('')
  const [isPosting, setIsPosting] = useState(false)
  const [postError, setPostError] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  async function loadGroup() {
    try {
      setIsLoading(true)
      setError('')
      const res = await fetch(`/api/groups/${slug}`)
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Group not found')
      }
      const data = await res.json()
      setGroup(data.group)
      setPosts(data.group.recentPosts ?? [])
      setMemberRole(data.group.memberRole)
      setIsMember(data.group.memberRole !== null)
      setCurrentUserId(data.group.currentUserId ?? null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load group')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (slug) void loadGroup()
  }, [slug])

  async function handleJoin() {
    try {
      setIsJoining(true)
      setActionFeedback('')
      const res = await fetch(`/api/groups/${slug}/join`, { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Failed to join')
      setIsMember(true)
      setMemberRole('member')
      setGroup((g) => g ? { ...g, memberRole: 'member', memberCount: g.memberCount + 1 } : g)
      setActionFeedback('Joined!')
    } catch (err) {
      setActionFeedback(err instanceof Error ? err.message : 'Error')
    } finally {
      setIsJoining(false)
    }
  }

  async function handleLeave() {
    try {
      setIsLeaving(true)
      setActionFeedback('')
      const res = await fetch(`/api/groups/${slug}/leave`, { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Failed to leave')
      setIsMember(false)
      setMemberRole(null)
      setGroup((g) => g ? { ...g, memberRole: null, memberCount: Math.max(0, g.memberCount - 1) } : g)
      setActionFeedback('Left group.')
    } catch (err) {
      setActionFeedback(err instanceof Error ? err.message : 'Error')
    } finally {
      setIsLeaving(false)
    }
  }

  async function handlePost(e: React.FormEvent) {
    e.preventDefault()
    const body = postBody.trim()
    if (!body) return
    try {
      setIsPosting(true)
      setPostError('')
      const res = await fetch(`/api/groups/${slug}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Failed to post')
      setPosts((prev) => [data.post, ...prev])
      setPostBody('')
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    } catch (err) {
      setPostError(err instanceof Error ? err.message : 'Error')
    } finally {
      setIsPosting(false)
    }
  }

  async function handleDeletePost(postId: string) {
    try {
      setDeletingId(postId)
      const res = await fetch(`/api/groups/${slug}/posts/${postId}`, { method: 'DELETE' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Failed to delete')
      setPosts((prev) => prev.filter((p) => p.id !== postId))
    } catch {
      // swallow — post stays visible
    } finally {
      setDeletingId(null)
    }
  }

  const categoryLabel =
    GROUP_CATEGORIES.find((c) => group && c.value === group.category)?.label ?? group?.category ?? ''

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#090b10] text-stone-100">
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20"
        style={{ backgroundImage: "url('/welcome2.jpg')" }}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#090b10]/60 to-[#090b10]/95" />

      <TopQuickNav className="left-4 right-4 md:left-6 md:right-6" />

      <main className="relative z-10 mx-auto max-w-3xl px-4 pb-16 pt-20 sm:px-6">
        {/* Back */}
        <Link
          href={ROUTES.GROUPS}
          className="inline-flex items-center gap-1 text-xs text-stone-400 hover:text-stone-200"
        >
          ← Groups
        </Link>

        {isLoading ? (
          <div className="mt-16 flex justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
          </div>
        ) : error ? (
          <p className="mt-16 text-center text-sm text-rose-400">{error}</p>
        ) : group ? (
          <>
            {/* Group header */}
            <div className="mt-5 rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-xl font-bold text-stone-200">
                  {group.coverUrl ? (
                    <img src={group.coverUrl} alt="" className="h-14 w-14 rounded-2xl object-cover" />
                  ) : (
                    getInitials(group.name)
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="font-[family:var(--font-display)] text-3xl text-stone-100">
                    {group.name}
                  </h1>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-stone-400">
                    <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 uppercase tracking-widest">
                      {categoryLabel}
                    </span>
                    <span>{group.memberCount} {group.memberCount === 1 ? 'member' : 'members'}</span>
                    {memberRole && (
                      <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 uppercase tracking-widest text-emerald-400">
                        {memberRole === 'owner' ? 'Owner' : memberRole === 'moderator' ? 'Mod' : 'Member'}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {group.description && (
                <p className="mt-4 text-sm leading-7 text-stone-300">{group.description}</p>
              )}

              <div className="mt-4 flex items-center gap-3">
                {isMember ? (
                  memberRole !== 'owner' && (
                    <button
                      type="button"
                      disabled={isLeaving}
                      onClick={() => void handleLeave()}
                      className="rounded-xl border border-white/15 px-4 py-2 text-xs text-stone-400 transition hover:border-white/25 hover:text-stone-200 disabled:cursor-wait disabled:opacity-50"
                    >
                      {isLeaving ? 'Leaving…' : 'Leave group'}
                    </button>
                  )
                ) : (
                  <button
                    type="button"
                    disabled={isJoining}
                    onClick={() => void handleJoin()}
                    className="rounded-xl border border-white/20 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-stone-100 transition hover:border-white/35 hover:bg-white/10 disabled:cursor-wait disabled:opacity-50"
                  >
                    {isJoining ? 'Joining…' : 'Join group'}
                  </button>
                )}
                {actionFeedback && (
                  <span className="text-xs text-emerald-400">{actionFeedback}</span>
                )}
              </div>
            </div>

            {/* Post composer — members only */}
            {isMember && (
              <form
                onSubmit={(e) => void handlePost(e)}
                className="mt-6 rounded-3xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur"
              >
                <textarea
                  value={postBody}
                  onChange={(e) => setPostBody(e.target.value)}
                  maxLength={MAX_GROUP_POST_LENGTH}
                  placeholder="Write something…"
                  rows={3}
                  className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-stone-100 placeholder:text-stone-500 focus:border-white/25 focus:outline-none"
                />
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-stone-500">
                    {postBody.length}/{MAX_GROUP_POST_LENGTH}
                  </span>
                  <div className="flex items-center gap-3">
                    {postError && <span className="text-xs text-rose-400">{postError}</span>}
                    <button
                      type="submit"
                      disabled={isPosting || !postBody.trim()}
                      className="rounded-xl border border-white/20 bg-white/[0.06] px-4 py-1.5 text-sm font-semibold text-stone-100 transition hover:border-white/35 hover:bg-white/10 disabled:cursor-wait disabled:opacity-50"
                    >
                      {isPosting ? 'Posting…' : 'Post'}
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Posts */}
            <section className="mt-6 space-y-4">
              {posts.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-white/10 p-8 text-center text-sm text-stone-400">
                  {isMember ? 'Be the first to post in this group.' : 'No posts yet.'}
                </div>
              ) : (
                posts.map((post) => (
                  <article
                    key={post.id}
                    className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-stone-300">
                          {post.author.avatarUrl ? (
                            <img
                              src={post.author.avatarUrl}
                              alt=""
                              className="h-8 w-8 rounded-full object-cover"
                            />
                          ) : (
                            getInitials(post.author.displayName)
                          )}
                        </div>
                        <div className="min-w-0">
                          <Link
                            href={`/u/${post.author.username}`}
                            className="text-sm font-semibold text-stone-100 hover:underline truncate block"
                          >
                            {post.author.displayName}
                          </Link>
                          <p className="text-xs text-stone-500">{formatRelativeTime(post.createdAt)}</p>
                        </div>
                      </div>
                      {/* Delete: shown to post author or mods/owners */}
                      {(memberRole === 'owner' || memberRole === 'moderator' || post.author.id === currentUserId) && (
                        <button
                          type="button"
                          disabled={deletingId === post.id}
                          onClick={() => void handleDeletePost(post.id)}
                          className="shrink-0 text-xs text-stone-500 hover:text-rose-400 disabled:cursor-wait disabled:opacity-50 transition"
                        >
                          {deletingId === post.id ? '…' : 'Delete'}
                        </button>
                      )}
                    </div>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-stone-200">
                      {post.body}
                    </p>
                  </article>
                ))
              )}
              <div ref={bottomRef} />
            </section>
          </>
        ) : null}
      </main>
    </div>
  )
}
