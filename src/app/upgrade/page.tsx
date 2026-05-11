"use client"

import Link from 'next/link'
import { FormEvent, useEffect, useState } from 'react'

import TopQuickNav from '@/app/_components/top-quick-nav'
import { ROUTES } from '@/lib/constants'

type MembershipStatus = {
  isPremium: boolean
  isVerified: boolean
  verificationStatus?: 'none' | 'pending' | 'approved' | 'rejected'
  memberSince: string
  totalVideos: number
  publicVideos: number
  totalViews: number
}

type PaymentPlan = 'monthly' | 'yearly'

const PLANS: Array<{ id: PaymentPlan; name: string; price: string; blurb: string }> = [
  {
    id: 'monthly',
    name: 'Premium Monthly',
    price: '$19.00 / month',
    blurb: 'Perfect for trying premium features now.',
  },
  {
    id: 'yearly',
    name: 'Premium Yearly',
    price: '$179.00 / year',
    blurb: 'Best value for long-term members.',
  },
]

async function uploadImageToCloudinary(file: File): Promise<string> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET

  if (!cloudName || !uploadPreset) {
    throw new Error('Image upload is unavailable right now. Configure Cloudinary first.')
  }

  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', uploadPreset)

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    throw new Error('Failed to upload image. Please try another file.')
  }

  const payload = await response.json()
  if (!payload?.secure_url || typeof payload.secure_url !== 'string') {
    throw new Error('Upload completed, but no usable image URL was returned.')
  }

  return payload.secure_url
}

