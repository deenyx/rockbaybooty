'use client'

import { useEffect, useRef } from 'react'

const TRACK_URL = '/jukebox/Fade%20Into%20You.mp3'

export default function WelcomeJukebox() {
  const audioRef = useRef<HTMLAudioElement>(null)
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const tryPlay = async () => {
      try {
        await audio.play()
      } catch {
        // Some browsers block autoplay with sound until first interaction.
      }
    }

    const startOnInteraction = () => {
      void tryPlay()
      window.removeEventListener('pointerdown', startOnInteraction)
      window.removeEventListener('keydown', startOnInteraction)
    }

    void tryPlay()
    window.addEventListener('pointerdown', startOnInteraction)
    window.addEventListener('keydown', startOnInteraction)

    return () => {
      window.removeEventListener('pointerdown', startOnInteraction)
      window.removeEventListener('keydown', startOnInteraction)
    }
  }, [])

  return (
    <audio
      ref={audioRef}
      src={TRACK_URL}
      autoPlay
      loop
      playsInline
      preload="auto"
      style={{ display: 'none' }}
    />
  )
}
