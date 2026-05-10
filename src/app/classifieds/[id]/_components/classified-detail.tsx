'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { CLASSIFIED_CATEGORY_LABELS, ROUTES } from '@/lib/constants'
import type { ClassifiedListing } from '@/lib/types'

const CATEGORY_COLORS: Record<string, string> = {
  'for-sale': 'bg-sky-900/60 text-sky-300 border-sky-500/30',
  wanted: 'bg-violet-900/60 text-violet-300 border-violet-500/30',
  free: 'bg-emerald-900/60 text-emerald-300 border-emerald-500/30',
  'housing-rentals': 'bg-indigo-900/60 text-indigo-300 border-indigo-500/30',
  'housing-roommates': 'bg-cyan-900/60 text-cyan-300 border-cyan-500/30',
  'housing-sublets': 'bg-blue-900/60 text-blue-300 border-blue-500/30',
  jobs: 'bg-amber-900/60 text-amber-300 border-amber-500/30',
  gigs: 'bg-yellow-900/60 text-yellow-300 border-yellow-500/30',
  services: 'bg-lime-900/60 text-lime-300 border-lime-500/30',
  'community-events': 'bg-fuchsia-900/60 text-fuchsia-300 border-fuchsia-500/30',
  classes: 'bg-purple-900/60 text-purple-300 border-purple-500/30',
  buying: 'bg-teal-900/60 text-teal-300 border-teal-500/30',
  selling: 'bg-pink-900/60 text-pink-300 border-pink-500/30',
  rentals: 'bg-indigo-900/60 text-indigo-300 border-indigo-500/30',
  personals: 'bg-rose-900/60 text-rose-300 border-rose-500/30',
  'adult-escorts': 'bg-red-900/60 text-red-300 border-red-500/30',
  'adult-massage': 'bg-orange-900/60 text-orange-300 border-orange-500/30',
  'adult-entertainment': 'bg-pink-900/60 text-pink-300 border-pink-500/30',
  encounters: 'bg-rose-900/60 text-rose-300 border-rose-500/30',
  casual: 'bg-orange-900/60 text-orange-300 border-orange-500/30',
  relationships: 'bg-indigo-900/60 text-indigo-300 border-indigo-500/30',
  seeking: 'bg-emerald-900/60 text-emerald-300 border-emerald-500/30',
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

type ClassifiedDetailProps = {
  listing: ClassifiedListing
  currentUserId: string
}

export default function ClassifiedDetail({ listing, currentUserId }: ClassifiedDetailProps) {
  const router = useRouter()
  const [photoIndex, setPhotoIndex] = useState(0)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)

  const isOwner = listing.userId === currentUserId
  const categoryColor = CATEGORY_COLORS[listing.category] ?? 'bg-white/10 text-stone-300 border-white/15'
  const categoryLabel = CLASSIFIED_CATEGORY_LABELS[listing.category as keyof typeof CLASSIFIED_CATEGORY_LABELS] ?? listing.category
  const isExpired = new Date(listing.expiresAt) < new Date()

  const handleDelete = async () => {
    setDeleting(true)
    setDeleteError('')
    try {
      const res = await fetch(`/api/classifieds/${listing.id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error((json as { error?: string }).error || 'Failed to delete')
      }
      router.push(ROUTES.CLASSIFIEDS)
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Something went wrong')
      setDeleting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#080b11] text-stone-100">
      <div className="mx-auto max-w-3xl px-4 py-8">
        {/* Back */}
        <Link
          href={ROUTES.CLASSIFIEDS}
          className="mb-6 inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-300 transition"
        >
          ← Back to classifieds
        </Link>

        {/* Status notice */}
        {isExpired && (
          <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-950/40 px-4 py-2.5 text-sm text-amber-300">
            This listing has expired and is no longer active.
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-[1fr_280px]">
          {/* Left: photos + content */}
          <div className="flex flex-col gap-5">
            {/* Photo carousel */}
            {listing.photos.length > 0 ? (
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0a0c12]">
                {/* Main photo */}
                <div className="relative aspect-video w-full overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={listing.photos[photoIndex]}
                    alt={`${listing.title} photo ${photoIndex + 1}`}
                    className="h-full w-full object-contain"
                  />
                  {/* Prev/Next */}
                  {listing.photos.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={() => setPhotoIndex((i) => (i - 1 + listing.photos.length) % listing.photos.length)}
                        className="absolute left-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-sm text-white hover:bg-black/80"
                      >
                        ‹
                      </button>
                      <button
                        type="button"
                        onClick={() => setPhotoIndex((i) => (i + 1) % listing.photos.length)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-sm text-white hover:bg-black/80"
                      >
                        ›
                      </button>
                    </>
                  )}
                </div>

                {/* Thumbnails */}
                {listing.photos.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto p-3">
                    {listing.photos.map((src, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setPhotoIndex(i)}
                        className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border transition ${
                          i === photoIndex ? 'border-white/40' : 'border-white/10 opacity-60 hover:opacity-80'
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={src} alt={`Thumb ${i + 1}`} className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex aspect-video w-full items-center justify-center rounded-2xl border border-white/10 bg-[#0a0c12] text-5xl text-stone-700">
                📋
              </div>
            )}

            {/* Title + category */}
            <div className="flex flex-wrap items-start gap-3">
              <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest ${categoryColor}`}>
                {categoryLabel}
              </span>
              <h1 className="w-full text-xl font-bold text-white">{listing.title}</h1>
            </div>

            {/* Location + dates */}
            <div className="flex flex-wrap gap-4 text-xs text-stone-500">
              {listing.location && <span>📍 {listing.location}</span>}
              <span>Posted {formatDate(listing.createdAt)}</span>
              {!isExpired && <span>Expires {formatDate(listing.expiresAt)}</span>}
            </div>

            {/* Description */}
            <div className="rounded-2xl border border-white/8 bg-[#0e1118] p-5">
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-stone-500">Description</h2>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-stone-300">{listing.description}</p>
            </div>
          </div>

          {/* Right: poster card + actions */}
          <div className="flex flex-col gap-4">
            {/* Poster card */}
            <div className="rounded-2xl border border-white/10 bg-[#0e1118] p-5">
              <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-stone-500">Posted by</h2>
              <div className="flex items-center gap-3">
                {listing.poster.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={listing.poster.avatarUrl}
                    alt={listing.poster.displayName}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                ) : (
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-lg font-bold text-stone-300">
                    {listing.poster.displayName.slice(0, 1).toUpperCase()}
                  </span>
                )}
                <div className="min-w-0">
                  <p className="truncate font-semibold text-stone-100">{listing.poster.displayName}</p>
                  <p className="text-xs text-stone-500">@{listing.poster.username}</p>
                </div>
              </div>

              {!isOwner && (
                <Link
                  href={`${ROUTES.MESSAGESS}/${listing.userId}`}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-full border border-sky-400/25 bg-gradient-to-r from-sky-500/80 to-indigo-600/80 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
                >
                  💬 Send message
                </Link>
              )}
            </div>

            {/* Owner: delete */}
            {isOwner && (
              <div className="rounded-2xl border border-white/10 bg-[#0e1118] p-5">
                <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-stone-500">Your listing</h2>

                {deleteError && (
                  <p className="mb-3 rounded-lg border border-rose-500/30 bg-rose-950/40 px-3 py-2 text-xs text-rose-300">
                    {deleteError}
                  </p>
                )}

                {!showConfirm ? (
                  <button
                    type="button"
                    onClick={() => setShowConfirm(true)}
                    className="w-full rounded-full border border-rose-500/25 bg-rose-950/40 py-2.5 text-sm text-rose-400 transition hover:bg-rose-950/70"
                  >
                    Delete listing
                  </button>
                ) : (
                  <div className="flex flex-col gap-2">
                    <p className="text-xs text-stone-400">Are you sure? This can't be undone.</p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setShowConfirm(false)}
                        className="flex-1 rounded-full border border-white/10 bg-white/5 py-2 text-xs text-stone-400 hover:bg-white/10"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleDelete}
                        disabled={deleting}
                        className="flex-1 rounded-full border border-rose-500/30 bg-rose-600/80 py-2 text-xs font-semibold text-white hover:bg-rose-600 disabled:opacity-60"
                      >
                        {deleting ? 'Deleting…' : 'Confirm'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
