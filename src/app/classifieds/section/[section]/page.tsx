import jwt from 'jsonwebtoken'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { notFound, redirect } from 'next/navigation'

import TopQuickNav from '@/app/_components/top-quick-nav'
import {
  AUTH_COOKIE_NAME,
  CLASSIFIED_CATEGORY_LABELS,
  CLASSIFIED_CATEGORY_SECTIONS,
  ROUTES,
} from '@/lib/constants'
import prisma from '@/lib/prisma'
import type { AuthTokenPayload, ClassifiedListing } from '@/lib/types'
import ClassifiedCard from '../../_components/classified-card'

function getTokenPayload(token: string): AuthTokenPayload | null {
  const jwtSecret = process.env.JWT_SECRET
  if (!jwtSecret) return null
  try {
    return jwt.verify(token, jwtSecret) as AuthTokenPayload
  } catch {
    return null
  }
}

type Props = {
  params: { section: string }
}

function serializeListing(listing: {
  id: string
  userId: string
  title: string
  description: string
  category: string
  location: string | null
  photos: string[]
  status: string
  expiresAt: Date
  createdAt: Date
  user: {
    id: string
    username: string
    displayName: string
    profile: { avatarUrl: string | null } | null
  }
}): ClassifiedListing {
  return {
    id: listing.id,
    userId: listing.userId,
    title: listing.title,
    description: listing.description,
    category: listing.category,
    location: listing.location,
    photos: listing.photos,
    status: listing.status,
    expiresAt: listing.expiresAt.toISOString(),
    createdAt: listing.createdAt.toISOString(),
    poster: {
      id: listing.user.id,
      username: listing.user.username,
      displayName: listing.user.displayName,
      avatarUrl: listing.user.profile?.avatarUrl ?? null,
    },
  }
}

type SectionListingRecord = {
  id: string
  userId: string
  title: string
  description: string
  category: string
  location: string | null
  photos: string[]
  status: string
  expiresAt: Date
  createdAt: Date
  user: {
    id: string
    username: string
    displayName: string
    profile: { avatarUrl: string | null } | null
  }
}

export default async function ClassifiedSectionPage({ params }: Props) {
  const token = cookies().get(AUTH_COOKIE_NAME)?.value

  if (!token) {
    redirect(`${ROUTES.LOGIN}?returnTo=${encodeURIComponent(`/classifieds/section/${params.section}`)}`)
  }

  const payload = getTokenPayload(token)
  if (!payload) {
    redirect(`${ROUTES.LOGIN}?returnTo=${encodeURIComponent(`/classifieds/section/${params.section}`)}`)
  }

  if (payload.mode === 'default-member') {
    redirect(ROUTES.DASHBOARD)
  }

  const currentUserId =
    (typeof payload.userId === 'string' && payload.userId) ||
    (typeof payload.sub === 'string' && payload.sub) ||
    null

  if (!currentUserId) {
    redirect(`${ROUTES.LOGIN}?returnTo=${encodeURIComponent(`/classifieds/section/${params.section}`)}`)
  }

  const section = CLASSIFIED_CATEGORY_SECTIONS.find((item) => item.value === params.section)

  if (!section) {
    notFound()
  }

  const categories = section.categories
  const listings = await prisma.classified.findMany({
    where: {
      status: 'active',
      expiresAt: { gt: new Date() },
      category: { in: [...categories] },
    },
    orderBy: { createdAt: 'desc' },
    take: 12,
    include: {
      user: {
        select: {
          id: true,
          username: true,
          displayName: true,
          profile: { select: { avatarUrl: true } },
        },
      },
    },
  })

  const counts = await Promise.all(
    categories.map(async (category) => {
      const count = await prisma.classified.count({
        where: {
          status: 'active',
          expiresAt: { gt: new Date() },
          category,
        },
      })

      return {
        value: category,
        label: CLASSIFIED_CATEGORY_LABELS[category as keyof typeof CLASSIFIED_CATEGORY_LABELS] ?? category,
        count,
      }
    })
  )

  const sectionListings = (listings as SectionListingRecord[]).map(serializeListing)

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#080b11] text-stone-100">
      <TopQuickNav className="left-4" />

      <div className="pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20" style={{ backgroundImage: "url('/welcome2.jpg')" }} />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(8,11,18,0.72)_0%,rgba(6,8,12,0.86)_100%)]" />

      <main className="relative z-10 mx-auto max-w-6xl px-4 pb-10 pt-20">
        <div className="mb-5 flex flex-wrap items-center gap-3 text-xs text-stone-500">
          <Link href={ROUTES.CLASSIFIEDS} className="hover:text-stone-300 transition">
            ← Back to classifieds
          </Link>
          <span>•</span>
          <span>{section.label}</span>
        </div>

        <section className="rounded-3xl border border-white/10 bg-black/30 p-6 backdrop-blur-xl sm:p-8">
          <p className="text-xs uppercase tracking-[0.24em] text-stone-300/80">Classifieds Section</p>
          <h1 className="mt-3 font-[family:var(--font-display)] text-4xl text-stone-100 sm:text-5xl">
            {section.label}
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-stone-300 sm:text-base">
            Browse listings inside this section, jump directly to a subcategory, or post something new in the same lane.
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            {counts.map((item) => (
              <Link
                key={item.value}
                href={`${ROUTES.CLASSIFIEDS}?category=${encodeURIComponent(item.value)}`}
                className="rounded-full border border-white/15 bg-white/[0.04] px-3 py-1.5 text-xs text-stone-200 transition hover:border-white/30 hover:bg-white/[0.08]"
              >
                {item.label} · {item.count}
              </Link>
            ))}
          </div>
        </section>

        <div className="mt-6 grid gap-4 lg:grid-cols-[280px_1fr]">
          <aside className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-black/30 p-5 backdrop-blur-xl">
              <p className="text-xs uppercase tracking-[0.18em] text-stone-400">Section</p>
              <h2 className="mt-2 text-xl font-semibold text-stone-100">{section.label}</h2>
              <p className="mt-2 text-sm leading-6 text-stone-300">
                Craigslist-style category hubs make it easier to scan the market fast.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/30 p-5 backdrop-blur-xl">
              <p className="text-xs uppercase tracking-[0.18em] text-stone-400">Other sections</p>
              <div className="mt-3 space-y-2">
                {CLASSIFIED_CATEGORY_SECTIONS.filter((item) => item.value !== section.value).map((item) => (
                  <Link
                    key={item.value}
                    href={`${ROUTES.CLASSIFIEDS_SECTION}/${item.value}`}
                    className="block rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-stone-300 transition hover:border-white/25 hover:bg-white/[0.06] hover:text-white"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </aside>

          <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-stone-400">Recent listings</p>
                <h2 className="mt-2 text-2xl font-semibold text-stone-100">Latest in {section.label}</h2>
              </div>
              <Link
                href={ROUTES.CLASSIFIEDS_NEW}
                className="rounded-full border border-rose-500/30 bg-gradient-to-r from-rose-600/90 to-pink-700/90 px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110"
              >
                Post in this section
              </Link>
            </div>

            {sectionListings.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/20 bg-black/25 p-8 text-stone-300 backdrop-blur">
                No active listings in this section yet. Be the first to post something here.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {sectionListings.map((listing) => (
                  <ClassifiedCard key={listing.id} listing={listing} />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  )
}
