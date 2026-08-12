const http = require("http")
const { URL } = require("url")
const crypto = require("crypto")
const fs = require("fs/promises")

function readNumber(name, fallback, { min = Number.NEGATIVE_INFINITY, max = Number.POSITIVE_INFINITY } = {}) {
  const raw = process.env[name]
  if (raw === undefined || String(raw).trim() === "") return fallback

  const parsed = Number(raw)
  if (!Number.isFinite(parsed)) {
    console.warn(`[config] ${name}="${raw}" is not a number; using ${fallback}`)
    return fallback
  }

  return Math.min(max, Math.max(min, parsed))
}

function readBoolean(name, fallback) {
  const raw = process.env[name]
  if (raw === undefined || String(raw).trim() === "") return fallback
  return !["0", "false", "no", "off"].includes(String(raw).trim().toLowerCase())
}

const PORT = readNumber("PORT", 4010, { min: 1, max: 65535 })
const MAX_ACTIVE = readNumber("MAX_ACTIVE", 175, { min: 1 })
const MAX_QUEUE = readNumber("MAX_QUEUE", 0, { min: 0 })
const SESSION_MS = readNumber("SESSION_MS", 24 * 60 * 60 * 1000, { min: 1000 })
const ACTIVE_HEARTBEAT_TIMEOUT_MS = readNumber("ACTIVE_HEARTBEAT_TIMEOUT_MS", 20 * 1000, { min: 10 * 1000 })
const HEARTBEAT_SWEEP_MS = Math.max(3 * 1000, Math.floor(ACTIVE_HEARTBEAT_TIMEOUT_MS / 2))
const QUEUE_HEARTBEAT_TIMEOUT_MS = readNumber("QUEUE_HEARTBEAT_TIMEOUT_MS", 5 * 60 * 1000, { min: 60 * 1000 })
const WINDOW_LOCK_RETRY_SECONDS = readNumber("WINDOW_LOCK_RETRY_SECONDS", 30, { min: 1 })
const ONLINE_MAX_USERS = readNumber("ONLINE_MAX_USERS", 1000, { min: 1 })
const PRESENCE_TTL_MS = readNumber("PRESENCE_TTL_MS", 45 * 1000, { min: 15 * 1000 })
const PRESENCE_COUNT_CACHE_MS = readNumber("PRESENCE_COUNT_CACHE_MS", 3000, { min: 1000 })
const PRESENCE_BACKEND = String(process.env.PRESENCE_BACKEND || "pocketbase")
  .trim()
  .toLowerCase()
const ACCESS_LOG_ENABLED = readBoolean("ACCESS_LOG_ENABLED", PRESENCE_BACKEND !== "pocketbase")
const ACCESS_LOG_PATH = String(process.env.ACCESS_LOG_PATH || "/var/log/nginx/access.log").trim()
const ACCESS_LOG_WINDOW_MS = readNumber("ACCESS_LOG_WINDOW_MS", 2 * 60 * 1000, { min: 30 * 1000 })
const ACCESS_LOG_CACHE_MS = readNumber("ACCESS_LOG_CACHE_MS", 10 * 1000, { min: 2 * 1000 })
const ACCESS_LOG_TAIL_BYTES = readNumber("ACCESS_LOG_TAIL_BYTES", 1_000_000, { min: 150_000 })
const POCKETBASE_URL = String(process.env.POCKETBASE_URL || "")
  .trim()
  .replace(/\/+$/g, "")
