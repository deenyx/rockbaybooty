/** Returns true if lastActiveAt is within the last 5 minutes */
export function isOnline(lastActiveAt: string | null | undefined): boolean {
  if (!lastActiveAt) return false
  return Date.now() - new Date(lastActiveAt).getTime() < 5 * 60 * 1000
}

/**
 * Small green/gray dot indicator.
 * size: 'sm' (default) = 8px, 'md' = 10px
 */
export default function OnlineDot({
  lastActiveAt,
  size = 'sm',
  className = '',
}: {
  lastActiveAt: string | null | undefined
  size?: 'sm' | 'md'
  className?: string
}) {
  const online = isOnline(lastActiveAt)
  const dim = size === 'md' ? 'h-2.5 w-2.5' : 'h-2 w-2'
  return (
    <span
      aria-label={online ? 'Online' : 'Offline'}
      title={online ? 'Online' : 'Offline'}
      className={`inline-block rounded-full border-2 border-[#090b10] ${dim} ${
        online ? 'bg-emerald-400' : 'bg-stone-600'
      } ${className}`}
    />
  )
}
