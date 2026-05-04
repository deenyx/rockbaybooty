'use client'

import { useEffect } from 'react'

const PING_INTERVAL_MS = 2 * 60 * 1000 // 2 minutes

export default function ActivityPing() {
  useEffect(() => {
    function ping() {
      fetch('/api/ping', { method: 'POST' }).catch(() => {})
    }
    ping()
    const id = setInterval(ping, PING_INTERVAL_MS)
    return () => clearInterval(id)
  }, [])

  return null
}
