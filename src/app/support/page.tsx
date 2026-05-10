import Link from 'next/link'

import TopQuickNav from '@/app/_components/top-quick-nav'
import { ROUTES } from '@/lib/constants'

export default function SupportPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#090b10] px-4 pb-8 pt-24 text-stone-100 sm:px-6 lg:px-8">
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30"
        style={{ backgroundImage: "url('/welcome2.jpg')" }}
      />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(8,11,18,0.7)_0%,rgba(6,8,12,0.84)_100%)]" />

      <TopQuickNav className="left-4 right-4 md:left-6 md:right-6" />

      <main className="relative z-10 mx-auto max-w-4xl space-y-6">
        <section className="rounded-3xl border border-white/10 bg-black/30 p-6 backdrop-blur-xl sm:p-8">
          <p className="text-xs uppercase tracking-[0.24em] text-stone-300/80">Support</p>
          <h1 className="mt-3 font-[family:var(--font-display)] text-4xl text-stone-100 sm:text-5xl">Help Center</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-stone-300 sm:text-base">
            Quick answers for account access, profile issues, privacy settings, and message controls.
          </p>
        </section>

        <section className="grid gap-3">
          {[
            'How do I reset my login credentials?',
            'How do I control who can message me?',
            'How do I report or block someone?',
            'How does premium video visibility work?',
          ].map((question) => (
            <article key={question} className="rounded-2xl border border-white/10 bg-black/30 p-4 backdrop-blur">
              <h2 className="text-sm font-semibold text-stone-100">{question}</h2>
              <p className="mt-1 text-sm text-stone-300">Placeholder answer block for full FAQ content.</p>
            </article>
          ))}
        </section>

        <div className="flex flex-wrap gap-3">
          <Link href={ROUTES.SETTINGS} className="rounded-xl border border-white/20 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-stone-100 transition hover:border-white/35 hover:bg-white/[0.1]">
            Manage settings
          </Link>
          <Link href={ROUTES.SAFETY} className="rounded-xl border border-white/20 px-4 py-2 text-sm text-stone-200 transition hover:border-white/35 hover:bg-white/[0.04]">
            Open safety center
          </Link>
        </div>
      </main>
    </div>
  )
}
