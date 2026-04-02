'use client'

import Link from 'next/link'
import { FormEvent, useEffect, useState } from 'react'

import { createVideo, deleteVideo, fetchMyVideos, updateVideo } from '@/lib/api'
import { ROUTES } from '@/lib/constants'
import type { VideoFeedItem } from '@/lib/types'

export default function MyVideosPage() {
  const [videos, setVideos] = useState<VideoFeedItem[]>([])
  const [isPremium, setIsPremium] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [thumbnailUrl, setThumbnailUrl] = useState('')
  const [isPublic, setIsPublic] = useState(false)

  async function loadVideos() {
    try {
      setIsLoading(true)
      setError('')
      const response = await fetchMyVideos()
      setVideos(response.videos)
      setIsPremium(response.isPremium === true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load your videos.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadVideos()
  }, [])

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    try {
      setIsSubmitting(true)
      setError('')
      setSuccess('')

      const response = await createVideo({
        title,
        description,
        videoUrl,
        thumbnailUrl,
        isPublic,
      })

      setVideos((current) => [response.video, ...current])
      setTitle('')
      setDescription('')
      setVideoUrl('')
      setThumbnailUrl('')
      setIsPublic(false)
      setSuccess('Video uploaded successfully.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to upload video.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleTogglePublic(video: VideoFeedItem) {
    try {
      setPendingId(video.id)
      setError('')
      setSuccess('')

      const response = await updateVideo(video.id, {
        isPublic: !video.isPublic,
      })

      setVideos((current) =>
        current.map((item) => (item.id === response.video.id ? response.video : item))
      )

      setSuccess(response.video.isPublic ? 'Video is now public.' : 'Video is now private.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update visibility.')
    } finally {
      setPendingId(null)
    }
  }

  async function handleDelete(videoId: string) {
    try {
      setPendingId(videoId)
      setError('')
      setSuccess('')

      await deleteVideo(videoId)
      setVideos((current) => current.filter((video) => video.id !== videoId))
      setSuccess('Video deleted.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete video.')
    } finally {
      setPendingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(255,180,120,0.24),_transparent_40%),radial-gradient(circle_at_top_right,_rgba(255,125,95,0.2),_transparent_42%),linear-gradient(160deg,#12080b_8%,#220d13_48%,#3f141f_100%)] px-4 py-8 text-stone-100 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <header className="rounded-3xl border border-white/10 bg-black/25 p-5 backdrop-blur-xl sm:p-6">
          <p className="text-xs uppercase tracking-[0.22em] text-amber-100/70">Videos</p>
          <h1 className="mt-2 font-[family:var(--font-display)] text-3xl text-amber-100 sm:text-4xl">My Video Vault</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-300">
            Upload links to your videos and control whether each one is public.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href={ROUTES.VIDEOS}
              className="rounded-xl border border-white/15 bg-black/30 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-stone-200 transition hover:border-amber-200/30 hover:text-amber-100"
            >
              Back to feed
            </Link>
            <span className="rounded-xl border border-white/15 bg-black/30 px-4 py-2 text-xs uppercase tracking-[0.14em] text-stone-300">
              {isPremium ? 'Premium account' : 'Standard account'}
            </span>
          </div>
        </header>

        <section className="mt-6 rounded-3xl border border-white/10 bg-black/30 p-5 backdrop-blur-xl sm:p-6">
          <h2 className="text-lg font-semibold text-stone-100">Upload Video</h2>

          <form className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2" onSubmit={handleCreate}>
            <label className="block text-sm text-stone-200">
              <span className="text-xs uppercase tracking-[0.14em] text-stone-400">Title</span>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                required
                className="mt-2 w-full rounded-xl border border-white/15 bg-black/35 px-4 py-3 text-sm text-stone-100 outline-none transition placeholder:text-stone-400/80 focus:border-amber-200/45"
                placeholder="Late Night Dance Session"
              />
            </label>

            <label className="block text-sm text-stone-200">
              <span className="text-xs uppercase tracking-[0.14em] text-stone-400">Video URL</span>
              <input
                value={videoUrl}
                onChange={(event) => setVideoUrl(event.target.value)}
                required
                className="mt-2 w-full rounded-xl border border-white/15 bg-black/35 px-4 py-3 text-sm text-stone-100 outline-none transition placeholder:text-stone-400/80 focus:border-amber-200/45"
                placeholder="https://..."
              />
            </label>

            <label className="block text-sm text-stone-200 md:col-span-2">
              <span className="text-xs uppercase tracking-[0.14em] text-stone-400">Description</span>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={3}
                className="mt-2 w-full rounded-xl border border-white/15 bg-black/35 px-4 py-3 text-sm text-stone-100 outline-none transition placeholder:text-stone-400/80 focus:border-amber-200/45"
                placeholder="What should viewers know before opening this clip?"
              />
            </label>

            <label className="block text-sm text-stone-200">
              <span className="text-xs uppercase tracking-[0.14em] text-stone-400">Thumbnail URL</span>
              <input
                value={thumbnailUrl}
                onChange={(event) => setThumbnailUrl(event.target.value)}
                className="mt-2 w-full rounded-xl border border-white/15 bg-black/35 px-4 py-3 text-sm text-stone-100 outline-none transition placeholder:text-stone-400/80 focus:border-amber-200/45"
                placeholder="https://..."
              />
            </label>

            <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-stone-200">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(event) => setIsPublic(event.target.checked)}
                className="h-4 w-4 accent-amber-400"
              />
              <span>
                Make public {isPremium ? '(Premium enabled)' : '(Premium required)'}
              </span>
            </label>

            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-xl border border-amber-200/30 bg-amber-300/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-amber-100 transition hover:bg-amber-300/30 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? 'Uploading...' : 'Upload Video'}
              </button>
            </div>
          </form>
        </section>

        {error && (
          <p className="mt-5 rounded-2xl border border-rose-300/30 bg-rose-500/20 p-4 text-sm text-rose-100">{error}</p>
        )}

        {success && (
          <p className="mt-5 rounded-2xl border border-emerald-300/30 bg-emerald-500/20 p-4 text-sm text-emerald-100">{success}</p>
        )}

        {isLoading ? (
          <div className="mt-8 flex justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-300/35 border-t-amber-100" />
          </div>
        ) : videos.length === 0 ? (
          <p className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-5 text-sm text-stone-300">You have not uploaded any videos yet.</p>
        ) : (
          <section className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
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
                  <h3 className="line-clamp-1 text-lg font-semibold text-stone-100">{video.title}</h3>
                  <p className="mt-2 line-clamp-2 text-sm text-stone-300">{video.description || 'No description provided.'}</p>

                  <div className="mt-4 flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.12em] text-stone-400">
                    <span>{video.views} views</span>
                    <span>•</span>
                    <span>{video.isPublic ? 'Public' : 'Private'}</span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <a
                      href={video.videoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-stone-200 transition hover:border-white/35 hover:text-stone-100"
                    >
                      Open
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        void handleTogglePublic(video)
                      }}
                      disabled={pendingId === video.id}
                      className="rounded-lg border border-amber-200/30 bg-amber-300/20 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-amber-100 transition hover:bg-amber-300/30 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {pendingId === video.id ? 'Saving...' : video.isPublic ? 'Make Private' : 'Make Public'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        void handleDelete(video.id)
                      }}
                      disabled={pendingId === video.id}
                      className="rounded-lg border border-rose-300/25 bg-rose-500/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-rose-200 transition hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {pendingId === video.id ? 'Working...' : 'Delete'}
                    </button>
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
