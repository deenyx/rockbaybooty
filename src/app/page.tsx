'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function Home() {
  const [showPasscodeModal, setShowPasscodeModal] = useState(false)
  const [passcode, setPasscode] = useState('')

  const handlePasscodeSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Validate passcode and redirect to onboarding
    window.location.href = `/onboarding?passcode=${passcode}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-purple-500 to-secondary">
      {/* Navigation */}
      <nav className="bg-black/20 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="text-2xl font-bold text-white">SocialNet</div>
            <div className="flex gap-4">
              <button onClick={() => setShowPasscodeModal(true)} className="btn btn-outline text-white border-white hover:bg-white/10">
                Join Now
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 drop-shadow-lg">
          Connect with Intention
        </h1>
        <p className="text-xl md:text-2xl text-white/90 mb-12 drop-shadow max-w-3xl mx-auto">
          An exclusive social network for meaningful connections. Dating, networking, dating, or just friends—find what you're looking for.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <button
            onClick={() => setShowPasscodeModal(true)}
            className="btn btn-primary text-lg px-8 py-3"
          >
            Get Started
          </button>
          <button className="btn btn-outline text-lg px-8 py-3 text-white border-white hover:bg-white/10">
            Learn More
          </button>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-black/30 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-white text-center mb-16">Why Join SocialNet?</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: '🔒',
                title: 'Private & Secure',
                desc: 'Invite-only access ensures a trusted community',
              },
              {
                icon: '👥',
                title: 'Real Connections',
                desc: 'Find matches, friends, or professional contacts',
              },
              {
                icon: '🎬',
                title: 'Video & Chat',
                desc: 'Connect face-to-face with video rooms',
              },
            ].map((feature, idx) => (
              <div
                key={idx}
                className="bg-white/10 backdrop-blur-md rounded-xl p-8 text-white hover:bg-white/20 transition"
              >
                <div className="text-5xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-200">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Passcode Modal */}
      {showPasscodeModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">Enter Passcode</h3>
            <p className="text-gray-600 mb-6">
              This is an invite-only community. Enter your passcode to begin onboarding.
            </p>

            <form onSubmit={handlePasscodeSubmit}>
              <input
                type="password"
                placeholder="Enter passcode"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                className="input-field mb-6 text-center tracking-widest text-lg"
                required
              />

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 btn btn-primary"
                >
                  Continue
                </button>
                <button
                  type="button"
                  onClick={() => setShowPasscodeModal(false)}
                  className="flex-1 btn btn-outline"
                >
                  Cancel
                </button>
              </div>
            </form>

            <p className="text-xs text-gray-500 text-center mt-4">
              Don't have a passcode? Request an invite from a current member.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
