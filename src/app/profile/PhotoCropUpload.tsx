import React, { useRef, useState } from 'react'

interface PhotoCropUploadProps {
  onUpload: (files: FileList) => void
  disabled?: boolean
}

export default function PhotoCropUpload({ onUpload, disabled }: PhotoCropUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setPreviewUrl(URL.createObjectURL(file))
    }
  }

  function handleCropAndUpload() {
    // For MVP, just upload the selected file (cropping can be added with a library like react-easy-crop)
    if (selectedFile) {
      const dt = new DataTransfer()
      dt.items.add(selectedFile)
      onUpload(dt.files)
      setSelectedFile(null)
      setPreviewUrl(null)
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        className="rounded-xl border border-white/20 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-stone-100 transition hover:border-white/35 hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-50"
        onClick={() => inputRef.current?.click()}
        disabled={disabled}
      >
        Upload & Crop Photo
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
        disabled={disabled}
      />
      {previewUrl && (
        <div className="mt-2 flex flex-col gap-2">
          <img src={previewUrl} alt="Preview" className="max-h-48 rounded-xl border border-white/20" />
          <button
            type="button"
            className="rounded-xl border border-amber-400/40 bg-amber-300/20 px-4 py-2 text-sm font-semibold text-amber-100 transition hover:border-amber-100/70 hover:bg-amber-200/30"
            onClick={handleCropAndUpload}
          >
            Save Photo
          </button>
        </div>
      )}
      <span className="text-xs text-stone-400">JPG, PNG, GIF. Up to 5MB each.</span>
    </div>
  )
}
