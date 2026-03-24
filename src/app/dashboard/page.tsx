'use client'

import Link from 'next/link'

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-purple-500 to-secondary">
      <nav className="bg-black/20 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-white">SocialNet Dashboard</h1>
            <button className="btn btn-outline text-white border-white hover:bg-white/10">
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-4xl font-bold text-white mb-8">Welcome to Your Dashboard</h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          {[
            { title: 'Member Search', emoji: '🔍', desc: 'Find new connections' },
            { title: 'Video Rooms', emoji: '🎥', desc: 'Connect face-to-face' },
            { title: 'Chat', emoji: '💬', desc: 'Send messages' },
            { title: 'Groups', emoji: '👥', desc: 'Join communities' },
          ].map((item) => (
            <div key={item.title} className="bg-white/10 backdrop-blur-md rounded-xl p-6 text-white hover:bg-white/20 transition cursor-pointer">
              <div className="text-4xl mb-3">{item.emoji}</div>
              <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
              <p className="text-gray-200">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 bg-yellow-500/20 border border-yellow-500/50 rounded-xl p-6 text-yellow-100">
          <p className="text-lg font-semibold">🚧 Features Under Development</p>
          <p>Additional features like classifieds, advanced search filters, and more will be added soon.</p>
        </div>
      </div>
    </div>
  )
}
