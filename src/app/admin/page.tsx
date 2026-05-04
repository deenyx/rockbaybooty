'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

import TopQuickNav from '@/app/_components/top-quick-nav'

type ReportItem = {
  id: string
  reason: string
  details: string | null
  status: string
  createdAt: string
  reporter: { id: string; username: string; displayName: string }
  reported: {
    id: string
    username: string
    displayName: string
    accountStatus: string
    isVerified: boolean
    avatarUrl: string | null
  }
}

const STATUS_TABS = ['pending', 'reviewed', 'actioned', 'dismissed'] as const
type StatusTab = (typeof STATUS_TABS)[number]

const REASON_LABELS: Record<string, string> = {
  harassment: 'Harassment',
  explicit_content: 'Explicit content',
  spam: 'Spam',
  impersonation: 'Impersonation',
  underage: 'Underage concern',
  other: 'Other',
}

function getInitials(name: string) {
  return name.split(' ').map((p) => p[0]).filter(Boolean).join('').slice(0, 2).toUpperCase()
}

export default function AdminDashboardPage() {
  const router = useRouter()
  const [reports, setReports] = useState<ReportItem[]>([])
  const [tab, setTab] = useState<StatusTab>('pending')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [actioningId, setActioningId] = useState<string | null>(null)
  const [userActioningId, setUserActioningId] = useState<string | null>(null)

  async function loadReports(status: StatusTab) {
    try {
      setIsLoading(true)
      setError('')
      const res = await fetch(`/api/admin/reports?status=${status}`)
      if (res.status === 403) {
        router.replace('/dashboard')
        return
      }
      if (!res.ok) throw new Error('Failed to load reports')
      const data = await res.json()
      setReports(data.reports ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadReports(tab)
  }, [tab])

  async function handleReportAction(reportId: string, status: 'reviewed' | 'dismissed' | 'actioned') {
    try {
      setActioningId(reportId)
      const res = await fetch('/api/admin/reports', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId, status }),
      })
      if (!res.ok) throw new Error('Failed to update report')
      setReports((prev) => prev.filter((r) => r.id !== reportId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error')
    } finally {
      setActioningId(null)
    }
  }

  async function handleUserAction(userId: string, action: 'suspend' | 'unsuspend' | 'delete' | 'verify' | 'unverify') {
    const confirmed = window.confirm(
      action === 'delete'
        ? 'Permanently delete this user? This cannot be undone.'
        : action === 'verify'
          ? 'Grant verified badge to this user?'
          : action === 'unverify'
            ? 'Remove verified badge from this user?'
            : `${action === 'suspend' ? 'Suspend' : 'Unsuspend'} this user?`
    )
    if (!confirmed) return
    try {
      setUserActioningId(userId)
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      if (!res.ok) throw new Error('Failed to update user')
      const data = await res.json()
      // Update accountStatus in local reports
      setReports((prev) =>
        prev.map((r) =>
          r.reported.id === userId
            ? { ...r, reported: { ...r.reported, accountStatus: data.user.status ?? r.reported.accountStatus, isVerified: data.user.isVerified ?? r.reported.isVerified } }
            : r
        )
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error')
    } finally {
      setUserActioningId(null)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#090b10] text-stone-100">
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat opacity-10"
        style={{ backgroundImage: "url('/3.jpg')" }}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#090b10]/60 to-[#090b10]/97" />

      <TopQuickNav className="left-4 right-4 md:left-6 md:right-6" />

      <main className="relative z-10 mx-auto max-w-4xl px-4 pb-16 pt-20 sm:px-6">
        <div className="mb-6">
          <p className="text-xs uppercase tracking-widest text-stone-500">Admin</p>
          <h1 className="mt-1 font-[family:var(--font-display)] text-3xl text-stone-100">
            Moderation Dashboard
          </h1>
        </div>

        {/* Status tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {STATUS_TABS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setTab(s)}
              className={`rounded-xl border px-4 py-1.5 text-xs font-semibold uppercase tracking-widest transition ${
                tab === s
                  ? 'border-white/30 bg-white/10 text-stone-100'
                  : 'border-white/10 text-stone-500 hover:border-white/20 hover:text-stone-300'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {error && (
          <p className="mb-4 rounded-xl border border-rose-500/30 bg-rose-900/30 px-4 py-2 text-sm text-rose-300">
            {error}
          </p>
        )}

        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
          </div>
        ) : reports.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/10 p-10 text-center text-sm text-stone-500">
            No {tab} reports.
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <div
                key={report.id}
                className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur"
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Reported user */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-bold text-stone-300 overflow-hidden">
                      {report.reported.avatarUrl ? (
                        <img src={report.reported.avatarUrl} alt="" className="h-10 w-10 object-cover" />
                      ) : (
                        getInitials(report.reported.displayName)
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/u/${report.reported.username}`}
                          className="text-sm font-semibold text-stone-100 hover:underline truncate"
                        >
                          {report.reported.displayName}
                        </Link>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] uppercase tracking-widest font-medium ${
                            report.reported.accountStatus === 'active'
                              ? 'bg-emerald-500/15 text-emerald-400'
                              : report.reported.accountStatus === 'suspended'
                              ? 'bg-amber-500/15 text-amber-400'
                              : 'bg-rose-500/15 text-rose-400'
                          }`}
                        >
                          {report.reported.accountStatus}
                        </span>
                      </div>
                      <p className="text-xs text-stone-500">
                        Reported by @{report.reporter.username} · {new Date(report.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Reason badge */}
                  <span className="shrink-0 rounded-full border border-rose-500/25 bg-rose-500/10 px-2.5 py-1 text-xs text-rose-300">
                    {REASON_LABELS[report.reason] ?? report.reason}
                  </span>
                </div>

                {report.details && (
                  <p className="mt-3 rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2 text-xs leading-6 text-stone-400">
                    {report.details}
                  </p>
                )}

                {tab === 'pending' && (
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <span className="mr-2 text-xs text-stone-500">Report:</span>
                    <button
                      type="button"
                      disabled={actioningId === report.id}
                      onClick={() => void handleReportAction(report.id, 'reviewed')}
                      className="rounded-lg border border-white/15 px-3 py-1 text-xs text-stone-300 transition hover:border-white/25 hover:text-stone-100 disabled:cursor-wait disabled:opacity-50"
                    >
                      Mark reviewed
                    </button>
                    <button
                      type="button"
                      disabled={actioningId === report.id}
                      onClick={() => void handleReportAction(report.id, 'dismissed')}
                      className="rounded-lg border border-white/15 px-3 py-1 text-xs text-stone-400 transition hover:border-white/20 hover:text-stone-200 disabled:cursor-wait disabled:opacity-50"
                    >
                      Dismiss
                    </button>
                    <button
                      type="button"
                      disabled={actioningId === report.id}
                      onClick={() => void handleReportAction(report.id, 'actioned')}
                      className="rounded-lg border border-rose-500/30 px-3 py-1 text-xs text-rose-300 transition hover:border-rose-400/40 hover:text-rose-200 disabled:cursor-wait disabled:opacity-50"
                    >
                      Action taken
                    </button>

                    <span className="ml-2 mr-1 text-xs text-stone-500">User:</span>
                    {report.reported.accountStatus === 'active' ? (
                      <button
                        type="button"
                        disabled={userActioningId === report.reported.id}
                        onClick={() => void handleUserAction(report.reported.id, 'suspend')}
                        className="rounded-lg border border-amber-500/30 px-3 py-1 text-xs text-amber-300 transition hover:border-amber-400/40 hover:text-amber-200 disabled:cursor-wait disabled:opacity-50"
                      >
                        Suspend
                      </button>
                    ) : report.reported.accountStatus === 'suspended' ? (
                      <button
                        type="button"
                        disabled={userActioningId === report.reported.id}
                        onClick={() => void handleUserAction(report.reported.id, 'unsuspend')}
                        className="rounded-lg border border-emerald-500/30 px-3 py-1 text-xs text-emerald-300 transition hover:border-emerald-400/40 hover:text-emerald-200 disabled:cursor-wait disabled:opacity-50"
                      >
                        Unsuspend
                      </button>
                    ) : null}
                    <button
                      type="button"
                      disabled={userActioningId === report.reported.id}
                      onClick={() => void handleUserAction(report.reported.id, report.reported.isVerified ? 'unverify' : 'verify')}
                      className="rounded-lg border border-sky-500/30 px-3 py-1 text-xs text-sky-300 transition hover:border-sky-400/40 hover:text-sky-200 disabled:cursor-wait disabled:opacity-50"
                    >
                      {report.reported.isVerified ? 'Remove ✓' : 'Verify ✓'}
                    </button>
                    <button
                      type="button"
                      disabled={userActioningId === report.reported.id}
                      onClick={() => void handleUserAction(report.reported.id, 'delete')}
                      className="rounded-lg border border-rose-700/40 px-3 py-1 text-xs text-rose-400 transition hover:border-rose-600/50 hover:text-rose-300 disabled:cursor-wait disabled:opacity-50"
                    >
                      Delete user
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
