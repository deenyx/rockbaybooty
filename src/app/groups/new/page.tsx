'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import TopQuickNav from '@/app/_components/top-quick-nav'
import { GROUP_CATEGORIES, ROUTES } from '@/lib/constants'

export default function NewGroupPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('general')
  const [isPublic, setIsPublic] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmedName = name.trim()
    if (!trimmedName) {
      setError('Group name is required')
      return
    }

    try {
      setIsSubmitting(true)
      setError('')
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trimmedName,
          description: description.trim() || undefined,
          category,
          isPublic,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Failed to create group')
      router.push(`/groups/${data.group.slug}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error creating group')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#090b10] text-stone-100">
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20"
        style={{ backgroundImage: "url('/welcome2.jpg')" }}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#090b10]/60 to-[#090b10]/95" />

      <TopQuickNav className="left-4 right-4 md:left-6 md:right-6" />

      <main className="relative z-10 mx-auto max-w-lg px-4 pb-16 pt-20 sm:px-6">
        <Link
          href={ROUTES.GROUPS}
          className="inline-flex items-center gap-1 text-xs text-stone-400 hover:text-stone-200"
        >
          ← Groups
        </Link>

        <h1 className="mt-5 font-[family:var(--font-display)] text-4xl text-stone-100">
          Create a group
        </h1>
        <p className="mt-2 text-sm text-stone-400">
          Start a community around a shared interest.
        </p>

        <form onSubmit={(e) => void handleSubmit(e)} className="mt-8 space-y-5">
          {/* Name */}
          <div>
            <label className="block text-xs uppercase tracking-widest text-stone-400" htmlFor="group-name">
              Name <span className="text-rose-400">*</span>
            </label>
            <input
              id="group-name"
              type="text"
              maxLength={80}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Crossdressers of Rock Bay"
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-stone-100 placeholder:text-stone-500 focus:border-white/25 focus:outline-none"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs uppercase tracking-widest text-stone-400" htmlFor="group-desc">
              Description
            </label>
            <textarea
              id="group-desc"
              rows={3}
              maxLength={500}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this group about?"
              className="mt-2 w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-stone-100 placeholder:text-stone-500 focus:border-white/25 focus:outline-none"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs uppercase tracking-widest text-stone-400" htmlFor="group-category">
              Category
            </label>
            <select
              id="group-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-[#0f121a] px-4 py-3 text-sm text-stone-100 focus:border-white/25 focus:outline-none"
            >
              {GROUP_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Visibility */}
          <div>
            <span className="block text-xs uppercase tracking-widest text-stone-400">
              Visibility
            </span>
            <div className="mt-2 flex gap-3">
              {[
                { val: true, label: 'Public', desc: 'Anyone can find and join' },
                { val: false, label: 'Private', desc: 'Invite only (coming soon)' },
              ].map(({ val, label, desc }) => (
                <button
                  key={String(val)}
                  type="button"
                  disabled={!val} // private groups not fully implemented yet
                  onClick={() => setIsPublic(val)}
                  className={`flex-1 rounded-2xl border p-3 text-left transition ${
                    isPublic === val
                      ? 'border-white/30 bg-white/[0.08]'
                      : 'border-white/10 hover:border-white/20'
                  } ${!val ? 'cursor-not-allowed opacity-40' : ''}`}
                >
                  <p className="text-sm font-semibold text-stone-100">{label}</p>
                  <p className="text-xs text-stone-400">{desc}</p>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="rounded-xl border border-rose-500/25 bg-rose-950/50 px-4 py-2 text-sm text-rose-300">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-2xl border border-white/20 bg-white/[0.06] py-3 text-sm font-semibold text-stone-100 transition hover:border-white/35 hover:bg-white/10 disabled:cursor-wait disabled:opacity-50"
          >
            {isSubmitting ? 'Creating…' : 'Create group'}
          </button>
        </form>
      </main>
    </div>
  )
}
