import type { Metadata } from 'next'
import Image from 'next/image'
import MembersGate from '@/app/_components/members-gate'

export const metadata: Metadata = {
  title: 'Private Entry',
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
      <div className="absolute inset-0">
        <Image
          src="/welcome2.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
          style={{
            objectPosition: 'center 18%',
            filter: 'saturate(1.08) contrast(1.02)',
          }}
        />
      </div>
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 18% 16%, rgba(56, 189, 248, 0.26), transparent 42%), radial-gradient(circle at 82% 14%, rgba(244, 114, 182, 0.2), transparent 36%), linear-gradient(180deg, rgba(2, 6, 23, 0.56), rgba(2, 6, 23, 0.9))',
          opacity: 0.08,
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center gap-10 px-4">
        <h1
          className="text-2xl tracking-[0.22em] text-stone-100/85 select-none"
          style={{ fontFamily: 'var(--font-copperplate)' }}
        >
          Members Only
        </h1>
        <p
          className="text-xs tracking-[0.15em] text-yellow-400 select-none -mt-6"
          style={{ fontFamily: 'var(--font-copperplate)' }}
        >
          access code required
        </p>

        <MembersGate />
      </div>

    </div>
  )
}
