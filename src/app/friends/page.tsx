import jwt from 'jsonwebtoken'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import MemberLayout from '@/app/_layouts/member-layout'
import { AUTH_COOKIE_NAME, ROUTES, SESSION_MODE_DEFAULT_MEMBER } from '@/lib/constants'
import prisma from '@/lib/prisma'
import type { AuthTokenPayload } from '@/lib/types'

type FriendUser = {
  id: string
  username: string
  displayName: string
  firstName: string | null
  profile: {
    avatarUrl: string | null
  } | null
}

function getTokenPayload(token: string): AuthTokenPayload | null {
  const jwtSecret = process.env.JWT_SECRET
  if (!jwtSecret) {
    return null
  }

  try {
    return jwt.verify(token, jwtSecret) as AuthTokenPayload
  } catch {
    return null
  }
}

async function requireAuthenticatedUserId(): Promise<string> {
  const cookieStore = await cookies()
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value

  if (!token) {
    redirect(`${ROUTES.LOGIN}?returnTo=${encodeURIComponent(ROUTES.FRIENDS)}`)
  }

  const payload = getTokenPayload(token)
  if (!payload) {
    redirect(`${ROUTES.LOGIN}?returnTo=${encodeURIComponent(ROUTES.FRIENDS)}`)
  }

  if (payload.mode === SESSION_MODE_DEFAULT_MEMBER) {
    redirect(ROUTES.DASHBOARD)
  }

  const userId =
    (typeof payload.userId === 'string' && payload.userId) ||
    (typeof payload.sub === 'string' && payload.sub) ||
    null

  if (!userId) {
    redirect(`${ROUTES.LOGIN}?returnTo=${encodeURIComponent(ROUTES.FRIENDS)}`)
  }

  return userId
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((part) => part.trim().slice(0, 1))
    .filter(Boolean)
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function formatDate(value: Date) {
  return value.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function FriendRow({
  user,
  subtitle,
  actions,
}: {
  user: FriendUser
  subtitle: string
  actions?: React.ReactNode
}) {
  const displayName = user.displayName || user.firstName || user.username

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="flex min-w-0 items-center gap-3">
        {user.profile?.avatarUrl ? (
          <div
            className="h-11 w-11 rounded-xl border border-white/20 bg-cover bg-center"
            style={{ backgroundImage: `url(${user.profile.avatarUrl})` }}
          />
        ) : (
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-sm font-semibold text-stone-100">
            {getInitials(displayName)}
          </div>
        )}

        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-stone-100">{displayName}</p>
          <p className="truncate text-xs text-stone-400">@{user.username}</p>
          <p className="text-xs text-stone-500">{subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {actions}
        <Link
          href={`${ROUTES.MESSAGES}/${user.id}`}
          className="rounded-lg border border-amber-200/30 bg-amber-300/15 px-3 py-1.5 text-xs font-semibold text-amber-100 transition hover:border-amber-100/60 hover:bg-amber-200/20"
        >
          Message
        </Link>
        <Link
          href={`/u/${user.username}`}
          className="rounded-lg border border-white/20 bg-white/5 px-3 py-1.5 text-xs font-semibold text-stone-200 transition hover:border-white/35 hover:text-white"
        >
          View
        </Link>
      </div>
    </li>
  )
}

type FriendsPageProps = {
  searchParams?: Record<string, string | string[] | undefined>
}

export default async function FriendsPage({ searchParams = {} }: FriendsPageProps) {
  const userId = await requireAuthenticatedUserId()

  async function acceptRequest(formData: FormData) {
    'use server'

    const activeUserId = await requireAuthenticatedUserId()
    const friendshipId = String(formData.get('friendshipId') || '')

    if (!friendshipId) {
      redirect(`${ROUTES.FRIENDS}?status=invalid`)
    }

    await prisma.friendship.updateMany({
      where: {
        id: friendshipId,
        recipientId: activeUserId,
        status: 'pending',
      },
      data: { status: 'accepted' },
    })

    redirect(`${ROUTES.FRIENDS}?status=accepted`)
  }

  async function declineRequest(formData: FormData) {
    'use server'

    const activeUserId = await requireAuthenticatedUserId()
    const friendshipId = String(formData.get('friendshipId') || '')

    if (!friendshipId) {
      redirect(`${ROUTES.FRIENDS}?status=invalid`)
    }

    await prisma.friendship.updateMany({
      where: {
        id: friendshipId,
        recipientId: activeUserId,
        status: 'pending',
      },
      data: { status: 'declined' },
    })

    redirect(`${ROUTES.FRIENDS}?status=declined`)
  }

  async function cancelRequest(formData: FormData) {
    'use server'

    const activeUserId = await requireAuthenticatedUserId()
    const friendshipId = String(formData.get('friendshipId') || '')

    if (!friendshipId) {
      redirect(`${ROUTES.FRIENDS}?status=invalid`)
    }

    await prisma.friendship.updateMany({
      where: {
        id: friendshipId,
        requesterId: activeUserId,
        status: 'pending',
      },
      data: { status: 'declined' },
    })

    redirect(`${ROUTES.FRIENDS}?status=cancelled`)
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      username: true,
      firstName: true,
      displayName: true,
      profile: {
        select: {
          avatarUrl: true,
        },
      },
    },
  })

  if (!user) {
    redirect(`${ROUTES.LOGIN}?returnTo=${encodeURIComponent(ROUTES.FRIENDS)}`)
  }

  const [acceptedFriendships, incomingRequests, outgoingRequests] = await Promise.all([
    prisma.friendship.findMany({
      where: {
        status: 'accepted',
        OR: [{ requesterId: userId }, { recipientId: userId }],
      },
      orderBy: { updatedAt: 'desc' },
      include: {
        requester: {
          select: {
            id: true,
            username: true,
            displayName: true,
            firstName: true,
            profile: { select: { avatarUrl: true } },
          },
        },
        recipient: {
          select: {
            id: true,
            username: true,
            displayName: true,
            firstName: true,
            profile: { select: { avatarUrl: true } },
          },
        },
      },
    }),
    prisma.friendship.findMany({
      where: { recipientId: userId, status: 'pending' },
      orderBy: { createdAt: 'desc' },
      include: {
        requester: {
          select: {
            id: true,
            username: true,
            displayName: true,
            firstName: true,
            profile: { select: { avatarUrl: true } },
          },
        },
      },
    }),
    prisma.friendship.findMany({
      where: { requesterId: userId, status: 'pending' },
      orderBy: { createdAt: 'desc' },
      include: {
        recipient: {
          select: {
            id: true,
            username: true,
            displayName: true,
            firstName: true,
            profile: { select: { avatarUrl: true } },
          },
        },
      },
    }),
  ])

  const acceptedFriends = acceptedFriendships.map((friendship) =>
    friendship.requesterId === userId ? friendship.recipient : friendship.requester
  )

  const statusParam = Array.isArray(searchParams.status)
    ? searchParams.status[0]
    : searchParams.status

  const feedbackMessage =
    statusParam === 'accepted'
      ? 'Friend request accepted.'
      : statusParam === 'declined'
        ? 'Friend request declined.'
        : statusParam === 'cancelled'
          ? 'Friend request cancelled.'
          : statusParam === 'invalid'
            ? 'Could not process that request.'
            : ''

  return (
    <MemberLayout
      initialUser={{
        username: user.username,
        firstName: user.firstName || user.displayName || user.username,
        displayName: user.displayName,
        avatarUrl: user.profile?.avatarUrl ?? undefined,
      }}
    >
      <div className="mx-auto min-h-screen w-full max-w-6xl space-y-6 px-4 pb-8 pt-8 sm:px-6 lg:px-8">
        <header className="rounded-3xl border border-white/10 bg-black/20 p-5 backdrop-blur-lg">
          <p className="text-xs uppercase tracking-[0.22em] text-stone-300/80">Network</p>
          <h1 className="mt-2 text-3xl font-semibold text-stone-100">Friends</h1>
          <p className="mt-2 text-sm text-stone-300">
            Manage your connected friends and pending requests.
          </p>
        </header>

        {feedbackMessage && (
          <p className="rounded-2xl border border-emerald-300/35 bg-emerald-400/12 px-4 py-3 text-sm text-emerald-100">
            {feedbackMessage}
          </p>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          <section className="rounded-3xl border border-white/10 bg-black/20 p-5 backdrop-blur-lg lg:col-span-2">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg font-semibold text-stone-100">Accepted Friends</h2>
              <span className="rounded-full border border-emerald-300/30 bg-emerald-400/15 px-3 py-1 text-xs uppercase tracking-[0.14em] text-emerald-100">
                {acceptedFriends.length}
              </span>
            </div>

            {acceptedFriends.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-6 text-sm text-stone-300">
                No friends yet. Start by discovering members.
                <div className="mt-3">
                  <Link
                    href={ROUTES.SEARCH}
                    className="inline-flex rounded-lg border border-sky-300/30 bg-sky-400/10 px-3 py-1.5 text-xs font-semibold text-sky-100 transition hover:bg-sky-300/15"
                  >
                    Browse Members
                  </Link>
                </div>
              </div>
            ) : (
              <ul className="mt-4 space-y-3">
                {acceptedFriends.map((friend) => (
                  <FriendRow key={friend.id} user={friend} subtitle="Friend" />
                ))}
              </ul>
            )}
          </section>

          <div className="space-y-6">
            <section className="rounded-3xl border border-white/10 bg-black/20 p-5 backdrop-blur-lg">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-100">Incoming</h2>
                <span className="text-xs text-stone-400">{incomingRequests.length}</span>
              </div>

              {incomingRequests.length === 0 ? (
                <p className="mt-4 text-sm text-stone-400">No incoming requests.</p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {incomingRequests.map((request) => (
                    <FriendRow
                      key={request.id}
                      user={request.requester}
                      subtitle={`Requested ${formatDate(request.createdAt)}`}
                      actions={
                        <>
                          <form action={declineRequest}>
                            <input type="hidden" name="friendshipId" value={request.id} />
                            <button
                              type="submit"
                              className="rounded-lg border border-white/20 bg-white/5 px-3 py-1.5 text-xs font-semibold text-stone-200 transition hover:border-white/35 hover:text-white"
                            >
                              Decline
                            </button>
                          </form>
                          <form action={acceptRequest}>
                            <input type="hidden" name="friendshipId" value={request.id} />
                            <button
                              type="submit"
                              className="rounded-lg border border-emerald-300/30 bg-emerald-300/20 px-3 py-1.5 text-xs font-semibold text-emerald-100 transition hover:border-emerald-200/60 hover:bg-emerald-200/30"
                            >
                              Accept
                            </button>
                          </form>
                        </>
                      }
                    />
                  ))}
                </ul>
              )}
            </section>

            <section className="rounded-3xl border border-white/10 bg-black/20 p-5 backdrop-blur-lg">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-100">Outgoing</h2>
                <span className="text-xs text-stone-400">{outgoingRequests.length}</span>
              </div>

              {outgoingRequests.length === 0 ? (
                <p className="mt-4 text-sm text-stone-400">No outgoing requests.</p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {outgoingRequests.map((request) => (
                    <FriendRow
                      key={request.id}
                      user={request.recipient}
                      subtitle={`Sent ${formatDate(request.createdAt)}`}
                      actions={
                        <form action={cancelRequest}>
                          <input type="hidden" name="friendshipId" value={request.id} />
                          <button
                            type="submit"
                            className="rounded-lg border border-white/20 bg-white/5 px-3 py-1.5 text-xs font-semibold text-stone-200 transition hover:border-white/35 hover:text-white"
                          >
                            Cancel
                          </button>
                        </form>
                      }
                    />
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>
      </div>
    </MemberLayout>
  )
}
