import Link from 'next/link'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { notFound } from 'next/navigation'

import VideoInteractions from './_components/video-interactions'
import VideoPlayerShell from './_components/video-player-shell'

import { AUTH_COOKIE_NAME, ROUTES, VIDEO_PLAYBACK_TOKEN_MAX_AGE_SECONDS } from '@/lib/constants'
import prisma from '@/lib/prisma'
import type { AuthTokenPayload } from '@/lib/types'

export const dynamic = 'force-dynamic'

async function getLoggedInMemberId(): Promise<string | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value
  const jwtSecret = process.env.JWT_SECRET

  if (!token || !jwtSecret) {
    return null
  }

  try {
    const payload = jwt.verify(token, jwtSecret) as AuthTokenPayload & { sub?: string }
    const userId =
      (typeof payload.userId === 'string' && payload.userId) ||
      (typeof payload.sub === 'string' && payload.sub) ||
      null

    if (!userId) {
      return null
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, status: true },
    })

    if (!user || user.status !== 'active') {
      return null
    }

    return user.id
  } catch {
    return null
  }
}

function createPublicPlaybackToken(videoId: string): string | null {
  const jwtSecret = process.env.JWT_SECRET

  if (!jwtSecret) {
    return null
  }

  return jwt.sign(
    {
      videoId,
      purpose: 'public-playback',
    },
    jwtSecret,
    { expiresIn: VIDEO_PLAYBACK_TOKEN_MAX_AGE_SECONDS }
  )
}

export default async function VideoViewerPage({ params }: { params: { id: string } }) {
  const video = await prisma.video.findUnique({
    where: { id: params.id },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          displayName: true,
          isPremium: true,
          profile: {
            select: {
              avatarUrl: true,
            },
          },
        },
      },
    },
  })

  if (!video) {
    notFound()
  }

  const memberId = await getLoggedInMemberId()
  const canView = video.isPublic || Boolean(memberId)
  const publicPlaybackToken = video.isPublic ? createPublicPlaybackToken(video.id) : null

  const playbackUrl = video.isPublic
    ? `/api/videos/${encodeURIComponent(video.id)}/play?token=${encodeURIComponent(publicPlaybackToken || '')}`
    : `/api/videos/${encodeURIComponent(video.id)}/play`

  if (!canView) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(255,180,120,0.24),_transparent_40%),radial-gradient(circle_at_top_right,_rgba(255,125,95,0.2),_transparent_42%),linear-gradient(160deg,#12080b_8%,#220d13_48%,#3f141f_100%)] px-4 py-12 text-stone-100 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-3xl rounded-3xl border border-white/10 bg-black/30 p-6 backdrop-blur-xl sm:p-8">
          <p className="text-xs uppercase tracking-[0.2em] text-amber-100/70">Members-Only Video</p>
          <h1 className="mt-3 font-[family:var(--font-display)] text-3xl text-amber-100 sm:text-4xl">{video.title}</h1>
          <p className="mt-4 text-base leading-7 text-stone-200">This video is members-only. Log in to watch.</p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={ROUTES.LOGIN}
              className="rounded-xl border border-amber-200/35 bg-amber-300/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-amber-100 transition hover:bg-amber-300/30"
            >
              Log In
            </Link>
            <Link
              href={ROUTES.ONBOARDING}
              className="rounded-xl border border-white/15 bg-black/30 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-stone-200 transition hover:border-amber-200/30 hover:text-amber-100"
            >
              Join Members
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const uploaderLabel = video.user.displayName || video.user.username

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(255,180,120,0.24),_transparent_40%),radial-gradient(circle_at_top_right,_rgba(255,125,95,0.2),_transparent_42%),linear-gradient(160deg,#12080b_8%,#220d13_48%,#3f141f_100%)] px-4 py-8 text-stone-100 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-5xl">
        <header className="rounded-3xl border border-white/10 bg-black/25 p-5 backdrop-blur-xl sm:p-6">
          <p className="text-xs uppercase tracking-[0.22em] text-amber-100/70">Video Viewer</p>
          <h1 className="mt-2 font-[family:var(--font-display)] text-3xl text-amber-100 sm:text-4xl">{video.title}</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-300">{video.description || 'No description provided.'}</p>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-stone-300">
            <span>Uploaded by</span>
            <span className="rounded-lg border border-white/15 bg-black/35 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-amber-100">
              @{uploaderLabel}
            </span>
            {!video.isPublic && (
              <span className="rounded-lg border border-white/15 bg-black/35 px-2.5 py-1 text-xs uppercase tracking-[0.14em] text-stone-300">
                Members-Only
              </span>
            )}
          </div>

          <VideoInteractions
            videoId={video.id}
            isPublic={video.isPublic}
            initialViews={video.views}
            showPublicBadge={video.isPublic && video.user.isPremium}
          />
        </header>

        <VideoPlayerShell
          src={playbackUrl}
          poster={video.thumbnailUrl || undefined}
          isPublic={video.isPublic}
        />
      </div>
    </div>
  )
}
