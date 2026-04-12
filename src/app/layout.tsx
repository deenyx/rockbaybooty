import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'RockBayBooty',
  description: 'RockBayBooty is an invite-only adult social network for verified adults seeking discreet dating, chemistry, and connection.'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
