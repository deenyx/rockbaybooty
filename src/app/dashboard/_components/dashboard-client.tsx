'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

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

type NearbyMember = {
  id: string
  name: string
  age: number
  location: string
  bio: string
}

type MoonData = {
  phase: number
  illumination: number
  phaseName: string
}

const SYNODIC_MONTH = 29.530588853

const NAV_ITEMS = [
  { label: 'Dashboard', href: ROUTES.DASHBOARD },
  { label: 'Search Members', href: ROUTES.SEARCH },
  { label: 'Messages', href: ROUTES.MESSAGESS },
  { label: 'Groups', href: ROUTES.GROUPS },
  { label: 'Profile', href: ROUTES.PROFILE },
]

const STATIC_NEARBY_MEMBERS: NearbyMember[] = [
  {
    id: 'near-1',
    name: 'Raven Luxe',
    age: 29,
    location: 'Downtown',
    bio: 'Night owl, after-hours cocktails, and electric chemistry with confident company.',
  },
  {
    id: 'near-2',
    name: 'Milo Voss',
    age: 34,
    location: 'West End',
    bio: 'Designer by day, vinyl collector by night. Big on banter and playful tension.',
  },
  {
    id: 'near-3',
    name: 'Sienna Vale',
    age: 27,
    location: 'Harbor District',
    bio: 'Soft-spoken, direct, and curious. Looking for chemistry that feels effortless.',
  },
  {
    id: 'near-4',
    name: 'Jax Noir',
    age: 31,
    location: 'Old Town',
    bio: 'Gym mornings, rooftop evenings, and unapologetic confidence with good communication.',
  },
  {
    id: 'near-5',
    name: 'Ari Sol',
    age: 26,
    location: 'Riverfront',
    bio: 'Creative soul, travel obsessed, and always down for a late-night deep conversation.',
  },
  {
    id: 'near-6',
    name: 'Cleo Hart',
    age: 33,
    location: 'Midtown',
    bio: 'Discreet, open-minded, and into quality connection over endless small talk.',
  },
]

