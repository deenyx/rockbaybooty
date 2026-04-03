import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import MembersGate from '@/app/_components/members-gate'
import { ROUTES } from '@/lib/constants'

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
          src="/welcome1.jpg"
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

        {searchParams?.verified === '1' && (
          <p className="rounded-xl border border-emerald-300/35 bg-emerald-400/12 px-4 py-2 text-center text-xs tracking-wide text-emerald-100">
            Email verified. You can log in now.
          </p>
        )}

        <div className="grid w-[min(92vw,34rem)] gap-2 sm:grid-cols-2">
          <Link
            href={`${ROUTES.LOGIN}?returnTo=${encodeURIComponent(safeReturnTo)}`}
            className="inline-flex items-center justify-center rounded-full border border-white/30 bg-black/35 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-100 transition hover:border-white/45 hover:bg-black/55"
          >
            Log In
          </Link>
          <Link
            href={ROUTES.SIGNUP}
            className="inline-flex items-center justify-center rounded-full border border-sky-300/30 bg-sky-400/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-100 transition hover:border-sky-200/55 hover:bg-sky-300/15"
          >
            Sign Up
          </Link>
        </div>

        <MembersGate
          initialError={searchParams?.error || ''}
          returnTo={safeReturnTo}
          verified={searchParams?.verified === '1'}
        />
      </div>

    </div>
  )
}
