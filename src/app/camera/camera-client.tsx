'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Mic, MicOff, Radio, RefreshCw, Video, VideoOff } from 'lucide-react'
import {
  ConnectionState,
  LocalAudioTrack,
  LocalVideoTrack,
  Room,
  RoomEvent,
  Track,
  createLocalAudioTrack,
  createLocalVideoTrack,
} from 'livekit-client'

import { Button } from '@/components/ui/button'

type HostState = {
  token: string
  roomName: string
  livekitUrl: string
  role: 'host' | 'viewer'
  participantName: string
  participantIdentity: string
  accountName: string
}

export default function CameraClient() {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const roomRef = useRef<Room | null>(null)
  const localVideoTrackRef = useRef<LocalVideoTrack | null>(null)
  const localAudioTrackRef = useRef<LocalAudioTrack | null>(null)
  const [hostState, setHostState] = useState<HostState | null>(null)
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.Disconnected)
  const [isHosting, setIsHosting] = useState(false)
  const [isMicEnabled, setIsMicEnabled] = useState(true)
  const [isVideoEnabled, setIsVideoEnabled] = useState(true)
  const [participantCount, setParticipantCount] = useState(0)
  const [error, setError] = useState('')
  const [viewerNote, setViewerNote] = useState('')
  const [remoteParticipants, setRemoteParticipants] = useState<Array<{ identity: string; name: string }>>([])

  const roomName = hostState?.roomName || 'camera-studio'
  const statusLabel = useMemo(() => {
    if (!isHosting) return 'Not broadcasting'
    if (connectionState === ConnectionState.Connected) return 'Live to room'
    if (connectionState === ConnectionState.Connecting) return 'Connecting...'
    return 'Preparing stream'
  }, [connectionState, isHosting])

  async function loadHostState() {
    setError('')
    const response = await fetch('/api/camera/token?role=host', {
      method: 'GET',
      credentials: 'include',
    })
    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Unable to initialize camera room')
    }

    setHostState(data)
    return data as HostState
  }

  async function publishTracks(room: Room) {
    const videoTrack = await createLocalVideoTrack({ facingMode: 'user' })
    localVideoTrackRef.current = videoTrack
    await room.localParticipant.publishTrack(videoTrack)

    if (isMicEnabled) {
      const audioTrack = await createLocalAudioTrack()
      localAudioTrackRef.current = audioTrack
      await room.localParticipant.publishTrack(audioTrack)
    }

    if (videoRef.current) {
      await videoTrack.attach(videoRef.current)
      await videoRef.current.play().catch(() => undefined)
    }
  }

  async function connectBroadcast() {
    try {
      const state = hostState || (await loadHostState())
      setIsHosting(true)
      setConnectionState(ConnectionState.Connecting)

      const room = new Room({
        adaptiveStream: true,
        dynacast: true,
      })

      room.on(RoomEvent.Connected, () => {
        setConnectionState(ConnectionState.Connected)
        setParticipantCount(room.numParticipants)
        setViewerNote('Viewers can join this room in real time.')
      })

      room.on(RoomEvent.Disconnected, () => {
        setConnectionState(ConnectionState.Disconnected)
        setParticipantCount(0)
        setViewerNote('Broadcast ended.')
      })

      room.on(RoomEvent.ParticipantConnected, () => {
        setParticipantCount(room.numParticipants)
      })

      room.on(RoomEvent.ParticipantDisconnected, () => {
        setParticipantCount(room.numParticipants)
      })

      room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
        if (track.kind === Track.Kind.Video) {
          const video = document.createElement('video')
          video.autoplay = true
          video.playsInline = true
          video.muted = true
          track.attach(video)
          setRemoteParticipants((prev) => {
            const existing = prev.filter((item) => item.identity !== participant.identity)
            return [...existing, { identity: participant.identity, name: participant.name || participant.identity }]
          })
          document.getElementById('viewer-grid')?.appendChild(video)
        }

        if (track.kind === Track.Kind.Audio) {
          const audio = document.createElement('audio')
          audio.autoplay = true
          track.attach(audio)
          document.body.appendChild(audio)
        }
      })

      room.on(RoomEvent.TrackUnsubscribed, (track) => {
        track.detach().forEach((element) => element.remove())
      })

      roomRef.current = room
      await room.connect(state.livekitUrl, state.token)
      await publishTracks(room)
      setParticipantCount(room.numParticipants)
    } catch (err) {
      console.error('Broadcast connection failed', err)
      setError(err instanceof Error ? err.message : 'Could not start broadcast')
      setIsHosting(false)
      setConnectionState(ConnectionState.Disconnected)
    }
  }

  async function stopBroadcast() {
    const room = roomRef.current

    try {
      localAudioTrackRef.current?.stop()
      localVideoTrackRef.current?.stop()
      localAudioTrackRef.current = null
      localVideoTrackRef.current = null
      await room?.disconnect()
    } finally {
      roomRef.current = null
      setIsHosting(false)
      setConnectionState(ConnectionState.Disconnected)
      setParticipantCount(0)
    }
  }

  async function toggleMic() {
    const room = roomRef.current
    setIsMicEnabled((prev) => !prev)

    if (!room) return

    if (isMicEnabled) {
      localAudioTrackRef.current?.stop()
      localAudioTrackRef.current = null
      return
    }

    const audioTrack = await createLocalAudioTrack()
    localAudioTrackRef.current = audioTrack
    await room.localParticipant.publishTrack(audioTrack)
  }

  async function toggleVideo() {
    const room = roomRef.current
    setIsVideoEnabled((prev) => !prev)

    if (!room) return

    if (isVideoEnabled) {
      localVideoTrackRef.current?.stop()
      localVideoTrackRef.current = null
      return
    }

    const videoTrack = await createLocalVideoTrack({ facingMode: 'user' })
    localVideoTrackRef.current = videoTrack
    await room.localParticipant.publishTrack(videoTrack)
    if (videoRef.current) {
      await videoTrack.attach(videoRef.current)
    }
  }

  useEffect(() => {
    return () => {
      void stopBroadcast()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
      <section className="rounded-3xl border border-white/10 bg-black/35 p-4 backdrop-blur-xl sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.24em] text-stone-400">Live Room</p>
            <h2 className="mt-1 text-xl font-semibold">Broadcast Studio</h2>
            <p className="mt-1 text-sm text-stone-400">Host a real LiveKit room for viewers to watch in real time.</p>
          </div>
          <div className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-stone-200">
            {statusLabel}
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-black">
          <video ref={videoRef} className="aspect-video w-full object-cover" playsInline muted autoPlay />
          {connectionState !== 'connected' && (
            <div className="flex aspect-video items-center justify-center bg-black/70 text-sm text-stone-300">
              Your broadcast preview appears here.
            </div>
          )}
          <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-rose-600/85 px-3 py-1 text-xs font-semibold text-white">
            <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
            LIVE ROOM
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {!isHosting ? (
            <Button onClick={() => void connectBroadcast()} className="gap-2">
              <Radio className="h-4 w-4" />
              Start Broadcast
            </Button>
          ) : (
            <Button variant="destructive" onClick={() => void stopBroadcast()} className="gap-2">
              <VideoOff className="h-4 w-4" />
              End Broadcast
            </Button>
          )}
          <Button variant="outline" onClick={() => void toggleMic()} className="gap-2">
            {isMicEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
            {isMicEnabled ? 'Mute Mic' : 'Unmute Mic'}
          </Button>
          <Button variant="outline" onClick={() => void toggleVideo()} className="gap-2">
            <Video className="h-4 w-4" />
            {isVideoEnabled ? 'Disable Cam' : 'Enable Cam'}
          </Button>
          <Button variant="secondary" onClick={() => void loadHostState()} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh Room
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
          <p className="text-[10px] uppercase tracking-[0.22em] text-stone-400">Room Details</p>
          <div className="mt-3 space-y-2 text-sm text-stone-300">
            <p>Room: {roomName}</p>
            <p>Participants: {participantCount}</p>
            <p>Account: {hostState?.accountName || 'loading...'}</p>
            <p className="text-xs text-stone-400">Identity: {hostState?.participantName || 'waiting for token'}</p>
          </div>
          {viewerNote && <p className="mt-3 text-xs text-emerald-300">{viewerNote}</p>}
        </div>

        <div className="rounded-3xl border border-white/10 bg-black/35 p-5 backdrop-blur-xl">
          <p className="text-[10px] uppercase tracking-[0.22em] text-stone-400">Viewers</p>
          <div id="viewer-grid" className="mt-4 space-y-2 text-sm text-stone-300">
            {remoteParticipants.length === 0 ? (
              <p>No remote viewers yet.</p>
            ) : (
              remoteParticipants.map((participant) => (
                <div key={participant.identity} className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                  {participant.name}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-black/35 p-5 backdrop-blur-xl text-sm text-stone-400">
          <p className="font-semibold text-stone-200">How this works</p>
          <p className="mt-2">Broadcast mode joins a shared LiveKit room. The watcher page subscribes to the same room so other members can view the stream live.</p>
        </div>
      </section>
    </div>
  )
}
