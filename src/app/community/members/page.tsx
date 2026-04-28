import Link from 'next/link'

import TopQuickNav from '@/app/_components/top-quick-nav'
import { INTEREST_TAG_OPTIONS, ROUTES, SEARCH_LOCATION_OPTIONS } from '@/lib/constants'
import prisma from '@/lib/prisma'

export const metadata = {
  title: 'Member Search | RockBayBooty Community',
  description: 'Discover and connect with verified members in the community',
}

function getLocation(profile: {
  location: string | null
  city: string | null
  state: string | null
  country: string | null
}) {
  if (profile.location) {
    return profile.location
  }

  const fallback = [profile.city, profile.state, profile.country].filter(Boolean).join(', ')
  return fallback || 'Location hidden'
}

function getRole(profile: { lookingFor: string[] }) {
  const role = profile.lookingFor.find((item) => ['Dominant', 'Submissive', 'Switch'].includes(item))
  return role || 'Member'
}

export default async function MembersPage() {
  let members = await prisma.user.findMany({
    where: {
      status: 'active',
      profile: {
        is: {
          isPublic: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 12,
    select: {
      id: true,
      displayName: true,
      profile: {
        select: {
          location: true,
          city: true,
          state: true,
          country: true,
          bio: true,
          lookingFor: true,
        },
      },
    },
  })

  if (members.length === 0) {
    members = await prisma.user.findMany({
      where: {
        status: 'active',
        profile: {
          isNot: null,
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 12,
      select: {
        id: true,
        displayName: true,
        profile: {
          select: {
            location: true,
            city: true,
            state: true,
            country: true,
            bio: true,
            lookingFor: true,
          },
        },
      },
    })
  }

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
            Member Search
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-stone-300 sm:text-base">
            Browse verified members by location and vibe, then jump into profile discovery.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-stone-400">Popular locations</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {SEARCH_LOCATION_OPTIONS.slice(0, 5).map((location) => (
                  <span key={location} className="rounded-full border border-white/20 px-3 py-1 text-xs text-stone-200">
                    {location}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-stone-400">Trending interests</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {INTEREST_TAG_OPTIONS.slice(0, 5).map((tag) => (
                  <span key={tag} className="rounded-full border border-white/20 px-3 py-1 text-xs text-stone-200">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {members.length === 0 ? (
            <article className="rounded-2xl border border-dashed border-white/20 bg-black/25 p-6 text-stone-300 backdrop-blur md:col-span-3">
              No discoverable members yet. Profiles will show up here after onboarding is completed.
            </article>
          ) : null}

          {members.map((member) => (
            (() => {
              const profile = member.profile
              const role = profile ? getRole(profile) : 'Member'
              const location = profile ? getLocation(profile) : 'Location hidden'
              const bio = profile?.bio || 'Profile details are limited for privacy. Open profile to learn more.'

              return (
            <article
              key={member.id}
              className="rounded-2xl border border-white/10 bg-black/30 p-5 backdrop-blur transition hover:border-white/20"
            >
              <p className="text-xs uppercase tracking-[0.16em] text-stone-400">{role}</p>
              <h2 className="mt-2 text-lg font-semibold text-stone-100">{member.displayName}</h2>
              <p className="text-sm text-stone-400">{location}</p>
              <p className="mt-3 text-sm leading-6 text-stone-300">{bio}</p>
              <button
                type="button"
                className="mt-4 w-full rounded-xl border border-white/20 bg-white/[0.06] px-3 py-2 text-sm text-stone-100 transition hover:border-white/35 hover:bg-white/[0.1]"
              >
                View profile
              </button>
            </article>
              )
            })()
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
            href={ROUTES.SEARCH}
            className="rounded-xl border border-white/20 px-4 py-2 text-sm text-stone-200 transition hover:border-white/35 hover:bg-white/[0.04]"
          >
            Open full search
          </Link>
        </div>
      </main>
    </div>
  )
}
