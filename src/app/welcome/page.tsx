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
          <div>
            <LandingAccessGate />
          </div>
        </div>
      </main>
    </div>
  )
}
