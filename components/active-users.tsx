"use client"

import { useEffect } from "react"
import { getPresenceSessionId, heartbeatPresence, releasePresence } from "@/lib/presence-client"

const HEARTBEAT_INTERVAL_MS = 15_000

export function ActiveUsers() {
  useEffect(() => {
    const sessionId = getPresenceSessionId()
    if (!sessionId) return

    let stopped = false

    const beat = async () => {
      if (stopped) return
      await heartbeatPresence(sessionId).catch(() => {})
    }

    void beat()
    const intervalId = window.setInterval(() => {
      void beat()
    }, HEARTBEAT_INTERVAL_MS)

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void beat()
      }
    }

    const onPageHide = () => {
      void releasePresence(sessionId).catch(() => {})
    }

    document.addEventListener("visibilitychange", onVisibilityChange)
    window.addEventListener("pagehide", onPageHide)

    return () => {
      stopped = true
      window.clearInterval(intervalId)
      document.removeEventListener("visibilitychange", onVisibilityChange)
      window.removeEventListener("pagehide", onPageHide)
      void releasePresence(sessionId).catch(() => {})
    }
  }, [])

  return null
}
