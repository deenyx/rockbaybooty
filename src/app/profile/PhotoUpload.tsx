import React, { useRef } from 'react'

interface PhotoUploadProps {
  onUpload: (files: FileList) => void
  disabled?: boolean
}

export default function PhotoUpload({ onUpload, disabled }: PhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        className="rounded-xl border border-white/20 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-stone-100 transition hover:border-white/35 hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-50"
        onClick={() => inputRef.current?.click()}
        disabled={disabled}
      >
        Upload Photos
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={e => {
          if (e.target.files) onUpload(e.target.files)
        }}
        disabled={disabled}
      />
      <span className="text-xs text-stone-400">JPG, PNG, GIF. Up to 5MB each.</span>
    </div>
  )
}
