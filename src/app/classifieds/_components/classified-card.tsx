'use client'

import Link from 'next/link'
import { CLASSIFIED_CATEGORY_LABELS } from '@/lib/constants'
import type { ClassifiedListing } from '@/lib/types'

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

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

type ClassifiedCardProps = {
  listing: ClassifiedListing
}

export default function ClassifiedCard({ listing }: ClassifiedCardProps) {
  const categoryColor = CATEGORY_COLORS[listing.category] ?? 'bg-white/10 text-stone-300 border-white/15'
  const categoryLabel = CLASSIFIED_CATEGORY_LABELS[listing.category as keyof typeof CLASSIFIED_CATEGORY_LABELS] ?? listing.category
  const thumb = listing.photos[0] ?? null

  return (
    <Link
      href={`/classifieds/${listing.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0e1118] transition hover:border-white/20 hover:bg-[#121620]"
    >
      {/* Photo / placeholder */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#0a0c12]">
        {thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumb}
            alt={listing.title}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-4xl text-stone-700">
            📋
          </div>
        )}
        {/* Category badge */}
        <span
          className={`absolute left-2 top-2 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest ${categoryColor}`}
        >
          {categoryLabel}
        </span>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-2 text-sm font-semibold text-stone-100 leading-snug group-hover:text-white">
          {listing.title}
        </h3>

        {listing.location && (
          <p className="text-xs text-stone-500">📍 {listing.location}</p>
        )}

        <p className="line-clamp-3 text-xs text-stone-400 leading-relaxed">
          {listing.description}
        </p>

        {/* Footer */}
        <div className="mt-auto flex items-center gap-2 pt-2">
          {listing.poster.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={listing.poster.avatarUrl}
              alt={listing.poster.displayName}
              className="h-6 w-6 rounded-full object-cover"
            />
          ) : (
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-[10px] font-bold text-stone-300">
              {listing.poster.displayName.slice(0, 1).toUpperCase()}
            </span>
          )}
          <span className="text-xs text-stone-500 truncate">{listing.poster.displayName}</span>
          <span className="ml-auto shrink-0 text-[10px] text-stone-600">{timeAgo(listing.createdAt)}</span>
        </div>
      </div>
    </Link>
  )
}
