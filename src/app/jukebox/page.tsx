// Jukebox page: lists all mp3 files in /jukebox and allows selection and playback in a popup

'use client'

import { useEffect, useState } from 'react'

export default function JukeboxPage() {
  const [tracks, setTracks] = useState<string[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [popup, setPopup] = useState<Window | null>(null)


  useEffect(() => {
    fetch('/api/jukebox')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.tracks)) setTracks(data.tracks)
      })
      .catch(() => setTracks([]))
  }, [])

  const handlePlay = () => {
    if (!selected) return
    const url = `/jukebox/${selected}`
    const win = window.open('', 'jukebox-player', 'width=400,height=180')
    if (win) {
      win.document.write(`
        <html><head><title>Now Playing</title></head>
        <body style='background:#111;color:#fff;text-align:center;padding:2em;'>
          <h2>Now Playing</h2>
          <audio src='${url}' controls autoplay style='width:90%'></audio>
          <div style='margin-top:1em;'>${selected}</div>
        </body></html>
      `)
      setPopup(win)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center py-12">
      <h1 className="text-3xl font-bold mb-8">Jukebox</h1>
      <div className="w-full max-w-md">
        <ul className="divide-y divide-white/10">
          {tracks.map((track) => (
            <li key={track} className="flex items-center justify-between py-3">
              <span>{track}</span>
              <button
                className={`px-4 py-1 rounded bg-blue-600 hover:bg-blue-700 transition ${selected === track ? 'ring-2 ring-blue-300' : ''}`}
                onClick={() => setSelected(track)}
              >
                Select
              </button>
            </li>
          ))}
        </ul>
        <button
          className="mt-8 w-full py-3 rounded bg-green-600 hover:bg-green-700 text-lg font-semibold disabled:bg-gray-700"
          disabled={!selected}
          onClick={handlePlay}
        >
          Play
        </button>
      </div>
      <p className="mt-8 text-sm text-gray-400">Drop mp3 files into <b>public/jukebox/</b> to add them to the playlist.</p>
    </div>
  )
}
