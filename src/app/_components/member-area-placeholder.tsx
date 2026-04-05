import Link from 'next/link'

import TopQuickNav from '@/app/_components/top-quick-nav'
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
    <div className="relative min-h-screen overflow-hidden bg-[#090b10] px-4 pb-8 pt-24 text-stone-100 sm:px-6 lg:px-8">
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat opacity-38"
        style={{ backgroundImage: "url('/welcome2.jpg')" }}
      />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(8,11,18,0.6)_0%,rgba(6,8,12,0.74)_100%)]" />

      <TopQuickNav className="left-4 right-4 md:left-6 md:right-6" />

      <main className="relative z-10 mx-auto max-w-5xl space-y-6">
        <div className="rounded-3xl border border-white/10 bg-black/30 p-6 backdrop-blur-xl sm:p-8">
          <p className="text-xs uppercase tracking-[0.24em] text-stone-300/80">{eyebrow}</p>
          <h1 className="mt-3 font-[family:var(--font-display)] text-4xl text-stone-100 sm:text-5xl">
            {title}
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-stone-300 sm:text-base">
            {description}
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={ROUTES.DASHBOARD}
              className="rounded-xl border border-white/20 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-stone-100 transition hover:border-white/35 hover:bg-white/[0.1]"
            >
              Back to dashboard
            </Link>
            <Link
              href={ROUTES.LOGIN}
              className="rounded-xl border border-white/20 px-4 py-2 text-sm text-stone-200 transition hover:border-white/35 hover:bg-white/[0.04] hover:text-white"
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
          <p className="text-xs uppercase tracking-[0.24em] text-stone-300/80">Status</p>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-stone-300 sm:text-base">
            This page is intentionally live as a protected placeholder so member navigation works end to end while the real feature is being built.
          </p>
        </section>
      </main>
    </div>
  )
}