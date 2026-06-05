'use client'

import { useMemo, useState } from 'react'

type AdminMemberRow = {
  id: string
  username: string
  displayName: string
  role: 'SUPREME_ADMIN' | 'ADMIN' | 'MODEL_VERIFIED' | 'MEMBER' | 'BURNER'
  status: 'active' | 'suspended' | 'deleted'
  emailVerified: boolean
  createdAt: string
  lastSeenLabel: string
  messagesSent: number
  videosPosted: number
}

type MemberControlTableProps = {
  initialMembers: AdminMemberRow[]
  actorRole: 'SUPREME_ADMIN' | 'ADMIN'
}

type PendingMap = Record<string, boolean>

export default function MemberControlTable({ initialMembers, actorRole }: MemberControlTableProps) {
  const [members, setMembers] = useState(initialMembers)
  const [pending, setPending] = useState<PendingMap>({})
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const canManageMember = useMemo(() => {
    return (targetRole: AdminMemberRow['role']) => {
      if (actorRole === 'SUPREME_ADMIN') {
        return true
      }

      return targetRole !== 'SUPREME_ADMIN'
    }
  }, [actorRole])

  async function toggleStatus(member: AdminMemberRow) {
    if (!canManageMember(member.role) || member.status === 'deleted') {
      return
    }

    const nextStatus = member.status === 'active' ? 'suspended' : 'active'
    setPending((current) => ({ ...current, [member.id]: true }))
    setErrorMessage(null)

    try {
      const response = await fetch(`/api/admin/members/${encodeURIComponent(member.id)}/status`, {
        method: 'PATCH',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({ status: nextStatus }),
      })

      const payload = (await response.json().catch(() => null)) as { error?: string } | null

      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to update member status')
      }

      setMembers((current) =>
        current.map((item) => (item.id === member.id ? { ...item, status: nextStatus } : item))
      )
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to update member status')
    } finally {
      setPending((current) => ({ ...current, [member.id]: false }))
    }
  }

  return (
    <section className="rounded-2xl border border-white/15 bg-black/30 p-4 shadow-xl backdrop-blur">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-stone-200">Member Controls</h2>
        <span className="text-xs text-stone-400">{members.length} shown</span>
      </div>

      {errorMessage ? (
        <p className="mb-3 rounded-lg border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
          {errorMessage}
        </p>
      ) : null}

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 text-[11px] uppercase tracking-[0.14em] text-stone-400">
              <th className="px-2 py-2">Member</th>
              <th className="px-2 py-2">Role</th>
              <th className="px-2 py-2">Status</th>
              <th className="px-2 py-2">Signals</th>
              <th className="px-2 py-2">Joined</th>
              <th className="px-2 py-2">Last Seen</th>
              <th className="px-2 py-2 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {members.map((member) => {
              const locked = !canManageMember(member.role) || member.status === 'deleted'
              const isPending = Boolean(pending[member.id])

              return (
                <tr key={member.id} className="border-b border-white/5 text-stone-200">
                  <td className="px-2 py-3 align-top">
                    <p className="font-medium text-stone-100">{member.displayName}</p>
                    <p className="text-xs text-stone-400">@{member.username}</p>
                  </td>
                  <td className="px-2 py-3 align-top text-xs">{member.role}</td>
                  <td className="px-2 py-3 align-top">
                    <span
                      className={
                        member.status === 'active'
                          ? 'rounded-full border border-emerald-400/40 bg-emerald-500/10 px-2 py-1 text-[11px] text-emerald-200'
                          : member.status === 'suspended'
                            ? 'rounded-full border border-amber-400/40 bg-amber-500/10 px-2 py-1 text-[11px] text-amber-200'
                            : 'rounded-full border border-rose-400/40 bg-rose-500/10 px-2 py-1 text-[11px] text-rose-200'
                      }
                    >
                      {member.status}
                    </span>
                  </td>
                  <td className="px-2 py-3 align-top text-xs text-stone-300">
                    <p>Verified: {member.emailVerified ? 'yes' : 'no'}</p>
                    <p>Msgs: {member.messagesSent}</p>
                    <p>Videos: {member.videosPosted}</p>
                  </td>
                  <td className="px-2 py-3 align-top text-xs text-stone-300">{member.createdAt}</td>
                  <td className="px-2 py-3 align-top text-xs text-stone-300">{member.lastSeenLabel}</td>
                  <td className="px-2 py-3 align-top text-right">
                    <button
                      type="button"
                      disabled={locked || isPending}
                      onClick={() => toggleStatus(member)}
                      className="rounded-lg border border-white/25 bg-white/5 px-3 py-1.5 text-xs uppercase tracking-[0.12em] text-stone-100 transition hover:border-white/45 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {isPending
                        ? 'Saving...'
                        : member.status === 'active'
                          ? 'Suspend'
                          : member.status === 'suspended'
                            ? 'Reactivate'
                            : 'Locked'}
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}