function getInitials(name: string) {
  return name
    .split(' ')
    .map((part) => part.trim().slice(0, 1))
    .filter(Boolean)
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function maskPersonalCode(code: string) {
  if (code.length <= 4) {
    return code
  }

  return '•'.repeat(code.length - 4) + code.slice(-4)
}

function getHeaderName(user: DashboardViewData['user']) {
  const candidates = [user.firstName, user.displayName, user.username]
    .map((value) => value.trim())
    .filter(Boolean)

  return candidates[0] || 'Member'
}

function computeMoonPhase(date: Date): MoonData {
  const anchor = new Date('2000-01-06T18:14:00Z')
  const elapsed = (date.getTime() - anchor.getTime()) / 86_400_000
  const phase = ((elapsed % SYNODIC_MONTH) + SYNODIC_MONTH) % SYNODIC_MONTH
  const illumination = (1 - Math.cos((phase / SYNODIC_MONTH) * 2 * Math.PI)) / 2

  let phaseName = 'Waning Crescent'
  if (phase < 1.0) phaseName = 'New Moon'
  else if (phase < 7.38) phaseName = 'Waxing Crescent'
  else if (phase < 8.38) phaseName = 'First Quarter'
  else if (phase < 14.77) phaseName = 'Waxing Gibbous'
  else if (phase < 15.77) phaseName = 'Full Moon'
  else if (phase < 22.14) phaseName = 'Waning Gibbous'
  else if (phase < 23.14) phaseName = 'Last Quarter'

  return { phase, illumination, phaseName }
}

function buildMoonPath(phase: number, r = 44): string | null {
  if (phase < 1.0 || phase > 28.53) {
    return null
  }

  const theta = (phase / SYNODIC_MONTH) * 2 * Math.PI
  const k = Math.cos(theta)
  const tx = Math.abs(r * k)
  const isWaxing = phase <= 14.765
  const top = `50 ${50 - r}`
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

  useEffect(() => {
    setMoon(computeMoonPhase(new Date()))
  }, [])

  if (!moon) {
    return null
  }

  const moonPath = buildMoonPath(moon.phase)
  const illuminationPercent = Math.round(moon.illumination * 100)
  const isNearFullMoon = moon.illumination > 0.85

  return (
    <div className="fixed bottom-6 right-4 z-20 flex w-32 flex-col items-center gap-3 rounded-2xl border border-[#d5b06a]/20 bg-[linear-gradient(160deg,rgba(16,7,11,0.84),rgba(8,3,6,0.92))] p-4 shadow-[0_24px_60px_rgba(0,0,0,0.5)] backdrop-blur-md sm:right-6">
      <svg
        viewBox="0 0 100 100"
        className="h-[4.5rem] w-[4.5rem]"
        aria-label={`${moon.phaseName}, ${illuminationPercent}% illuminated`}
        role="img"
      >
        <circle cx="50" cy="50" r="44" fill="rgba(255,255,255,0.03)" stroke="rgba(213,176,106,0.24)" strokeWidth="0.8" />
        {isNearFullMoon && (
          <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(213,176,106,0.22)" strokeWidth="5" />
        )}
        {moonPath ? <path d={moonPath} fill="rgba(238,223,188,0.92)" /> : <circle cx="50" cy="50" r="44" fill="rgba(255,255,255,0.04)" />}
      </svg>
      <div className="w-full text-center">
        <p className="text-[9px] uppercase tracking-[0.22em] text-stone-300/70">{moon.phaseName}</p>
        <p className="mt-1 text-[11px] font-medium tabular-nums text-stone-100/85">{illuminationPercent}%</p>
        <p className="mt-1 truncate text-[8px] uppercase tracking-[0.15em] text-stone-400/55">{city.trim() || 'Tonight'}</p>
      </div>
    </div>
  )
}

function NavIcon({ label }: { label: string }) {
  if (label === 'Dashboard') {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
        <path d="M3 13.5 12 4l9 9.5" />
        <path d="M5.5 11.5V20h13V11.5" />
      </svg>
    )
  }

  if (label === 'Search Members') {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
        <circle cx="11" cy="11" r="6.5" />
        <path d="m16 16 4.5 4.5" />
      </svg>
    )
  }

  if (label === 'Messages') {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
        <rect x="3" y="5" width="18" height="14" rx="2.5" />
        <path d="m4.5 7 7.5 6 7.5-6" />
      </svg>
    )
  }

  if (label === 'Groups') {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
        <circle cx="8" cy="10" r="3" />
        <circle cx="16.5" cy="9" r="2.5" />
        <path d="M3.5 19c.8-2.6 2.8-4 5.8-4s5 1.4 5.7 4" />
        <path d="M13.5 18.8c.6-1.8 1.9-2.9 3.9-2.9 1.4 0 2.6.6 3.2 1.7" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5 19c1.2-3 3.5-4.5 7-4.5S17.8 16 19 19" />
    </svg>
  )
}

