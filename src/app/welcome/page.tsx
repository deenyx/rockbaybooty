'use client'

import { useState } from 'react'
import type { CSSProperties } from 'react'

const playfulScript = {
  fontFamily:
    "'SignPainter', 'SignPainter-HouseScript', 'Snell Roundhand', 'Bradley Hand', 'Brush Script MT', cursive",
  letterSpacing: '0.01em',
} as CSSProperties

export default function Welcome() {
  const [showPasscodeModal, setShowPasscodeModal] = useState(false)
  const [passcode, setPasscode] = useState('')

  const handlePasscodeSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    window.location.href = `/onboarding?passcode=${passcode}`
  }

  return (
    <div
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden"
      style={{
        backgroundImage: [
          'linear-gradient(135deg, rgba(15, 23, 42, 0.85) 0%, rgba(61, 10, 79, 0.85) 50%, rgba(26, 10, 46, 0.85) 100%)',
          "url('/welcome.png')",
        ].join(', '),
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
        backgroundColor: '#0a0314',
        ...playfulScript,
      }}
    >
      {/* Glow orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/3 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-700/20 blur-[120px]" />
        <div className="absolute right-1/4 bottom-1/4 h-[300px] w-[300px] rounded-full bg-pink-600/15 blur-[100px]" />
      </div>

      {/* Hero content */}
      <main className="relative z-10 flex flex-col items-center gap-8 px-8 text-center">
        {/* Tagline */}
        <p className="max-w-2xl text-3xl text-white/60 leading-tight sm:text-4xl" style={playfulScript}>
          Where desire meets discretion.
          <br />
          <span className="text-white/40 text-xl sm:text-2xl">No judgment. No limits. Just your kind of people.</span>
        </p>

        {/* CTAs */}
        <div className="mt-6 flex flex-col items-center gap-4 sm:flex-row">
          <button
            onClick={() => setShowPasscodeModal(true)}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-10 py-4 text-2xl font-medium text-white/40 backdrop-blur-sm transition hover:bg-white/10 hover:text-white/60"
            style={playfulScript}
          >
            Create Account
          </button>
          <button
            onClick={() => setShowPasscodeModal(true)}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-purple-400/50 bg-purple-700/45 px-12 py-4 text-2xl font-medium text-white shadow-lg shadow-purple-950/40 backdrop-blur-sm transition hover:border-purple-300/70 hover:bg-purple-600/60 hover:text-white"
            style={playfulScript}
          >
            Join Now
          </button>
        </div>

        {/* Subtle disclaimer */}
        <p className="mt-8 text-xs text-white/25" style={playfulScript}>
          18+ only &nbsp;·&nbsp; Adults only &nbsp;·&nbsp; Members agree to our community guidelines
        </p>
      </main>

      {/* Passcode Modal */}
      {showPasscodeModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="rounded-2xl shadow-2xl max-w-md w-full overflow-hidden" style={{
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(61, 10, 79, 0.95) 50%, rgba(26, 10, 46, 0.95) 100%)',
            border: '1px solid rgba(168, 85, 247, 0.3)',
          }}>
            {/* Header */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(61, 10, 79, 0.8) 0%, rgba(168, 85, 247, 0.2) 100%)',
              padding: '24px',
              borderBottom: '1px solid rgba(168, 85, 247, 0.2)',
            }}>
              <h3 className="text-3xl font-bold text-white mb-0" style={playfulScript}>Enter Passcode</h3>
            </div>

            {/* Body */}
            <div className="p-8">
              <p className="text-white/80 mb-6" style={playfulScript}>
                This is an invite-only community. Enter your passcode to begin onboarding.
              </p>

              <form onSubmit={handlePasscodeSubmit}>
                <input
                  type="password"
                  placeholder="Enter passcode"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg mb-6 text-center tracking-widest text-lg bg-white/10 border border-purple-400/30 text-white placeholder-white/50 focus:border-purple-400/60 focus:ring-2 focus:ring-purple-500/30 outline-none transition"
                  required
                />

                <div className="flex gap-3">
                  <button
                    type="submit"
                    style={{
                      background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.8) 0%, rgba(219, 39, 119, 0.8) 100%)',
                    }}
                    className="flex-1 px-4 py-2 rounded-lg font-medium text-white hover:shadow-lg hover:shadow-purple-500/50 transition"
                    style={playfulScript}
                  >
                    Continue
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPasscodeModal(false)}
                    className="flex-1 px-4 py-2 rounded-lg font-medium text-white border border-purple-400/30 hover:border-purple-400/60 hover:bg-white/5 transition"
                    style={playfulScript}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>

            {/* Footer */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(61, 10, 79, 0.5) 0%, rgba(168, 85, 247, 0.1) 100%)',
              padding: '16px 24px',
              borderTop: '1px solid rgba(168, 85, 247, 0.2)',
            }}>
              <p className="text-xs text-white/50 text-center m-0" style={playfulScript}>
                Don't have a passcode? Request an invite from a current member.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
