'use client'

type OnlineDotProps = {
  lastActiveAt?: string | null
  size?: 'sm' | 'md' | 'lg'
}

const sizeClassMap: Record<NonNullable<OnlineDotProps['size']>, string> = {
  sm: 'h-2 w-2',
  md: 'h-2.5 w-2.5',
  lg: 'h-3 w-3',
}

export default function OnlineDot({ lastActiveAt, size = 'sm' }: OnlineDotProps) {
  const activeMs = lastActiveAt ? new Date(lastActiveAt).getTime() : 0
  const isOnline = Number.isFinite(activeMs) && Date.now() - activeMs <= 5 * 60 * 1000

  return (
    <span
      aria-label={isOnline ? 'Online' : 'Offline'}
      title={isOnline ? 'Online' : 'Offline'}
      className={`inline-block rounded-full ${sizeClassMap[size]} ${
        isOnline ? 'bg-emerald-400 shadow-[0_0_0_2px_rgba(16,185,129,0.25)]' : 'bg-stone-500/70'
      }`}
    />
  )
}
