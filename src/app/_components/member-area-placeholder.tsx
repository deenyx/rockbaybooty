import Link from 'next/link'

import { ROUTES } from '@/lib/constants'

type MemberAreaPlaceholderProps = {
  eyebrow: string
  title: string
  description: string
  highlights: string[]
}

export default function MemberAreaPlaceholder({
  eyebrow,
  title,
  description,
  highlights,
}: MemberAreaPlaceholderProps) {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,180,0,0.18),_transparent_34%),linear-gradient(160deg,#0b0608_18%,#1a0b10_60%,#341113_100%)] px-4 py-8 text-stone-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="rounded-3xl border border-white/10 bg-black/30 p-6 backdrop-blur-xl sm:p-8">
          <p className="text-xs uppercase tracking-[0.24em] text-amber-100/70">{eyebrow}</p>
          <h1 className="mt-3 font-[family:var(--font-display)] text-4xl text-amber-100 sm:text-5xl">
            {title}
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-stone-300 sm:text-base">
            {description}
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={ROUTES.DASHBOARD}
              className="rounded-xl border border-amber-200/35 bg-amber-300/15 px-4 py-2 text-sm font-semibold text-amber-100 transition hover:bg-amber-300/25"
            >
              Back to dashboard
            </Link>
            <Link
              href={ROUTES.LOGIN}
              className="rounded-xl border border-white/20 px-4 py-2 text-sm text-stone-200 transition hover:border-white/35 hover:text-white"
            >
              Switch account
            </Link>
          </div>
        </div>

        <section className="grid gap-4 sm:grid-cols-3">
          {highlights.map((item) => (
            <article
              key={item}
              className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur"
            >
              <p className="text-xs uppercase tracking-[0.18em] text-stone-400">Planned</p>
              <p className="mt-3 text-sm font-semibold text-stone-100">{item}</p>
            </article>
          ))}
        </section>

        <section className="rounded-3xl border border-dashed border-white/15 bg-black/20 p-6 backdrop-blur-xl sm:p-8">
          <p className="text-xs uppercase tracking-[0.24em] text-amber-100/70">Status</p>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-stone-300 sm:text-base">
            This page is intentionally live as a protected placeholder so member navigation works end to end while the real feature is being built.
          </p>
        </section>
      </div>
    </main>
  )
}