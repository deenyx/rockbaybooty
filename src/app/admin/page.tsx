import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import type { UserRole } from '@prisma/client'

import { AUTH_COOKIE_NAME, ROUTES } from '@/lib/constants'
import prisma from '@/lib/prisma'
import type { AuthTokenPayload } from '@/lib/types'

import MemberControlTable from './_components/member-control-table'
import ReportsQueue from './_components/reports-queue'

type AdminRole = 'SUPREME_ADMIN' | 'ADMIN'

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

function isAdminRole(role: UserRole | null | undefined): role is AdminRole {
  return role === 'SUPREME_ADMIN' || role === 'ADMIN'
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

function formatRelativeSince(date: Date): string {
  const ms = Date.now() - date.getTime()
  const hours = Math.floor(ms / (1000 * 60 * 60))

  if (hours < 1) {
    return 'under 1h ago'
  }

  if (hours < 24) {
    return `${hours}h ago`
  }

  const days = Math.floor(hours / 24)
  if (days < 30) {
    return `${days}d ago`
  }

  const months = Math.floor(days / 30)
  return `${months}mo ago`
}

export default async function AdminControlPanelPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value

  if (!token) {
    redirect(`${ROUTES.LOGIN}?returnTo=${encodeURIComponent('/admin')}`)
  }

  const payload = getTokenPayload(token)
  const userId = payload?.userId || payload?.sub || null

  if (!userId) {
    redirect(`${ROUTES.LOGIN}?returnTo=${encodeURIComponent('/admin')}`)
  }

  const actor = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      username: true,
      displayName: true,
    },
  })

  if (!actor || !isAdminRole(actor.role)) {
    redirect(ROUTES.ME)
  }

  const [
    totalMembers,
    activeMembers,
    suspendedMembers,
    burnerMembers,
    onboardingOpen,
    pendingReports,
    recentMembers,
    recentReports,
    recentAuditEvents,
  ] =
    await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: 'active' } }),
      prisma.user.count({ where: { status: 'suspended' } }),
      prisma.user.count({ where: { role: 'BURNER' } }),
      prisma.user.count({ where: { onboardingStep: { not: 'completed' } } }),
      prisma.report.count({ where: { status: 'pending' } }),
      prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 25,
        select: {
          id: true,
          username: true,
          displayName: true,
          role: true,
          status: true,
          emailVerified: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              sentMessages: true,
              videos: true,
            },
          },
        },
      }),
      prisma.report.findMany({
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: {
          id: true,
          reason: true,
          details: true,
          status: true,
          createdAt: true,
          reviewedAt: true,
          resolutionNote: true,
          reporter: {
            select: {
              id: true,
              username: true,
              displayName: true,
            },
          },
          target: {
            select: {
              id: true,
              username: true,
              displayName: true,
              status: true,
            },
          },
          reviewedBy: {
            select: {
              id: true,
              username: true,
              displayName: true,
            },
          },
        },
      }),
      prisma.adminAuditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: {
          id: true,
          action: true,
          reason: true,
          targetUserId: true,
          createdAt: true,
          actor: {
            select: {
              username: true,
              displayName: true,
            },
          },
        },
      }),
    ])

  const memberRows = recentMembers.map((member) => ({
    id: member.id,
    username: member.username,
    displayName: member.displayName,
    role: member.role,
    status: member.status as 'active' | 'suspended' | 'deleted',
    emailVerified: member.emailVerified,
    createdAt: formatDate(member.createdAt),
    lastSeenLabel: formatRelativeSince(member.updatedAt),
    messagesSent: member._count.sentMessages,
    videosPosted: member._count.videos,
  }))

  const reportRows = recentReports.map((report) => ({
    id: report.id,
    reason: report.reason,
    details: report.details,
    status: report.status,
    createdAt: formatDate(report.createdAt),
    reviewedAt: report.reviewedAt ? formatDate(report.reviewedAt) : null,
    resolutionNote: report.resolutionNote,
    reporter: report.reporter,
    target: report.target,
    reviewedBy: report.reviewedBy,
  }))

  return (
    <main className="min-h-screen bg-[#090b10] px-4 pb-12 pt-8 text-stone-100 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl space-y-6">
        <header className="rounded-2xl border border-white/15 bg-gradient-to-br from-[#141824] via-[#12151f] to-[#0c0f16] p-5 shadow-2xl">
          <p className="text-[11px] uppercase tracking-[0.2em] text-stone-400">Administration</p>
          <h1 className="mt-2 text-2xl font-semibold text-white">Control Panel</h1>
          <p className="mt-2 max-w-3xl text-sm text-stone-300">
            Safety and account operations live here. Moderator workflows can be layered on top of this base panel once report ingestion is wired.
          </p>
          <p className="mt-3 text-xs text-stone-400">
            Signed in as {actor.displayName} (@{actor.username}) • Role: {actor.role}
          </p>
        </header>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <article className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-stone-400">Total</p>
            <p className="mt-2 text-2xl font-semibold text-white">{totalMembers}</p>
          </article>
          <article className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-emerald-300">Active</p>
            <p className="mt-2 text-2xl font-semibold text-emerald-200">{activeMembers}</p>
          </article>
          <article className="rounded-xl border border-amber-400/20 bg-amber-500/10 p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-amber-300">Suspended</p>
            <p className="mt-2 text-2xl font-semibold text-amber-200">{suspendedMembers}</p>
          </article>
          <article className="rounded-xl border border-cyan-400/20 bg-cyan-500/10 p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-cyan-300">Burner Accounts</p>
            <p className="mt-2 text-2xl font-semibold text-cyan-200">{burnerMembers}</p>
          </article>
          <article className="rounded-xl border border-fuchsia-400/20 bg-fuchsia-500/10 p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-fuchsia-300">Onboarding Open</p>
            <p className="mt-2 text-2xl font-semibold text-fuchsia-200">{onboardingOpen}</p>
          </article>
        </section>

        <section className="rounded-xl border border-amber-400/25 bg-amber-500/10 p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-amber-300">Pending Reports</p>
          <p className="mt-2 text-2xl font-semibold text-amber-100">{pendingReports}</p>
        </section>

        <ReportsQueue initialReports={reportRows} />

        <MemberControlTable initialMembers={memberRows} actorRole={actor.role} />

        <section className="rounded-2xl border border-white/15 bg-black/30 p-4 shadow-xl backdrop-blur">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-stone-200">Audit Log</h2>
            <span className="text-xs text-stone-400">Last {recentAuditEvents.length} events</span>
          </div>

          {recentAuditEvents.length === 0 ? (
            <p className="rounded-lg border border-white/10 bg-white/5 px-3 py-4 text-sm text-stone-300">
              No audit events yet.
            </p>
          ) : (
            <div className="space-y-2">
              {recentAuditEvents.map((event) => (
                <article key={event.id} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-xs text-stone-200">
                  <p>
                    <span className="font-semibold text-stone-100">{event.action}</span> by {event.actor.displayName} (@{event.actor.username})
                  </p>
                  <p className="text-stone-400">
                    {formatDate(event.createdAt)}{event.targetUserId ? ` • target: ${event.targetUserId.slice(0, 8)}...` : ''}
                  </p>
                  {event.reason ? <p className="mt-1 text-stone-300">{event.reason}</p> : null}
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}