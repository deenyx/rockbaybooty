'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'

import { MEMBER_MENU_ITEMS } from '@/lib/constants'

type TopQuickNavProps = {
  className?: string
}

function getActiveLabel(pathname: string): string {
  const match = MEMBER_MENU_ITEMS.find((item) => {
    return pathname === item.href || pathname.startsWith(`${item.href}/`)
  })
  return match?.label ?? MEMBER_MENU_ITEMS[0].label
}

export default function TopQuickNav({ className = '' }: TopQuickNavProps) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const activeLabel = getActiveLabel(pathname)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  return (
    <div ref={ref} className={`fixed top-3 z-40 ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Open navigation menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-2xl border border-white/15 bg-[#0f121a]/90 px-3 py-2 shadow-[0_8px_24px_rgba(0,0,0,0.4)] backdrop-blur-xl transition hover:border-white/25 hover:bg-[#0f121a]"
      >
        {/* hamburger */}
        <span className="flex h-4 w-4 flex-col justify-between">
          <span className={`block h-px w-full bg-stone-400 transition-all ${open ? 'translate-y-[7px] rotate-45' : ''}`} />
          <span className={`block h-px w-full bg-stone-400 transition-all ${open ? 'opacity-0' : ''}`} />
          <span className={`block h-px w-full bg-stone-400 transition-all ${open ? '-translate-y-[7px] -rotate-45' : ''}`} />
        </span>
        <span className="text-xs font-medium text-stone-300">{activeLabel}</span>
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-2 w-44 overflow-hidden rounded-2xl border border-white/15 bg-[#0f121a]/95 py-1 shadow-[0_18px_40px_rgba(0,0,0,0.55)] backdrop-blur-xl">
          {MEMBER_MENU_ITEMS.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`block px-4 py-2.5 text-sm transition ${
                  active
                    ? 'bg-white/[0.07] text-stone-100'
                    : 'text-stone-400 hover:bg-white/[0.04] hover:text-stone-100'
                }`}
              >
                {item.label}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
