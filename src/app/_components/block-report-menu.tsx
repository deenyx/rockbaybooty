'use client'

import { useEffect, useRef, useState } from 'react'

import { blockUser, reportUser } from '@/lib/api'
import { REPORT_REASON_LABELS, REPORT_REASONS } from '@/lib/constants'
import type { ReportReason } from '@/lib/types'

interface BlockReportMenuProps {
  targetId: string
  targetName: string
  isBlocked?: boolean
  onBlocked?: () => void
  onUnblocked?: () => void
  /** Render trigger. Receives onClick and aria props. Defaults to a "⋯" button. */
  trigger?: (props: { onClick: () => void; 'aria-expanded': boolean }) => React.ReactNode
}

type Step = 'menu' | 'report-reason' | 'report-details' | 'done'

export default function BlockReportMenu({
  targetId,
  targetName,
  isBlocked = false,
  onBlocked,
  onUnblocked,
  trigger,
}: BlockReportMenuProps) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<Step>('menu')
  const [selectedReason, setSelectedReason] = useState<ReportReason | ''>('')
  const [details, setDetails] = useState('')
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        handleClose()
      }
    }
    if (open) document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [open])

  function handleClose() {
    setOpen(false)
    // Reset after animation
    setTimeout(() => {
      setStep('menu')
      setSelectedReason('')
      setDetails('')
      setFeedback('')
    }, 200)
  }

  async function handleBlock() {
    setLoading(true)
    try {
      await blockUser(targetId)
      setFeedback(`${targetName} has been blocked.`)
      setStep('done')
      onBlocked?.()
    } catch {
      setFeedback('Failed to block. Please try again.')
      setStep('done')
    } finally {
      setLoading(false)
    }
  }

  async function handleUnblock() {
    setLoading(true)
    try {
      const { unblockUser } = await import('@/lib/api')
      await unblockUser(targetId)
      setFeedback(`${targetName} has been unblocked.`)
      setStep('done')
      onUnblocked?.()
    } catch {
      setFeedback('Failed to unblock. Please try again.')
      setStep('done')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmitReport() {
    if (!selectedReason) return
    setLoading(true)
    try {
      await reportUser({ targetId, reason: selectedReason, details: details || undefined })
      setFeedback('Report submitted. Thank you for helping keep the community safe.')
      setStep('done')
    } catch {
      setFeedback('Failed to submit report. Please try again.')
      setStep('done')
    } finally {
      setLoading(false)
    }
  }

  const triggerProps = {
    onClick: () => setOpen((v) => !v),
    'aria-expanded': open,
  }

  return (
    <div ref={ref} className="relative inline-block">
      {trigger ? (
        trigger(triggerProps)
      ) : (
        <button
          type="button"
          {...triggerProps}
          aria-label="More options"
          className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-stone-400 transition hover:border-white/20 hover:bg-white/10 hover:text-stone-200"
        >
          <span className="text-lg leading-none">⋯</span>
        </button>
      )}

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-white/15 bg-[#0f121a]/95 shadow-[0_18px_40px_rgba(0,0,0,0.55)] backdrop-blur-xl">
          {/* Menu step */}
          {step === 'menu' && (
            <div className="py-1">
              <p className="px-4 pb-1.5 pt-2.5 text-xs font-semibold uppercase tracking-wider text-stone-500">
                {targetName}
              </p>
              {isBlocked ? (
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleUnblock}
                  className="w-full px-4 py-2.5 text-left text-sm text-stone-300 transition hover:bg-white/[0.05] hover:text-stone-100 disabled:opacity-50"
                >
                  Unblock
                </button>
              ) : (
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleBlock}
                  className="w-full px-4 py-2.5 text-left text-sm text-stone-300 transition hover:bg-white/[0.05] hover:text-stone-100 disabled:opacity-50"
                >
                  Block
                </button>
              )}
              <div className="mx-3 my-1 h-px bg-white/10" />
              <button
                type="button"
                onClick={() => setStep('report-reason')}
                className="w-full px-4 py-2.5 text-left text-sm text-rose-400 transition hover:bg-rose-500/10 hover:text-rose-300"
              >
                Report
              </button>
            </div>
          )}

          {/* Report reason step */}
          {step === 'report-reason' && (
            <div className="py-2">
              <div className="flex items-center gap-2 px-4 pb-2 pt-1.5">
                <button
                  type="button"
                  onClick={() => setStep('menu')}
                  aria-label="Back"
                  className="text-stone-500 hover:text-stone-300"
                >
                  ←
                </button>
                <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                  Report reason
                </p>
              </div>
              {REPORT_REASONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => {
                    setSelectedReason(r)
                    setStep('report-details')
                  }}
                  className="w-full px-4 py-2.5 text-left text-sm text-stone-300 transition hover:bg-white/[0.05] hover:text-stone-100"
                >
                  {REPORT_REASON_LABELS[r]}
                </button>
              ))}
            </div>
          )}

          {/* Report details step */}
          {step === 'report-details' && (
            <div className="p-4">
              <div className="flex items-center gap-2 pb-3">
                <button
                  type="button"
                  onClick={() => setStep('report-reason')}
                  aria-label="Back"
                  className="text-stone-500 hover:text-stone-300"
                >
                  ←
                </button>
                <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                  {selectedReason ? REPORT_REASON_LABELS[selectedReason as ReportReason] : ''}
                </p>
              </div>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Optional: describe what happened (max 1000 chars)"
                maxLength={1000}
                rows={3}
                className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-stone-200 placeholder-stone-600 outline-none focus:border-white/20 focus:ring-0"
              />
              <button
                type="button"
                disabled={loading}
                onClick={handleSubmitReport}
                className="mt-3 w-full rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-500 disabled:opacity-50"
              >
                {loading ? 'Submitting…' : 'Submit Report'}
              </button>
            </div>
          )}

          {/* Done step */}
          {step === 'done' && (
            <div className="px-4 py-5 text-center">
              <p className="text-sm text-stone-300">{feedback}</p>
              <button
                type="button"
                onClick={handleClose}
                className="mt-4 rounded-xl border border-white/10 px-4 py-1.5 text-xs text-stone-400 transition hover:border-white/20 hover:text-stone-200"
              >
                Close
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
