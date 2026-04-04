'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  LiveKitRoom,
  VideoTrack,
  RoomAudioRenderer,
  useLocalParticipant,
  useParticipants,
  useTracks,
  useRoomContext,
  isTrackReference,
} from '@livekit/components-react'
import type { TrackReferenceOrPlaceholder } from '@livekit/components-react'
import { RoomEvent, Track } from 'livekit-client'
import type { Participant } from 'livekit-client'

import { fetchChatRoomToken } from '@/lib/api'
import { ROUTES } from '@/lib/constants'
import type { ChatRoomTokenResponse, LiveChatMessage } from '@/lib/types'

// ─────────────────────────────────────────────────────────────────────────────
// Outer component — fetches token then mounts the LiveKit room
// ─────────────────────────────────────────────────────────────────────────────

type RoomStatus = 'loading' | 'ready' | 'error'

export default function LiveRoomClient() {
  const [status, setStatus] = useState<RoomStatus>('loading')
  const [tokenData, setTokenData] = useState<ChatRoomTokenResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchChatRoomToken()
      .then((data) => {
        setTokenData(data)
        setStatus('ready')
      })
      .catch((err: Error) => {
        setError(err.message || 'Could not connect to the live room.')
        setStatus('error')
      })
  }, [])

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(160deg,#0b0608_18%,#1a0b10_60%,#341113_100%)]">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-amber-400/30 border-t-amber-400" />
          <p className="text-sm text-stone-400">Connecting to the room&hellip;</p>
        </div>
      </div>
    )
  }

  if (status === 'error' || !tokenData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(160deg,#0b0608_18%,#1a0b10_60%,#341113_100%)] px-4">
        <div className="max-w-sm rounded-3xl border border-white/10 bg-black/30 p-8 text-center backdrop-blur-xl">
          <p className="text-xs uppercase tracking-[0.24em] text-red-400/80">Connection Error</p>
          <p className="mt-3 text-sm text-stone-300">
            {error || 'Unable to join the live room right now.'}
          </p>
          <a
            href={ROUTES.DASHBOARD}
            className="mt-6 inline-block rounded-xl border border-amber-200/35 bg-amber-300/15 px-4 py-2 text-sm font-semibold text-amber-100 transition hover:bg-amber-300/25"
          >
            Back to dashboard
          </a>
        </div>
      </div>
    )
  }

  return (
    <LiveKitRoom
      token={tokenData.token}
      serverUrl={tokenData.wsUrl}
      connect={true}
      audio={false}
      video={false}
      style={{ height: '100dvh' }}
    >
      <RoomAudioRenderer />
      <RoomScreen />
    </LiveKitRoom>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Inner room screen — must live inside <LiveKitRoom>
// ─────────────────────────────────────────────────────────────────────────────

function RoomScreen() {
  const room = useRoomContext()
  const { localParticipant } = useLocalParticipant()
  const participants = useParticipants()

  // Camera tracks only (non-placeholder = camera must be on)
  const videoTrackRefs = useTracks(
    [{ source: Track.Source.Camera, withPlaceholder: false }],
    { onlySubscribed: false }
  )

  const [isCamOn, setIsCamOn] = useState(false)
  const [isMicOn, setIsMicOn] = useState(false)
  const [messages, setMessages] = useState<LiveChatMessage[]>([])
  const [inputText, setInputText] = useState('')
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Receive ephemeral text messages via LiveKit data channel
  useEffect(() => {
    const handleData = (payload: Uint8Array) => {
      try {
        const raw = JSON.parse(new TextDecoder().decode(payload)) as unknown

        if (
          typeof raw === 'object' &&
          raw !== null &&
          typeof (raw as LiveChatMessage).id === 'string' &&
          typeof (raw as LiveChatMessage).senderName === 'string' &&
          typeof (raw as LiveChatMessage).text === 'string' &&
          (raw as LiveChatMessage).text.length <= 500
        ) {
          setMessages((prev) => [...prev, raw as LiveChatMessage])
        }
      } catch {
        // ignore malformed data channel messages
      }
    }

    room.on(RoomEvent.DataReceived, handleData)
    return () => {
      room.off(RoomEvent.DataReceived, handleData)
    }
  }, [room])

  // Scroll chat to bottom when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const toggleCamera = useCallback(async () => {
    const next = !isCamOn
    setIsCamOn(next)
    try {
      await localParticipant.setCameraEnabled(next)
    } catch {
      setIsCamOn(isCamOn)
    }
  }, [isCamOn, localParticipant])

  const toggleMic = useCallback(async () => {
    const next = !isMicOn
    setIsMicOn(next)
    try {
      await localParticipant.setMicrophoneEnabled(next)
    } catch {
      setIsMicOn(isMicOn)
    }
  }, [isMicOn, localParticipant])

  const leaveRoom = useCallback(async () => {
    await room.disconnect()
    window.location.href = ROUTES.DASHBOARD
  }, [room])

  const sendMessage = useCallback(() => {
    const text = inputText.trim()
    if (!text) return

    const msg: LiveChatMessage = {
      id: crypto.randomUUID(),
      senderId: localParticipant.identity,
      senderName: localParticipant.name || localParticipant.identity,
      text,
      sentAt: Date.now(),
    }

    setMessages((prev) => [...prev, msg])

    const encoded = new TextEncoder().encode(JSON.stringify(msg))
    void localParticipant.publishData(encoded, { reliable: true })
    setInputText('')
  }, [inputText, localParticipant])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const onlineCount = participants.length

  return (
    <div className="flex h-dvh flex-col bg-[radial-gradient(circle_at_top,_rgba(255,180,0,0.08),_transparent_34%),linear-gradient(160deg,#0b0608_18%,#1a0b10_60%,#341113_100%)] text-stone-100">
      {/* ── Header ── */}
      <header className="flex flex-shrink-0 items-center justify-between border-b border-white/10 bg-black/20 px-4 py-3 backdrop-blur">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-amber-100/70">Members Lounge</p>
          <p className="mt-0.5 text-xs text-stone-500">
            {onlineCount} {onlineCount === 1 ? 'person' : 'people'} in the room
          </p>
        </div>
        <button
          onClick={leaveRoom}
          className="rounded-xl border border-red-400/30 bg-red-800/20 px-3 py-1.5 text-xs font-semibold text-red-300 transition hover:border-red-400/50 hover:bg-red-800/35"
        >
          Leave room
        </button>
      </header>

      {/* ── Main area ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Video grid */}
        <div className="flex flex-1 flex-col overflow-hidden p-4">
          {videoTrackRefs.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
              <div className="rounded-2xl border border-dashed border-white/15 bg-black/20 px-8 py-10">
                <p className="text-xs uppercase tracking-[0.2em] text-stone-600">No cameras on yet</p>
                <p className="mt-2 text-sm text-stone-500">
                  Turn on your camera below to be seen by others
                </p>
              </div>
            </div>
          ) : (
            <div className={`grid h-full gap-3 ${gridColsClass(videoTrackRefs.length)}`}>
              {videoTrackRefs.map((trackRef) => (
                <ParticipantTile
                  key={`${trackRef.participant.sid}-cam`}
                  trackRef={trackRef}
                />
              ))}
            </div>
          )}

          {/* Media controls */}
          <div className="mt-4 flex flex-shrink-0 items-center justify-center gap-3">
            <ToggleButton
              active={isMicOn}
              onClick={toggleMic}
              activeLabel="Mic on"
              inactiveLabel="Mic off"
            />
            <ToggleButton
              active={isCamOn}
              onClick={toggleCamera}
              activeLabel="Camera on"
              inactiveLabel="Camera off"
            />
          </div>
        </div>

        {/* ── Sidebar: participants + chat ── */}
        <aside className="flex w-72 flex-shrink-0 flex-col border-l border-white/10 bg-black/20 backdrop-blur-xl">
          {/* Participants */}
          <div className="border-b border-white/10 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-stone-500">
              Online ({onlineCount})
            </p>
            <ul className="mt-3 space-y-2">
              {participants.map((p: Participant) => (
                <li key={p.sid} className="flex items-center gap-2 text-sm">
                  <span className="h-1.5 w-1.5 flex-none rounded-full bg-emerald-400" />
                  <span className="truncate text-stone-300">
                    {p.name || p.identity}
                    {p.isLocal && (
                      <span className="ml-1 text-xs text-stone-600">(you)</span>
                    )}
                  </span>
                  {p.isCameraEnabled && (
                    <span className="ml-auto flex-none text-xs text-stone-600">cam</span>
                  )}
                  {p.isMicrophoneEnabled && (
                    <span className="flex-none text-xs text-stone-600">mic</span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Messages */}
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.length === 0 && (
              <p className="text-xs text-stone-600">No messages yet — say hi!</p>
            )}
            {messages.map((msg) => (
              <div key={msg.id}>
                <span
                  className={`text-xs font-semibold ${
                    msg.senderId === localParticipant.identity
                      ? 'text-amber-300/90'
                      : 'text-rose-300/80'
                  }`}
                >
                  {msg.senderName}
                </span>
                <p className="mt-0.5 break-words text-sm text-stone-300">{msg.text}</p>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Chat input */}
          <div className="flex-shrink-0 border-t border-white/10 p-3">
            <div className="flex gap-2">
              <input
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Say something…"
                maxLength={500}
                className="min-w-0 flex-1 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-stone-100 placeholder-stone-600 outline-none transition focus:border-amber-400/40 focus:ring-1 focus:ring-amber-400/20"
              />
              <button
                onClick={sendMessage}
                disabled={!inputText.trim()}
                className="flex-shrink-0 rounded-xl border border-amber-200/35 bg-amber-300/15 px-3 py-2 text-sm font-semibold text-amber-100 transition hover:bg-amber-300/25 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Send
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Participant video tile
// ─────────────────────────────────────────────────────────────────────────────

function ParticipantTile({ trackRef }: { trackRef: TrackReferenceOrPlaceholder }) {
  const { participant } = trackRef
  const hasVideo = isTrackReference(trackRef)

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/40">
      {hasVideo ? (
        <VideoTrack
          trackRef={trackRef}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-400/20 text-2xl font-bold text-amber-200">
            {(participant.name || participant.identity).charAt(0).toUpperCase()}
          </div>
        </div>
      )}
      <div className="absolute bottom-2 left-2 rounded-lg bg-black/60 px-2 py-0.5 text-xs text-stone-200 backdrop-blur">
        {participant.name || participant.identity}
        {participant.isLocal && ' (you)'}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Media control toggle button
// ─────────────────────────────────────────────────────────────────────────────

function ToggleButton({
  active,
  onClick,
  activeLabel,
  inactiveLabel,
}: {
  active: boolean
  onClick: () => void
  activeLabel: string
  inactiveLabel: string
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
        active
          ? 'border-amber-400/40 bg-amber-300/20 text-amber-100 hover:bg-amber-300/30'
          : 'border-white/15 bg-white/5 text-stone-400 hover:border-white/25 hover:text-stone-200'
      }`}
    >
      <span
        className={`h-2 w-2 rounded-full ${active ? 'bg-amber-400' : 'bg-stone-600'}`}
      />
      {active ? activeLabel : inactiveLabel}
    </button>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function gridColsClass(count: number): string {
  if (count === 1) return 'grid-cols-1'
  if (count <= 4) return 'grid-cols-2'
  if (count <= 9) return 'grid-cols-3'
  return 'grid-cols-4'
}
