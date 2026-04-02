'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'

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

const NAV_ITEMS = [
  { label: 'Dashboard', href: ROUTES.DASHBOARD },
  { label: 'Search', href: ROUTES.SEARCH },
  { label: 'Videos', href: ROUTES.VIDEOS },
  { label: 'Messages', href: ROUTES.MESSAGESS },
  { label: 'Live Chat', href: ROUTES.CHAT },
  { label: 'Groups', href: ROUTES.GROUPS },
  { label: 'Profile', href: ROUTES.PROFILE },
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

function NavIcon({ label }: { label: string }) {
  if (label === 'Dashboard') {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
        <path d="M3 13.5 12 4l9 9.5" />
        <path d="M5.5 11.5V20h13V11.5" />
      </svg>
    )
  }

  if (label === 'Search') {
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

  if (label === 'Live Chat') {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
        <path d="M7.5 8.5a4.5 4.5 0 1 1 9 0v2.1a4.5 4.5 0 0 1-9 0z" />
        <path d="M12 16.8v2.7" />
        <path d="M9.5 19.5h5" />
      </svg>
    )
  }

  if (label === 'Videos') {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
        <rect x="3" y="6" width="13" height="12" rx="2" />
        <path d="m10 10 4 2-4 2z" />
        <path d="m16 10 5-3v10l-5-3" />
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
    <aside className="flex h-full flex-col border-r border-white/10 bg-[#0d1117]/78 px-4 py-5 backdrop-blur-md">
      <div className="px-2">
        {!isMobile && (
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/[0.04] text-sm font-semibold text-stone-100 md:group-hover/sidebar:hidden">
            F
          </div>
        )}

        <p className={`font-[var(--font-display)] text-3xl leading-none text-stone-100 ${!isMobile ? 'hidden md:group-hover/sidebar:block' : ''}`}>
          fuxem
        </p>
        <p className={`mt-2 text-[10px] uppercase tracking-[0.22em] text-stone-400 ${!isMobile ? 'hidden md:group-hover/sidebar:block' : ''}`}>
          Private member lounge
        </p>
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
                ? 'border border-white/20 bg-white/[0.08] text-stone-100'
                : 'border border-transparent text-stone-300 hover:border-white/10 hover:bg-white/[0.03] hover:text-stone-100'
                } ${!isMobile ? 'md:justify-center md:px-0 md:group-hover/sidebar:justify-start md:group-hover/sidebar:px-3' : ''}`}
            >
              <span className="opacity-90">
                <NavIcon label={item.label} />
              </span>
              <span className={!isMobile ? 'hidden md:group-hover/sidebar:inline' : ''}>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className={`mt-auto rounded-2xl border border-white/10 bg-white/[0.03] transition-all ${!isMobile ? 'md:px-2 md:py-2 md:group-hover/sidebar:p-3' : 'p-3'}`}>
        <div className={`flex items-center ${!isMobile ? 'justify-center md:justify-start md:gap-3' : 'gap-3'}`}>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/[0.04] text-sm font-semibold text-stone-100">
            {initials}
          </div>
          <div className={`min-w-0 ${!isMobile ? 'hidden md:group-hover/sidebar:block' : ''}`}>
            <p className="truncate text-sm font-medium text-stone-100">{fullName}</p>
            <p className="text-[11px] uppercase tracking-[0.15em] text-stone-400">Member</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className={`mt-3 inline-flex w-full items-center justify-center rounded-lg border border-white/15 bg-white/[0.03] px-3 py-2 text-[11px] uppercase tracking-[0.18em] text-stone-200 transition hover:border-white/25 hover:bg-white/[0.05] ${!isMobile ? 'hidden md:group-hover/sidebar:inline-flex' : ''}`}
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

  const [copied, setCopied] = useState(false)

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
    <div className="relative min-h-screen overflow-hidden bg-[#090b10] text-stone-100">
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat opacity-38"
        style={{ backgroundImage: "url('/welcome2.jpg')" }}
      />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(8,11,18,0.6)_0%,rgba(6,8,12,0.74)_100%)]" />

      <div className="group/sidebar fixed inset-y-0 left-0 z-30 flex w-56 overflow-hidden md:w-[84px] md:hover:w-64 md:transition-[width] md:duration-300">
        <Sidebar
          currentPath={pathname}
          fullName={fullName}
          initials={initials}
          onLogout={handleLogout}
          isMobile={false}
        />
      </div>

      <main className="relative z-10 mx-auto w-full px-4 pb-16 pt-6 pl-60 sm:px-6 md:pl-28 md:pr-8 md:pt-8">
        <section className="rounded-3xl border border-white/12 bg-black/30 p-5 shadow-[0_8px_22px_rgba(0,0,0,0.22)] sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/15 bg-white/[0.04] text-xl font-semibold text-stone-100">
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
                  <span className="rounded-full border border-white/15 bg-white/[0.04] px-2.5 py-1 text-[11px] text-stone-200">
                    {initialData.profile.gender}
                  </span>
                ) : null}
                {initialData.profile.sexualOrientation ? (
                  <span className="rounded-full border border-white/15 bg-white/[0.04] px-2.5 py-1 text-[11px] text-stone-200">
                    {initialData.profile.sexualOrientation}
                  </span>
                ) : null}
              </div>

              <p className="mt-4 max-w-3xl text-sm leading-6 text-stone-300">
                {initialData.profile.bio.trim() || 'Tell members a little about your energy, style, and what kind of connection you enjoy.'}
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-4">
                <Link
                  href={ROUTES.SEARCH}
                  className="text-sm font-medium text-stone-200 underline decoration-white/35 underline-offset-4 transition hover:text-white hover:decoration-white"
                >
                  Search
                </Link>
                <Link
                  href={ROUTES.MESSAGESS}
                  className="text-sm font-medium text-stone-300 underline decoration-white/25 underline-offset-4 transition hover:text-white hover:decoration-white"
                >
                  Open Inbox
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/12 bg-black/25 p-3">
              <p className="text-[11px] uppercase tracking-[0.18em] text-stone-400">Personal passcode</p>
              <div className="mt-2 flex items-center gap-2">
                <span className="rounded-lg border border-white/15 bg-white/[0.04] px-3 py-1.5 font-mono text-sm tracking-[0.22em] text-stone-100">
                  {maskedPasscode}
                </span>
                <button
                  type="button"
                  onClick={copyPasscode}
                  className="rounded-lg border border-white/15 bg-white/[0.03] px-3 py-1.5 text-xs uppercase tracking-[0.14em] text-stone-200 transition hover:border-white/25 hover:text-stone-100"
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-white/12 bg-black/25 p-3">
              <p className="text-[11px] uppercase tracking-[0.18em] text-stone-400">Looking for</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {initialData.profile.lookingFor.length > 0 ? (
                  initialData.profile.lookingFor.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-white/15 bg-white/[0.04] px-2.5 py-1 text-[11px] text-stone-200"
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

      </main>
    </div>
  )
}
