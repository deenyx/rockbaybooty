import type { Metadata } from 'next'

import LandingAccessGate from '@/app/_components/landing-access-gate'

export const metadata: Metadata = {
  title: 'Private. Passionate. Yours.',
  description:
    'Exclusive adult social network — invite-only. RockBayBooty is a private, verified adults-only space for discreet dating, chemistry, and connection.',
  keywords: [
    'invite only adult social network',
    'private adult dating',
    'verified adults only',
    'discreet hookup platform',
    'luxury adult community',
  ],
  openGraph: {
    title: 'Private. Passionate. Yours. | RockBayBooty',
    description:
      'Exclusive adult social network — invite-only. Verified adults, discreet profiles, and private connection.',
    siteName: 'RockBayBooty',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Private. Passionate. Yours. | RockBayBooty',
    description:
      'Exclusive adult social network — invite-only. Verified adults, private access, discreet connection.',
  },
}

export default function Welcome() {
  return (
    <div className="relative isolate min-h-screen overflow-hidden bg-[#020617] text-slate-100">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "linear-gradient(180deg, rgba(2, 6, 23, 0.7), rgba(2, 6, 23, 0.88)), url('/welcome1.jpg')",
        }}
      />
      <main className="relative mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-12 sm:px-8">
        <div className="rounded-3xl border border-white/15 bg-black/35 p-8 backdrop-blur-sm sm:p-10">
          <div className="space-y-8">
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-200/80">
                Invite-only member access
              </p>
              <h1 className="font-[family:var(--font-display)] text-5xl leading-[0.95] text-stone-100 sm:text-6xl">
                Private.
                <br />
                Passionate.
                <br />
                Yours.
              </h1>
              <p className="max-w-xl text-sm leading-7 text-stone-300 sm:text-base">
                RockBayBooty is a discreet adults-only network for meaningful chemistry.
                Enter your invite passcode to continue onboarding.
              </p>
              <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.2em] text-stone-300/90">
                <span className="rounded-full border border-white/20 bg-black/30 px-3 py-1.5">19+ only</span>
                <span className="rounded-full border border-white/20 bg-black/30 px-3 py-1.5">Verified access</span>
                <span className="rounded-full border border-white/20 bg-black/30 px-3 py-1.5">No public profiles</span>
              </div>
            </div>

            <LandingAccessGate />
          </div>
        </div>
      </main>
    </div>
  )
}