const POCKETBASE_ADMIN_EMAIL = String(process.env.POCKETBASE_ADMIN_EMAIL || "").trim()
const POCKETBASE_ADMIN_PASSWORD = String(process.env.POCKETBASE_ADMIN_PASSWORD || "").trim()
const POCKETBASE_COLLECTION = String(process.env.POCKETBASE_COLLECTION || "presence_sessions").trim()
const POCKETBASE_ENABLED = Boolean(
  PRESENCE_BACKEND === "pocketbase" && POCKETBASE_URL && POCKETBASE_ADMIN_EMAIL && POCKETBASE_ADMIN_PASSWORD && POCKETBASE_COLLECTION,
)
const activeByDevice = new Map()
const activeByToken = new Map()
const queue = []
const memoryPresence = new Map()
let pocketbaseToken = ""
let pocketbaseTokenExpiresAt = 0
let pocketbaseAuthPath = ""
let pocketbaseAuthInFlight = null
const lastPresenceErrorAt = new Map()
let pocketbaseCountCache = {
  value: 0,
  expiresAt: 0,
}
let accessLogCountCache = {
  value: 0,
  expiresAt: 0,
}

function now() {
  return Date.now()
}

function toPocketbaseDate(ts) {
  return new Date(ts).toISOString().replace("T", " ")
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function logPresenceError(error, context) {
  const ts = now()
  const lastAt = lastPresenceErrorAt.get(context) || 0
  if (ts - lastAt < 10_000) return
  lastPresenceErrorAt.set(context, ts)
  const message = error instanceof Error ? error.message : String(error)
  console.warn(`[presence:${context}] ${message}`)
}

const MONTH_INDEX = {
  Jan: 0,
  Feb: 1,
  Mar: 2,
  Apr: 3,
  May: 4,
  Jun: 5,
  Jul: 6,
  Aug: 7,
  Sep: 8,
  Oct: 9,
  Nov: 10,
  Dec: 11,
}

function parseNginxTimestampToEpochMs(raw) {
  const match = /^(\d{2})\/([A-Za-z]{3})\/(\d{4}):(\d{2}):(\d{2}):(\d{2})\s+([+-]\d{4})$/.exec(raw)
  if (!match) return 0

  const [, dayRaw, monthRaw, yearRaw, hourRaw, minuteRaw, secondRaw, tzRaw] = match
  const month = MONTH_INDEX[monthRaw]
  if (month === undefined) return 0

  const year = Number(yearRaw)
  const day = Number(dayRaw)
  const hour = Number(hourRaw)
  const minute = Number(minuteRaw)
  const second = Number(secondRaw)

  const sign = tzRaw.startsWith("-") ? -1 : 1
  const tzHour = Number(tzRaw.slice(1, 3))
  const tzMinute = Number(tzRaw.slice(3, 5))
  const offsetMs = sign * (tzHour * 60 + tzMinute) * 60 * 1000

  const utcMs = Date.UTC(year, month, day, hour, minute, second)
  return utcMs - offsetMs
}

async function readTailChunk(filePath, maxBytes) {
  let handle
  try {
    handle = await fs.open(filePath, "r")
    const stats = await handle.stat()
    const size = Number(stats.size || 0)
    if (size <= 0) return ""

    const readLength = Math.min(size, maxBytes)
    const start = size - readLength
    const buffer = Buffer.alloc(readLength)
    const { bytesRead } = await handle.read(buffer, 0, readLength, start)
    return buffer.subarray(0, bytesRead).toString("utf8")
  } catch {
    return ""
  } finally {
    if (handle) {
      await handle.close().catch(() => {})
    }
  }
}

async function countRecentVisitorsFromAccessLog(force = false) {
  if (!ACCESS_LOG_ENABLED || !ACCESS_LOG_PATH) return 0

  const ts = now()
  if (!force && accessLogCountCache.expiresAt > ts) {
    return accessLogCountCache.value
  }

  const text = await readTailChunk(ACCESS_LOG_PATH, ACCESS_LOG_TAIL_BYTES)
  if (!text) {
    accessLogCountCache = { value: 0, expiresAt: ts + ACCESS_LOG_CACHE_MS }
    return 0
  }

  const cutoff = ts - ACCESS_LOG_WINDOW_MS
  const lines = text.split("\n")
  const seen = new Set()

  for (let i = lines.length - 1; i >= 0; i -= 1) {
    const line = lines[i]
    if (!line) continue

    const match = /^(\S+)\s+\S+\s+\S+\s+\[([^\]]+)\]\s+"[A-Z]+\s+(\S+)/.exec(line)
    if (!match) continue

    const ip = match[1]
    const timestampMs = parseNginxTimestampToEpochMs(match[2])
    if (!timestampMs) continue

    if (timestampMs < cutoff) break

    if (ip) {
      seen.add(ip)
    }
  }

  const count = seen.size
  accessLogCountCache = { value: count, expiresAt: ts + ACCESS_LOG_CACHE_MS }
  return count
}

