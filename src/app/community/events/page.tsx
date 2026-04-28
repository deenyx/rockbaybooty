import Link from 'next/link'

import TopQuickNav from '@/app/_components/top-quick-nav'
import { ROUTES } from '@/lib/constants'
import prisma from '@/lib/prisma'

export const metadata = {
  title: 'Events | RockBayBooty Community',
  description: 'Find and join community events and meetups',
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

export default async function EventsPage() {
  const [groups, activeMembersCount] = await Promise.all([
    prisma.group.findMany({
      orderBy: { createdAt: 'desc' },
      take: 9,
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
      },
    }),
    prisma.user.count({
      where: {
        status: 'active',
      },
    }),
  ])

  const eventFeed = groups.map((group, index) => ({
    id: group.id,
    title: group.name,
    date: `Created ${formatDate(group.createdAt)}`,
    location: 'Community space',
    attendees: Math.max(3, Math.min(activeMembersCount, 12 + index * 4)),
    tags: group.description ? ['Member-hosted', 'Open'] : ['Member-hosted'],
    description: group.description || 'Community meetup space open for verified members.',
  }))

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#090b10] px-4 pb-8 pt-24 text-stone-100 sm:px-6 lg:px-8">
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20"
        style={{ backgroundImage: "url('/welcome2.jpg')" }}
      />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(8,11,18,0.7)_0%,rgba(6,8,12,0.8)_100%)]" />

      <TopQuickNav className="left-4 right-4 md:left-6 md:right-6" />

      <main className="relative z-10 mx-auto max-w-5xl space-y-6">
        <section className="rounded-3xl border border-white/10 bg-black/30 p-6 backdrop-blur-xl sm:p-8">
          <p className="text-xs uppercase tracking-[0.24em] text-stone-300/80">Community</p>
          <h1 className="mt-3 font-[family:var(--font-display)] text-4xl text-stone-100 sm:text-5xl">
            Events
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-stone-300 sm:text-base">
            Find upcoming meetups, workshops, and private socials curated by verified members.
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            {['Tonight', 'This Week', 'Workshops', 'Members-only'].map((filter) => (
              <span
                key={filter}
                className="rounded-full border border-white/20 bg-white/[0.06] px-3 py-1 text-xs tracking-[0.08em] text-stone-200"
              >
                {filter}
              </span>
            ))}
          </div>
        </section>

        <section className="grid gap-4">
          {eventFeed.length === 0 ? (
            <article className="rounded-2xl border border-dashed border-white/20 bg-black/25 p-6 text-stone-300 backdrop-blur">
              No community events yet. The first events will appear here as soon as members create groups.
            </article>
          ) : null}

          {eventFeed.map((event) => (
            <article
              key={event.id}
              className="rounded-2xl border border-white/10 bg-black/30 p-5 backdrop-blur transition hover:border-white/20"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-stone-100">{event.title}</h2>
                  <p className="mt-1 text-sm text-stone-300">{event.date}</p>
                  <p className="text-sm text-stone-400">{event.location}</p>
                </div>
                <p className="rounded-full border border-white/15 px-3 py-1 text-xs text-stone-300">
                  {event.attendees} going
                </p>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {event.tags.map((tag) => (
                  <span key={tag} className="rounded-lg bg-white/10 px-2.5 py-1 text-xs text-stone-200">
                    {tag}
                  </span>
                ))}
              </div>

              <p className="mt-4 text-sm leading-6 text-stone-300">{event.description}</p>
            </article>
          ))}
        </section>

        <div className="flex flex-wrap gap-3">
          <Link
            href={ROUTES.COMMUNITY}
            className="rounded-xl border border-white/20 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-stone-100 transition hover:border-white/35 hover:bg-white/[0.1]"
          >
            Back to community hub
          </Link>
          <Link
            href={ROUTES.COMMUNITY_CLASSIFIEDS}
            className="rounded-xl border border-white/20 px-4 py-2 text-sm text-stone-200 transition hover:border-white/35 hover:bg-white/[0.04]"
          >
            Browse classifieds
          </Link>
        </div>
      </main>
    </div>
  )
}
