import React from 'react'

interface ProfileGalleryProps {
  photoUrls: string[]
}

export default function ProfileGallery({ photoUrls }: ProfileGalleryProps) {
  if (!photoUrls || photoUrls.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-center text-stone-400">
        No photos uploaded yet.
      </div>
    )
  }
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
      {photoUrls.map((url, idx) => (
        <div key={idx} className="aspect-square overflow-hidden rounded-xl border border-white/10 bg-stone-900">
          <img
            src={url}
            alt={`Profile photo ${idx + 1}`}
            className="h-full w-full object-cover hover:scale-105 transition-transform duration-200"
          />
        </div>
      ))}
    </div>
  )
}
