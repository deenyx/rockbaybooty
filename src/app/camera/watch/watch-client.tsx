'use client'

import { useEffect, useRef, useState } from 'react'
import { PlayCircle, Radio } from 'lucide-react'
import { Room, RoomEvent, Track } from 'livekit-client'

import { Button } from '@/components/ui/button'

type WatchState = {
  token: string
  roomName: string
  livekitUrl: string
  role: 'viewer'
  participantName: string
  participantIdentity: string
  accountName: string
}

function ensureAudioPlayback(element: HTMLAudioElement) {
  element.autoplay = true
  element.controls = true
}

export default function CameraWatchClient() {
  const roomRef = useRef<Room | null>(null)
  const hostVideoRef = useRef<HTMLVideoElement | null>(null)
  const hostAudioRef = useRef<HTMLAudioElement | null>(null)
  const [watchState, setWatchState] = useState<WatchState | null>(null)
  const [status, setStatus] = useState('Not watching')
  const [viewerCount, setViewerCount] = useState(0)
  const [error, setError] = useState('')
  const [isWatching, setIsWatching] = useState(false)

  async function loadWatchState() {
    const response = await fetch('/api/camera/token?role=viewer', {
      method: 'GET',
      credentials: 'include',
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Unable to join live room')
    }

    setWatchState(data)
    return data as WatchState
  }

  async function startWatching() {
    try {
      const state = watchState || (await loadWatchState())
      setError('')
      setIsWatching(true)
      setStatus('Connecting to live room...')

      const room = new Room({
        adaptiveStream: true,
        dynacast: true,
      })

      room.on(RoomEvent.Connected, () => {
        setStatus('Watching live')
        setViewerCount(room.numParticipants)
      })

      room.on(RoomEvent.Disconnected, () => {
        setStatus('Watch ended')
        setViewerCount(0)
        setIsWatching(false)
      })

      room.on(RoomEvent.ParticipantConnected, () => {
        setViewerCount(room.numParticipants)
      })

      room.on(RoomEvent.ParticipantDisconnected, () => {
        setViewerCount(room.numParticipants)
      })

      room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
        if (track.kind === Track.Kind.Video && hostVideoRef.current) {
          track.attach(hostVideoRef.current)
          setStatus(`Watching ${participant.name || participant.identity}`)
        }

        if (track.kind === Track.Kind.Audio && hostAudioRef.current) {
          track.attach(hostAudioRef.current)
          ensureAudioPlayback(hostAudioRef.current)
        }
      })

      room.on(RoomEvent.TrackUnsubscribed, (track) => {
        track.detach().forEach((element) => element.remove())
      })

      roomRef.current = room
      await room.connect(state.livekitUrl, state.token)
      setViewerCount(room.numParticipants)
    } catch (err) {
      console.error('Failed to watch camera room', err)
      setError(err instanceof Error ? err.message : 'Could not join live room')
      setIsWatching(false)
      setStatus('Not watching')
    }
  }

  async function stopWatching() {
    try {
      await roomRef.current?.disconnect()
    } finally {
      roomRef.current = null
      setIsWatching(false)
      setViewerCount(0)
      setStatus('Not watching')
    }
  }

  useEffect(() => {
    return () => {
      void stopWatching()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
      <section className="rounded-3xl border border-white/10 bg-black/35 p-4 backdrop-blur-xl sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.24em] text-stone-400">Viewer Room</p>
            <h1 className="mt-1 text-2xl font-semibold">Watch Live</h1>
            <p className="mt-1 text-sm text-stone-400">View a member's camera room in real time.</p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-stone-200">
            <span className={`h-2 w-2 rounded-full ${isWatching ? 'bg-emerald-400' : 'bg-stone-500'}`} />
            {status}
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-black">
          <video ref={hostVideoRef} className="aspect-video w-full object-cover" playsInline autoPlay muted />
          {!isWatching && (
            <div className="flex aspect-video items-center justify-center bg-black/70 text-sm text-stone-300">
              <span className="flex items-center gap-2">
                <PlayCircle className="h-4 w-4" />
                Join the broadcast to see the host feed here
              </span>
            </div>
          )}
        </div>

        <audio ref={hostAudioRef} className="hidden" />

        <div className="mt-4 flex flex-wrap gap-2">
          {!isWatching ? (
            <Button onClick={() => void startWatching()} className="gap-2">
              <Radio className="h-4 w-4" />
              Join Live
            </Button>
          ) : (
            <Button variant="destructive" onClick={() => void stopWatching()} className="gap-2">
              Leave Live
            </Button>
          )}
          <Button variant="secondary" onClick={() => void loadWatchState()} className="gap-2">
            Refresh Join Token
          </Button>
        </div>

        {error && (
          <p className="mt-3 rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
            {error}
          </p>
        )}
      </section>

      <section className="space-y-6">
        <div className="rounded-3xl border border-white/10 bg-black/35 p-5 backdrop-blur-xl">
          <p className="text-[10px] uppercase tracking-[0.22em] text-stone-400">Watch Info</p>
          <div className="mt-3 space-y-2 text-sm text-stone-300">
            <p>Room: {watchState?.roomName || 'camera-studio'}</p>
            <p>Viewer count: {viewerCount}</p>
            <p>Account: {watchState?.accountName || 'loading...'}</p>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-black/35 p-5 backdrop-blur-xl text-sm text-stone-400">
          <p className="font-semibold text-stone-200">Notes</p>
          <p className="mt-2">This page uses the same shared room as the broadcaster. When the host starts streaming, the main video above will populate automatically.</p>
        </div>
      </section>
    </div>
  )
}
