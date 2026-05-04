'use client'

import Link from 'next/link'
import { useEffect, useState, useMemo } from 'react'
import { usePathname, useRouter } from 'next/navigation'

import OnlineDot from '@/app/_components/online-dot'
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

  if (label === 'Community') {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
        <circle cx="8" cy="9" r="2.5" />
        <circle cx="16" cy="9" r="2.5" />
        <circle cx="12" cy="3.5" r="2.5" />
        <path d="M3 19c0-2 1.5-3.5 5-3.5s5 1.5 5 3.5" />
        <path d="M11 19c0-2 1.5-3.5 5-3.5s5 1.5 5 3.5" />
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

  if (label === 'Friends') {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
        <circle cx="9" cy="8" r="3" />
        <path d="M3 19c.9-2.8 2.9-4.2 6-4.2s5.1 1.4 6 4.2" />
        <path d="M17 11l2 2 3-3" strokeLinecap="round" strokeLinejoin="round" />
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

type Stats = {
  friendsCount: number
  pendingRequestsCount: number
  groupsCount: number
  unreadMessages: number
  unreadNotifications: number
  messageRequestsCount: number
}

type FeedMember = {
  id: string
  username: string
  displayName: string
  avatarUrl: string | null
  city: string | null
  country: string | null
  gender: string | null
  isVerified: boolean
  lastActiveAt: string | null
  createdAt: string | null
}

type GroupPost = {
  id: string
  body: string
  createdAt: string
  group: { id: string; name: string; slug: string }
  author: { id: string; username: string; displayName: string; avatarUrl: string | null }
}

function MemberCard({ m }: { m: FeedMember }) {
  const initials = getInitials(m.displayName || m.username)
  return (
    <Link
      href={`/u/${m.username}`}
      className="group flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-black/20 p-3 text-center backdrop-blur-xl transition hover:border-white/20 hover:bg-white/[0.03]"
    >
      <div className="relative">
        {m.avatarUrl ? (
          <img src={m.avatarUrl} alt={m.displayName || m.username} className="h-14 w-14 rounded-xl border border-white/15 object-cover" />
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-white/15 bg-white/[0.04] text-base font-semibold text-stone-300">
            {initials}
          </div>
        )}
        <OnlineDot lastActiveAt={m.lastActiveAt} size="md" className="absolute -bottom-0.5 -right-0.5" />
      </div>
      <div className="min-w-0 w-full">
        <p className="truncate text-xs font-medium text-stone-100">
          {m.displayName || m.username}
          {m.isVerified && <span className="ml-1 text-sky-400">✓</span>}
        </p>
        {(m.city || m.country) && (
          <p className="truncate text-[10px] text-stone-500">{[m.city, m.country].filter(Boolean).join(', ')}</p>
        )}
      </div>
    </Link>
  )
}

function StatCard({ label, value, href, badge }: { label: string; value: number; href: string; badge?: boolean }) {
  return (
    <Link
      href={href}
      className="relative flex flex-col gap-1 rounded-2xl border border-white/10 bg-black/20 px-4 py-4 backdrop-blur-xl transition hover:border-white/20 hover:bg-white/[0.03]"
    >
      {badge && value > 0 && (
        <span className="absolute right-3 top-3 flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-[9px] font-bold text-black">
          {value > 99 ? '99+' : value}
        </span>
      )}
      <span className="text-2xl font-bold text-stone-100">{value}</span>
      <span className="text-[10px] uppercase tracking-[0.2em] text-stone-500">{label}</span>
    </Link>
  )
}

function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60_000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return new Date(iso).toLocaleDateString()
}

export default function DashboardClient({ initialData }: DashboardClientProps) {
  const router = useRouter()
  const pathname = usePathname()

  const fullName = useMemo(() => initialData.user.displayName || initialData.user.firstName || initialData.user.username, [initialData.user])
  const initials = useMemo(() => getInitials(fullName || 'Member'), [fullName])

  const [stats, setStats] = useState<Stats | null>(null)
  const [onlineMembers, setOnlineMembers] = useState<FeedMember[]>([])
  const [newMembers, setNewMembers] = useState<FeedMember[]>([])
  const [groupPosts, setGroupPosts] = useState<GroupPost[]>([])
  const [feedLoading, setFeedLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/dashboard/stats').then((r) => r.json()),
      fetch('/api/dashboard/feed').then((r) => r.json()),
    ]).then(([s, f]) => {
      setStats(s)
      setOnlineMembers(f.onlineMembers ?? [])
      setNewMembers(f.newMembers ?? [])
      setGroupPosts(f.recentGroupPosts ?? [])
    }).catch(() => {/* non-fatal */}).finally(() => setFeedLoading(false))
  }, [])

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'GET' })
    } catch {
      // best-effort
    }
    router.push(ROUTES.WELCOME)
  }

  const totalAlerts = (stats?.pendingRequestsCount ?? 0) + (stats?.unreadMessages ?? 0) + (stats?.messageRequestsCount ?? 0)

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

      {/* Main content — offset by sidebar width */}
      <main className="relative z-10 ml-56 min-h-screen px-5 pb-20 pt-20 md:ml-[84px] md:px-8">
        <div className="mx-auto max-w-4xl space-y-8">

          {/* Greeting */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.22em] text-stone-500">Welcome back</p>
              <h1 className="font-[var(--font-display)] text-3xl leading-tight text-stone-100">
                {initialData.user.displayName || initialData.user.firstName}
              </h1>
            </div>
            <Link
              href={`/u/${initialData.user.username}`}
              className="rounded-2xl border border-white/10 bg-black/20 px-4 py-2 text-xs uppercase tracking-widest text-stone-400 backdrop-blur-xl transition hover:border-white/20 hover:text-stone-200"
            >
              My profile
            </Link>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <StatCard label="Friends" value={stats?.friendsCount ?? 0} href={ROUTES.FRIENDS} />
            <StatCard label="Requests" value={stats?.pendingRequestsCount ?? 0} href={ROUTES.FRIENDS + '?tab=pending'} badge />
            <StatCard label="Groups" value={stats?.groupsCount ?? 0} href={ROUTES.GROUPS} />
            <StatCard label="Messages" value={stats?.unreadMessages ?? 0} href={ROUTES.MESSAGESS} badge />
            <StatCard label="Requests" value={stats?.messageRequestsCount ?? 0} href={ROUTES.MESSAGESS} badge />
            <StatCard label="Alerts" value={stats?.unreadNotifications ?? 0} href={ROUTES.DASHBOARD} badge />
          </div>

          {/* Quick actions */}
          <section>
            <p className="mb-3 text-[10px] uppercase tracking-[0.22em] text-stone-500">Quick actions</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: 'Find members', href: ROUTES.SEARCH, icon: '🔍' },
                { label: 'Browse groups', href: ROUTES.GROUPS, icon: '👥' },
                { label: 'Classifieds', href: ROUTES.CLASSIFIEDS, icon: '📋' },
                { label: 'Live chat', href: ROUTES.CHAT, icon: '🎙️' },
              ].map((a) => (
                <Link
                  key={a.href}
                  href={a.href}
                  className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 backdrop-blur-xl transition hover:border-white/20 hover:bg-white/[0.03]"
                >
                  <span className="text-lg">{a.icon}</span>
                  <span className="text-sm text-stone-300">{a.label}</span>
                </Link>
              ))}
            </div>
          </section>

          {/* Online now */}
          {feedLoading ? (
            <div className="flex justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-400/30 border-t-amber-400" />
            </div>
          ) : (
            <>
              {onlineMembers.length > 0 && (
                <section>
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-[10px] uppercase tracking-[0.22em] text-stone-500">
                      Online now
                      <span className="ml-2 inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 align-middle" />
                    </p>
                    <Link href={ROUTES.SEARCH} className="text-[10px] uppercase tracking-widest text-stone-500 hover:text-stone-300 transition">
                      See all →
                    </Link>
                  </div>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
                    {onlineMembers.slice(0, 12).map((m) => <MemberCard key={m.id} m={m} />)}
                  </div>
                </section>
              )}

              {newMembers.length > 0 && (
                <section>
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-[10px] uppercase tracking-[0.22em] text-stone-500">New members</p>
                    <Link href={ROUTES.SEARCH} className="text-[10px] uppercase tracking-widest text-stone-500 hover:text-stone-300 transition">
                      See all →
                    </Link>
                  </div>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
                    {newMembers.slice(0, 6).map((m) => <MemberCard key={m.id} m={m} />)}
                  </div>
                </section>
              )}

              {groupPosts.length > 0 && (
                <section>
                  <p className="mb-3 text-[10px] uppercase tracking-[0.22em] text-stone-500">Group activity</p>
                  <ul className="space-y-2">
                    {groupPosts.map((post) => (
                      <li key={post.id}>
                        <Link
                          href={`/groups/${post.group.slug}`}
                          className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 backdrop-blur-xl transition hover:border-white/20 hover:bg-white/[0.03]"
                        >
                          <div className="flex-shrink-0">
                            {post.author.avatarUrl ? (
                              <img src={post.author.avatarUrl} alt={post.author.displayName} className="h-8 w-8 rounded-lg border border-white/15 object-cover" />
                            ) : (
                              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-white/[0.04] text-xs font-semibold text-stone-300">
                                {getInitials(post.author.displayName || post.author.username)}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[10px] text-stone-500">
                              <span className="text-stone-400">{post.author.displayName || post.author.username}</span>
                              {' '}in{' '}
                              <span className="text-amber-400/80">{post.group.name}</span>
                              {' · '}
                              {formatRelative(post.createdAt)}
                            </p>
                            <p className="mt-0.5 line-clamp-2 text-sm text-stone-300">{post.body}</p>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {onlineMembers.length === 0 && newMembers.length === 0 && groupPosts.length === 0 && (
                <div className="rounded-3xl border border-white/10 bg-black/20 p-12 text-center backdrop-blur-xl">
                  <p className="text-stone-400">Your feed is quiet right now.</p>
                  <Link href={ROUTES.SEARCH} className="mt-3 inline-block text-xs text-amber-400 hover:underline">
                    Discover members →
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}
