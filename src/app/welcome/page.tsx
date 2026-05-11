import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import PinEntryBox from './PinEntryBox'
import BackgroundAudio from './BackgroundAudio'
import { AUTH_COOKIE_NAME, ROUTES } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'Private Entry',
  description:
    'Exclusive adult social network — invite-only. Fuxem is a private, verified adults-only space for discreet dating, chemistry, and connection.',
  keywords: [
    'invite only adult social network',
    'private adult dating',
    'verified adults only',
    'discreet hookup platform',
    'luxury adult community',
  ],
  openGraph: {
    title: 'Private. Passionate. Yours. | Fuxem',
    description:
      'Exclusive adult social network — invite-only. Verified adults, discreet profiles, and private connection.',
    siteName: 'Fuxem',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Private. Passionate. Yours. | Fuxem',
    description:
      'Exclusive adult social network — invite-only. Verified adults, private access, discreet connection.',
  },
}

export default async function Welcome() {
  const cookieStore = await cookies()
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value
  if (token) {
    redirect(ROUTES.DASHBOARD)
  }

  return (
    <div
      className="relative isolate text-slate-100"
      style={{
        position: 'relative',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        backgroundColor: '#020617',
      }}
    >
      <BackgroundAudio />
      <Image
        src="/thisone.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        style={{
          objectFit: 'cover',
          filter: 'blur(12px)',
          transform: 'scale(1.06)',
          opacity: 0.42,
          zIndex: 0,
          pointerEvents: 'none',
        }}
      />

      <Image
        src="/thisone.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        style={{
          objectFit: 'contain',
          zIndex: 0,
          pointerEvents: 'none',
        }}
      />

      <Link
        href="/login"
        style={{
          position: 'absolute',
          top: 24,
          left: 24,
          zIndex: 30,
          background: 'transparent',
          border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: 6,
          color: 'rgba(255,255,255,0.7)',
          textDecoration: 'none',
          fontSize: 12,
          fontWeight: 500,
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          padding: '7px 14px',
        }}
      >
        Log In
      </Link>
      <Link
        href="/signup"
        style={{
          position: 'absolute',
          top: 24,
          right: 24,
          zIndex: 30,
          background: 'rgba(255,255,255,0.12)',
          border: '1px solid rgba(255,255,255,0.25)',
          borderRadius: 6,
          color: 'rgba(255,255,255,0.9)',
          textDecoration: 'none',
          fontSize: 12,
          fontWeight: 500,
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          padding: '7px 14px',
        }}
      >
        Sign Up
      </Link>

      <div
        style={{
          position: 'absolute',
          top: 18,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 30,
          pointerEvents: 'none',
        }}
      >
        <div style={{ pointerEvents: 'auto' }}>
          <PinEntryBox />
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: '8%',
          left: 0,
          right: 0,
          zIndex: 30,
          textAlign: 'center',
          pointerEvents: 'none',
        }}
      >
        <p
          style={{
            fontFamily: "Copperplate, 'Copperplate Gothic Light', fantasy",
            fontSize: 'clamp(0.6rem, 1.5vw, 0.85rem)',
            letterSpacing: '0.35em',
            color: 'rgba(255,255,255,0.70)',
            textTransform: 'uppercase',
          }}
        >
          Sexual Activity Club — Adults Only
        </p>
      </div>
    </div>
  )
}
