'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

import TopQuickNav from '@/app/_components/top-quick-nav'

// ── Types ─────────────────────────────────────────────────────────────────────

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

type GroupItem = {
  id: string
  name: string
  slug: string
  category: string
  status: string
  isPublic: boolean
  createdAt: string
  memberCount: number
  postCount: number
  owner: { id: string; username: string; displayName: string } | null
}

type ClassifiedItem = {
  id: string
  title: string
  description: string
  category: string
  location: string | null
  status: string
  expiresAt: string
  createdAt: string
  author: { id: string; username: string; displayName: string; avatarUrl: string | null }
}

// ── Constants ─────────────────────────────────────────────────────────────────

type MainTab = 'reports' | 'groups' | 'classifieds'
const MAIN_TABS: { key: MainTab; label: string }[] = [
  { key: 'reports', label: 'Reports' },
  { key: 'groups', label: 'Groups' },
  { key: 'classifieds', label: 'Classifieds' },
]

const REPORT_STATUS_TABS = ['pending', 'reviewed', 'actioned', 'dismissed'] as const
type ReportStatusTab = (typeof REPORT_STATUS_TABS)[number]

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

  // ── Main tab ───────────────────────────────────────────────────────────────
  const [mainTab, setMainTab] = useState<MainTab>('reports')

  // ── Reports state ──────────────────────────────────────────────────────────
  const [reports, setReports] = useState<ReportItem[]>([])
  const [reportStatusTab, setReportStatusTab] = useState<ReportStatusTab>('pending')
  const [reportsLoading, setReportsLoading] = useState(false)
  const [reportsError, setReportsError] = useState('')
  const [actioningId, setActioningId] = useState<string | null>(null)
  const [userActioningId, setUserActioningId] = useState<string | null>(null)

  // ── Groups state ───────────────────────────────────────────────────────────
  const [groups, setGroups] = useState<GroupItem[]>([])
  const [groupsNextCursor, setGroupsNextCursor] = useState<string | null>(null)
  const [groupStatusFilter, setGroupStatusFilter] = useState<'active' | 'closed' | 'deleted'>('active')
  const [groupSearch, setGroupSearch] = useState('')
  const [groupsLoading, setGroupsLoading] = useState(false)
  const [groupsError, setGroupsError] = useState('')
  const [groupActioningId, setGroupActioningId] = useState<string | null>(null)

  // ── Classifieds state ──────────────────────────────────────────────────────
  const [classifieds, setClassifieds] = useState<ClassifiedItem[]>([])
  const [classifiedsNextCursor, setClassifiedsNextCursor] = useState<string | null>(null)
  const [classifiedStatusFilter, setClassifiedStatusFilter] = useState<'active' | 'deleted'>('active')
  const [classifiedSearch, setClassifiedSearch] = useState('')
  const [classifiedsLoading, setClassifiedsLoading] = useState(false)
  const [classifiedsError, setClassifiedsError] = useState('')
  const [classifiedActioningId, setClassifiedActioningId] = useState<string | null>(null)

  // ── Loaders ────────────────────────────────────────────────────────────────

  async function loadReports(status: ReportStatusTab) {
    try {
      setReportsLoading(true)
      setReportsError('')
      const res = await fetch(`/api/admin/reports?status=${status}`)
      if (res.status === 403) { router.replace('/dashboard'); return }
      if (!res.ok) throw new Error('Failed to load reports')
      const data = await res.json()
      setReports(data.reports ?? [])
    } catch (err) {
      setReportsError(err instanceof Error ? err.message : 'Error')
    } finally {
      setReportsLoading(false)
    }
  }

  async function loadGroups(status: typeof groupStatusFilter, q: string, cursor?: string) {
    try {
      setGroupsLoading(true)
      setGroupsError('')
      const params = new URLSearchParams({ status, q })
      if (cursor) params.set('cursor', cursor)
      const res = await fetch(`/api/admin/groups?${params}`)
      if (!res.ok) throw new Error('Failed to load groups')
      const data = await res.json()
      setGroups((prev) => cursor ? [...prev, ...(data.groups ?? [])] : (data.groups ?? []))
      setGroupsNextCursor(data.nextCursor ?? null)
    } catch (err) {
      setGroupsError(err instanceof Error ? err.message : 'Error')
    } finally {
      setGroupsLoading(false)
    }
  }

  async function loadClassifieds(status: typeof classifiedStatusFilter, q: string, cursor?: string) {
    try {
      setClassifiedsLoading(true)
      setClassifiedsError('')
      const params = new URLSearchParams({ status, q })
      if (cursor) params.set('cursor', cursor)
      const res = await fetch(`/api/admin/classifieds?${params}`)
      if (!res.ok) throw new Error('Failed to load classifieds')
      const data = await res.json()
      setClassifieds((prev) => cursor ? [...prev, ...(data.classifieds ?? [])] : (data.classifieds ?? []))
      setClassifiedsNextCursor(data.nextCursor ?? null)
    } catch (err) {
      setClassifiedsError(err instanceof Error ? err.message : 'Error')
    } finally {
      setClassifiedsLoading(false)
    }
  }

  // ── Effects ────────────────────────────────────────────────────────────────

  useEffect(() => { void loadReports(reportStatusTab) }, [reportStatusTab])
  useEffect(() => { void loadGroups(groupStatusFilter, groupSearch) }, [groupStatusFilter])
  useEffect(() => { void loadClassifieds(classifiedStatusFilter, classifiedSearch) }, [classifiedStatusFilter])

  // ── Actions ────────────────────────────────────────────────────────────────

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
      setReportsError(err instanceof Error ? err.message : 'Error')
    } finally {
      setActioningId(null)
    }
  }

  async function handleUserAction(userId: string, action: 'suspend' | 'unsuspend' | 'delete' | 'verify' | 'unverify') {
    const confirmed = window.confirm(
      action === 'delete' ? 'Permanently delete this user? This cannot be undone.'
      : action === 'verify' ? 'Grant verified badge to this user?'
      : action === 'unverify' ? 'Remove verified badge from this user?'
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
      setReports((prev) =>
        prev.map((r) =>
          r.reported.id === userId
            ? { ...r, reported: { ...r.reported, accountStatus: data.user.status ?? r.reported.accountStatus, isVerified: data.user.isVerified ?? r.reported.isVerified } }
            : r
        )
      )
    } catch (err) {
      setReportsError(err instanceof Error ? err.message : 'Error')
    } finally {
      setUserActioningId(null)
    }
  }

  async function handleGroupAction(groupId: string, action: 'close' | 'reopen' | 'delete') {
    const confirmed = window.confirm(
      action === 'delete' ? 'Permanently delete this group? This cannot be undone.'
      : action === 'close' ? 'Close this group? Members will no longer be able to post.'
      : 'Reopen this group?'
    )
    if (!confirmed) return
    try {
      setGroupActioningId(groupId)
      const res = await fetch('/api/admin/groups', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId, action }),
      })
      if (!res.ok) throw new Error('Failed to update group')
      const data = await res.json()
      const newStatus = data.group.status
      // If the new status no longer matches the current filter, remove it from the list
      setGroups((prev) =>
        newStatus === groupStatusFilter
          ? prev.map((g) => g.id === groupId ? { ...g, status: newStatus } : g)
          : prev.filter((g) => g.id !== groupId)
      )
    } catch (err) {
      setGroupsError(err instanceof Error ? err.message : 'Error')
    } finally {
      setGroupActioningId(null)
    }
  }

  async function handleClassifiedAction(classifiedId: string, action: 'remove' | 'restore') {
    try {
      setClassifiedActioningId(classifiedId)
      const res = await fetch('/api/admin/classifieds', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classifiedId, action }),
      })
      if (!res.ok) throw new Error('Failed to update classified')
      const data = await res.json()
      const newStatus = data.classified.status
      setClassifieds((prev) =>
        newStatus === classifiedStatusFilter
          ? prev
          : prev.filter((c) => c.id !== classifiedId)
      )
    } catch (err) {
      setClassifiedsError(err instanceof Error ? err.message : 'Error')
    } finally {
      setClassifiedActioningId(null)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

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

        {/* Main tabs */}
        <div className="flex gap-2 mb-8 border-b border-white/10 pb-0">
          {MAIN_TABS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setMainTab(key)}
              className={`rounded-t-xl border-t border-x px-5 py-2 text-xs font-semibold uppercase tracking-widest transition -mb-px ${
                mainTab === key
                  ? 'border-white/20 bg-white/[0.07] text-stone-100'
                  : 'border-transparent text-stone-500 hover:text-stone-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── REPORTS panel ──────────────────────────────────────────────── */}
        {mainTab === 'reports' && (
          <>
            <div className="flex flex-wrap gap-2 mb-6">
              {REPORT_STATUS_TABS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setReportStatusTab(s)}
                  className={`rounded-xl border px-4 py-1.5 text-xs font-semibold uppercase tracking-widest transition ${
                    reportStatusTab === s
                      ? 'border-white/30 bg-white/10 text-stone-100'
                      : 'border-white/10 text-stone-500 hover:border-white/20 hover:text-stone-300'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            {reportsError && (
              <p className="mb-4 rounded-xl border border-rose-500/30 bg-rose-900/30 px-4 py-2 text-sm text-rose-300">
                {reportsError}
              </p>
            )}

            {reportsLoading ? (
              <div className="flex justify-center py-16">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
              </div>
            ) : reports.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-white/10 p-10 text-center text-sm text-stone-500">
                No {reportStatusTab} reports.
              </div>
            ) : (
              <div className="space-y-4">
                {reports.map((report) => (
                  <div
                    key={report.id}
                    className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur"
                  >
                    <div className="flex items-start justify-between gap-4">
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
                      <span className="shrink-0 rounded-full border border-rose-500/25 bg-rose-500/10 px-2.5 py-1 text-xs text-rose-300">
                        {REASON_LABELS[report.reason] ?? report.reason}
                      </span>
                    </div>

                    {report.details && (
                      <p className="mt-3 rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2 text-xs leading-6 text-stone-400">
                        {report.details}
                      </p>
                    )}

                    {reportStatusTab === 'pending' && (
                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <span className="mr-2 text-xs text-stone-500">Report:</span>
                        <button type="button" disabled={actioningId === report.id} onClick={() => void handleReportAction(report.id, 'reviewed')} className="rounded-lg border border-white/15 px-3 py-1 text-xs text-stone-300 transition hover:border-white/25 hover:text-stone-100 disabled:cursor-wait disabled:opacity-50">Mark reviewed</button>
                        <button type="button" disabled={actioningId === report.id} onClick={() => void handleReportAction(report.id, 'dismissed')} className="rounded-lg border border-white/15 px-3 py-1 text-xs text-stone-400 transition hover:border-white/20 hover:text-stone-200 disabled:cursor-wait disabled:opacity-50">Dismiss</button>
                        <button type="button" disabled={actioningId === report.id} onClick={() => void handleReportAction(report.id, 'actioned')} className="rounded-lg border border-rose-500/30 px-3 py-1 text-xs text-rose-300 transition hover:border-rose-400/40 hover:text-rose-200 disabled:cursor-wait disabled:opacity-50">Action taken</button>

                        <span className="ml-2 mr-1 text-xs text-stone-500">User:</span>
                        {report.reported.accountStatus === 'active' ? (
                          <button type="button" disabled={userActioningId === report.reported.id} onClick={() => void handleUserAction(report.reported.id, 'suspend')} className="rounded-lg border border-amber-500/30 px-3 py-1 text-xs text-amber-300 transition hover:border-amber-400/40 hover:text-amber-200 disabled:cursor-wait disabled:opacity-50">Suspend</button>
                        ) : report.reported.accountStatus === 'suspended' ? (
                          <button type="button" disabled={userActioningId === report.reported.id} onClick={() => void handleUserAction(report.reported.id, 'unsuspend')} className="rounded-lg border border-emerald-500/30 px-3 py-1 text-xs text-emerald-300 transition hover:border-emerald-400/40 hover:text-emerald-200 disabled:cursor-wait disabled:opacity-50">Unsuspend</button>
                        ) : null}
                        <button type="button" disabled={userActioningId === report.reported.id} onClick={() => void handleUserAction(report.reported.id, report.reported.isVerified ? 'unverify' : 'verify')} className="rounded-lg border border-sky-500/30 px-3 py-1 text-xs text-sky-300 transition hover:border-sky-400/40 hover:text-sky-200 disabled:cursor-wait disabled:opacity-50">{report.reported.isVerified ? 'Remove ✓' : 'Verify ✓'}</button>
                        <button type="button" disabled={userActioningId === report.reported.id} onClick={() => void handleUserAction(report.reported.id, 'delete')} className="rounded-lg border border-rose-700/40 px-3 py-1 text-xs text-rose-400 transition hover:border-rose-600/50 hover:text-rose-300 disabled:cursor-wait disabled:opacity-50">Delete user</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── GROUPS panel ───────────────────────────────────────────────── */}
        {mainTab === 'groups' && (
          <>
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <div className="flex gap-2">
                {(['active', 'closed', 'deleted'] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => { setGroupStatusFilter(s); setGroups([]); void loadGroups(s, groupSearch) }}
                    className={`rounded-xl border px-4 py-1.5 text-xs font-semibold uppercase tracking-widest transition ${
                      groupStatusFilter === s
                        ? 'border-white/30 bg-white/10 text-stone-100'
                        : 'border-white/10 text-stone-500 hover:border-white/20 hover:text-stone-300'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <form
                className="flex flex-1 min-w-[180px] items-center gap-2"
                onSubmit={(e) => { e.preventDefault(); void loadGroups(groupStatusFilter, groupSearch) }}
              >
                <input
                  type="search"
                  value={groupSearch}
                  onChange={(e) => setGroupSearch(e.target.value)}
                  placeholder="Search groups…"
                  className="flex-1 rounded-xl border border-white/15 bg-black/35 px-3 py-1.5 text-sm text-stone-100 outline-none placeholder:text-stone-500 focus:border-white/30"
                />
                <button type="submit" className="rounded-xl border border-white/20 bg-white/5 px-3 py-1.5 text-xs text-stone-300 transition hover:bg-white/10">Search</button>
              </form>
            </div>

            {groupsError && (
              <p className="mb-4 rounded-xl border border-rose-500/30 bg-rose-900/30 px-4 py-2 text-sm text-rose-300">{groupsError}</p>
            )}

            {groupsLoading && groups.length === 0 ? (
              <div className="flex justify-center py-16">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
              </div>
            ) : groups.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-white/10 p-10 text-center text-sm text-stone-500">
                No {groupStatusFilter} groups.
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {groups.map((group) => (
                    <div key={group.id} className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Link
                              href={`/groups/${group.slug}`}
                              className="font-semibold text-stone-100 hover:underline"
                            >
                              {group.name}
                            </Link>
                            <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-widest text-stone-400">
                              {group.category}
                            </span>
                            <span className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-widest font-medium ${
                              group.status === 'active' ? 'bg-emerald-500/15 text-emerald-400'
                              : group.status === 'closed' ? 'bg-amber-500/15 text-amber-400'
                              : 'bg-rose-500/15 text-rose-400'
                            }`}>
                              {group.status}
                            </span>
                            {!group.isPublic && (
                              <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-widest text-stone-500">private</span>
                            )}
                          </div>
                          <p className="mt-1 text-xs text-stone-500">
                            {group.memberCount} members · {group.postCount} posts
                            {group.owner && <> · Owner: @{group.owner.username}</>}
                            {' · '}Created {new Date(group.createdAt).toLocaleDateString()}
                          </p>
                        </div>

                        <div className="flex shrink-0 gap-2">
                          {group.status === 'active' && (
                            <button
                              type="button"
                              disabled={groupActioningId === group.id}
                              onClick={() => void handleGroupAction(group.id, 'close')}
                              className="rounded-lg border border-amber-500/30 px-3 py-1 text-xs text-amber-300 transition hover:border-amber-400/40 hover:text-amber-200 disabled:cursor-wait disabled:opacity-50"
                            >
                              Close
                            </button>
                          )}
                          {group.status === 'closed' && (
                            <button
                              type="button"
                              disabled={groupActioningId === group.id}
                              onClick={() => void handleGroupAction(group.id, 'reopen')}
                              className="rounded-lg border border-emerald-500/30 px-3 py-1 text-xs text-emerald-300 transition hover:border-emerald-400/40 hover:text-emerald-200 disabled:cursor-wait disabled:opacity-50"
                            >
                              Reopen
                            </button>
                          )}
                          {group.status !== 'deleted' && (
                            <button
                              type="button"
                              disabled={groupActioningId === group.id}
                              onClick={() => void handleGroupAction(group.id, 'delete')}
                              className="rounded-lg border border-rose-700/40 px-3 py-1 text-xs text-rose-400 transition hover:border-rose-600/50 hover:text-rose-300 disabled:cursor-wait disabled:opacity-50"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {groupsNextCursor && (
                  <button
                    type="button"
                    disabled={groupsLoading}
                    onClick={() => void loadGroups(groupStatusFilter, groupSearch, groupsNextCursor)}
                    className="mt-5 w-full rounded-xl border border-white/15 bg-white/5 py-2.5 text-xs font-semibold uppercase tracking-widest text-stone-300 transition hover:bg-white/10 disabled:cursor-wait disabled:opacity-50"
                  >
                    {groupsLoading ? 'Loading…' : 'Load more'}
                  </button>
                )}
              </>
            )}
          </>
        )}

        {/* ── CLASSIFIEDS panel ──────────────────────────────────────────── */}
        {mainTab === 'classifieds' && (
          <>
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <div className="flex gap-2">
                {(['active', 'deleted'] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => { setClassifiedStatusFilter(s); setClassifieds([]); void loadClassifieds(s, classifiedSearch) }}
                    className={`rounded-xl border px-4 py-1.5 text-xs font-semibold uppercase tracking-widest transition ${
                      classifiedStatusFilter === s
                        ? 'border-white/30 bg-white/10 text-stone-100'
                        : 'border-white/10 text-stone-500 hover:border-white/20 hover:text-stone-300'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <form
                className="flex flex-1 min-w-[180px] items-center gap-2"
                onSubmit={(e) => { e.preventDefault(); void loadClassifieds(classifiedStatusFilter, classifiedSearch) }}
              >
                <input
                  type="search"
                  value={classifiedSearch}
                  onChange={(e) => setClassifiedSearch(e.target.value)}
                  placeholder="Search classifieds…"
                  className="flex-1 rounded-xl border border-white/15 bg-black/35 px-3 py-1.5 text-sm text-stone-100 outline-none placeholder:text-stone-500 focus:border-white/30"
                />
                <button type="submit" className="rounded-xl border border-white/20 bg-white/5 px-3 py-1.5 text-xs text-stone-300 transition hover:bg-white/10">Search</button>
              </form>
            </div>

            {classifiedsError && (
              <p className="mb-4 rounded-xl border border-rose-500/30 bg-rose-900/30 px-4 py-2 text-sm text-rose-300">{classifiedsError}</p>
            )}

            {classifiedsLoading && classifieds.length === 0 ? (
              <div className="flex justify-center py-16">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
              </div>
            ) : classifieds.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-white/10 p-10 text-center text-sm text-stone-500">
                No {classifiedStatusFilter} classifieds.
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {classifieds.map((ad) => (
                    <div key={ad.id} className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Link
                              href={`/classifieds/${ad.id}`}
                              className="font-semibold text-stone-100 hover:underline"
                            >
                              {ad.title}
                            </Link>
                            <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-widest text-stone-400">
                              {ad.category}
                            </span>
                            <span className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-widest font-medium ${
                              ad.status === 'active' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'
                            }`}>
                              {ad.status}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-stone-500 line-clamp-1">{ad.description}</p>
                          <p className="mt-1 text-xs text-stone-500">
                            By @{ad.author.username}
                            {ad.location && <> · {ad.location}</>}
                            {' · '}Posted {new Date(ad.createdAt).toLocaleDateString()}
                            {' · '}Expires {new Date(ad.expiresAt).toLocaleDateString()}
                          </p>
                        </div>

                        <div className="flex shrink-0 gap-2">
                          {ad.status === 'active' ? (
                            <button
                              type="button"
                              disabled={classifiedActioningId === ad.id}
                              onClick={() => void handleClassifiedAction(ad.id, 'remove')}
                              className="rounded-lg border border-rose-700/40 px-3 py-1 text-xs text-rose-400 transition hover:border-rose-600/50 hover:text-rose-300 disabled:cursor-wait disabled:opacity-50"
                            >
                              Remove
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={classifiedActioningId === ad.id}
                              onClick={() => void handleClassifiedAction(ad.id, 'restore')}
                              className="rounded-lg border border-emerald-500/30 px-3 py-1 text-xs text-emerald-300 transition hover:border-emerald-400/40 hover:text-emerald-200 disabled:cursor-wait disabled:opacity-50"
                            >
                              Restore
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {classifiedsNextCursor && (
                  <button
                    type="button"
                    disabled={classifiedsLoading}
                    onClick={() => void loadClassifieds(classifiedStatusFilter, classifiedSearch, classifiedsNextCursor)}
                    className="mt-5 w-full rounded-xl border border-white/15 bg-white/5 py-2.5 text-xs font-semibold uppercase tracking-widest text-stone-300 transition hover:bg-white/10 disabled:cursor-wait disabled:opacity-50"
                  >
                    {classifiedsLoading ? 'Loading…' : 'Load more'}
                  </button>
                )}
              </>
            )}
          </>
        )}
      </main>
    </div>
  )
}
