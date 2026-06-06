'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Camera, CameraOff, Circle, Loader2, Square, UploadCloud } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'

type MediaPolicy = {
  tier: 'premium' | 'free' | 'burner'
  maxPhotos: number | null
  maxVideos: number | null
  allowVideos: boolean
  requireWatermark: boolean
}

type MediaState = {
  policy: MediaPolicy
  counts: {
    photos: number
    videos: number
  }
  photoUrls: string[]
  videoUrls: string[]
}

function chooseRecorderMimeType() {
  const candidates = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm']

  for (const candidate of candidates) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(candidate)) {
      return candidate
    }
  }

  return ''
}

export default function ProfileMediaCapture() {
  const previewRef = useRef<HTMLVideoElement | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<BlobPart[]>([])
  const streamRef = useRef<MediaStream | null>(null)

  const [mediaState, setMediaState] = useState<MediaState | null>(null)
  const [status, setStatus] = useState<'idle' | 'capturing' | 'uploading'>('idle')
  const [isRecording, setIsRecording] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const photoLimitLabel = useMemo(() => {
    if (!mediaState) return '--'
    return mediaState.policy.maxPhotos === null
      ? 'Unlimited'
      : `${mediaState.counts.photos}/${mediaState.policy.maxPhotos}`
  }, [mediaState])

  const videoLimitLabel = useMemo(() => {
    if (!mediaState) return '--'
    if (!mediaState.policy.allowVideos) return 'Not allowed'
    return mediaState.policy.maxVideos === null
      ? 'Unlimited'
      : `${mediaState.counts.videos}/${mediaState.policy.maxVideos}`
  }, [mediaState])

  async function loadMediaState() {
    const response = await fetch('/api/member/media', {
      method: 'GET',
      credentials: 'include',
    })

    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.error || 'Unable to load media policy')
    }

    setMediaState(data as MediaState)
    return data as MediaState
  }

  function stopPreview() {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    if (previewRef.current) {
      previewRef.current.srcObject = null
    }
  }

  async function openCamera() {
    setError('')
    setMessage('')

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: true,
      })

      streamRef.current = stream
      if (previewRef.current) {
        previewRef.current.srcObject = stream
        await previewRef.current.play().catch(() => undefined)
      }
      setStatus('capturing')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Camera or microphone permission denied.')
    }
  }

  async function uploadBlob(path: string, blob: Blob) {
    if (!supabase) {
      throw new Error('Upload storage is not configured.')
    }

    const { error: uploadError } = await supabase.storage
      .from('profile-photos')
      .upload(path, blob, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      throw uploadError
    }

    const { data } = supabase.storage.from('profile-photos').getPublicUrl(path)
    if (!data?.publicUrl) {
      throw new Error('Unable to get uploaded media URL.')
    }

    return data.publicUrl
  }

  async function saveMedia(kind: 'photo' | 'video', url: string, watermarked: boolean) {
    const response = await fetch('/api/member/media', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ kind, url, watermarked }),
    })

    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.error || 'Unable to save media to profile.')
    }

    setMediaState((previousState) => {
      if (!previousState) return previousState
      return {
        ...previousState,
        counts: data.counts,
        photoUrls: data.photoUrls,
        videoUrls: data.videoUrls,
      }
    })
  }

  async function capturePhoto() {
    if (!previewRef.current || !streamRef.current || !mediaState) {
      return
    }

    if (mediaState.policy.maxPhotos !== null && mediaState.counts.photos >= mediaState.policy.maxPhotos) {
      setError(`Photo limit reached (${mediaState.policy.maxPhotos}).`)
      return
    }

    setError('')
    setMessage('')
    setStatus('uploading')

    try {
      const video = previewRef.current
      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth || 1280
      canvas.height = video.videoHeight || 720
      const context = canvas.getContext('2d')

      if (!context) {
        throw new Error('Unable to capture photo frame.')
      }

      context.drawImage(video, 0, 0, canvas.width, canvas.height)

      if (mediaState.policy.requireWatermark) {
        const stamp = 'BURNER PREVIEW'
        context.fillStyle = 'rgba(0, 0, 0, 0.45)'
        context.fillRect(canvas.width - 340, canvas.height - 70, 320, 48)
        context.fillStyle = 'rgba(255, 255, 255, 0.9)'
        context.font = '700 28px sans-serif'
        context.fillText(stamp, canvas.width - 325, canvas.height - 36)
      }

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (outputBlob) => {
            if (!outputBlob) {
              reject(new Error('Failed to encode photo.'))
              return
            }
            resolve(outputBlob)
          },
          'image/jpeg',
          0.92
        )
      })

      const path = `profile-photos/camera/${Date.now()}-${Math.random().toString(36).slice(2)}${
        mediaState.policy.requireWatermark ? '-wm' : ''
      }.jpg`

      const uploadedUrl = await uploadBlob(path, blob)
      await saveMedia('photo', uploadedUrl, mediaState.policy.requireWatermark)
      setMessage('Photo saved to your profile gallery.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to capture photo.')
    } finally {
      setStatus('capturing')
    }
  }

  async function startRecording() {
    if (!streamRef.current || !mediaState) {
      return
    }

    if (!mediaState.policy.allowVideos) {
      setError('Video capture is not available for your account tier.')
      return
    }

    if (mediaState.policy.maxVideos !== null && mediaState.counts.videos >= mediaState.policy.maxVideos) {
      setError(`Video limit reached (${mediaState.policy.maxVideos}).`)
      return
    }

    setError('')
    setMessage('')

    const mimeType = chooseRecorderMimeType()
    const recorder = mimeType
      ? new MediaRecorder(streamRef.current, { mimeType })
      : new MediaRecorder(streamRef.current)

    chunksRef.current = []
    mediaRecorderRef.current = recorder

    recorder.ondataavailable = (event: BlobEvent) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data)
      }
    }

    recorder.onstop = async () => {
      setStatus('uploading')
      try {
        const outputType = recorder.mimeType || 'video/webm'
        const blob = new Blob(chunksRef.current, { type: outputType })

        const path = `profile-videos/camera/${Date.now()}-${Math.random().toString(36).slice(2)}.webm`
        const uploadedUrl = await uploadBlob(path, blob)
        await saveMedia('video', uploadedUrl, false)
        setMessage('Video saved to your profile.')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to save recording.')
      } finally {
        setStatus('capturing')
      }
    }

    recorder.start(250)
    setIsRecording(true)
  }

  function stopRecording() {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
      return
    }

    mediaRecorderRef.current.stop()
    setIsRecording(false)
  }

  useEffect(() => {
    void loadMediaState().catch((err) => {
      setError(err instanceof Error ? err.message : 'Unable to load media state.')
    })

    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop()
      }
      stopPreview()
    }
  }, [])

  const canUseCamera = status !== 'uploading'

  return (
    <section className="rounded-3xl border border-white/10 bg-black/35 p-4 backdrop-blur-xl sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.24em] text-stone-400">Profile Camera</p>
          <h2 className="mt-1 text-xl font-semibold">Capture Photos and Videos</h2>
          <p className="mt-1 text-sm text-stone-400">Open your webcam and mic, capture content, then save it directly to your profile media.</p>
        </div>
        <Button variant="secondary" onClick={() => void loadMediaState()} className="gap-2">
          <UploadCloud className="h-4 w-4" />
          Refresh Limits
        </Button>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm text-stone-300">
          <p className="text-xs uppercase tracking-[0.18em] text-stone-400">Plan</p>
          <p className="mt-1 font-semibold text-stone-100">{mediaState?.policy.tier || '...'}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm text-stone-300">
          <p className="text-xs uppercase tracking-[0.18em] text-stone-400">Photos</p>
          <p className="mt-1 font-semibold text-stone-100">{photoLimitLabel}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm text-stone-300">
          <p className="text-xs uppercase tracking-[0.18em] text-stone-400">Videos</p>
          <p className="mt-1 font-semibold text-stone-100">{videoLimitLabel}</p>
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-black">
        <video ref={previewRef} className="aspect-video w-full object-cover" autoPlay muted playsInline />
        {!streamRef.current && (
          <div className="flex aspect-video items-center justify-center text-sm text-stone-400">
            Camera preview appears here once you start capture.
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button onClick={() => void openCamera()} disabled={!canUseCamera} className="gap-2">
          <Camera className="h-4 w-4" />
          Open Camera
        </Button>
        <Button variant="outline" onClick={stopPreview} disabled={!streamRef.current || !canUseCamera} className="gap-2">
          <CameraOff className="h-4 w-4" />
          Close Camera
        </Button>
        <Button variant="outline" onClick={() => void capturePhoto()} disabled={!streamRef.current || !canUseCamera} className="gap-2">
          <Circle className="h-4 w-4" />
          Capture Photo
        </Button>
        {!isRecording ? (
          <Button
            variant="outline"
            onClick={() => void startRecording()}
            disabled={!streamRef.current || !canUseCamera || !mediaState?.policy.allowVideos}
            className="gap-2"
          >
            <Circle className="h-4 w-4" />
            Record Video
          </Button>
        ) : (
          <Button variant="destructive" onClick={stopRecording} className="gap-2">
            <Square className="h-4 w-4" />
            Stop Recording
          </Button>
        )}
      </div>

      {status === 'uploading' && (
        <p className="mt-3 inline-flex items-center gap-2 rounded-xl border border-sky-400/25 bg-sky-500/10 px-3 py-2 text-sm text-sky-200">
          <Loader2 className="h-4 w-4 animate-spin" />
          Uploading and saving to profile...
        </p>
      )}

      {error && (
        <p className="mt-3 rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
          {error}
        </p>
      )}

      {message && (
        <p className="mt-3 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
          {message}
        </p>
      )}

      {mediaState?.policy.requireWatermark && (
        <p className="mt-3 text-xs text-amber-300">
          Burner uploads are photo-only and automatically watermarked.
        </p>
      )}
    </section>
  )
}
