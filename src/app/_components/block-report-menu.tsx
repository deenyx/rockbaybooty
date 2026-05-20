'use client'

import { useState } from 'react'

type BlockReportMenuProps = {
  targetId: string
  targetName: string
}

export default function BlockReportMenu({ targetId, targetName }: BlockReportMenuProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Safety actions for ${targetName}`}
        onClick={() => setOpen((current) => !current)}
        className="rounded-lg border border-white/20 bg-white/5 px-2 py-1 text-[11px] uppercase tracking-[0.12em] text-stone-200 transition hover:border-white/35 hover:text-white"
      >
        Safety
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-2 w-44 rounded-xl border border-white/15 bg-[#0d1117] p-1.5 shadow-xl"
        >
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="block w-full rounded-lg px-2 py-2 text-left text-xs text-stone-200 transition hover:bg-white/10"
          >
            Report {targetName}
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="block w-full rounded-lg px-2 py-2 text-left text-xs text-rose-200 transition hover:bg-rose-500/20"
          >
            Block member
          </button>
          <p className="px-2 pb-1 pt-2 text-[10px] text-stone-400">ID: {targetId.slice(0, 8)}...</p>
        </div>
      )}
    </div>
  )
}
