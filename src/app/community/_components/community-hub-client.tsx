'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import TopQuickNav from '@/app/_components/top-quick-nav'
import { ROUTES } from '@/lib/constants'

export default function CommunityHubClient() {
  const pathname = usePathname()

  const modules = [
    {
      id: 'members',
      title: 'Member Search',
      description: 'Discover and connect with verified members in the community',
      icon: (
        <svg viewBox="0 0 24 24" className="h-12 w-12" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true">
          <circle cx="10" cy="8" r="4" />
          <path d="M2 20c0-4 3-6 8-6s8 2 8 6" />
          <circle cx="18" cy="10" r="3" />
          <path d="M18 14c2 0 3 1 3 3v3" />
        </svg>
      ),
      href: ROUTES.COMMUNITY_MEMBERS,
      badge: 'Browse',
    },
    {
      id: 'events',
      title: 'Events',
      description: 'Find upcoming events and meetups hosted by the community',
      icon: (
        <svg viewBox="0 0 24 24" className="h-12 w-12" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true">
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M16 2v4" />
          <path d="M8 2v4" />
          <path d="M3 10h18" />
        </svg>
      ),
      href: ROUTES.COMMUNITY_EVENTS,
      badge: 'Explore',
    },
    {
      id: 'classifieds',
      title: 'Classifieds',
      description: 'Browse listings, services, and exclusive content from members',
      icon: (
        <svg viewBox="0 0 24 24" className="h-12 w-12" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M3 9h18" />
          <path d="M9 3v18" />
          <rect x="3" y="3" width="6" height="6" />
        </svg>
      ),
      href: ROUTES.COMMUNITY_CLASSIFIEDS,
      badge: 'Discover',
    },
  ]

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#090b10] px-4 pb-8 pt-24 text-stone-100 sm:px-6 lg:px-8">
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20"
        style={{ backgroundImage: "url('/welcome2.jpg')" }}
      />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(8,11,18,0.7)_0%,rgba(6,8,12,0.8)_100%)]" />

      <TopQuickNav className="left-4 right-4 md:left-6 md:right-6" />

      <main className="relative z-10 mx-auto max-w-5xl space-y-8">
        {/* Header */}
        <div className="rounded-3xl border border-white/10 bg-black/30 p-6 backdrop-blur-xl sm:p-8">
          <p className="text-xs uppercase tracking-[0.24em] text-stone-300/80">Welcome to</p>
          <h1 className="mt-3 font-[family:var(--font-display)] text-4xl text-stone-100 sm:text-5xl">
            Community Hub
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-stone-300 sm:text-base">
            Connect with verified members, discover events, and explore exclusive content. Everything is private and members-only.
          </p>
        </div>

        {/* Module Cards Grid */}
        <div className="grid gap-6 md:grid-cols-3">
          {modules.map((module) => (
            <Link
              key={module.id}
              href={module.href}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.02] p-6 backdrop-blur transition hover:border-white/20 hover:bg-gradient-to-br hover:from-white/[0.12] hover:to-white/[0.06]"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/20 opacity-0 transition group-hover:opacity-100" />

              <div className="relative z-10 space-y-4">
                <div className="inline-flex rounded-xl border border-white/10 bg-white/5 p-3 text-stone-300 transition group-hover:border-white/20 group-hover:bg-white/10 group-hover:text-stone-100">
                  {module.icon}
                </div>

                <div>
                  <h2 className="text-lg font-semibold text-stone-100">{module.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-stone-400 transition group-hover:text-stone-300">
                    {module.description}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4">
                  <span className="text-xs uppercase tracking-[0.15em] text-stone-500 transition group-hover:text-stone-400">
                    {module.badge}
                  </span>
                  <svg className="h-5 w-5 text-stone-400 transition group-hover:translate-x-1 group-hover:text-stone-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Activity Section */}
        <section className="rounded-2xl border border-white/10 bg-black/30 p-6 backdrop-blur-xl sm:p-8">
          <h2 className="text-lg font-semibold text-stone-100">Recent Activity</h2>
          <p className="mt-2 text-sm text-stone-400">
            Check back here to see the latest from the community—new members joining, upcoming events, and trending listings.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-stone-400">Placeholder</p>
              <p className="mt-2 text-sm font-semibold text-stone-300">New Members</p>
              <p className="text-2xl font-bold text-stone-100">—</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-stone-400">Placeholder</p>
              <p className="mt-2 text-sm font-semibold text-stone-300">Upcoming Events</p>
              <p className="text-2xl font-bold text-stone-100">—</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