function Sidebar({
  currentPath,
  fullName,
  initials,
  onLogout,
  isMobile,
  onNavigate,
}: {
  currentPath: string
  fullName: string
  initials: string
  onLogout: () => void
  isMobile: boolean
  onNavigate?: () => void
}) {
  return (
    <aside className="flex h-full flex-col border-r border-white/10 bg-[linear-gradient(180deg,#0a0508_0%,#060304_100%)] px-4 py-5">
      <div className="px-2">
        <p className="font-[var(--font-display)] text-3xl leading-none text-[#f2dfbe]">fuxem</p>
        <p className="mt-2 text-[10px] uppercase tracking-[0.22em] text-stone-400">Private member lounge</p>
      </div>

      <nav className="mt-7 space-y-1.5">
        {NAV_ITEMS.map((item) => {
          const active = currentPath === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${active
                ? 'border border-[#d5b06a]/35 bg-[#3b121f]/60 text-[#f6e4be] shadow-[0_8px_20px_rgba(0,0,0,0.25)]'
                : 'border border-transparent text-stone-300 hover:border-white/10 hover:bg-white/[0.03] hover:text-stone-100'
                }`}
            >
              <span className="opacity-90">
                <NavIcon label={item.label} />
              </span>
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="mt-auto rounded-2xl border border-white/10 bg-white/[0.03] p-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#d5b06a]/30 bg-[#3b121f]/50 text-sm font-semibold text-[#f6e4be]">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-stone-100">{fullName}</p>
            <p className="text-[11px] uppercase tracking-[0.15em] text-stone-400">Member</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="mt-3 inline-flex w-full items-center justify-center rounded-lg border border-rose-300/25 bg-rose-500/10 px-3 py-2 text-[11px] uppercase tracking-[0.18em] text-rose-200 transition hover:border-rose-300/40 hover:bg-rose-500/20"
        >
          Logout
        </button>

        {isMobile && (
          <p className="mt-2 text-center text-[10px] uppercase tracking-[0.14em] text-stone-500">Swipe your world</p>
        )}
      </div>
    </aside>
  )
}

export default function DashboardClient({ initialData }: DashboardClientProps) {
  const router = useRouter()
  const pathname = usePathname()

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isRevealed, setIsRevealed] = useState(false)

  useEffect(() => {
    const raf = window.requestAnimationFrame(() => {
      setIsRevealed(true)
    })

    return () => window.cancelAnimationFrame(raf)
  }, [])

  const headerName = useMemo(() => getHeaderName(initialData.user), [initialData.user])
  const fullName = useMemo(() => initialData.user.displayName || initialData.user.firstName || initialData.user.username, [initialData.user])
  const initials = useMemo(() => getInitials(fullName || 'Member'), [fullName])
  const maskedPasscode = useMemo(() => maskPersonalCode(initialData.user.personalCode), [initialData.user.personalCode])
  const location = useMemo(
    () => initialData.profile.location || [initialData.profile.city, initialData.profile.state, initialData.profile.country].filter(Boolean).join(', '),
    [initialData.profile]
  )

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'GET' })
    } catch {
      // best-effort logout request
    }

    router.push(ROUTES.WELCOME)
  }

  const copyPasscode = async () => {
    try {
      await navigator.clipboard.writeText(initialData.user.personalCode)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050203] text-stone-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_8%,rgba(127,18,41,0.24),transparent_40%),radial-gradient(circle_at_88%_12%,rgba(180,127,42,0.17),transparent_34%),linear-gradient(165deg,#050203_4%,#11050a_44%,#18070e_72%,#060304_100%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.018)_1px,transparent_1px),linear-gradient(180deg,rgba(255,255,255,0.018)_1px,transparent_1px)] bg-[size:120px_120px] opacity-[0.07]" />

      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#090406]/85 backdrop-blur-md lg:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <p className="font-[var(--font-display)] text-2xl text-[#f2dfbe]">fuxem</p>
            <p className="text-[10px] uppercase tracking-[0.2em] text-stone-400">Dashboard</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#d5b06a]/30 bg-[#3b121f]/50 text-xs font-semibold text-[#f6e4be]">
              {initials}
            </div>
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-white/[0.03]"
              aria-label="Open menu"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/60"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-label="Close menu overlay"
          />
          <div className="absolute inset-y-0 left-0 w-[84%] max-w-xs">
            <Sidebar
              currentPath={pathname}
              fullName={fullName}
              initials={initials}
              onLogout={handleLogout}
              isMobile
              onNavigate={() => setIsMobileMenuOpen(false)}
            />
          </div>
        </div>
      )}

      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:flex lg:w-64">
        <Sidebar
          currentPath={pathname}
          fullName={fullName}
          initials={initials}
          onLogout={handleLogout}
          isMobile={false}
        />
      </div>

      <main className="relative z-10 mx-auto w-full px-4 pb-16 pt-6 sm:px-6 lg:pl-72 lg:pr-8 lg:pt-8">
        <section className={`rounded-3xl border border-[#d5b06a]/18 bg-[linear-gradient(145deg,rgba(18,7,12,0.84),rgba(10,4,7,0.9))] p-5 shadow-[0_28px_60px_rgba(0,0,0,0.42)] transition-all duration-700 ease-out sm:p-6 ${isRevealed ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[#d5b06a]/35 bg-[#3b121f]/50 text-xl font-semibold text-[#f6e4be]">
              {initialData.profile.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={initialData.profile.avatarUrl} alt={`${headerName} avatar`} className="h-full w-full object-cover" />
              ) : (
                <span>{initials}</span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-[11px] uppercase tracking-[0.2em] text-stone-400">Welcome back</p>
              <h1 className="mt-1 text-3xl font-semibold text-stone-50">{headerName}</h1>

              <div className="mt-3 flex flex-wrap gap-2">
                {initialData.profile.age ? (
                  <span className="rounded-full border border-white/12 bg-white/[0.03] px-3 py-1 text-xs text-stone-200">
                    {initialData.profile.age} years old
                  </span>
                ) : null}
                {location ? (
                  <span className="rounded-full border border-white/12 bg-white/[0.03] px-3 py-1 text-xs text-stone-200">
                    {location}
                  </span>
                ) : null}
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {initialData.profile.gender ? (
                  <span className="rounded-full border border-[#d5b06a]/28 bg-[#d5b06a]/10 px-2.5 py-1 text-[11px] text-[#f4dfb3]">
                    {initialData.profile.gender}
                  </span>
                ) : null}
                {initialData.profile.sexualOrientation ? (
                  <span className="rounded-full border border-[#d5b06a]/28 bg-[#d5b06a]/10 px-2.5 py-1 text-[11px] text-[#f4dfb3]">
                    {initialData.profile.sexualOrientation}
                  </span>
                ) : null}
              </div>

              <p className="mt-4 max-w-3xl text-sm leading-6 text-stone-300">
                {initialData.profile.bio.trim() || 'Tell members a little about your energy, style, and what kind of connection you enjoy.'}
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/12 bg-black/20 p-3">
              <p className="text-[11px] uppercase tracking-[0.18em] text-stone-400">Personal passcode</p>
              <div className="mt-2 flex items-center gap-2">
                <span className="rounded-lg border border-[#d5b06a]/30 bg-[#3b121f]/40 px-3 py-1.5 font-mono text-sm tracking-[0.22em] text-[#f4dfb3]">
                  {maskedPasscode}
                </span>
                <button
                  type="button"
                  onClick={copyPasscode}
                  className="rounded-lg border border-white/15 bg-white/[0.03] px-3 py-1.5 text-xs uppercase tracking-[0.14em] text-stone-200 transition hover:border-[#d5b06a]/35 hover:text-[#f4dfb3]"
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-white/12 bg-black/20 p-3">
              <p className="text-[11px] uppercase tracking-[0.18em] text-stone-400">Looking for</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {initialData.profile.lookingFor.length > 0 ? (
                  initialData.profile.lookingFor.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-rose-300/30 bg-rose-500/15 px-2.5 py-1 text-[11px] text-rose-100"
                    >
                      {tag}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-stone-400">Add your intentions in Profile to improve matches.</p>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className={`mt-6 rounded-3xl border border-white/10 bg-black/25 p-5 shadow-[0_20px_45px_rgba(0,0,0,0.35)] transition-all delay-100 duration-700 ease-out sm:p-6 ${isRevealed ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0'}`}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] text-[#d5b06a]/80">Members Near You</p>
              <h2 className="mt-1 text-2xl font-semibold text-stone-100">Fresh faces in your orbit</h2>
            </div>
            <Link
              href={ROUTES.SEARCH}
              className="rounded-full border border-white/15 bg-white/[0.03] px-3 py-1.5 text-[11px] uppercase tracking-[0.18em] text-stone-200 transition hover:border-[#d5b06a]/35 hover:text-[#f4dfb3]"
            >
              Browse all
            </Link>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {STATIC_NEARBY_MEMBERS.map((member, index) => (
              <article
                key={member.id}
                style={{ transitionDelay: `${120 + index * 65}ms` }}
                className={`rounded-2xl border border-white/10 bg-[linear-gradient(160deg,rgba(17,8,12,0.7),rgba(8,4,6,0.82))] p-4 transition-all duration-700 ease-out hover:-translate-y-0.5 hover:border-[#d5b06a]/35 hover:shadow-[0_18px_32px_rgba(0,0,0,0.32)] ${isRevealed ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'}`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#d5b06a]/35 bg-[#3b121f]/50 text-sm font-semibold text-[#f4dfb3]">
                    {getInitials(member.name)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-stone-100">{member.name}</p>
                    <p className="text-xs text-stone-400">
                      {member.age} • {member.location}
                    </p>
                  </div>
                </div>

                <p className="mt-3 line-clamp-2 text-sm leading-6 text-stone-300">{member.bio}</p>

                <div className="mt-4 flex gap-2">
                  <Link
                    href={ROUTES.SEARCH}
                    className="inline-flex flex-1 items-center justify-center rounded-lg border border-white/20 bg-white/[0.02] px-3 py-2 text-[11px] uppercase tracking-[0.14em] text-stone-200 transition hover:border-white/35 hover:bg-white/[0.05] hover:text-stone-100"
                  >
                    View Profile
                  </Link>
                  <Link
                    href={ROUTES.MESSAGESS}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-[#d5b06a]/40 bg-[linear-gradient(145deg,rgba(181,128,44,0.35),rgba(123,28,55,0.5))] px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#fae8c2] shadow-[0_10px_20px_rgba(0,0,0,0.25)] transition hover:border-[#e2c37f]/55 hover:brightness-110"
                  >
                    <span className="inline-flex h-1.5 w-1.5 rounded-full bg-[#f7dfa9]" aria-hidden="true" />
                    Message
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>

      <MoonWidget city={initialData.profile.city} />
    </div>
  )
}
