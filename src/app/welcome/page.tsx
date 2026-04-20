import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'

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
    <div
      className="relative isolate text-slate-100"
      style={{
        position: 'relative',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        backgroundImage: 'url(/0.jpg)',
        backgroundSize: 'contain',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center center',
        backgroundColor: '#020617',
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 0,
          pointerEvents: 'none',
          background:
            'linear-gradient(180deg, rgba(2, 6, 23, 0.03), rgba(2, 6, 23, 0.12)), linear-gradient(120deg, rgba(8, 47, 73, 0.02), rgba(17, 24, 39, 0.03) 42%, rgba(67, 20, 7, 0.02))',
          opacity: 1,
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 0,
          pointerEvents: 'none',
          background:
            'radial-gradient(120% 90% at 50% 50%, rgba(2, 6, 23, 0) 64%, rgba(2, 6, 23, 0.08) 100%)',
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 0,
          pointerEvents: 'none',
          background:
            'radial-gradient(44% 34% at 84% 64%, rgba(245, 245, 244, 0.14), rgba(245, 245, 244, 0) 72%)',
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
    </div>
  )
}
