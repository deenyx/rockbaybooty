'use client'

import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'

import { CLASSIFIED_CATEGORIES, CLASSIFIEDS_MAX_PHOTOS, ROUTES } from '@/lib/constants'

const MAX_PHOTO_BYTES = 5 * 1024 * 1024

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function NewClassifiedForm() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [location, setLocation] = useState('')
  const [photos, setPhotos] = useState<string[]>([])
  const [error, setError] = useState('')
  const [status, setStatus] = useState<'idle' | 'submitting'>('idle')

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return

    const remaining = CLASSIFIEDS_MAX_PHOTOS - photos.length
    const toProcess = files.slice(0, remaining)

    const results: string[] = []
    for (const file of toProcess) {
      if (file.size > MAX_PHOTO_BYTES) {
        setError(`"${file.name}" exceeds the 5 MB limit`)
        continue
      }
      const b64 = await fileToBase64(file)
      results.push(b64)
    }

    setPhotos((prev) => [...prev, ...results])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!title.trim()) { setError('Title is required'); return }
    if (!description.trim()) { setError('Description is required'); return }
    if (!category) { setError('Please select a category'); return }

    setStatus('submitting')

    try {
      const res = await fetch('/api/classifieds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ title: title.trim(), description: description.trim(), category, location: location.trim() || null, photos }),
      })

      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error((json as { error?: string }).error || 'Failed to post listing')
      }

      router.push(ROUTES.CLASSIFIEDS)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setStatus('idle')
    }
  }

  const inputCls = 'w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-stone-100 outline-none placeholder:text-stone-500 focus:border-sky-400/50 focus:ring-1 focus:ring-sky-400/20 transition'
  const labelCls = 'mb-1.5 block text-xs font-semibold uppercase tracking-widest text-stone-400'

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Title */}
      <div>
        <label className={labelCls} htmlFor="cl-title">Title</label>
        <input
          id="cl-title"
          type="text"
          maxLength={120}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Short, descriptive headline…"
          className={inputCls}
        />
        <p className="mt-1 text-right text-[10px] text-stone-600">{title.length}/120</p>
      </div>

      {/* Category */}
      <div>
        <label className={labelCls} htmlFor="cl-cat">Category</label>
        <select
          id="cl-cat"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className={`${inputCls} appearance-none`}
        >
          <option value="" disabled>Select a category…</option>
          {CLASSIFIED_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>

      {/* Location */}
      <div>
        <label className={labelCls} htmlFor="cl-loc">Location <span className="normal-case font-normal text-stone-600">(optional)</span></label>
        <input
          id="cl-loc"
          type="text"
          maxLength={100}
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="City, area, or 'Online'…"
          className={inputCls}
        />
      </div>

      {/* Description */}
      <div>
        <label className={labelCls} htmlFor="cl-desc">Description</label>
        <textarea
          id="cl-desc"
          rows={6}
          maxLength={4000}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Tell members what you're looking for…"
          className={`${inputCls} resize-none`}
        />
        <p className="mt-1 text-right text-[10px] text-stone-600">{description.length}/4000</p>
      </div>

      {/* Photos */}
      <div>
        <label className={labelCls}>Photos <span className="normal-case font-normal text-stone-600">(up to {CLASSIFIEDS_MAX_PHOTOS}, 5 MB each)</span></label>

        <div className="flex flex-wrap gap-3">
          {photos.map((src, i) => (
            <div key={i} className="relative h-24 w-24 overflow-hidden rounded-xl border border-white/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => removePhoto(i)}
                className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-[10px] text-white hover:bg-black/90"
                aria-label="Remove photo"
              >
                ✕
              </button>
            </div>
          ))}

          {photos.length < CLASSIFIEDS_MAX_PHOTOS && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex h-24 w-24 items-center justify-center rounded-xl border border-dashed border-white/15 text-2xl text-stone-600 transition hover:border-white/30 hover:text-stone-400"
            >
              +
            </button>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* Error */}
      {error && (
        <p className="rounded-xl border border-rose-500/30 bg-rose-950/40 px-3 py-2 text-sm text-rose-300">
          {error}
        </p>
      )}

      {/* Submit */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={() => router.push(ROUTES.CLASSIFIEDS)}
          className="flex-1 rounded-full border border-white/10 bg-white/5 py-2.5 text-sm text-stone-400 transition hover:bg-white/10"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={status === 'submitting'}
          className="flex-1 rounded-full border border-rose-500/30 bg-gradient-to-r from-rose-600/90 to-pink-700/90 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
        >
          {status === 'submitting' ? 'Posting…' : 'Post listing'}
        </button>
      </div>
    </form>
  )
}
