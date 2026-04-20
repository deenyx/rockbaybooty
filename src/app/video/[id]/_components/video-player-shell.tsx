'use client'

import Link from 'next/link'
import { useState } from 'react'

import { ROUTES } from '@/lib/constants'

type VideoPlayerShellProps = {
  src: string
  poster: string | undefined
  isPublic: boolean
}

export default function VideoPlayerShell({ src, poster, isPublic }: VideoPlayerShellProps) {
  const [isPromptOpen, setIsPromptOpen] = useState(isPublic)

  return (
    <section className="mt-6 overflow-hidden rounded-3xl border border-white/10 bg-black/35 p-3 backdrop-blur-xl sm:p-4">
      <div className="relative">
        <video
          controls
          controlsList="nodownload noplaybackrate"
          disablePictureInPicture
          preload="metadata"
          poster={poster}
          className="h-auto w-full rounded-2xl border border-white/10 bg-black"
        >
          <source src={src} />
          Your browser does not support the video element.
        </video>

        {isPromptOpen && (
          <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/70 p-4">
            <div className="w-full max-w-md rounded-2xl border border-amber-200/30 bg-[linear-gradient(165deg,#170a0d_0%,#0d0507_100%)] p-5 shadow-[0_18px_45px_rgba(0,0,0,0.45)]">
              <p className="text-[11px] uppercase tracking-[0.18em] text-amber-100/75">fuxem exclusive</p>
              <h3 className="mt-2 text-xl font-semibold text-amber-100">Want more after this?</h3>
              <p className="mt-2 text-sm leading-6 text-stone-300">
                Join members to unlock full private drops, direct messaging, and premium public links.
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setIsPromptOpen(false)}
                  className="rounded-lg border border-white/20 bg-black/40 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-stone-200 transition hover:border-white/35"
                >
                  Keep Watching
                </button>
                <Link
                  href={ROUTES.ONBOARDING}
                  className="rounded-lg border border-amber-200/35 bg-amber-300/20 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-amber-100 transition hover:bg-amber-300/30"
                >
                  See More
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