export default function UpgradePage() {
  const [status, setStatus] = useState<MembershipStatus | null>(null)
  const [loadError, setLoadError] = useState('')
  const [isLoadingStatus, setIsLoadingStatus] = useState(true)

  const [selectedPlan, setSelectedPlan] = useState<PaymentPlan>('monthly')
  const [cardholderName, setCardholderName] = useState('')
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false)
  const [paymentMessage, setPaymentMessage] = useState('')

  const [idFile, setIdFile] = useState<File | null>(null)
  const [idPreviewUrl, setIdPreviewUrl] = useState('')
  const [isSubmittingId, setIsSubmittingId] = useState(false)
  const [idMessage, setIdMessage] = useState('')

  useEffect(() => {
    let mounted = true

    async function loadStatus() {
      try {
        const response = await fetch('/api/member/membership', { method: 'GET' })
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Unable to load membership status.')
        }

        if (mounted) {
          setStatus(data)
          setLoadError('')
        }
      } catch (error) {
        if (mounted) {
          setLoadError(error instanceof Error ? error.message : 'Unable to load membership status.')
        }
      } finally {
        if (mounted) {
          setIsLoadingStatus(false)
        }
      }
    }

    void loadStatus()

    return () => {
      mounted = false
    }
  }, [])

  async function handleSubmitIdVerification(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!idFile) {
      setIdMessage('Select a photo ID image before submitting.')
      return
    }

    setIsSubmittingId(true)
    setIdMessage('')

    try {
      const imageUrl = await uploadImageToCloudinary(idFile)

      const response = await fetch('/api/member/verification/photo-id', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Unable to submit ID verification.')
      }

      setIdMessage(data.message || 'ID verification submitted.')
      setStatus((previous) =>
        previous
          ? {
              ...previous,
              verificationStatus: 'pending',
            }
          : previous
      )
    } catch (error) {
      setIdMessage(error instanceof Error ? error.message : 'Unable to submit ID verification.')
    } finally {
      setIsSubmittingId(false)
    }
  }

  async function handleSubmitPayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!cardholderName.trim()) {
      setPaymentMessage('Cardholder name is required.')
      return
    }

    setIsSubmittingPayment(true)
    setPaymentMessage('')

    try {
      const response = await fetch('/api/member/membership/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: selectedPlan,
          cardholderName: cardholderName.trim(),
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Payment could not be completed.')
      }

      if (data.url) {
        window.location.href = data.url
        return
      }

      setPaymentMessage(data.message || 'Redirecting to secure checkout.')
    } catch (error) {
      setPaymentMessage(error instanceof Error ? error.message : 'Payment could not be completed.')
    } finally {
      setIsSubmittingPayment(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#090b10] px-4 pb-8 pt-24 text-stone-100 sm:px-6 lg:px-8">
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30"
        style={{ backgroundImage: "url('/welcome2.jpg')" }}
      />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(8,11,18,0.7)_0%,rgba(6,8,12,0.84)_100%)]" />

      <TopQuickNav className="left-4 right-4 md:left-6 md:right-6" />

      <main className="relative z-10 mx-auto max-w-5xl space-y-6">
        <section className="rounded-3xl border border-white/10 bg-black/30 p-6 backdrop-blur-xl sm:p-8">
          <p className="text-xs uppercase tracking-[0.24em] text-stone-300/80">Upgrade</p>
          <h1 className="mt-3 font-[family:var(--font-display)] text-4xl text-stone-100 sm:text-5xl">Member Tier & Billing</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-stone-300 sm:text-base">
            Verify your identity, select a payment plan, and upgrade your account to premium.
          </p>

          {isLoadingStatus ? (
            <p className="mt-4 text-sm text-stone-300">Loading account status...</p>
          ) : loadError ? (
            <p className="mt-4 rounded-xl border border-rose-400/35 bg-rose-500/20 p-3 text-sm text-rose-100">{loadError}</p>
          ) : status ? (
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <p className="text-[10px] uppercase tracking-[0.16em] text-stone-400">Account Tier</p>
                <p className="mt-1 text-lg font-semibold text-stone-100">{status.isPremium ? 'Premium' : 'Standard'}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <p className="text-[10px] uppercase tracking-[0.16em] text-stone-400">ID Verification</p>
                <p className="mt-1 text-lg font-semibold text-stone-100">
                  {status.verificationStatus === 'pending'
                    ? 'Pending review'
                    : status.verificationStatus === 'approved' || status.isVerified
                      ? 'Verified'
                      : status.verificationStatus === 'rejected'
                        ? 'Rejected'
                        : 'Not verified'}
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <p className="text-[10px] uppercase tracking-[0.16em] text-stone-400">Member Since</p>
                <p className="mt-1 text-lg font-semibold text-stone-100">{new Date(status.memberSince).toLocaleDateString()}</p>
              </div>
            </div>
          ) : null}
        </section>

        <section className="rounded-3xl border border-white/10 bg-black/30 p-6 backdrop-blur-xl">
          <p className="text-xs uppercase tracking-[0.16em] text-stone-400">Step 1</p>
          <h2 className="mt-2 text-2xl font-semibold text-stone-100">Photo ID verification</h2>
          <p className="mt-2 text-sm text-stone-300">
            Upload a clear image of your photo ID to activate verification.
          </p>

          <form onSubmit={handleSubmitIdVerification} className="mt-4 space-y-4">
            <input
              type="file"
              accept="image/*"
              onChange={(event) => {
                const selectedFile = event.target.files?.[0] || null
                setIdFile(selectedFile)
                setIdMessage('')
                if (selectedFile) {
                  setIdPreviewUrl(URL.createObjectURL(selectedFile))
                } else {
                  setIdPreviewUrl('')
                }
              }}
              className="block w-full rounded-xl border border-white/15 bg-white/[0.04] p-2 text-sm text-stone-200"
            />

            {idPreviewUrl && (
              <img src={idPreviewUrl} alt="ID preview" className="h-40 rounded-xl border border-white/10 object-cover" />
            )}

            {idMessage && (
              <p className="rounded-xl border border-sky-300/30 bg-sky-400/10 px-3 py-2 text-sm text-sky-100">
                {idMessage}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmittingId}
              className="rounded-xl border border-white/20 bg-white/[0.08] px-4 py-2 text-sm font-semibold text-stone-100 transition hover:border-white/35 hover:bg-white/[0.12] disabled:opacity-60"
            >
              {isSubmittingId ? 'Submitting ID...' : 'Submit ID verification'}
            </button>
          </form>
        </section>

        <section className="rounded-3xl border border-white/10 bg-black/30 p-6 backdrop-blur-xl">
          <p className="text-xs uppercase tracking-[0.16em] text-stone-400">Step 2</p>
          <h2 className="mt-2 text-2xl font-semibold text-stone-100">Make payment</h2>
          <p className="mt-2 text-sm text-stone-300">
            Choose your plan and complete payment to activate premium access.
          </p>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {PLANS.map((plan) => (
              <button
                key={plan.id}
                type="button"
                onClick={() => setSelectedPlan(plan.id)}
                className={`rounded-2xl border px-4 py-4 text-left transition ${
                  selectedPlan === plan.id
                    ? 'border-amber-300/55 bg-amber-400/10'
                    : 'border-white/10 bg-white/[0.03] hover:border-white/25'
                }`}
              >
                <p className="text-xs uppercase tracking-[0.16em] text-stone-400">{plan.name}</p>
                <p className="mt-2 text-2xl font-semibold text-stone-100">{plan.price}</p>
                <p className="mt-2 text-sm text-stone-300">{plan.blurb}</p>
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmitPayment} className="mt-4 space-y-4">
            <label className="block space-y-1">
              <span className="text-xs uppercase tracking-[0.16em] text-stone-400">Cardholder Name</span>
              <input
                type="text"
                value={cardholderName}
                onChange={(event) => {
                  setCardholderName(event.target.value)
                  setPaymentMessage('')
                }}
                placeholder="Name on card"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-stone-100 outline-none placeholder:text-stone-500 focus:border-amber-300/50"
              />
            </label>

            {paymentMessage && (
              <p className="rounded-xl border border-amber-300/35 bg-amber-400/12 px-3 py-2 text-sm text-amber-100">
                {paymentMessage}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmittingPayment}
              className="rounded-xl border border-amber-300/30 bg-amber-400/10 px-4 py-2 text-sm font-semibold text-amber-100 transition hover:border-amber-200/60 hover:bg-amber-300/15 disabled:opacity-60"
            >
              {isSubmittingPayment ? 'Processing payment...' : 'Pay and upgrade'}
            </button>
          </form>
        </section>

        <div className="flex flex-wrap gap-3">
          <Link href={ROUTES.DASHBOARD} className="rounded-xl border border-white/20 px-4 py-2 text-sm text-stone-200 transition hover:border-white/35 hover:bg-white/[0.04]">
            Back to dashboard
          </Link>
          <Link href={ROUTES.MEMBERSHIP} className="rounded-xl border border-white/20 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-stone-100 transition hover:border-white/35 hover:bg-white/[0.1]">
            View membership details
          </Link>
        </div>
      </main>
    </div>
  )
}
