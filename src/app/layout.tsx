import type { Metadata } from 'next'
import { Cormorant_Garamond, Manrope } from 'next/font/google'

import { ROUTES } from '@/lib/constants'

import './globals.css'

const sans = Manrope({
  subsets: ['latin'],
  variable: '--font-sans',
})

const display = Cormorant_Garamond({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['500', '600', '700'],
})

export const metadata: Metadata = {
  title: {
    default: 'RockBayBooty',
    template: '%s | RockBayBooty',
  },
  description:
    'RockBayBooty is an invite-only adult social network for verified adults seeking discreet dating, chemistry, and connection.',
  applicationName: 'RockBayBooty',
  keywords: [
    'invite only adult social network',
    'private adult dating',
    'verified adults',
    'discreet hookup community',
  ],
  openGraph: {
    title: 'RockBayBooty',
    description:
      'Invite-only adult social network for verified adults who value chemistry, discretion, and privacy.',
    siteName: 'RockBayBooty',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'RockBayBooty',
    description:
      'Invite-only adult social network for verified adults who value chemistry, discretion, and privacy.',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${sans.variable} ${display.variable} min-h-screen bg-[#060304] font-[family:var(--font-sans)] text-stone-100 antialiased`}
      >
        {children}

        <noscript>
          <a href={ROUTES.LOGIN}>Login</a>
        </noscript>
      </body>
    </html>
  )
}
