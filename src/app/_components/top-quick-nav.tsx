'use client'

import { usePathname, useRouter } from 'next/navigation'

import { MEMBER_MENU_ITEMS } from '@/lib/constants'

type TopQuickNavProps = {
  className?: string
}

function getActiveRoute(pathname: string): string {
  const match = MEMBER_MENU_ITEMS.find((item) => {
    return pathname === item.href || pathname.startsWith(`${item.href}/`)
  })

  return match?.href ?? MEMBER_MENU_ITEMS[0].href
}

export default function TopQuickNav({ className = '' }: TopQuickNavProps) {
  const router = useRouter()
  const pathname = usePathname()
  const activeRoute = getActiveRoute(pathname)

  return (
    <div className={`fixed top-3 z-40 ${className}`}>
      <label className="sr-only" htmlFor="quick-nav-select">
        Quick navigation
      </label>
      <div className="rounded-2xl border border-white/15 bg-[#0f121a]/90 px-3 py-2 shadow-[0_18px_40px_rgba(0,0,0,0.45)] backdrop-blur-xl">
        <p className="text-[10px] uppercase tracking-[0.18em] text-stone-400">Quick nav</p>
        <select
          id="quick-nav-select"
          value={activeRoute}
          onChange={(event) => router.push(event.target.value)}
          className="mt-1 w-full rounded-xl border border-white/15 bg-black/45 px-3 py-2 text-sm text-stone-100 outline-none transition focus:border-white/35"
        >
          {MEMBER_MENU_ITEMS.map((item) => (
            <option key={item.href} value={item.href} className="bg-[#0f121a] text-stone-100">
              {item.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
