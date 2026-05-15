import React from 'react'

interface ProfilePreviewProps {
  displayName: string
  avatarUrl: string
  city: string
  state: string
  country: string
  gender: string
  sexualOrientation: string
  interests: string[]
  bio: string
}

export default function ProfilePreview({
  displayName,
  avatarUrl,
  city,
  state,
  country,
  gender,
  sexualOrientation,
  interests,
  bio,
}: ProfilePreviewProps) {
  return (
    <div className="rounded-3xl border border-white/10 bg-black/35 p-6 backdrop-blur-xl text-stone-100">
      <div className="flex items-center gap-4">
        <div className="h-20 w-20 overflow-hidden rounded-full border border-white/20 bg-stone-800">
          {avatarUrl ? (
            <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-3xl text-stone-500">?</div>
          )}
        </div>
        <div>
          <div className="text-xl font-bold">{displayName || 'Your Name'}</div>
          <div className="text-sm text-stone-400">
            {[city, state, country].filter(Boolean).join(', ')}
          </div>
          <div className="text-xs text-stone-400 mt-1">
            {gender} {sexualOrientation && `• ${sexualOrientation}`}
          </div>
        </div>
      </div>
      <div className="mt-4 text-sm text-stone-300">
        {bio || <span className="italic text-stone-500">No bio yet.</span>}
      </div>
      {interests.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {interests.map((tag) => (
            <span key={tag} className="rounded bg-white/10 px-2 py-1 text-xs text-stone-200">
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
