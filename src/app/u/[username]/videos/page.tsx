import Link from 'next/link'
import { notFound } from 'next/navigation'

import prisma from '@/lib/prisma'

export default async function UserVideosPage({
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
      videos: {
        where: { isPublic: true },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          description: true,
          thumbnailUrl: true,
          createdAt: true,
        },
      },
    },
  })

  if (!user) {
    notFound()
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-4 py-10 text-slate-100">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Public Videos</p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-100">
            {user.displayName} (@{user.username})
          </h1>
        </div>
        <Link href={`/u/${user.username}`} className="text-sm text-slate-300 hover:text-slate-100">
          Back to profile
        </Link>
      </div>

      {user.videos.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-black/30 p-6 text-sm text-slate-300">
          No public videos yet.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {user.videos.map((video) => (
            <article key={video.id} className="rounded-xl border border-white/10 bg-black/30 p-4">
              <h2 className="text-sm font-semibold text-slate-100">{video.title}</h2>
              {video.description ? <p className="mt-2 line-clamp-3 text-xs text-slate-300">{video.description}</p> : null}
              <Link href={`/video/${video.id}`} className="mt-4 inline-block text-xs text-sky-300 hover:text-sky-200">
                Open video
              </Link>
            </article>
          ))}
        </div>
      )}
    </main>
  )
}
