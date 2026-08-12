"use client"

export type PresenceCountResponse = {
  ok: boolean
  onlineCount: number
  rawOnlineCount?: number
  maxOnline: number
  capped: boolean
  display?: string
  backend?: string
}

const PRESENCE_API_BASE = "/api/queue/presence"
const SESSION_STORAGE_KEY = "1key-presence-session-id"
export const ONLINE_MAX_FALLBACK = 1000

function randomSessionId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

export function getPresenceSessionId() {
  if (typeof window === "undefined") return ""
  try {
    const existing = window.sessionStorage.getItem(SESSION_STORAGE_KEY)
    if (existing) return existing
    const created = randomSessionId()
    window.sessionStorage.setItem(SESSION_STORAGE_KEY, created)
    return created
  } catch {
    return randomSessionId()
  }
}

async function postPresence(path: string, payload: Record<string, unknown>) {
  await fetch(`${PRESENCE_API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    keepalive: path === "/release",
    cache: "no-store",
  })
}

export async function heartbeatPresence(sessionId: string) {
  if (!sessionId) return
  await postPresence("/heartbeat", { sessionId })
}

export async function releasePresence(sessionId: string) {
  if (!sessionId) return
  await postPresence("/release", { sessionId })
}

export async function fetchPresenceCount() {
  try {
    const response = await fetch(`${PRESENCE_API_BASE}/count`, {
      method: "GET",
      cache: "no-store",
    })
    if (!response.ok) return null
    const payload = (await response.json()) as PresenceCountResponse
    return {
      onlineCount: Number(payload.onlineCount || 0),
      maxOnline: Number(payload.maxOnline || ONLINE_MAX_FALLBACK),
      capped: Boolean(payload.capped),
    }
  } catch {
    return null
  }
}
