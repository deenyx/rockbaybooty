import Link from 'next/link'
import { notFound } from 'next/navigation'

import prisma from '@/lib/prisma'

export default async function UserPage({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params

  const user = await prisma.user.findUnique({
    where: { username: username.toLowerCase() },
    select: {
      username: true,
      displayName: true,
      createdAt: true,
      profile: {
        select: {
          bio: true,
          city: true,
          state: true,
          country: true,
          interests: true,
          lookingFor: true,
          avatarUrl: true,
        },
      },
    },
  })

  if (!user) {
    notFound()
  }

  const location = [user.profile?.city, user.profile?.state, user.profile?.country]
    .filter(Boolean)
    .join(', ')

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-4 py-10 text-slate-100">
      <div className="rounded-2xl border border-white/10 bg-black/35 p-6 backdrop-blur-sm">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Member Page</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-100">{user.displayName}</h1>
        <p className="mt-1 text-sm text-slate-400">@{user.username}</p>

        {location ? <p className="mt-4 text-sm text-slate-300">{location}</p> : null}
        {user.profile?.bio ? <p className="mt-3 text-sm text-slate-200">{user.profile.bio}</p> : null}

        {user.profile?.interests?.length ? (
          <div className="mt-5 flex flex-wrap gap-2">
            {user.profile.interests.slice(0, 10).map((interest) => (
              <span
                key={interest}
                className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-slate-200"
              >
                {interest}
              </span>
            ))}
          </div>
        ) : null}

        <div className="mt-8 flex gap-3">
          <Link
            href={`/u/${user.username}/videos`}
            className="rounded-lg border border-white/20 px-4 py-2 text-sm text-slate-100 hover:bg-white/10"
          >
            Videos
          </Link>
          <Link
            href="/me/messages"
            className="rounded-lg border border-white/20 px-4 py-2 text-sm text-slate-100 hover:bg-white/10"
          >
            Message
          </Link>
        </div>
      </div>
    </main>
  )
}
