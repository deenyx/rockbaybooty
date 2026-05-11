'use client'

import { useEffect, useRef, useState } from 'react'

export default function BackgroundAudio() {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [tracks, setTracks] = useState<string[]>([])
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0)

  // Fetch available tracks
  useEffect(() => {
    fetch('/api/jukebox')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.tracks) && data.tracks.length > 0) {
          setTracks(data.tracks)
        }
      })
      .catch(() => setTracks([]))
  }, [])

  // Play track and handle next track
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || tracks.length === 0) return

    const currentTrack = tracks[currentTrackIndex]
    audio.src = `/jukebox/${encodeURIComponent(currentTrack)}`
    audio.volume = 0.3

    // Attempt to autoplay
    const playPromise = audio.play()
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Autoplay blocked - enable on first user interaction
        const enableAudio = () => {
          audio.play().catch(() => {})
          document.removeEventListener('click', enableAudio)
        }
        document.addEventListener('click', enableAudio)
      })
    }
  }, [tracks, currentTrackIndex])

  // Handle track end - play next random track
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || tracks.length === 0) return

    const handleEnded = () => {
      setCurrentTrackIndex((prev) => (prev + 1) % tracks.length)
    }

    audio.addEventListener('ended', handleEnded)
    return () => audio.removeEventListener('ended', handleEnded)
  }, [tracks])

  return (
    <audio
      ref={audioRef}
      style={{ display: 'none' }}
      preload="auto"
    />
  )
}
