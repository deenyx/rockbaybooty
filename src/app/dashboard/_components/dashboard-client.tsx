'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useMemo } from 'react'

import TopQuickNav from '@/app/_components/top-quick-nav'
import { MEMBER_MENU_ITEMS, ROUTES } from '@/lib/constants'

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

const NAV_ITEMS = [...MEMBER_MENU_ITEMS]

function getInitials(name: string) {
  return name
    .split(' ')
    .map((part) => part.trim().slice(0, 1))
    .filter(Boolean)
    .join('')
    .slice(0, 2)
    .toUpperCase()
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

  if (label === 'Settings') {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06A1.65 1.65 0 0 0 15 19.4a1.65 1.65 0 0 0-1 .6 1.65 1.65 0 0 0-.33 1V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-.33-1 1.65 1.65 0 0 0-1-.6 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-.6-1 1.65 1.65 0 0 0-1-.33H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1-.33 1.65 1.65 0 0 0 .6-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-.6 1.65 1.65 0 0 0 .33-1V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 .33 1 1.65 1.65 0 0 0 1 .6 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c.2.36.31.76.33 1.17V10a2 2 0 0 1 0 4h-.09c-.41.02-.81.13-1.17.33z" />
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

  const fullName = useMemo(() => initialData.user.displayName || initialData.user.firstName || initialData.user.username, [initialData.user])
  const initials = useMemo(() => getInitials(fullName || 'Member'), [fullName])

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'GET' })
    } catch {
      // best-effort logout request
    }

    router.push(ROUTES.WELCOME)
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#090b10] text-stone-100">
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat opacity-38"
        style={{ backgroundImage: "url('/welcome2.jpg')" }}
      />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(8,11,18,0.6)_0%,rgba(6,8,12,0.74)_100%)]" />

      <TopQuickNav className="left-60 right-4 md:left-28 md:right-6" />

      <div className="group/sidebar fixed inset-y-0 left-0 z-30 flex w-56 overflow-hidden md:w-[84px] md:hover:w-64 md:transition-[width] md:duration-300">
        <Sidebar
          currentPath={pathname}
          fullName={fullName}
          initials={initials}
          onLogout={handleLogout}
          isMobile={false}
        />
      </div>

      <main className="relative z-10 w-full px-4 pb-16 pt-24 pl-60 sm:px-6 md:pl-28 md:pr-8 md:pt-24">
        <div className="mx-auto max-w-4xl space-y-6">

          {/* Welcome card */}
          <div className="rounded-3xl border border-white/10 bg-black/30 p-6 backdrop-blur-xl sm:p-8">
            <p className="text-xs uppercase tracking-[0.24em] text-stone-400">Welcome back</p>
            <h1 className="mt-2 font-[family:var(--font-display)] text-4xl text-stone-100 sm:text-5xl">
              {initialData.user.displayName || initialData.user.username}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-stone-400">
              <span>@{initialData.user.username}</span>
              {initialData.profile.location ? (
                <span>&middot; {initialData.profile.location}</span>
              ) : null}
              {initialData.profile.age ? (
                <span>&middot; {initialData.profile.age} yrs</span>
              ) : null}
            </div>
            {initialData.profile.bio ? (
              <p className="mt-4 max-w-xl text-sm leading-7 text-stone-300">{initialData.profile.bio}</p>
            ) : null}
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href={ROUTES.PROFILE}
                className="rounded-xl border border-white/20 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-stone-100 transition hover:border-white/35 hover:bg-white/[0.1]"
              >
                Edit profile
              </Link>
              <Link
                href={ROUTES.SEARCH}
                className="rounded-xl border border-white/20 px-4 py-2 text-sm text-stone-200 transition hover:border-white/35 hover:bg-white/[0.04] hover:text-white"
              >
                Browse members
              </Link>
            </div>
          </div>

          {/* Looking for / Interests */}
          {(initialData.profile.lookingFor.length > 0 || initialData.profile.interests.length > 0) && (
            <div className="rounded-3xl border border-white/10 bg-black/20 p-6 backdrop-blur-xl">
              {initialData.profile.lookingFor.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-[0.22em] text-stone-400">Looking for</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {initialData.profile.lookingFor.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-amber-400/20 bg-amber-400/[0.07] px-3 py-1 text-xs text-amber-300/80"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {initialData.profile.interests.length > 0 && (
                <div className={initialData.profile.lookingFor.length > 0 ? 'mt-5' : ''}>
                  <p className="text-[10px] uppercase tracking-[0.22em] text-stone-400">Interests</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {initialData.profile.interests.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-white/15 bg-white/[0.04] px-3 py-1 text-xs text-stone-300"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Quick links */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { label: 'Browse Members', desc: 'Find matches near you', href: ROUTES.SEARCH },
              { label: 'Messages', desc: 'View conversations', href: ROUTES.MESSAGESS },
              { label: 'Live Chat', desc: 'Join the members lounge', href: ROUTES.CHAT },
              { label: 'Videos', desc: 'Watch member videos', href: ROUTES.VIDEOS },
              { label: 'My Videos', desc: 'Upload and manage your clips', href: ROUTES.MY_VIDEOS },
              { label: 'Settings', desc: 'Privacy and account controls', href: ROUTES.SETTINGS },
            ].map(({ label, desc, href }) => (
              <Link
                key={href}
                href={href}
                className="group rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur transition hover:border-white/20 hover:bg-white/[0.06]"
              >
                <p className="text-sm font-semibold text-stone-100 group-hover:text-white">{label}</p>
                <p className="mt-1 text-xs text-stone-400">{desc}</p>
              </Link>
            ))}
          </div>

          {/* Member code */}
          <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-5 backdrop-blur">
            <p className="text-[10px] uppercase tracking-[0.22em] text-stone-400">Your member code</p>
            <p className="mt-2 font-mono text-lg tracking-widest text-stone-100">{initialData.user.personalCode}</p>
          </div>

        </div>
      </main>
    </div>
  )
}
