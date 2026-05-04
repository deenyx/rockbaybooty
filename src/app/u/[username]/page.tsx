'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import TopQuickNav from '@/app/_components/top-quick-nav'
import OnlineDot from '@/app/_components/online-dot'
import { ROUTES } from '@/lib/constants'

type SocialLinks = {
  twitter: string | null
  fetlife: string | null
  onlyfans: string | null
  pornhub: string | null
  tumblr: string | null
  instagram: string | null
} | null

type PublicProfile = {
  id: string
  username: string
  displayName: string
  avatarUrl: string | null
  photoUrls: string[]
  bio: string | null
  age: number | null
  gender: string | null
  genderOther: string | null
  pronouns: string | null
  sexualOrientation: string | null
  orientationOther: string | null
  city: string | null
  state: string | null
  country: string | null
  interests: string[]
  lookingFor: string[]
  isOnline: boolean
  isVerified: boolean
  isSelf: boolean
  friendshipStatus: 'none' | 'outgoing_pending' | 'incoming_pending' | 'friends'
  allowDirectMessages: boolean
  allowFriendRequests: boolean
  friendshipId: string | null
  socialLinks: SocialLinks
  memberSince: string
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function formatMemberSince(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

export default function PublicProfilePage() {
  const params = useParams()
  const router = useRouter()
  const username = typeof params?.username === 'string' ? params.username : ''

  const [profile, setProfile] = useState<PublicProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [friendAction, setFriendAction] = useState('')
  const [isFriendLoading, setIsFriendLoading] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)
  const [showMsgRequest, setShowMsgRequest] = useState(false)
  const [msgRequestIntro, setMsgRequestIntro] = useState('')
  const [isSendingMsgReq, setIsSendingMsgReq] = useState(false)
  const [msgReqFeedback, setMsgReqFeedback] = useState('')

  async function load() {
    try {
      setIsLoading(true)
      setError('')
      const res = await fetch(`/api/users/${username}`)
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Member not found.')
      }
      const data = await res.json()
      setProfile(data.profile)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (username) void load()
  }, [username])

  async function handleFriendRequest() {
    if (!profile) return
    try {
      setIsFriendLoading(true)
      setFriendAction('')
      const res = await fetch('/api/friends/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientId: profile.id }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Failed to send request')
      setProfile((p) =>
        p ? { ...p, friendshipStatus: 'outgoing_pending', friendshipId: data.friendship?.id ?? null } : p
      )
      setFriendAction('Friend request sent!')
    } catch (err) {
      setFriendAction(err instanceof Error ? err.message : 'Error')
    } finally {
      setIsFriendLoading(false)
    }
  }

  async function handleCancelRequest() {
    if (!profile?.friendshipId) return
    try {
      setIsFriendLoading(true)
      const res = await fetch('/api/friends/requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendshipId: profile.friendshipId, action: 'cancel' }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Failed to cancel')
      setProfile((p) => p ? { ...p, friendshipStatus: 'none', friendshipId: null } : p)
      setFriendAction('')
    } catch (err) {
      setFriendAction(err instanceof Error ? err.message : 'Error')
    } finally {
      setIsFriendLoading(false)
    }
  }

  async function handleSendMsgRequest() {
    if (!profile) return
    try {
      setIsSendingMsgReq(true)
      setMsgReqFeedback('')
      const res = await fetch('/api/message-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientId: profile.id, intro: msgRequestIntro.trim() || undefined }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Failed to send request')
      setMsgReqFeedback('Message request sent!')
      setShowMsgRequest(false)
      setMsgRequestIntro('')
    } catch (err) {
      setMsgReqFeedback(err instanceof Error ? err.message : 'Error')
    } finally {
      setIsSendingMsgReq(false)
    }
  }

  const locationParts = [profile?.city, profile?.state, profile?.country].filter(Boolean)
  const locationStr = locationParts.join(', ')

  const allPhotos = [
    ...(profile?.avatarUrl ? [profile.avatarUrl] : []),
    ...(profile?.photoUrls ?? []).filter((p) => p !== profile?.avatarUrl),
  ]

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#090b10] text-stone-100">
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20"
        style={{ backgroundImage: "url('/welcome2.jpg')" }}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#090b10]/60 to-[#090b10]/95" />

      <TopQuickNav className="left-4 right-4 md:left-6 md:right-6" />

      {/* Lightbox */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setSelectedPhoto(null)}
        >
          <img
            src={selectedPhoto}
            alt=""
            className="max-h-[90vh] max-w-[90vw] rounded-2xl object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            type="button"
            onClick={() => setSelectedPhoto(null)}
            className="absolute right-6 top-6 text-2xl text-white/60 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      <main className="relative z-10 mx-auto max-w-2xl px-4 pb-16 pt-20 sm:px-6">
        <Link
          href={ROUTES.SEARCH}
          className="inline-flex items-center gap-1 text-xs text-stone-400 hover:text-stone-200"
        >
          ← Back
        </Link>

        {isLoading ? (
          <div className="mt-16 flex justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
          </div>
        ) : error ? (
          <p className="mt-16 text-center text-sm text-rose-400">{error}</p>
        ) : profile ? (
          <>
            {/* Hero card */}
            <div className="mt-5 rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur">
              <div className="flex items-start gap-5">
                {/* Avatar */}
                <button
                  type="button"
                  disabled={!profile.avatarUrl}
                  onClick={() => profile.avatarUrl && setSelectedPhoto(profile.avatarUrl)}
                  className="shrink-0 disabled:cursor-default"
                >
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/10 text-2xl font-bold text-stone-300 overflow-hidden">
                    {profile.avatarUrl ? (
                      <img src={profile.avatarUrl} alt="" className="h-20 w-20 object-cover" />
                    ) : (
                      getInitials(profile.displayName)
                    )}
                  </div>
                </button>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h1 className="font-[family:var(--font-display)] text-2xl text-stone-100 truncate">
                      {profile.displayName}
                    </h1>
                    {profile.isVerified && (
                      <span title="Verified member" className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sky-500 text-[11px] font-bold text-white">✓</span>
                    )}
                    <OnlineDot lastActiveAt={profile.isOnline ? new Date().toISOString() : null} size="md" />
                  </div>
                  <p className="text-xs text-stone-500">@{profile.username}</p>

                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-stone-400">
                    {profile.pronouns && (
                      <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5">
                        {profile.pronouns}
                      </span>
                    )}
                    {profile.age && (
                      <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5">
                        {profile.age}
                      </span>
                    )}
                    {(profile.gender === 'other' ? profile.genderOther : profile.gender) && (
                      <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5">
                        {profile.gender === 'other' ? profile.genderOther : profile.gender}
                      </span>
                    )}
                    {locationStr && (
                      <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5">
                        📍 {locationStr}
                      </span>
                    )}
                  </div>

                  <p className="mt-1 text-xs text-stone-600">
                    Member since {formatMemberSince(profile.memberSince)}
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              {!profile.isSelf && (
                <div className="mt-5 space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    {profile.allowDirectMessages && profile.friendshipStatus === 'friends' && (
                      <Link
                        href={`${ROUTES.MESSAGESS}/${profile.id}`}
                        className="rounded-xl border border-white/20 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-stone-100 transition hover:border-white/35 hover:bg-white/10"
                      >
                        Message
                      </Link>
                    )}

                    {profile.allowDirectMessages && profile.friendshipStatus !== 'friends' && !msgReqFeedback && (
                      <button
                        type="button"
                        onClick={() => setShowMsgRequest((v) => !v)}
                        className="rounded-xl border border-white/20 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-stone-100 transition hover:border-white/35 hover:bg-white/10"
                      >
                        {showMsgRequest ? 'Cancel' : 'Message'}
                      </button>
                    )}

                    {msgReqFeedback && (
                      <span className="text-xs text-emerald-400">{msgReqFeedback}</span>
                    )}

                    {profile.allowFriendRequests &&
                      profile.friendshipStatus === 'none' && (
                        <button
                          type="button"
                          disabled={isFriendLoading}
                          onClick={() => void handleFriendRequest()}
                          className="rounded-xl border border-white/15 px-4 py-2 text-sm text-stone-300 transition hover:border-white/25 hover:text-stone-100 disabled:cursor-wait disabled:opacity-50"
                        >
                          {isFriendLoading ? 'Sending…' : 'Add Friend'}
                        </button>
                      )}

                    {profile.friendshipStatus === 'friends' && (
                      <span className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-400">
                        Friends
                      </span>
                    )}

                    {profile.friendshipStatus === 'outgoing_pending' && (
                      <button
                        type="button"
                        disabled={isFriendLoading}
                        onClick={() => void handleCancelRequest()}
                        className="rounded-xl border border-white/15 px-4 py-2 text-sm text-stone-400 transition hover:border-rose-500/30 hover:text-rose-400 disabled:cursor-wait disabled:opacity-50"
                      >
                        {isFriendLoading ? '…' : 'Request Sent · Cancel'}
                      </button>
                    )}

                    {profile.friendshipStatus === 'incoming_pending' && (
                      <span className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm text-amber-400">
                        Wants to be friends
                      </span>
                    )}

                    {friendAction && (
                      <span className="text-xs text-emerald-400">{friendAction}</span>
                    )}
                  </div>

                  {/* Message request composer */}
                  {showMsgRequest && (
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <p className="mb-2 text-xs text-stone-400">Add an optional intro (max 300 chars)</p>
                      <textarea
                        value={msgRequestIntro}
                        onChange={(e) => setMsgRequestIntro(e.target.value)}
                        maxLength={300}
                        placeholder="Introduce yourself…"
                        rows={3}
                        className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-stone-100 placeholder:text-stone-500 focus:border-white/25 focus:outline-none"
                      />
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-xs text-stone-600">{msgRequestIntro.length}/300</span>
                        <button
                          type="button"
                          disabled={isSendingMsgReq}
                          onClick={() => void handleSendMsgRequest()}
                          className="rounded-xl border border-white/20 bg-white/[0.06] px-4 py-1.5 text-sm font-semibold text-stone-100 transition hover:border-white/35 hover:bg-white/10 disabled:cursor-wait disabled:opacity-50"
                        >
                          {isSendingMsgReq ? 'Sending…' : 'Send request'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {profile.isSelf && (
                <div className="mt-4">
                  <Link
                    href={ROUTES.PROFILE}
                    className="text-xs text-stone-400 hover:text-stone-200 underline underline-offset-2"
                  >
                    Edit your profile
                  </Link>
                </div>
              )}
            </div>

            {/* Bio */}
            {profile.bio && (
              <div className="mt-4 rounded-3xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur">
                <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-stone-500">About</h2>
                <p className="whitespace-pre-wrap text-sm leading-7 text-stone-200">{profile.bio}</p>
              </div>
            )}

            {/* Looking for & Interests */}
            {(profile.lookingFor.length > 0 || profile.interests.length > 0) && (
              <div className="mt-4 rounded-3xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur space-y-4">
                {profile.lookingFor.length > 0 && (
                  <div>
                    <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-stone-500">Looking for</h2>
                    <div className="flex flex-wrap gap-2">
                      {profile.lookingFor.map((item) => (
                        <span
                          key={item}
                          className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-stone-300 capitalize"
                        >
                          {item.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {profile.interests.length > 0 && (
                  <div>
                    <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-stone-500">Interests</h2>
                    <div className="flex flex-wrap gap-2">
                      {profile.interests.map((item) => (
                        <span
                          key={item}
                          className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-stone-300 capitalize"
                        >
                          {item.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Photos */}
            {allPhotos.length > 1 && (
              <div className="mt-4 rounded-3xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur">
                <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-stone-500">Photos</h2>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {allPhotos.map((url, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setSelectedPhoto(url)}
                      className="aspect-square overflow-hidden rounded-xl border border-white/10 bg-white/5"
                    >
                      <img src={url} alt="" className="h-full w-full object-cover transition hover:scale-105" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Social links */}
            {profile.socialLinks && Object.values(profile.socialLinks).some(Boolean) && (
              <div className="mt-4 rounded-3xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur">
                <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-stone-500">Links</h2>
                <div className="flex flex-wrap gap-3">
                  {profile.socialLinks.twitter && (
                    <a href={profile.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="text-xs text-sky-400 hover:text-sky-300 transition">
                      Twitter/X
                    </a>
                  )}
                  {profile.socialLinks.fetlife && (
                    <a href={profile.socialLinks.fetlife} target="_blank" rel="noopener noreferrer" className="text-xs text-rose-400 hover:text-rose-300 transition">
                      FetLife
                    </a>
                  )}
                  {profile.socialLinks.onlyfans && (
                    <a href={profile.socialLinks.onlyfans} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:text-blue-300 transition">
                      OnlyFans
                    </a>
                  )}
                  {profile.socialLinks.pornhub && (
                    <a href={profile.socialLinks.pornhub} target="_blank" rel="noopener noreferrer" className="text-xs text-orange-400 hover:text-orange-300 transition">
                      Pornhub
                    </a>
                  )}
                  {profile.socialLinks.tumblr && (
                    <a href={profile.socialLinks.tumblr} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-400 hover:text-indigo-300 transition">
                      Tumblr
                    </a>
                  )}
                  {profile.socialLinks.instagram && (
                    <a href={profile.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="text-xs text-pink-400 hover:text-pink-300 transition">
                      Instagram
                    </a>
                  )}
                </div>
              </div>
            )}
          </>
        ) : null}
      </main>
    </div>
  )
}
