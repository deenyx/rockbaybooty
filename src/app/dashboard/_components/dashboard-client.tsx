'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

import { ROUTES } from '@/lib/constants'

type DashboardViewData = {
  user: {
    id: string
    username: string
    firstName: string
    displayName: string
    personalCode: string
  }
  profile: {
    age: number | null
    location: string
    bio: string
    lookingFor: string[]
    interests: string[]
    avatarUrl: string
    city: string
    state: string
    country: string
    gender: string
    genderOther: string
    sexualOrientation: string
    orientationOther: string
  }
}

type DashboardClientProps = {
  initialData: DashboardViewData
}

const SUPERNOVA_URL = 'https://www.youtube.com/watch?v=tI-5uv4wryI'
const SUPERNOVA_EMBED_URL = 'https://www.youtube-nocookie.com/embed/tI-5uv4wryI?autoplay=1&rel=0'

// ─── Moon phase astronomy ─────────────────────────────────────────────────
const SYNODIC_MONTH = 29.530588853

type MoonData = { phase: number; illumination: number; phaseName: string }

function computeMoonPhase(date: Date): MoonData {
  const anchor = new Date('2000-01-06T18:14:00Z')
  const elapsed = (date.getTime() - anchor.getTime()) / 86_400_000
  const phase = ((elapsed % SYNODIC_MONTH) + SYNODIC_MONTH) % SYNODIC_MONTH
  const illumination = (1 - Math.cos((phase / SYNODIC_MONTH) * 2 * Math.PI)) / 2
  let phaseName: string
  if (phase < 1.0)        phaseName = 'New Moon'
  else if (phase < 7.38)  phaseName = 'Waxing Crescent'
  else if (phase < 8.38)  phaseName = 'First Quarter'
  else if (phase < 14.77) phaseName = 'Waxing Gibbous'
  else if (phase < 15.77) phaseName = 'Full Moon'
  else if (phase < 22.14) phaseName = 'Waning Gibbous'
  else if (phase < 23.14) phaseName = 'Last Quarter'
  else                    phaseName = 'Waning Crescent'
  return { phase, illumination, phaseName }
}

// Each path: outer limb (full semicircle) + terminator ellipse arc back
function buildMoonPath(phase: number, r = 44): string | null {
  if (phase < 1.0 || phase > 28.53) return null
  const theta = (phase / SYNODIC_MONTH) * 2 * Math.PI
  const k = Math.cos(theta)
  const tx = Math.abs(r * k)
  const isWaxing = phase <= 14.765
  const top    = `50 ${50 - r}`
  const bottom = `50 ${50 + r}`
  if (isWaxing) {
    const sweep = k >= 0 ? 0 : 1
    return `M ${top} A ${r} ${r} 0 1 1 ${bottom} A ${tx.toFixed(2)} ${r} 0 0 ${sweep} ${top} Z`
  }
  const sweep = k >= 0 ? 1 : 0
  return `M ${top} A ${r} ${r} 0 1 0 ${bottom} A ${tx.toFixed(2)} ${r} 0 0 ${sweep} ${top} Z`
}

function MoonWidget({ city }: { city: string }) {
  const [moon, setMoon] = useState<MoonData | null>(null)
  useEffect(() => { setMoon(computeMoonPhase(new Date())) }, [])
  if (!moon) return null
  const moonPath = buildMoonPath(moon.phase)
  const illumPct = Math.round(moon.illumination * 100)
  const locationLabel = city.trim() || 'tonight'
  const isNearFull = moon.illumination > 0.85
  return (
    <div className="fixed bottom-8 right-6 z-20 flex w-32 flex-col items-center gap-3 rounded-2xl border border-white/10 bg-[linear-gradient(160deg,rgba(12,8,16,0.82),rgba(7,5,10,0.92))] p-4 shadow-[0_20px_55px_rgba(0,0,0,0.5)] backdrop-blur-md sm:right-8">
      <svg
        viewBox="0 0 100 100"
        className="h-[4.5rem] w-[4.5rem]"
        aria-label={`${moon.phaseName}, ${illumPct}% illuminated`}
        role="img"
      >
        <circle cx="50" cy="50" r="44" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.14)" strokeWidth="0.7" />
        {isNearFull && (
          <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(230,218,190,0.22)" strokeWidth="5" />
        )}
        {moonPath ? (
          <path d={moonPath} fill="rgba(232,222,196,0.92)" />
        ) : (
          <circle cx="50" cy="50" r="44" fill="rgba(255,255,255,0.05)" />
        )}
      </svg>
      <div className="w-full text-center">
        <p className="text-[9px] uppercase tracking-[0.22em] leading-tight text-stone-300/65">{moon.phaseName}</p>
        <p className="mt-1 text-[11px] font-medium tabular-nums text-stone-200/80">{illumPct}%</p>
        <p className="mt-1.5 truncate text-[8px] uppercase tracking-[0.14em] text-stone-400/50">{locationLabel}</p>
      </div>
    </div>
  )
}

