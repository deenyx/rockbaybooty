"use client"

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

import TopQuickNav from '@/app/_components/top-quick-nav'
import { ROUTES } from '@/lib/constants'

function UpgradeSuccessContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id') || ''
  const [message, setMessage] = useState('Verifying your payment...')
  const [isPremium, setIsPremium] = useState(false)

  useEffect(() => {
    let mounted = true

    async function finalize() {
      if (!sessionId) {
        setMessage('Missing payment session. Please contact support.')
        return
      }

      try {
        const response = await fetch('/api/member/membership/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        })

        const data = await response.json()
        if (!response.ok) {
          throw new Error(data.error || 'Unable to verify payment.')
        }

        if (mounted) {
          setMessage(data.message || 'Payment verified.')
          setIsPremium(Boolean(data.isPremium))
        }
      } catch (error) {
        if (mounted) {
          setMessage(error instanceof Error ? error.message : 'Unable to verify payment.')
        }
      }
    }

    void finalize()

    return () => {
      mounted = false
    }
  }, [sessionId])

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#090b10] px-4 pb-8 pt-24 text-stone-100 sm:px-6 lg:px-8">
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30"
        style={{ backgroundImage: "url('/welcome2.jpg')" }}
      />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(8,11,18,0.7)_0%,rgba(6,8,12,0.84)_100%)]" />

      <TopQuickNav className="left-4 right-4 md:left-6 md:right-6" />

      <main className="relative z-10 mx-auto max-w-3xl space-y-6 rounded-3xl border border-white/10 bg-black/30 p-6 backdrop-blur-xl sm:p-8">
        <p className="text-xs uppercase tracking-[0.24em] text-stone-300/80">Upgrade complete</p>
        <h1 className="font-[family:var(--font-display)] text-4xl text-stone-100">Payment status</h1>
        <p className="text-sm leading-7 text-stone-300">{message}</p>
        {isPremium && (
          <p className="rounded-xl border border-emerald-300/35 bg-emerald-400/12 px-4 py-3 text-sm text-emerald-100">
            Premium is active on your account.
          </p>
        )}

        <div className="flex flex-wrap gap-3">
          <Link href={ROUTES.DASHBOARD} className="rounded-xl border border-white/20 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-stone-100 transition hover:border-white/35 hover:bg-white/[0.1]">
            Back to dashboard
          </Link>
          <Link href={ROUTES.MEMBERSHIP} className="rounded-xl border border-white/20 px-4 py-2 text-sm text-stone-200 transition hover:border-white/35 hover:bg-white/[0.04]">
            View membership
          </Link>
        </div>
      </main>
    </div>
  )
}

export default function UpgradeSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#090b10]" />}>
      <UpgradeSuccessContent />
    </Suspense>
  )
}
