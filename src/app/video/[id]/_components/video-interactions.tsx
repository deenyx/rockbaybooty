'use client'

import { useEffect, useMemo, useState } from 'react'

import { incrementVideoViews } from '@/lib/api'

type VideoInteractionsProps = {
  videoId: string
  isPublic: boolean
  initialViews: number
  showPublicBadge: boolean
}

export default function VideoInteractions({
  videoId,
  isPublic,
  initialViews,
  showPublicBadge,
}: VideoInteractionsProps) {
  const [views, setViews] = useState(initialViews)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function addView() {
      try {
        const result = await incrementVideoViews(videoId)

        if (!cancelled) {
          setViews(result.views)
        }
      } catch {
        if (!cancelled) {
          setViews((current) => current)
        }
      }
    }

    void addView()

    return () => {
      cancelled = true
    }
  }, [videoId])

  const shareUrl = useMemo(() => {
    if (typeof window === 'undefined') {
      return ''
    }

    return window.location.href
  }, [])

  async function handleCopyLink() {
    try {
      const value = shareUrl || window.location.href
      await navigator.clipboard.writeText(value)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      <span className="rounded-lg border border-white/15 bg-black/35 px-3 py-1.5 text-xs uppercase tracking-[0.14em] text-stone-300">
        {views} views
      </span>

      {isPublic && (
        <>
          {showPublicBadge && (
            <span className="rounded-lg border border-amber-200/35 bg-amber-300/20 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-amber-100">
              Public Link
            </span>
          )}
          <button
            type="button"
            onClick={handleCopyLink}
            className="rounded-lg border border-amber-200/35 bg-amber-300/20 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-amber-100 transition hover:bg-amber-300/30"
          >
            {copied ? 'Link Copied' : 'Copy Link'}
          </button>
        </>
      )}
    </div>
  )
}