function json(res, statusCode, payload) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  })
  res.end(JSON.stringify(payload))
}

const MAX_BODY_BYTES = 100_000

class HttpError extends Error {
  constructor(statusCode, message) {
    super(message)
    this.name = "HttpError"
    this.statusCode = statusCode
  }
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    let size = 0
    let settled = false

    const settle = (fn, value) => {
      if (settled) return
      settled = true
      req.off("data", onData)
      req.off("end", onEnd)
      req.off("error", onError)
      fn(value)
    }

    const onData = (chunk) => {
      size += chunk.length
      if (size > MAX_BODY_BYTES) {
        chunks.length = 0
        settle(reject, new HttpError(413, "Body too large."))
        req.resume()
        return
      }
      chunks.push(chunk)
    }

    const onEnd = () => {
      if (size === 0) return settle(resolve, {})

      let parsed
      try {
        parsed = JSON.parse(Buffer.concat(chunks).toString("utf8"))
      } catch {
        return settle(reject, new HttpError(400, "Invalid JSON."))
      }

      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        return settle(reject, new HttpError(400, "Body must be a JSON object."))
      }

      settle(resolve, parsed)
    }

    const onError = (error) => settle(reject, error)

    req.on("data", onData)
    req.on("end", onEnd)
    req.on("error", onError)
  })
}

