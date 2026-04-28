import Link from 'next/link'

import TopQuickNav from '@/app/_components/top-quick-nav'
import { ROUTES } from '@/lib/constants'
import prisma from '@/lib/prisma'

export const metadata = {
  title: 'Classifieds | RockBayBooty Community',
  description: 'Browse listings, services, and exclusive content from members',
}

function pseudoPriceFromId(id: string) {
  const seed = id.slice(-4).split('').reduce((sum, char) => sum + char.charCodeAt(0), 0)
  const amount = 15 + (seed % 90)
  return `$${amount}`
}

export default async function ClassifiedsPage() {
  const listings = await prisma.classified.findMany({
    orderBy: { createdAt: 'desc' },
    take: 12,
    select: {
      id: true,
      title: true,
      category: true,
      description: true,
    },
  })

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
            Classifieds
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-stone-300 sm:text-base">
            Explore member listings for services, content, and access opportunities.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {listings.length === 0 ? (
            <article className="rounded-2xl border border-dashed border-white/20 bg-black/25 p-6 text-stone-300 backdrop-blur md:col-span-3">
              No listings yet. Once members post classifieds, they will appear here.
            </article>
          ) : null}

          {listings.map((listing) => (
            <article
              key={listing.id}
              className="rounded-2xl border border-white/10 bg-black/30 p-5 backdrop-blur transition hover:border-white/20"
            >
              <p className="text-xs uppercase tracking-[0.16em] text-stone-400">{listing.category}</p>
              <h2 className="mt-2 text-lg font-semibold text-stone-100">{listing.title}</h2>
              <p className="mt-1 text-sm text-stone-400">Seller: Verified member</p>
              <p className="mt-3 text-sm leading-6 text-stone-300">{listing.description}</p>
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm font-semibold text-stone-100">{pseudoPriceFromId(listing.id)}</p>
                <button
                  type="button"
                  className="rounded-lg border border-white/20 bg-white/[0.06] px-3 py-1.5 text-xs text-stone-100 transition hover:border-white/35 hover:bg-white/[0.1]"
                >
                  Open
                </button>
              </div>
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
            href={ROUTES.COMMUNITY_EVENTS}
            className="rounded-xl border border-white/20 px-4 py-2 text-sm text-stone-200 transition hover:border-white/35 hover:bg-white/[0.04]"
          >
            View events
          </Link>
        </div>
      </main>
    </div>
  )
}
