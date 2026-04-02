'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

import { fetchPublicVideos, incrementVideoViews } from '@/lib/api'
import { ROUTES } from '@/lib/constants'
import type { VideoFeedItem } from '@/lib/types'

function formatRelativeDate(value: string): string {
  const date = new Date(value)
  const ms = Date.now() - date.getTime()
  const mins = Math.floor(ms / 60000)

  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`

  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`

  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`

  return date.toLocaleDateString()
}

export default function VideosPage() {
  const [videos, setVideos] = useState<VideoFeedItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        setIsLoading(true)
        setError('')
        const response = await fetchPublicVideos()

        if (!cancelled) {
          setVideos(response.videos)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unable to load videos.')
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [])

  const videoCountLabel = useMemo(() => {
    if (videos.length === 1) {
      return '1 public video'
    }

    return `${videos.length} public videos`
  }, [videos.length])

  async function handleOpenVideo(videoId: string) {
    try {
      const result = await incrementVideoViews(videoId)
      setVideos((current) =>
        current.map((video) =>
          video.id === videoId
            ? {
                ...video,
                views: result.views,
              }
            : video
        )
      )
    } catch {
      // Best-effort view updates should not block opening the URL.
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#090b10] px-4 py-8 text-stone-100 sm:px-6 lg:px-8">
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat opacity-38"
        style={{ backgroundImage: "url('/welcome2.jpg')" }}
      />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(8,11,18,0.6)_0%,rgba(6,8,12,0.74)_100%)]" />

      <div className="relative z-10 mx-auto w-full max-w-6xl">
        <header className="rounded-3xl border border-white/12 bg-black/30 p-5 backdrop-blur-xl sm:p-6">
          <p className="text-xs uppercase tracking-[0.22em] text-stone-300/80">Videos</p>
          <h1 className="mt-2 font-[family:var(--font-display)] text-3xl text-stone-100 sm:text-4xl">Public Video Feed</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-300">
            Watch clips shared by Premium members and jump to your own upload dashboard anytime.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href={ROUTES.MY_VIDEOS}
              className="rounded-xl border border-white/20 bg-white/[0.06] px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-stone-100 transition hover:border-white/35 hover:bg-white/[0.1]"
            >
              My Videos
            </Link>
            <span className="rounded-xl border border-white/15 bg-black/30 px-4 py-2 text-xs uppercase tracking-[0.14em] text-stone-300">
              {videoCountLabel}
            </span>
          </div>
        </header>

        {error && (
          <p className="mt-5 rounded-2xl border border-rose-300/30 bg-rose-500/20 p-4 text-sm text-rose-100">
            {error}
          </p>
        )}

        {isLoading ? (
          <div className="mt-10 flex justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-300/35 border-t-amber-100" />
          </div>
        ) : videos.length === 0 ? (
          <p className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-5 text-sm text-stone-300">
            No public videos yet.
          </p>
        ) : (
          <section className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {videos.map((video) => (
              <article key={video.id} className="overflow-hidden rounded-3xl border border-white/10 bg-black/30 backdrop-blur-xl">
                <div className="relative h-44 w-full bg-black/40">
                  {video.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={video.thumbnailUrl}
                      alt={`${video.title} thumbnail`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm uppercase tracking-[0.18em] text-stone-400">
                      No thumbnail
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <h2 className="line-clamp-1 text-lg font-semibold text-stone-100">{video.title}</h2>
                  <p className="mt-1 text-xs uppercase tracking-[0.14em] text-stone-400">
                    by {video.user.displayName} · {formatRelativeDate(video.createdAt)}
                  </p>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-stone-300">{video.description || 'No description provided.'}</p>

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <span className="text-xs uppercase tracking-[0.12em] text-stone-400">{video.views} views</span>
                    <a
                      href={video.videoUrl}
                      target="_blank"
                      rel="noreferrer"
                      title={`Preview ${video.title}`}
                      onClick={() => {
                        void handleOpenVideo(video.id)
                      }}
                      className="rounded-lg border border-white/20 bg-white/[0.05] px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-stone-100 transition hover:border-white/35 hover:bg-white/[0.1]"
                    >
                      Watch
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </div>
  )
}