function createToken() {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function activeCount() {
  return activeByDevice.size
}

function removeFromQueue(deviceId) {
  const index = queue.findIndex((entry) => entry.deviceId === deviceId)
  if (index >= 0) queue.splice(index, 1)
}

function removeActive(deviceId) {
  const existing = activeByDevice.get(deviceId)
  if (!existing) return
  activeByToken.delete(existing.token)
  activeByDevice.delete(deviceId)
}

function renewSession(session, ts = now()) {
  if (!session) return
  session.lastSeenAt = ts
  session.expiresAt = ts + SESSION_MS
}

function cleanup() {
  const ts = now()

  for (const [deviceId, session] of activeByDevice.entries()) {
    const expired = session.expiresAt <= ts
    const stale = ts - session.lastSeenAt > ACTIVE_HEARTBEAT_TIMEOUT_MS
    if (expired || stale) {
      removeActive(deviceId)
    }
  }

  const seenDevice = new Set()
  for (let i = queue.length - 1; i >= 0; i -= 1) {
    const entry = queue[i]
    if (!entry || !entry.deviceId) {
      queue.splice(i, 1)
      continue
    }

    if (seenDevice.has(entry.deviceId) || activeByDevice.has(entry.deviceId)) {
      queue.splice(i, 1)
      continue
    }

    if (ts - (entry.lastSeenAt || entry.joinedAt || 0) > QUEUE_HEARTBEAT_TIMEOUT_MS) {
      queue.splice(i, 1)
      continue
    }

    seenDevice.add(entry.deviceId)
  }
}

function activate(deviceId, windowId) {
  const existing = activeByDevice.get(deviceId)
  if (existing) return existing

  const startedAt = now()
  const session = {
    token: createToken(),
    deviceId,
    windowId,
    startedAt,
    lastSeenAt: startedAt,
    expiresAt: startedAt + SESSION_MS,
  }

  activeByDevice.set(deviceId, session)
  activeByToken.set(session.token, deviceId)
  removeFromQueue(deviceId)
  return session
}

function promote() {
  cleanup()
  while (activeCount() < MAX_ACTIVE && queue.length > 0) {
    const next = queue.shift()
    if (!next || !next.deviceId || !next.windowId) continue
    if (activeByDevice.has(next.deviceId)) continue
    activate(next.deviceId, next.windowId)
  }
}

function basePayload() {
  return {
    activeCount: activeCount(),
    queueSize: queue.length,
    maxActive: MAX_ACTIVE,
  }
}

function lockedWindowPayload(message) {
  return {
    status: "locked_window",
    code: "window_locked",
    retryAfterSeconds: WINDOW_LOCK_RETRY_SECONDS,
    message: message || "It appears another proxy window is open. Please close it and try again.",
    ...basePayload(),
  }
}

function queueState(deviceId, windowId) {
  const queuedEntry = queue.find((entry) => entry.deviceId === deviceId)
  if (queuedEntry) queuedEntry.lastSeenAt = now()

  promote()

  const active = activeByDevice.get(deviceId)
  if (active) {
    if (windowId && active.windowId !== windowId) {
      return lockedWindowPayload("It appears another proxy window is open. Please close it and try again.")
    }

    renewSession(active)

    return {
      status: "active",
      code: "active",
      token: active.token,
      expiresAt: active.expiresAt,
      ...basePayload(),
    }
  }

  const position = queue.findIndex((entry) => entry.deviceId === deviceId)
  if (position >= 0) {
    return {
      status: "queued",
      code: "max_active",
      message: "Max people are currently using proxy. Use the button below to enter queue.",
      position: position + 1,
      ...basePayload(),
    }
  }

  return {
    status: "idle",
    ...basePayload(),
  }
}

function handleJoin(deviceId, windowId) {
  promote()

  const active = activeByDevice.get(deviceId)
  if (active) {
    if (active.windowId !== windowId) {
      return lockedWindowPayload("It appears another proxy window is open. Please close it and try again.")
    }

    renewSession(active)
    return queueState(deviceId, windowId)
  }

  const existingQueueIndex = queue.findIndex((entry) => entry.deviceId === deviceId)
  if (existingQueueIndex >= 0) {
    queue[existingQueueIndex].windowId = windowId
    queue[existingQueueIndex].lastSeenAt = now()
    return queueState(deviceId, windowId)
  }

  if (activeCount() < MAX_ACTIVE) {
    activate(deviceId, windowId)
    return queueState(deviceId, windowId)
  }

  if (MAX_QUEUE > 0 && queue.length >= MAX_QUEUE) {
    return {
      status: "error",
      code: "queue_full",
      message: "Queue is full. Try again in a bit.",
      ...basePayload(),
    }
  }

  queue.push({ deviceId, windowId, joinedAt: now(), lastSeenAt: now() })
  return queueState(deviceId, windowId)
}

function touchSession(deviceId, windowId, token) {
  const active = activeByDevice.get(deviceId)
  if (!active) return queueState(deviceId, windowId)

  if (token && active.token !== token) {
    return lockedWindowPayload("Active session token mismatch. Please close extra proxy windows and try again.")
  }

  if (windowId && active.windowId !== windowId) {
    return lockedWindowPayload("It appears another proxy window is open. Please close it and try again.")
  }

  renewSession(active)
  return queueState(deviceId, windowId)
}

function validateDeviceId(deviceId) {
  return typeof deviceId === "string" && deviceId.length >= 6 && deviceId.length <= 120
}

function validateWindowId(windowId) {
  return typeof windowId === "string" && windowId.length >= 6 && windowId.length <= 120
}

function validatePresenceSessionId(sessionId) {
  return typeof sessionId === "string" && sessionId.length >= 12 && sessionId.length <= 120
}

function validateCaddyAskDomain(domain) {
  if (typeof domain !== "string") return false
  const trimmed = domain.trim().toLowerCase()
  if (!trimmed || trimmed.length > 253) return false
  if (!trimmed.includes(".")) return false
  if (!/^[a-z0-9.-]+$/.test(trimmed)) return false

  const labels = trimmed.split(".")
  if (labels.some((label) => !label || label.length > 63 || label.startsWith("-") || label.endsWith("-"))) {
    return false
  }

  return true
}

function cleanupMemoryPresence(ts = now()) {
  for (const [sessionId, expiresAt] of memoryPresence.entries()) {
    if (expiresAt <= ts) {
      memoryPresence.delete(sessionId)
    }
  }
}

function memoryPresenceHeartbeat(sessionId) {
  cleanupMemoryPresence()
  memoryPresence.set(sessionId, now() + PRESENCE_TTL_MS)
  return memoryPresence.size
}

function memoryPresenceRelease(sessionId) {
  memoryPresence.delete(sessionId)
  cleanupMemoryPresence()
  return memoryPresence.size
}

function memoryPresenceCount() {
  cleanupMemoryPresence()
  return memoryPresence.size
}

function escapePocketbaseFilterValue(value) {
  return String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"')
}

function invalidatePocketbaseCountCache() {
  pocketbaseCountCache = { value: 0, expiresAt: 0 }
}

function pocketbaseRecordsBasePath() {
  return `/api/collections/${encodeURIComponent(POCKETBASE_COLLECTION)}/records`
}

async function pocketbaseAuthenticate(force = false) {
  if (!POCKETBASE_ENABLED) return false
  if (!force && pocketbaseToken && pocketbaseTokenExpiresAt > now() + 5_000) return true

  if (pocketbaseAuthInFlight) return pocketbaseAuthInFlight

  pocketbaseAuthInFlight = performPocketbaseAuth().finally(() => {
    pocketbaseAuthInFlight = null
  })

  return pocketbaseAuthInFlight
}

async function performPocketbaseAuth() {
  const payload = {
    identity: POCKETBASE_ADMIN_EMAIL,
    email: POCKETBASE_ADMIN_EMAIL,
    password: POCKETBASE_ADMIN_PASSWORD,
  }

  const candidatePaths = pocketbaseAuthPath
    ? [pocketbaseAuthPath]
    : ["/api/collections/_superusers/auth-with-password", "/api/admins/auth-with-password"]

  let lastError = new Error("PocketBase authentication failed")
  for (const path of candidatePaths) {
    try {
      const response = await fetch(`${POCKETBASE_URL}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const bodyText = await response.text()
      const body = bodyText ? JSON.parse(bodyText) : {}
      if (!response.ok) {
        throw new Error(`PocketBase auth ${response.status}: ${bodyText || "Unknown error"}`)
      }

      if (!body || typeof body.token !== "string" || !body.token) {
        throw new Error("PocketBase auth succeeded without token")
      }

      pocketbaseToken = body.token
      pocketbaseTokenExpiresAt = now() + 50 * 60 * 1000
      pocketbaseAuthPath = path
      return true
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
    }
  }

  throw lastError
}

async function pocketbaseRequest(method, path, body, retry = true) {
  await pocketbaseAuthenticate()

  const response = await fetch(`${POCKETBASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: pocketbaseToken,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  if (response.status === 401 && retry) {
    pocketbaseToken = ""
    pocketbaseTokenExpiresAt = 0
    await pocketbaseAuthenticate(true)
    return pocketbaseRequest(method, path, body, false)
  }

  const bodyText = await response.text()
  const parsed = bodyText ? JSON.parse(bodyText) : null
  if (!response.ok) {
    throw new Error(`PocketBase ${method} ${path} failed (${response.status}): ${bodyText || "Unknown error"}`)
  }
  return parsed
}

async function pocketbaseFindSession(sessionId) {
  const params = new URLSearchParams({
    page: "1",
    perPage: "1",
    filter: `session_id="${escapePocketbaseFilterValue(sessionId)}"`,
  })

  const payload = await pocketbaseRequest("GET", `${pocketbaseRecordsBasePath()}?${params.toString()}`)
  const item = payload && Array.isArray(payload.items) ? payload.items[0] : null
  return item
}

async function pocketbaseHeartbeat(sessionId) {
  const expiresAt = toPocketbaseDate(now() + PRESENCE_TTL_MS)
  const existing = await pocketbaseFindSession(sessionId)
  const data = {
    session_id: sessionId,
    expires_at: expiresAt,
  }

  if (existing && existing.id) {
    await pocketbaseRequest("PATCH", `${pocketbaseRecordsBasePath()}/${existing.id}`, data)
  } else {
    await pocketbaseRequest("POST", pocketbaseRecordsBasePath(), data)
  }

  invalidatePocketbaseCountCache()
}

async function pocketbaseRelease(sessionId) {
  const existing = await pocketbaseFindSession(sessionId)
  if (existing && existing.id) {
    await pocketbaseRequest("DELETE", `${pocketbaseRecordsBasePath()}/${existing.id}`)
    invalidatePocketbaseCountCache()
  }
}

async function pocketbaseCleanupExpired() {
  const filter = `expires_at <= "${toPocketbaseDate(now())}"`
  let deleted = 0

  for (let page = 0; page < 50; page += 1) {
    const params = new URLSearchParams({
      page: "1",
      perPage: "200",
      filter,
    })

    const payload = await pocketbaseRequest("GET", `${pocketbaseRecordsBasePath()}?${params.toString()}`)
    const items = payload && Array.isArray(payload.items) ? payload.items : []
    if (items.length === 0) break

    for (const item of items) {
      if (!item || !item.id) continue
      await pocketbaseRequest("DELETE", `${pocketbaseRecordsBasePath()}/${item.id}`)
      deleted += 1
    }

    if (items.length < 200) break
    await sleep(50)
  }

  if (deleted > 0) invalidatePocketbaseCountCache()
}

async function pocketbaseCountOnline(force = false) {
  if (!force && pocketbaseCountCache.expiresAt > now()) {
    return pocketbaseCountCache.value
  }

  const params = new URLSearchParams({
    page: "1",
    perPage: "1",
    filter: `expires_at > "${toPocketbaseDate(now())}"`,
  })
  const payload = await pocketbaseRequest("GET", `${pocketbaseRecordsBasePath()}?${params.toString()}`)
  const total = Number(payload?.totalItems || 0)
  pocketbaseCountCache = {
    value: total,
    expiresAt: now() + PRESENCE_COUNT_CACHE_MS,
  }
  return total
}

async function presenceHeartbeat(sessionId) {
  const memoryCount = memoryPresenceHeartbeat(sessionId)
  if (!POCKETBASE_ENABLED) return memoryCount

  try {
    await pocketbaseHeartbeat(sessionId)
    return pocketbaseCountOnline()
  } catch (error) {
    logPresenceError(error, "heartbeat")
    return memoryCount
  }
}

async function presenceRelease(sessionId) {
  const memoryCount = memoryPresenceRelease(sessionId)
  if (!POCKETBASE_ENABLED) return memoryCount

  try {
    await pocketbaseRelease(sessionId)
    return pocketbaseCountOnline(true)
  } catch (error) {
    logPresenceError(error, "release")
    return memoryCount
  }
}

async function presenceCount() {
  const memoryCount = memoryPresenceCount()
  let backendCount = memoryCount
  let backendHealthy = !POCKETBASE_ENABLED

  if (POCKETBASE_ENABLED) {
    try {
      backendCount = await pocketbaseCountOnline()
      backendHealthy = true
    } catch (error) {
      logPresenceError(error, "count")
      backendHealthy = false
      backendCount = memoryCount
    }
  }

  let accessLogCount = 0
  const shouldUseAccessLogFallback = ACCESS_LOG_ENABLED && (!POCKETBASE_ENABLED || !backendHealthy)
  if (shouldUseAccessLogFallback) {
    try {
      accessLogCount = await countRecentVisitorsFromAccessLog()
    } catch (error) {
      logPresenceError(error, "access-log-count")
    }
  }

  return Math.max(memoryCount, backendCount, accessLogCount)
}

async function presenceCleanup() {
  cleanupMemoryPresence()
  if (!POCKETBASE_ENABLED) return
  try {
    await pocketbaseCleanupExpired()
  } catch (error) {
    logPresenceError(error, "cleanup")
  }
}

function presencePayload(rawOnlineCount) {
  const safeCount = Math.max(0, Number(rawOnlineCount || 0))
  const capped = safeCount >= ONLINE_MAX_USERS
  return {
    onlineCount: capped ? ONLINE_MAX_USERS : safeCount,
    rawOnlineCount: safeCount,
    maxOnline: ONLINE_MAX_USERS,
    capped,
    display: capped ? "MAX" : String(safeCount),
    backend: POCKETBASE_ENABLED ? "pocketbase" : "memory",
  }
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === "OPTIONS") {
      return json(res, 200, { ok: true })
    }

    const parsed = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`)
    const pathname = parsed.pathname

    if (pathname === "/caddy/ask" && req.method === "GET") {
      const domain = parsed.searchParams.get("domain") || ""
      if (!validateCaddyAskDomain(domain)) {
        res.statusCode = 400
        res.end("invalid domain")
        return
      }

      res.statusCode = 200
      res.end("ok")
      return
    }

    if (pathname === "/health") {
      promote()
      const currentPresence = await presenceCount()
      return json(res, 200, {
        ok: true,
        activeCount: activeCount(),
        queueSize: queue.length,
        maxActive: MAX_ACTIVE,
        maxQueue: MAX_QUEUE,
        sessionMs: SESSION_MS,
        heartbeatTimeoutMs: ACTIVE_HEARTBEAT_TIMEOUT_MS,
        onlineUsers: presencePayload(currentPresence),
      })
    }

    if (pathname === "/presence/count" && req.method === "GET") {
      const currentPresence = await presenceCount()
      return json(res, 200, {
        ok: true,
        ...presencePayload(currentPresence),
      })
    }

    if (pathname === "/presence/heartbeat" && req.method === "POST") {
      const body = await parseBody(req)
      const sessionId = typeof body.sessionId === "string" ? body.sessionId.trim() : ""
      if (!validatePresenceSessionId(sessionId)) {
        return json(res, 400, { status: "error", message: "Missing or invalid sessionId." })
      }

      const currentPresence = await presenceHeartbeat(sessionId)
      return json(res, 200, {
        ok: true,
        sessionId,
        ttlMs: PRESENCE_TTL_MS,
        ...presencePayload(currentPresence),
      })
    }

    if (pathname === "/presence/release" && req.method === "POST") {
      const body = await parseBody(req)
      const sessionId = typeof body.sessionId === "string" ? body.sessionId.trim() : ""
      if (!validatePresenceSessionId(sessionId)) {
        return json(res, 400, { status: "error", message: "Missing or invalid sessionId." })
      }

      const currentPresence = await presenceRelease(sessionId)
      return json(res, 200, {
        ok: true,
        ...presencePayload(currentPresence),
      })
    }

    if (pathname === "/join" && req.method === "POST") {
      const body = await parseBody(req)
      const deviceId = body.deviceId
      const windowId = body.windowId

      if (!validateDeviceId(deviceId)) {
        return json(res, 400, { status: "error", message: "Missing or invalid deviceId." })
      }

      if (!validateWindowId(windowId)) {
        return json(res, 400, { status: "error", message: "Missing or invalid windowId." })
      }

      const result = handleJoin(deviceId, windowId)
      return json(res, 200, result)
    }

    if (pathname === "/status" && req.method === "GET") {
      const deviceId = parsed.searchParams.get("deviceId") || ""
      const windowId = parsed.searchParams.get("windowId") || ""

      if (!validateDeviceId(deviceId)) {
        return json(res, 400, { status: "error", message: "Missing or invalid deviceId." })
      }

      if (!validateWindowId(windowId)) {
        return json(res, 400, { status: "error", message: "Missing or invalid windowId." })
      }

      return json(res, 200, queueState(deviceId, windowId))
    }

    if (pathname === "/ping" && req.method === "POST") {
      const body = await parseBody(req)
      const deviceId = typeof body.deviceId === "string" ? body.deviceId : ""
      const windowId = typeof body.windowId === "string" ? body.windowId : ""
      const token = typeof body.token === "string" ? body.token : ""

      if (!validateDeviceId(deviceId) || !validateWindowId(windowId)) {
        return json(res, 400, { status: "error", message: "Missing or invalid deviceId/windowId." })
      }

      const result = touchSession(deviceId, windowId, token)
      return json(res, 200, result)
    }

    if (pathname === "/release" && req.method === "POST") {
      const body = await parseBody(req)
      const token = typeof body.token === "string" ? body.token : ""
      const explicitDeviceId = typeof body.deviceId === "string" ? body.deviceId : ""
      const explicitWindowId = typeof body.windowId === "string" ? body.windowId : ""
      const tokenDeviceId = token ? activeByToken.get(token) : ""
      const deviceId = tokenDeviceId || explicitDeviceId

      if (!validateDeviceId(deviceId)) {
        return json(res, 400, { status: "error", message: "Missing valid token or deviceId." })
      }

      const hasValidToken = Boolean(tokenDeviceId) && tokenDeviceId === deviceId

      const active = activeByDevice.get(deviceId)
      if (active) {
        const ownsSession = hasValidToken || (Boolean(explicitWindowId) && active.windowId === explicitWindowId)
        if (!ownsSession) {
          return json(res, 403, {
            status: "error",
            code: "not_session_owner",
            message: "Provide the session token or the owning windowId to release this session.",
          })
        }
        removeActive(deviceId)
      }

      const queuedIndex = queue.findIndex((entry) => entry.deviceId === deviceId)
      if (queuedIndex >= 0) {
        const queued = queue[queuedIndex]
        const ownsQueueEntry = hasValidToken || (Boolean(explicitWindowId) && queued.windowId === explicitWindowId)
        if (ownsQueueEntry) {
          queue.splice(queuedIndex, 1)
        }
      }

      promote()
      return json(res, 200, { status: "idle", ...basePayload() })
    }

    return json(res, 404, { status: "error", message: "Not found." })
  } catch (error) {
    const statusCode = error instanceof HttpError ? error.statusCode : 500
    if (statusCode >= 500) {
      console.error("[queue-gate] request failed:", error)
    }

    if (res.headersSent || res.writableEnded) {
      res.destroy()
      return
    }

    return json(res, statusCode, {
      status: "error",
      message: error instanceof HttpError ? error.message : "Unknown server error.",
    })
  }
})

let sweepInFlight = false

const sweepTimer = setInterval(() => {
  cleanup()
  promote()

  if (sweepInFlight) return
  sweepInFlight = true
  presenceCleanup()
    .catch((error) => logPresenceError(error, "sweep"))
    .finally(() => {
      sweepInFlight = false
    })
}, HEARTBEAT_SWEEP_MS)

if (typeof sweepTimer.unref === "function") {
  sweepTimer.unref()
}

server.on("error", (error) => {
  console.error(`[queue-gate] server error: ${error instanceof Error ? error.message : String(error)}`)
  process.exitCode = 1
  clearInterval(sweepTimer)
  server.close(() => process.exit(1))
})

process.on("unhandledRejection", (reason) => {
  console.error("[queue-gate] unhandled rejection:", reason)
})

let shuttingDown = false
function shutdown(signal) {
  if (shuttingDown) return
  shuttingDown = true
  console.log(`[queue-gate] ${signal} received, shutting down`)
  clearInterval(sweepTimer)
  server.close(() => process.exit(0))
  setTimeout(() => process.exit(0), 5000).unref()
}

process.on("SIGTERM", () => shutdown("SIGTERM"))
process.on("SIGINT", () => shutdown("SIGINT"))

server.listen(PORT, "127.0.0.1", () => {
  console.log(
    `1Key queue gate running on http://127.0.0.1:${PORT} ` +
      `(presence=${POCKETBASE_ENABLED ? "pocketbase" : "memory"}, onlineMax=${ONLINE_MAX_USERS}, ` +
      `maxActive=${MAX_ACTIVE})`,
  )
})
