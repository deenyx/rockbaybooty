'use client'

import { useMemo, useState } from 'react'

type ReportStatus = 'pending' | 'reviewed' | 'dismissed' | 'actioned'

type AdminReportItem = {
  id: string
  reason: string
  details: string | null
  status: ReportStatus
  createdAt: string
  reviewedAt: string | null
  resolutionNote: string | null
  reporter: {
    id: string
    username: string
    displayName: string
  }
  target: {
    id: string
    username: string
    displayName: string
    status: string
  }
  reviewedBy: {
    id: string
    username: string
    displayName: string
  } | null
}

type ReportsQueueProps = {
  initialReports: AdminReportItem[]
}

type PendingMap = Record<string, boolean>

const STATUS_CLASS: Record<ReportStatus, string> = {
  pending: 'border-amber-400/40 bg-amber-500/15 text-amber-100',
  reviewed: 'border-sky-400/40 bg-sky-500/15 text-sky-100',
  dismissed: 'border-stone-400/40 bg-stone-500/15 text-stone-100',
  actioned: 'border-emerald-400/40 bg-emerald-500/15 text-emerald-100',
}

function formatReason(reason: string): string {
  return reason
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export default function ReportsQueue({ initialReports }: ReportsQueueProps) {
  const [reports, setReports] = useState(initialReports)
  const [pending, setPending] = useState<PendingMap>({})
  const [resolutionNotes, setResolutionNotes] = useState<Record<string, string>>({})
  const [filter, setFilter] = useState<ReportStatus | 'all'>('pending')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const filtered = useMemo(() => {
    if (filter === 'all') {
      return reports
    }

    return reports.filter((item) => item.status === filter)
  }, [filter, reports])

  async function updateReportStatus(reportId: string, status: Exclude<ReportStatus, 'pending'>) {
    setPending((current) => ({ ...current, [reportId]: true }))
    setErrorMessage(null)

    try {
      const response = await fetch(`/api/admin/reports/${encodeURIComponent(reportId)}`, {
        method: 'PATCH',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          status,
          resolutionNote: resolutionNotes[reportId] || undefined,
        }),
      })

      const payload = (await response.json().catch(() => null)) as
        | {
            error?: string
            report?: {
              id: string
              status: ReportStatus
              reviewedAt: string | null
              resolutionNote: string | null
            }
          }
        | null

      if (!response.ok || !payload?.report) {
        throw new Error(payload?.error || 'Failed to update report')
      }

      setReports((current) =>
        current.map((item) =>
          item.id === reportId
            ? {
                ...item,
                status: payload.report?.status || item.status,
                reviewedAt: payload.report?.reviewedAt || item.reviewedAt,
                resolutionNote: payload.report?.resolutionNote || item.resolutionNote,
              }
            : item
        )
      )
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to update report')
    } finally {
      setPending((current) => ({ ...current, [reportId]: false }))
    }
  }

  return (
    <section className="rounded-2xl border border-white/15 bg-black/30 p-4 shadow-xl backdrop-blur">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-stone-200">Reports Queue</h2>
        <div className="flex items-center gap-2 text-xs text-stone-300">
          <label htmlFor="report-filter" className="uppercase tracking-[0.12em] text-stone-400">
            Filter
          </label>
          <select
            id="report-filter"
            value={filter}
            onChange={(event) => setFilter(event.target.value as ReportStatus | 'all')}
            className="rounded-lg border border-white/20 bg-black/40 px-2 py-1 text-xs text-stone-100"
          >
            <option value="pending">Pending</option>
            <option value="reviewed">Reviewed</option>
            <option value="actioned">Actioned</option>
            <option value="dismissed">Dismissed</option>
            <option value="all">All</option>
          </select>
        </div>
      </div>

      {errorMessage ? (
        <p className="mb-3 rounded-lg border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
          {errorMessage}
        </p>
      ) : null}

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <p className="rounded-lg border border-white/10 bg-white/5 px-3 py-4 text-sm text-stone-300">
            No reports in this state.
          </p>
        ) : (
          filtered.map((report) => {
            const isPending = Boolean(pending[report.id])

            return (
              <article key={report.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-stone-100">
                      {report.target.displayName} (@{report.target.username})
                    </p>
                    <p className="text-xs text-stone-400">
                      Reported by {report.reporter.displayName} (@{report.reporter.username}) on {report.createdAt}
                    </p>
                  </div>
                  <span className={`rounded-full border px-2 py-1 text-[11px] uppercase tracking-[0.12em] ${STATUS_CLASS[report.status]}`}>
                    {report.status}
                  </span>
                </div>

                <div className="mt-2 grid gap-2 text-xs text-stone-300 sm:grid-cols-2">
                  <p>
                    <span className="text-stone-400">Reason:</span> {formatReason(report.reason)}
                  </p>
                  <p>
                    <span className="text-stone-400">Target status:</span> {report.target.status}
                  </p>
                </div>

                {report.details ? (
                  <p className="mt-2 rounded-lg border border-white/10 bg-black/25 px-2.5 py-2 text-xs text-stone-200">
                    {report.details}
                  </p>
                ) : null}

                <textarea
                  value={resolutionNotes[report.id] || ''}
                  onChange={(event) =>
                    setResolutionNotes((current) => ({
                      ...current,
                      [report.id]: event.target.value,
                    }))
                  }
                  placeholder="Optional resolution note"
                  className="mt-2 min-h-20 w-full rounded-lg border border-white/15 bg-black/35 px-3 py-2 text-xs text-stone-100 outline-none transition focus:border-white/30"
                />

                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => updateReportStatus(report.id, 'reviewed')}
                    className="rounded-lg border border-sky-300/35 bg-sky-500/15 px-2.5 py-1.5 text-[11px] uppercase tracking-[0.12em] text-sky-100 transition hover:bg-sky-500/25 disabled:opacity-45"
                  >
                    Mark Reviewed
                  </button>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => updateReportStatus(report.id, 'actioned')}
                    className="rounded-lg border border-emerald-300/35 bg-emerald-500/15 px-2.5 py-1.5 text-[11px] uppercase tracking-[0.12em] text-emerald-100 transition hover:bg-emerald-500/25 disabled:opacity-45"
                  >
                    Mark Actioned
                  </button>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => updateReportStatus(report.id, 'dismissed')}
                    className="rounded-lg border border-stone-300/30 bg-stone-500/15 px-2.5 py-1.5 text-[11px] uppercase tracking-[0.12em] text-stone-100 transition hover:bg-stone-500/25 disabled:opacity-45"
                  >
                    Dismiss
                  </button>
                </div>
              </article>
            )
          })
        )}
      </div>
    </section>
  )
}