export default function DashboardClient({ initialData }: DashboardClientProps) {
  const [isSoundboardOpen, setIsSoundboardOpen] = useState(false)
  const [playerInstanceKey, setPlayerInstanceKey] = useState(0)

  const toggleSoundboard = () => {
    setIsSoundboardOpen((previous) => {
      const next = !previous
      if (next) {
        // Force a fresh iframe mount so the track starts on open.
        setPlayerInstanceKey((value) => value + 1)
      }
      return next
    })
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#060304] text-stone-100">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-70"
        style={{ backgroundImage: "url('/3.jpg')" }}
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(154,29,67,0.22),_transparent_38%),radial-gradient(circle_at_82%_20%,_rgba(184,115,34,0.1),_transparent_34%),linear-gradient(160deg,rgba(5,2,4,0.36)_8%,rgba(18,5,12,0.38)_44%,rgba(25,7,14,0.42)_72%,rgba(8,5,8,0.48)_100%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(180deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:120px_120px] opacity-[0.06]" />
      <div className="pointer-events-none absolute -left-28 top-20 h-80 w-80 rounded-full bg-rose-700/20 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-0 h-[28rem] w-[28rem] rounded-full bg-amber-700/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-14 h-96 w-96 rounded-full bg-fuchsia-900/15 blur-3xl" />

      <button
        type="button"
        onClick={toggleSoundboard}
        aria-label="Toggle Champagne Supernova soundboard"
        title="Champagne Supernova Soundboard"
        className="fixed left-5 top-20 z-40 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/60 text-amber-50 shadow-[0_12px_28px_rgba(0,0,0,0.35)] transition hover:scale-105 hover:border-amber-200/35 hover:bg-black/80"
      >
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
          <circle cx="12" cy="12" r="4.6" />
          <ellipse cx="12" cy="12" rx="9" ry="3.2" transform="rotate(-20 12 12)" />
          <path d="M16.5 8.2a1.2 1.2 0 1 0 0.01 0" />
        </svg>
      </button>

      {isSoundboardOpen && (
        <section className="fixed left-5 top-36 z-40 w-[min(92vw,320px)] rounded-2xl border border-white/10 bg-[#12090d]/90 p-3 shadow-[0_20px_50px_rgba(0,0,0,0.45)] backdrop-blur-md">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] uppercase tracking-[0.16em] text-rose-100/90">Soundboard</p>
            <button
              type="button"
              onClick={() => setIsSoundboardOpen(false)}
              className="rounded-md border border-white/20 px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-stone-300 transition hover:text-white"
            >
              Close
            </button>
          </div>

          <p className="mt-1 text-xs text-stone-300">Oasis - Champagne Supernova</p>

          <div className="mt-3 overflow-hidden rounded-xl border border-white/10 bg-black/50">
            <iframe
              key={playerInstanceKey}
              src={SUPERNOVA_EMBED_URL}
              title="Oasis - Champagne Supernova"
              className="h-44 w-full"
              allow="autoplay; encrypted-media; picture-in-picture"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </div>

          <a
            href={SUPERNOVA_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex text-[10px] uppercase tracking-[0.14em] text-rose-200/85 transition hover:text-rose-100"
          >
            Open on YouTube
          </a>
        </section>
      )}

      <div className="relative z-10">
        <header className="fixed left-1/2 top-4 z-30 w-[calc(100%-2rem)] max-w-7xl -translate-x-1/2 rounded-2xl border border-white/12 bg-[linear-gradient(140deg,rgba(20,10,16,0.84),rgba(9,7,10,0.9))] px-4 py-3 shadow-[0_22px_50px_rgba(0,0,0,0.35)] backdrop-blur-md sm:w-[calc(100%-3rem)] sm:px-5">
          <div className="flex items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2.5 text-stone-100">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-amber-200/20 bg-amber-300/10 text-amber-100/90">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
                  <path d="M12 5.2a5.8 5.8 0 1 0 0 11.6 5.8 5.8 0 0 0 0-11.6Z" />
                  <path d="M3.2 13.4c.5 1.5 4 2.5 8.5 2.5 5 0 9-1.3 9-3s-4-3-9-3c-3.6 0-6.6.7-8 1.9a1.1 1.1 0 0 0-.5 1.6Z" opacity="0.72" />
                  <circle cx="17.7" cy="7.7" r="1.25" />
                </svg>
              </span>
              <div>
                <p className="text-[10px] uppercase tracking-[0.24em] text-stone-300/70">Member Headbar</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href={ROUTES.MESSAGESS}
                className="inline-flex items-center rounded-full border border-white/15 bg-white/[0.02] px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-stone-200/70 transition hover:border-amber-200/25 hover:bg-amber-200/10 hover:text-amber-100"
              >
                Messages
              </Link>
              <Link
                href={ROUTES.CHAT}
                className="inline-flex items-center rounded-full border border-white/15 bg-white/[0.02] px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-stone-200/70 transition hover:border-amber-200/25 hover:bg-amber-200/10 hover:text-amber-100"
              >
                Chat
              </Link>
            </div>
          </div>
        </header>
      </div>

      {/* Moon phase widget — location from member profile */}
      <MoonWidget city={initialData.profile.city} />
    </div>
  )
}
