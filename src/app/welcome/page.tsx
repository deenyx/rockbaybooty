import type { Metadata } from 'next'
import Image from 'next/image'
import MembersGate from '@/app/_components/members-gate'

type WelcomePageProps = {
  searchParams?: {
    error?: string
    returnTo?: string
    verified?: string
  }
}

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

export default function Welcome({ searchParams }: WelcomePageProps) {
  const safeReturnTo =
    searchParams?.returnTo &&
    searchParams.returnTo.startsWith('/') &&
    !searchParams.returnTo.startsWith('//')
      ? searchParams.returnTo
      : '/dashboard'

  return (
    <div className="relative isolate min-h-screen overflow-hidden bg-[#020617] text-slate-100">
      <div className="absolute inset-0">
        <Image
          src="/welcome2.jpg"
          alt=""
          fill
          priority
          quality={95}
          sizes="100vw"
          className="object-cover"
          style={{
            objectPosition: 'center 16%',
          }}
        />
      </div>
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(2, 6, 23, 0.16), rgba(2, 6, 23, 0.34)), linear-gradient(120deg, rgba(8, 47, 73, 0.16), rgba(17, 24, 39, 0.08) 42%, rgba(67, 20, 7, 0.14))',
          opacity: 1,
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

        <MembersGate
          initialError={searchParams?.error || ''}
          returnTo={safeReturnTo}
          verified={searchParams?.verified === '1'}
        />
      </div>

    </div>
  )
}
