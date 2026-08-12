"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  Hourglass,
  House,
  Maximize2,
  Minimize2,
  Search,
  TerminalSquare,
  Trash2,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type GateStatus = "loading" | "active" | "queued" | "idle" | "expired" | "error" | "locked_window"
type ConsoleLogLevel = "log" | "info" | "warn" | "error"

type QueuePayload = {
  status: GateStatus
  code?: string
  token?: string
  expiresAt?: number
  position?: number
  queueSize?: number
  activeCount?: number
  maxActive?: number
  retryAfterSeconds?: number
  message?: string
}

type BookmarkItem = {
  id: string
  label: string
  url: string
  createdAt: number
}

type ConsoleLog = {
  id: number
  level: ConsoleLogLevel
  message: string
  at: number
}

type NavigationResolution = {
  url: string
  warning: string
  blockedHost?: string
}

const DEVICE_KEY = "1key-proxy-device-id"
const WINDOW_KEY = "1key-proxy-window-id"
const BOOKMARKS_STORAGE_KEY = "1key-proxy-bookmarks-v4"
const APP_PROXY_HANDOFF_KEY = "1key-proxy-app-handoff-url"
const SCRAMJET_LAUNCH_KEY = "1key-scramjet-launch-url"
const SCRAMJET_LAUNCH_NONCE_KEY = "1key-scramjet-launch-nonce"
const SCRAMJET_LAUNCH_ACK_TIMEOUT_MS = 9000

const DEFAULT_HOME_URL = ""
const DUCKDUCKGO_SEARCH_URL = "https://duckduckgo.com/?kl=us-en&l=us-en&ia=web&q="
const API_BASE = "/api/queue"
const SCRAMJET_MOUNT = "/scramjet/?embed=1&v=11"
const HISTORY_MAX_ENTRIES = 120
const PROXY_HOME_GIF = "/images/ui/proxy-home-soman.gif"
const YOUTUBE_BROKEN_MESSAGE = "YouTube is currently broken. I'll fix it later, I promise."
const HOME_TYPE_PHRASES = [
  "Search something...",
  "Start browsing...",
  "Start connecting...",
  "Start discovering...",
]

const BLOCKED_SEARCH_HOSTS = [
  "google.com",
  "www.google.com",
  "search.google.com",
  "bing.com",
  "www.bing.com",
  "yahoo.com",
  "www.yahoo.com",
  "search.yahoo.com",
]
const ONEKEY_HOSTS = ["1key.lol", "www.1key.lol", "localhost", "127.0.0.1"]
const INACTIVITY_PROMPT_AFTER_MS = 15 * 60 * 1000
const INACTIVITY_CONFIRM_WINDOW_MS = 30 * 1000
const STATUS_POLL_INTERVAL_MS = 2000
const STATUS_RECOVERY_POLL_INTERVAL_MS = 5000
const TOLERATED_STATUS_FAILURES = 9

const makeSearchUrl = (query: string) => `${DUCKDUCKGO_SEARCH_URL}${encodeURIComponent(query)}`
const isLikelyHost = (value: string) => value.includes(".") && !value.includes(" ") && !value.startsWith("about:")
const isYoutubeHost = (host: string) =>
  host === "youtube.com" || host.endsWith(".youtube.com") || host === "youtu.be" || host.endsWith(".youtu.be")
const NOISY_HOST_SUFFIXES = [
  "googlevideo.com",
  "ytimg.com",
  "youtubei.googleapis.com",
  "doubleclick.net",
  "googlesyndication.com",
  "googleadservices.com",
  "gstatic.com",
]
const STATIC_RESOURCE_EXT_RE =
  /\.(?:js|mjs|css|map|json|txt|xml|svg|png|jpe?g|gif|webp|ico|woff2?|ttf|otf|eot|mp4|m4s|webm|mp3|m4a|ogg|wav|m3u8|ts|vtt|srt|webmanifest|wasm)$/i
const isLikelyDocumentNavigation = (value: string) => {
  try {
    const parsed = new URL(value)
    const host = parsed.hostname.toLowerCase()
    const path = parsed.pathname.toLowerCase()

    if (NOISY_HOST_SUFFIXES.some((suffix) => host === suffix || host.endsWith(`.${suffix}`))) return false
    if (STATIC_RESOURCE_EXT_RE.test(path)) return false

    if (isYoutubeHost(host)) {
      if (path.startsWith("/youtubei/")) return false
      if (path.startsWith("/api/")) return false
      if (path.startsWith("/ptracking")) return false
      if (path.startsWith("/player_204") || path.startsWith("/generate_204")) return false
    }

    return true
  } catch {
    return false
  }
}
const normalizeAddressUrl = (value: string) => {
  try {
    const parsed = new URL(value)
    const host = parsed.hostname.toLowerCase()
    if (!isYoutubeHost(host)) return parsed.toString()

    const keep = new URLSearchParams()
    for (const key of ["v", "list", "index", "t", "start", "si"]) {
      const val = parsed.searchParams.get(key)
      if (val) keep.set(key, val)
    }
    parsed.hash = ""
    const search = keep.toString()
    parsed.search = search ? `?${search}` : ""
    return parsed.toString()
  } catch {
    return value
  }
}
const youtubeVideoIdFromUrl = (value: string) => {
  try {
    const parsed = new URL(value)
    const host = parsed.hostname.toLowerCase()
    if (!isYoutubeHost(host)) return ""

    if (host === "youtu.be" || host.endsWith(".youtu.be")) {
      return parsed.pathname.replace(/^\/+/, "")
    }

    const fromQuery = parsed.searchParams.get("v")
    if (fromQuery) return fromQuery

    const segments = parsed.pathname.split("/").filter(Boolean)
    if (segments[0] === "shorts" && segments[1]) return segments[1]
    if (segments[0] === "live" && segments[1]) return segments[1]
    return ""
  } catch {
    return ""
  }
}

const forceEnglishTarget = (value: string) => {
  try {
    const parsed = new URL(value)
    const host = parsed.hostname.toLowerCase()
    if (!isYoutubeHost(host)) return parsed.toString()

    if (host === "youtu.be" || host.endsWith(".youtu.be")) {
      const id = parsed.pathname.replace(/^\/+/, "")
      parsed.hostname = "m.youtube.com"
      parsed.pathname = "/watch"
      parsed.search = ""
      if (id) parsed.searchParams.set("v", id)
    } else {
      parsed.hostname = "m.youtube.com"
    }

    parsed.searchParams.set("hl", "en")
    parsed.searchParams.set("gl", "US")
    parsed.searchParams.set("persist_hl", "1")
    parsed.searchParams.set("persist_gl", "1")
    parsed.searchParams.set("app", "m")
    parsed.hash = ""
    return parsed.toString()
  } catch {
    return value
  }
}
const decodeRepeated = (value: string, rounds = 4) => {
  let output = value
  for (let index = 0; index < rounds; index += 1) {
    try {
      const decoded = decodeURIComponent(output)
      if (decoded === output) break
      output = decoded
    } catch {
      break
    }
  }
  return output
}

const sanitizeLaunchUrl = (raw: string) => {
  let value = decodeRepeated(raw.trim())
  if (!value) return ""

  const baseOrigin = typeof window !== "undefined" ? window.location.origin : "https://1key.lol"
  const baseHost = (() => {
    try {
      return new URL(baseOrigin).hostname.toLowerCase()
    } catch {
      return "1key.lol"
    }
  })()

  for (let attempt = 0; attempt < 4; attempt += 1) {
    if (!value) return ""

    try {
      const parsed = new URL(value, baseOrigin)
      const host = parsed.hostname.toLowerCase()
      const isProxyLoopHost = ONEKEY_HOSTS.includes(host) || host === baseHost

      if (isProxyLoopHost && parsed.pathname.startsWith("/scramjet/")) {
        const tail = `${parsed.pathname.slice("/scramjet/".length)}${parsed.search}${parsed.hash}`
        value = decodeRepeated(tail)
        continue
      }

      if (parsed.protocol === "http:" || parsed.protocol === "https:") {
        return parsed.toString()
      }

      return ""
    } catch {
      if (value.startsWith("/scramjet/")) {
        value = decodeRepeated(value.slice("/scramjet/".length))
        continue
      }

      if (isLikelyHost(value)) {
        value = `https://${value}`
        continue
      }

      return ""
    }
  }

  return ""
}

const toUrlOrSearch = (value: string): NavigationResolution => {
  const trimmed = value.trim()
  if (!trimmed) return { url: DEFAULT_HOME_URL, warning: "" }

  const directCandidate =
    trimmed.startsWith("http://") || trimmed.startsWith("https://")
      ? trimmed
      : isLikelyHost(trimmed)
        ? `https://${trimmed}`
        : ""

  if (!directCandidate) return { url: makeSearchUrl(trimmed), warning: "" }

  try {
    const parsed = new URL(directCandidate)
    const host = parsed.hostname.toLowerCase()

    if (isYoutubeHost(host)) {
      return {
        url: "",
        warning: YOUTUBE_BROKEN_MESSAGE,
        blockedHost: parsed.hostname,
      }
    }

    const blockedHost = BLOCKED_SEARCH_HOSTS.includes(host)

    if (blockedHost) {
      return {
        url: "",
        warning: `${parsed.hostname} is blocked here. Use DuckDuckGo instead.`,
        blockedHost: parsed.hostname,
      }
    }

    return {
      url: forceEnglishTarget(parsed.toString()),
      warning: "",
    }
  } catch {
    return { url: makeSearchUrl(trimmed), warning: "" }
  }
}

const getBookmarkLabel = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "")
  } catch {
    return url
  }
}

const getOrCreateLocalId = (key: string, storage: Storage) => {
  const existing = storage.getItem(key)
  if (existing) return existing
  const created =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  storage.setItem(key, created)
  return created
}

const createRuntimeWindowId = () =>
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`

async function queueRequest(path: string, body?: Record<string, unknown>) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: body ? "POST" : "GET",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  })

  const readPayload = async (): Promise<QueuePayload | null> => {
    try {
      return (await response.json()) as QueuePayload
    } catch {
      return null
    }
  }

  const payload = await readPayload()
  if (!response.ok) throw new Error(payload?.message || `Queue request failed (${response.status})`)
  if (!payload) throw new Error("Queue request returned an unreadable response.")
  return payload
}

export default function ProxyPage() {
  const browserFrameWrapRef = useRef<HTMLDivElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const launchTimeoutRef = useRef<number | null>(null)
  const currentUrlRef = useRef(DEFAULT_HOME_URL)
  const blockedDomainRef = useRef("")
  const lastAddressSyncRef = useRef<{ value: string; at: number }>({ value: "", at: 0 })
  const lastUrlChangeEventRef = useRef<{ value: string; at: number }>({ value: "", at: 0 })
  const lastYoutubeNavRef = useRef<{ value: string; videoId: string; at: number }>({ value: "", videoId: "", at: 0 })
  const expiredLockRef = useRef(false)
  const statusFailuresRef = useRef(0)
  const inactivityLastInteractionRef = useRef(Date.now())
  const inactivityDeadlineRef = useRef(0)
  const sessionRef = useRef<{ deviceId: string; windowId: string; token: string }>({
    deviceId: "",
    windowId: "",
    token: "",
  })

  const [isFullscreen, setIsFullscreen] = useState(false)
  const [shellLoaded, setShellLoaded] = useState(false)
  const [frameNonce, setFrameNonce] = useState(0)
  const [loading, setLoading] = useState(false)
  const [warning, setWarning] = useState("")

  const [addressInput, setAddressInput] = useState(DEFAULT_HOME_URL)
  const [history, setHistory] = useState<string[]>([DEFAULT_HOME_URL])
  const [historyIndex, setHistoryIndex] = useState(0)
  const historyIndexRef = useRef(0)
  const [blockedDomain, setBlockedDomain] = useState("")

  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([])
  const [consoleOpen, setConsoleOpen] = useState(false)
  const [logs, setLogs] = useState<ConsoleLog[]>([])
  const [consoleInput, setConsoleInput] = useState("")
  const [homePhraseIndex, setHomePhraseIndex] = useState(0)
  const [homeTypedText, setHomeTypedText] = useState("")
  const [homeDeleting, setHomeDeleting] = useState(false)

  const [deviceId, setDeviceId] = useState("")
  const [windowId, setWindowId] = useState("")

  const [status, setStatus] = useState<GateStatus>("loading")
  const [queueData, setQueueData] = useState<QueuePayload | null>(null)
  const [errorMessage, setErrorMessage] = useState("")
  const [joinBusy, setJoinBusy] = useState(false)
  const [inactivityPromptOpen, setInactivityPromptOpen] = useState(false)
  const [inactivityCountdownSec, setInactivityCountdownSec] = useState(
    Math.ceil(INACTIVITY_CONFIRM_WINDOW_MS / 1000),
  )

  const currentUrl = history[historyIndex] ?? DEFAULT_HOME_URL

  const appendLog = useCallback((level: ConsoleLogLevel, message: string) => {
    setLogs((previous) => {
      const next: ConsoleLog = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        level,
        message,
        at: Date.now(),
      }
      return [...previous.slice(-249), next]
    })
  }, [])

  const clearLaunchTimeout = useCallback(() => {
    if (launchTimeoutRef.current !== null) {
      window.clearTimeout(launchTimeoutRef.current)
      launchTimeoutRef.current = null
    }
  }, [])

  const sendLaunch = useCallback(
    (url: string) => {
      const safeUrl = sanitizeLaunchUrl(url)
      if (url && !safeUrl) {
        setLoading(false)
        setWarning("Blocked invalid proxy target URL. Try entering a normal site URL again.")
        appendLog("warn", `Blocked invalid launch URL: ${url}`)
        return
      }

      try {
        localStorage.setItem(SCRAMJET_LAUNCH_KEY, safeUrl)
        localStorage.setItem(SCRAMJET_LAUNCH_NONCE_KEY, String(Date.now()))
      } catch {
        appendLog("warn", "Could not persist launch URL.")
      }

      const shellWin = iframeRef.current?.contentWindow
      if (safeUrl) {
        if (shellLoaded && shellWin) {
          shellWin.postMessage({ __onekey_launch: safeUrl }, "*")
        } else {
          setShellLoaded(false)
          setFrameNonce((value) => value + 1)
        }
      }

      clearLaunchTimeout()
      setLoading(Boolean(safeUrl))

      if (safeUrl) {
        launchTimeoutRef.current = window.setTimeout(() => {
          appendLog("warn", "Launch timed out. Retrying once automatically.")
          const retryWin = iframeRef.current?.contentWindow
          if (shellLoaded && retryWin) {
            retryWin.postMessage({ __onekey_launch: safeUrl }, "*")
          } else {
            setShellLoaded(false)
            setFrameNonce((value) => value + 1)
          }
          launchTimeoutRef.current = window.setTimeout(() => {
            setLoading(false)
            appendLog("warn", "Launch is taking longer than expected.")
          }, SCRAMJET_LAUNCH_ACK_TIMEOUT_MS)
        }, SCRAMJET_LAUNCH_ACK_TIMEOUT_MS)
      }

      appendLog("info", `Launch: ${safeUrl || "home"}`)
    },
    [appendLog, clearLaunchTimeout, shellLoaded]
  )

  const applyNavigatedUrl = useCallback(
    (raw: string) => {
      const safe = sanitizeLaunchUrl(raw)
      if (!safe) return false

      try {
        const parsed = new URL(safe)
        const host = parsed.hostname.toLowerCase()
        const isBlockedHost = BLOCKED_SEARCH_HOSTS.includes(host)
        if (!isLikelyDocumentNavigation(parsed.toString())) return true

        if (isYoutubeHost(host)) {
          const blockedHost = parsed.hostname
          setBlockedDomain(blockedHost)
          setWarning(YOUTUBE_BROKEN_MESSAGE)
          setLoading(false)
          setAddressInput(blockedHost)
          setHistory((previous) => {
            if (previous.length === 0) return [""]
            const next = [...previous]
            const index = Math.min(Math.max(historyIndexRef.current, 0), previous.length - 1)
            if (next[index] === "") return previous
            next[index] = ""
            return next
          })
          blockedDomainRef.current = blockedHost
          lastAddressSyncRef.current = { value: "", at: Date.now() }
          return true
        }

        if (isBlockedHost) {
          const blockedHost = parsed.hostname
          setBlockedDomain(blockedHost)
          setWarning(`${blockedHost} is blocked here. Use DuckDuckGo instead.`)
          setLoading(false)
          setAddressInput(blockedHost)
          setHistory((previous) => {
            if (previous.length === 0) return [""]
            const next = [...previous]
            const index = Math.min(Math.max(historyIndexRef.current, 0), previous.length - 1)
            if (next[index] === "") return previous
            next[index] = ""
            return next
          })
          blockedDomainRef.current = blockedHost
          lastAddressSyncRef.current = { value: "", at: Date.now() }
          return true
        }

        const normalized = normalizeAddressUrl(parsed.toString())
        const now = Date.now()
        const last = lastAddressSyncRef.current

        if (normalized === last.value && now - last.at < 1200) return true
        if (normalized === currentUrlRef.current && !blockedDomainRef.current) {
          lastAddressSyncRef.current = { value: normalized, at: now }
          return true
        }

        lastAddressSyncRef.current = { value: normalized, at: now }
        blockedDomainRef.current = ""
        currentUrlRef.current = normalized

        setBlockedDomain("")
        setAddressInput(normalized)
        setHistory((previous) => {
          if (previous.length === 0) return [normalized]
          const next = [...previous]
          const index = Math.min(Math.max(historyIndexRef.current, 0), previous.length - 1)
          if (next[index] === normalized) return previous
          next[index] = normalized
          return next
        })
        return true
      } catch {
        return false
      }
    },
    []
  )

  const syncAddressFromShell = useCallback(() => {
    const shellWin = iframeRef.current?.contentWindow
    if (!shellWin) return

    try {
      const nested = shellWin.document.querySelector("iframe") as HTMLIFrameElement | null
      if (!nested) return
      const candidate = nested.contentWindow?.location.href || nested.getAttribute("src") || ""
      if (!candidate) return
      void applyNavigatedUrl(candidate)
    } catch {
    }
  }, [applyNavigatedUrl])

  const refreshStatus = useCallback(
    async (id: string, wid: string) => {
      try {
        const result = await queueRequest(`/status?deviceId=${encodeURIComponent(id)}&windowId=${encodeURIComponent(wid)}`)
        statusFailuresRef.current = 0
        if (expiredLockRef.current && result.status !== "active") {
          setQueueData({
            ...result,
            status: "expired",
            code: "session_timeout",
            message: "Inactivity confirmation timed out. Please re-enter queue.",
          })
          setStatus("expired")
          return
        }
        setQueueData(result)
        setStatus(result.status)
        setErrorMessage("")
      } catch (error) {
        statusFailuresRef.current += 1
        if (statusFailuresRef.current < TOLERATED_STATUS_FAILURES) {
          setErrorMessage("Connection issue. Reconnecting...")
          return
        }
        setStatus("error")
        setErrorMessage(error instanceof Error ? error.message : "Could not refresh queue status.")
      }
    },
    []
  )

  const joinQueue = useCallback(
    async (id: string, wid: string) => {
      setJoinBusy(true)
      expiredLockRef.current = false
      statusFailuresRef.current = 0
      try {
        const result = await queueRequest("/join", {
          deviceId: id,
          windowId: wid,
        })
        setQueueData(result)
        setStatus(result.status)
        setErrorMessage(result.message || "")
        appendLog("info", `Queue status: ${result.status}`)
      } catch (error) {
        setStatus("error")
        setErrorMessage(error instanceof Error ? error.message : "Could not join queue.")
      } finally {
        setJoinBusy(false)
      }
    },
    [appendLog]
  )

  const pingSession = useCallback(async () => {
    if (!deviceId || !windowId) return
    try {
      const result = await queueRequest("/ping", {
        deviceId,
        windowId,
        token: queueData?.token,
      })
      if (expiredLockRef.current && result.status !== "active") {
        setQueueData({
          ...result,
          status: "expired",
          code: "session_timeout",
          message: "Inactivity confirmation timed out. Please re-enter queue.",
        })
        setStatus("expired")
        return
      }
      setQueueData(result)
      setStatus(result.status)
      if (result.message) setErrorMessage(result.message)
    } catch {
    }
  }, [deviceId, queueData?.token, windowId])

  const hookConsole = useCallback(
    (target: Window | null | undefined) => {
      if (!target) return

      try {
        const marker = "__onekey_console_hook__"
        if ((target as unknown as Record<string, unknown>)[marker]) return
        ;(target as unknown as Record<string, unknown>)[marker] = true

        const script = `
          (function () {
            if (window.__onekey_hook_script__) return;
            window.__onekey_hook_script__ = true;

            const emit = (level, args) => {
              try {
                const text = Array.from(args || []).map((value) => {
                  try {
                    if (typeof value === 'string') return value;
                    return JSON.stringify(value);
                  } catch (e) {
                    return String(value);
                  }
                }).join(' ');
                top.postMessage({ __onekey_console__: 1, level, message: text }, '*');
              } catch (e) {}
            };

            ['log', 'info', 'warn', 'error'].forEach((level) => {
              const original = console[level];
              console[level] = function (...args) {
                emit(level, args);
                return original.apply(this, args);
              };
            });

            window.addEventListener('error', (event) => emit('error', [event.message || 'window error']));
            window.addEventListener('unhandledrejection', (event) => {
              const reason = event && event.reason;
              emit('error', [reason && reason.message ? reason.message : String(reason)]);
            });
          })();
        `

        ;(target as unknown as { eval: (code: string) => unknown }).eval(script)
      } catch {
      }
    },
    []
  )

  const hookIframeConsole = useCallback(() => {
    const shellWin = iframeRef.current?.contentWindow
    if (!shellWin) return

    hookConsole(shellWin)

    try {
      const nested = shellWin.document.querySelector("iframe") as HTMLIFrameElement | null
      const nestedWin = nested?.contentWindow
      if (nestedWin) {
        hookConsole(nestedWin)
      }
    } catch {
    }
  }, [hookConsole])

  const stabilizeYoutubeFrame = useCallback(() => {
    const script = `
      (function () {
        try {
          const host = String(location.hostname || '').toLowerCase();
          const isYt = host === 'youtube.com' || host.endsWith('.youtube.com') || host === 'youtu.be' || host.endsWith('.youtu.be');
          if (!isYt) return;
          if (window.__onekey_youtube_stability__) return;
          window.__onekey_youtube_stability__ = true;

          const minReloadGapMs = 12000;
          let lastReloadAt = 0;
          const canReload = () => {
            const now = Date.now();
            if (now - lastReloadAt < minReloadGapMs) return false;
            lastReloadAt = now;
            return true;
          };

          try {
            const originalReload = window.location.reload.bind(window.location);
            window.location.reload = function () {
              if (!canReload()) return;
              return originalReload();
            };
          } catch {}

          try {
            const originalAssign = window.location.assign.bind(window.location);
            let lastAssignHref = '';
            let lastAssignAt = 0;
            window.location.assign = function (next) {
              const href = String(next || '');
              const now = Date.now();
              if (href && href === lastAssignHref && now - lastAssignAt < 3000) return;
              lastAssignHref = href;
              lastAssignAt = now;
              return originalAssign(next);
            };
          } catch {}

          try {
            const originalReplace = window.location.replace.bind(window.location);
            let lastReplaceHref = '';
            let lastReplaceAt = 0;
            window.location.replace = function (next) {
              const href = String(next || '');
              const now = Date.now();
              if (href && href === lastReplaceHref && now - lastReplaceAt < 3000) return;
              lastReplaceHref = href;
              lastReplaceAt = now;
              return originalReplace(next);
            };
          } catch {}
        } catch {}
      })();
    `

    const inject = (target: Window | null | undefined) => {
      if (!target) return
      try {
        ;(target as unknown as { eval: (code: string) => unknown }).eval(script)
      } catch {
      }
    }

    const shellWin = iframeRef.current?.contentWindow
    if (!shellWin) return

    inject(shellWin)
    try {
      const nested = shellWin.document.querySelector("iframe") as HTMLIFrameElement | null
      inject(nested?.contentWindow)
    } catch {
    }
  }, [])

  useEffect(() => {
    appendLog("info", "1Key proxy console ready.")
  }, [appendLog])

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const shellWin = iframeRef.current?.contentWindow
      if (!shellWin) return

      let candidate = event.source as Window | null
      let fromShell = false
      for (let depth = 0; candidate && depth < 16; depth += 1) {
        if (candidate === shellWin) {
          fromShell = true
          break
        }
        let parent: Window | null = null
        try {
          parent = candidate.parent
        } catch {
          parent = null
        }
        if (!parent || parent === candidate) break
        candidate = parent
      }
      if (!fromShell) return

      const payload = event.data
      if (!payload || typeof payload !== "object") return

      if ("__onekey_launch_ack" in payload) {
        clearLaunchTimeout()
        setLoading(false)
        return
      }

      if ("__onekey_launch_error" in payload) {
        clearLaunchTimeout()
        setLoading(false)
        const message = String((payload as { __onekey_launch_error?: string }).__onekey_launch_error || "Proxy launch failed.")
        setErrorMessage(message)
        appendLog("error", message)
        return
      }

      if ("__onekey_urlchange" in payload) {
        const raw = String((payload as { __onekey_urlchange?: string }).__onekey_urlchange || "")
        const safe = sanitizeLaunchUrl(raw)
        if (!safe) return

        const normalized = normalizeAddressUrl(safe)
        const now = Date.now()
        const previous = lastUrlChangeEventRef.current
        let minGapMs = 300
        let youtubeNav = false
        let youtubeVideoId = ""
        try {
          const host = new URL(normalized).hostname.toLowerCase()
          if (isYoutubeHost(host)) {
            youtubeNav = true
            youtubeVideoId = youtubeVideoIdFromUrl(normalized)
            minGapMs = 10000
          }
        } catch {
        }

        if (normalized === previous.value && now - previous.at < (youtubeNav ? 45000 : 12000)) return
        if (now - previous.at < minGapMs) return

        if (youtubeNav) {
          const previousYoutube = lastYoutubeNavRef.current
          if (youtubeVideoId && previousYoutube.videoId === youtubeVideoId && now - previousYoutube.at < 45000) return
          if (!youtubeVideoId && previousYoutube.value === normalized && now - previousYoutube.at < 45000) return
          lastYoutubeNavRef.current = { value: normalized, videoId: youtubeVideoId, at: now }
        }

        lastUrlChangeEventRef.current = { value: normalized, at: now }
        void applyNavigatedUrl(normalized)
        return
      }

      if (!("__onekey_console__" in payload)) return

      const levelRaw = (payload as { level?: string }).level || "log"
      const message = (payload as { message?: string }).message || ""
      const level: ConsoleLogLevel =
        levelRaw === "error" || levelRaw === "warn" || levelRaw === "info" || levelRaw === "log" ? levelRaw : "log"
      appendLog(level, message)
    }

    window.addEventListener("message", onMessage)
    return () => window.removeEventListener("message", onMessage)
  }, [appendLog, applyNavigatedUrl, clearLaunchTimeout])

  useEffect(() => {
    return () => clearLaunchTimeout()
  }, [clearLaunchTimeout])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(BOOKMARKS_STORAGE_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw) as BookmarkItem[]
      if (Array.isArray(parsed)) setBookmarks(parsed)
    } catch {
      appendLog("warn", "Bookmarks could not be loaded from storage.")
    }
  }, [appendLog])

  useEffect(() => {
    try {
      localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(bookmarks))
    } catch {
      appendLog("warn", "Bookmarks could not be saved to storage.")
    }
  }, [appendLog, bookmarks])

  useEffect(() => {
    try {
      const id = getOrCreateLocalId(DEVICE_KEY, localStorage)
      const wid = createRuntimeWindowId()
      try {
        sessionStorage.setItem(WINDOW_KEY, wid)
      } catch {
      }
      setDeviceId(id)
      setWindowId(wid)
      void joinQueue(id, wid)
    } catch {
      setStatus("error")
      setErrorMessage("Could not initialize device identity.")
    }
  }, [joinQueue])

  useEffect(() => {
    if (!deviceId || !windowId) return
    const isLiveStatus = status === "queued" || status === "active" || status === "locked_window"
    if (!isLiveStatus && status !== "error") return

    const interval = window.setInterval(() => {
      void refreshStatus(deviceId, windowId)
    }, isLiveStatus ? STATUS_POLL_INTERVAL_MS : STATUS_RECOVERY_POLL_INTERVAL_MS)

    return () => window.clearInterval(interval)
  }, [deviceId, refreshStatus, status, windowId])

  useEffect(() => {
    if (status !== "active") return
    const interval = window.setInterval(() => {
      void pingSession()
    }, 4000)
    return () => window.clearInterval(interval)
  }, [pingSession, status])

  useEffect(() => {
    sessionRef.current.deviceId = deviceId
  }, [deviceId])

  useEffect(() => {
    sessionRef.current.windowId = windowId
  }, [windowId])

  useEffect(() => {
    sessionRef.current.token = queueData?.token || ""
  }, [queueData?.token])

  const releaseSession = useCallback(
    (preferBeacon = false) => {
      const { deviceId: id, windowId: wid, token } = sessionRef.current
      if (!id || !wid) return
      const payload = JSON.stringify({ deviceId: id, windowId: wid, token: token || undefined })

      if (preferBeacon && typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
        const blob = new Blob([payload], { type: "application/json" })
        navigator.sendBeacon(`${API_BASE}/release`, blob)
        return
      }

      void fetch(`${API_BASE}/release`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true,
      }).catch(() => undefined)
    },
    []
  )

  const resolveCloakTarget = useCallback(() => {
    try {
      const raw = localStorage.getItem("1key-settings")
      if (raw) {
        const parsed = JSON.parse(raw) as { panicUrl?: unknown }
        const panicUrl = typeof parsed?.panicUrl === "string" ? parsed.panicUrl.trim() : ""
        if (panicUrl) {
          if (panicUrl.startsWith("http://") || panicUrl.startsWith("https://")) return panicUrl
          return `https://${panicUrl}`
        }
      }
    } catch {
    }

    return "about:blank"
  }, [])

  const kickToCloakedPage = useCallback(
    (reason: string) => {
      if (expiredLockRef.current) return
      expiredLockRef.current = true
      inactivityDeadlineRef.current = 0
      setInactivityPromptOpen(false)
      setInactivityCountdownSec(Math.ceil(INACTIVITY_CONFIRM_WINDOW_MS / 1000))

      releaseSession(false)
      setQueueData((previous) => ({
        ...(previous || {}),
        status: "expired",
        code: "session_timeout",
        message: reason,
      }))
      setStatus("expired")
      appendLog("warn", reason)

      const target = resolveCloakTarget()
      window.setTimeout(() => {
        ;(window as Window & { __skipUnloadWarning?: boolean }).__skipUnloadWarning = true
        window.location.href = target
      }, 120)
    },
    [appendLog, releaseSession, resolveCloakTarget],
  )

  const confirmStillHere = useCallback(() => {
    inactivityLastInteractionRef.current = Date.now()
    inactivityDeadlineRef.current = 0
    setInactivityPromptOpen(false)
    setInactivityCountdownSec(Math.ceil(INACTIVITY_CONFIRM_WINDOW_MS / 1000))
    appendLog("info", "Presence confirmed. Continuing proxy session.")
  }, [appendLog])

  useEffect(() => {
    const releaseOnPageHide = (event: PageTransitionEvent) => {
      if (event.persisted) return
      releaseSession(true)
    }

    window.addEventListener("pagehide", releaseOnPageHide)
    return () => {
      window.removeEventListener("pagehide", releaseOnPageHide)
      releaseSession(false)
    }
  }, [releaseSession])

  useEffect(() => {
    if (status !== "active") {
      inactivityDeadlineRef.current = 0
      setInactivityPromptOpen(false)
      setInactivityCountdownSec(Math.ceil(INACTIVITY_CONFIRM_WINDOW_MS / 1000))
      return
    }

    const markInteraction = () => {
      inactivityLastInteractionRef.current = Date.now()
    }

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        markInteraction()
      }
    }

    const forEachFrameWindow = (apply: (target: Window) => void) => {
      const shellWin = iframeRef.current?.contentWindow
      if (!shellWin) return

      try {
        apply(shellWin)
      } catch {
      }

      try {
        const nested = shellWin.document.querySelector("iframe") as HTMLIFrameElement | null
        if (nested?.contentWindow) apply(nested.contentWindow)
      } catch {
      }
    }

    const bindFrameActivity = () => {
      forEachFrameWindow((target) => {
        target.addEventListener("pointerdown", markInteraction, { passive: true, capture: true })
        target.addEventListener("keydown", markInteraction, { capture: true })
        target.addEventListener("touchstart", markInteraction, { passive: true, capture: true })
        target.addEventListener("wheel", markInteraction, { passive: true, capture: true })
      })
    }

    const unbindFrameActivity = () => {
      forEachFrameWindow((target) => {
        target.removeEventListener("pointerdown", markInteraction, { capture: true })
        target.removeEventListener("keydown", markInteraction, { capture: true })
        target.removeEventListener("touchstart", markInteraction, { capture: true })
        target.removeEventListener("wheel", markInteraction, { capture: true })
      })
    }

    markInteraction()
    bindFrameActivity()

    window.addEventListener("pointerdown", markInteraction, { passive: true })
    window.addEventListener("keydown", markInteraction)
    window.addEventListener("touchstart", markInteraction, { passive: true })
    window.addEventListener("wheel", markInteraction, { passive: true })
    document.addEventListener("visibilitychange", onVisibility)

    const interval = window.setInterval(() => {
      bindFrameActivity()
      const ts = Date.now()

      if (inactivityDeadlineRef.current > 0) {
        const remainingMs = Math.max(0, inactivityDeadlineRef.current - ts)
        const seconds = Math.ceil(remainingMs / 1000)
        setInactivityCountdownSec(seconds)

        if (remainingMs <= 0) {
          kickToCloakedPage("Inactivity confirmation timed out. Session closed.")
        }
        return
      }

      if (ts - inactivityLastInteractionRef.current >= INACTIVITY_PROMPT_AFTER_MS) {
        inactivityDeadlineRef.current = ts + INACTIVITY_CONFIRM_WINDOW_MS
        setInactivityCountdownSec(Math.ceil(INACTIVITY_CONFIRM_WINDOW_MS / 1000))
        setInactivityPromptOpen(true)
        appendLog("warn", "Inactivity check triggered. Confirm within 30 seconds to stay connected.")
      }
    }, 1000)

    return () => {
      window.clearInterval(interval)
      unbindFrameActivity()
      window.removeEventListener("pointerdown", markInteraction)
      window.removeEventListener("keydown", markInteraction)
      window.removeEventListener("touchstart", markInteraction)
      window.removeEventListener("wheel", markInteraction)
      document.removeEventListener("visibilitychange", onVisibility)
    }
  }, [appendLog, kickToCloakedPage, status])

  useEffect(() => {
    if (status === "active") expiredLockRef.current = false
  }, [status])

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener("fullscreenchange", onFsChange)
    return () => document.removeEventListener("fullscreenchange", onFsChange)
  }, [])

  useEffect(() => {
    setAddressInput(currentUrl)
  }, [currentUrl])

  useEffect(() => {
    currentUrlRef.current = currentUrl
  }, [currentUrl])

  useEffect(() => {
    blockedDomainRef.current = blockedDomain
  }, [blockedDomain])

  useEffect(() => {
    historyIndexRef.current = historyIndex
  }, [historyIndex])

  useEffect(() => {
    if (status !== "active") return
    const interval = window.setInterval(() => {
      if (document.visibilityState !== "visible") return
      try {
        const activeHost = new URL(currentUrlRef.current).hostname.toLowerCase()
        if (isYoutubeHost(activeHost)) return
      } catch {
      }
      syncAddressFromShell()
    }, 3500)
    return () => window.clearInterval(interval)
  }, [status, syncAddressFromShell])

  useEffect(() => {
    if (status !== "active") return
    let host = ""
    try {
      host = new URL(currentUrl || "https://1key.lol").hostname.toLowerCase()
    } catch {
      host = ""
    }
    if (!isYoutubeHost(host)) return

    stabilizeYoutubeFrame()
    const interval = window.setInterval(() => {
      if (document.visibilityState !== "visible") return
      stabilizeYoutubeFrame()
    }, 1500)
    return () => window.clearInterval(interval)
  }, [currentUrl, stabilizeYoutubeFrame, status])

  useEffect(() => {
    if (!consoleOpen || status !== "active") return
    const interval = window.setInterval(() => {
      if (document.visibilityState !== "visible") return
      hookIframeConsole()
    }, 1800)
    return () => window.clearInterval(interval)
  }, [consoleOpen, hookIframeConsole, status])

  useEffect(() => {
    const showProxyHome = status === "active" && !currentUrl && !blockedDomain
    if (!showProxyHome) {
      if (homeTypedText) setHomeTypedText("")
      if (homeDeleting) setHomeDeleting(false)
      return
    }

    const phrase = HOME_TYPE_PHRASES[homePhraseIndex % HOME_TYPE_PHRASES.length] || ""
    const typingDone = !homeDeleting && homeTypedText === phrase
    const deletingDone = homeDeleting && homeTypedText.length === 0
    const delay = typingDone ? 1300 : deletingDone ? 280 : homeDeleting ? 40 : 74

    const timeout = window.setTimeout(() => {
      if (typingDone) {
        setHomeDeleting(true)
        return
      }
      if (deletingDone) {
        setHomeDeleting(false)
        setHomePhraseIndex((value) => (value + 1) % HOME_TYPE_PHRASES.length)
        return
      }
      const step = homeDeleting ? -1 : 1
      setHomeTypedText(phrase.slice(0, Math.max(0, homeTypedText.length + step)))
    }, delay)

    return () => window.clearTimeout(timeout)
  }, [blockedDomain, currentUrl, homeDeleting, homePhraseIndex, homeTypedText, status])

  const navigate = useCallback(
    (rawInput: string, source: string) => {
      const parsed = toUrlOrSearch(rawInput)

      if (parsed.blockedHost) {
        setBlockedDomain(parsed.blockedHost)
        setWarning(parsed.warning)
        setLoading(false)
        appendLog("warn", `Blocked host: ${parsed.blockedHost}`)
        return
      }

      const safeUrl = parsed.url ? sanitizeLaunchUrl(parsed.url) : ""
      if (parsed.url && !safeUrl) {
        setWarning("Invalid URL for proxy launch. Please enter a normal site URL.")
        appendLog("warn", `Blocked invalid navigation target from ${source}`)
        return
      }

      setBlockedDomain("")
      const nextHistory = [...history.slice(0, historyIndex + 1), safeUrl]
      const clippedHistory =
        nextHistory.length > HISTORY_MAX_ENTRIES ? nextHistory.slice(nextHistory.length - HISTORY_MAX_ENTRIES) : nextHistory
      setHistory(clippedHistory)
      setHistoryIndex(clippedHistory.length - 1)
      setWarning(parsed.warning)
      if (parsed.warning) appendLog("warn", parsed.warning)
      appendLog("info", `${source}: ${safeUrl || "home"}`)

      if (safeUrl) {
        sendLaunch(safeUrl)
      } else {
        setLoading(false)
      }
    },
    [appendLog, history, historyIndex, sendLaunch]
  )

  useEffect(() => {
    if (status !== "active") return
    let target = ""
    try {
      target = (sessionStorage.getItem(APP_PROXY_HANDOFF_KEY) || "").trim()
      if (target) sessionStorage.removeItem(APP_PROXY_HANDOFF_KEY)
    } catch {
      return
    }
    if (!target) return
    navigate(target, "Apps")
  }, [navigate, status])

  const goBack = () => {
    if (historyIndex <= 0) return
    const nextIndex = historyIndex - 1
    setHistoryIndex(nextIndex)
    setBlockedDomain("")
    const targetUrl = history[nextIndex] ?? ""
    if (targetUrl) {
      sendLaunch(targetUrl)
    } else {
      setLoading(false)
    }
    appendLog("info", "History: back")
  }

  const goForward = () => {
    if (historyIndex >= history.length - 1) return
    const nextIndex = historyIndex + 1
    setHistoryIndex(nextIndex)
    setBlockedDomain("")
    const targetUrl = history[nextIndex] ?? ""
    if (targetUrl) {
      sendLaunch(targetUrl)
    } else {
      setLoading(false)
    }
    appendLog("info", "History: forward")
  }

  const goHome = () => {
    const nextHistory = [...history.slice(0, historyIndex + 1), ""]
    const clippedHistory =
      nextHistory.length > HISTORY_MAX_ENTRIES ? nextHistory.slice(nextHistory.length - HISTORY_MAX_ENTRIES) : nextHistory
    setHistory(clippedHistory)
    setHistoryIndex(clippedHistory.length - 1)
    setBlockedDomain("")
    setShellLoaded(false)
    setLoading(false)
    appendLog("info", "Home")
  }

  const hasBookmark = useMemo(() => bookmarks.some((bookmark) => bookmark.url === currentUrl && currentUrl), [bookmarks, currentUrl])

  const toggleBookmark = () => {
    if (!currentUrl) return

    if (hasBookmark) {
      setBookmarks((previous) => previous.filter((bookmark) => bookmark.url !== currentUrl))
      appendLog("info", `Bookmark removed: ${currentUrl}`)
      return
    }

    const nextBookmark: BookmarkItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      label: getBookmarkLabel(currentUrl),
      url: currentUrl,
      createdAt: Date.now(),
    }
    setBookmarks((previous) => [nextBookmark, ...previous])
    appendLog("info", `Bookmark added: ${currentUrl}`)
  }

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement && browserFrameWrapRef.current) {
        await browserFrameWrapRef.current.requestFullscreen()
      } else {
        await document.exitFullscreen()
      }
    } catch {
      appendLog("warn", "Fullscreen blocked.")
    }
  }

  const runConsoleCommand = () => {
    const command = consoleInput.trim()
    if (!command) return

    appendLog("info", `> ${command}`)

    try {
      const shellWin = iframeRef.current?.contentWindow
      if (!shellWin) {
        appendLog("error", "Proxy iframe unavailable.")
      } else {
        let targetWin: Window | null = shellWin
        try {
          const nested = shellWin.document.querySelector("iframe") as HTMLIFrameElement | null
          if (nested?.contentWindow) targetWin = nested.contentWindow
        } catch {
        }

        const result = (targetWin as unknown as { eval: (code: string) => unknown }).eval(command)
        appendLog("log", result === undefined ? "undefined" : String(result))
      }
    } catch (error) {
      appendLog("error", error instanceof Error ? error.message : "Command failed")
    }

    setConsoleInput("")
  }

  const clearLogs = () => setLogs([])

  const queuePosition = queueData?.position ?? 0
  const queueSize = queueData?.queueSize ?? 0
  const activeCount = queueData?.activeCount ?? 0
  const maxActive = queueData?.maxActive ?? 175
  const statusCode = queueData?.code || ""
  const isYoutubeBlockedDomain = blockedDomain ? isYoutubeHost(blockedDomain.toLowerCase()) : false
  const effectiveStatusCode = status === "expired" ? "session_timeout" : statusCode
  const statusMessage = queueData?.message || ""
  const retryAfterSeconds = Math.max(5, Number(queueData?.retryAfterSeconds || 30))

  const proxyVisible = status === "active"

  const topLine = useMemo(() => {
    if (status === "queued") return `${activeCount}/${maxActive} people using proxy • You are #${queuePosition} in queue`
    if (status === "locked_window") return statusMessage || "Another proxy window is already open on this device"
    if (status === "active") return `${activeCount}/${maxActive} people using proxy • ${queueSize} in queue`
    if (status === "expired") return statusMessage || "Inactivity confirmation timed out. Re-enter queue."
    if (status === "error") return "Queue error"
    return "Connecting..."
  }, [activeCount, maxActive, queuePosition, queueSize, status, statusMessage])

  return (
    <div className="relative h-screen overflow-hidden pt-16 pb-2 proto-page-shell">
      <div className="relative z-10 mx-auto flex h-[calc(100vh-4.5rem)] w-full max-w-7xl flex-col px-4 sm:px-6 lg:px-8">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/70 bg-card/55 px-4 py-2 backdrop-blur-md">
          <p className="text-sm text-foreground/90">{topLine}</p>
          <p className="inline-flex items-center gap-1 text-sm font-semibold text-foreground">
            <Hourglass className="h-4 w-4" />
            {proxyVisible ? (inactivityPromptOpen ? `${inactivityCountdownSec}s` : "LIVE") : "00:00"}
          </p>
        </div>

        {warning ? (
          <div className="mb-2 flex items-start gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-sm text-amber-100">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p className="flex-1">{warning}</p>
            <button
              type="button"
              onClick={() => setWarning("")}
              className="rounded p-1 text-amber-100/70 transition hover:bg-amber-400/20 hover:text-amber-50"
              aria-label="Dismiss warning"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : null}

        {errorMessage ? (
          <div className="mb-2 flex items-start gap-3 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm text-red-100">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{errorMessage}</p>
          </div>
        ) : null}

        <div className="mb-2 rounded-2xl border border-border bg-card/45 p-3 backdrop-blur-md">
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" size="icon-sm" onClick={goBack} disabled={historyIndex <= 0 || !proxyVisible}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              onClick={goForward}
              disabled={historyIndex >= history.length - 1 || !proxyVisible}
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button type="button" variant="outline" size="icon-sm" onClick={goHome} disabled={!proxyVisible}>
              <House className="h-4 w-4" />
            </Button>

            <form
              className="min-w-[280px] flex-1"
              onSubmit={(event) => {
                event.preventDefault()
                navigate(addressInput, "Address bar")
              }}
            >
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={addressInput}
                  onChange={(event) => setAddressInput(event.target.value)}
                  className="h-9 rounded-xl border-border/70 bg-background/50 pl-9 pr-3"
                  placeholder="Search with DuckDuckGo or enter a URL"
                  spellCheck={false}
                  autoCapitalize="off"
                  autoCorrect="off"
                  disabled={!proxyVisible}
                />
              </div>
            </form>

            <Button
              type="button"
              variant={hasBookmark ? "secondary" : "outline"}
              size="icon-sm"
              onClick={toggleBookmark}
              disabled={!proxyVisible || !currentUrl}
            >
              {hasBookmark ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
            </Button>

            <Button type="button" variant="outline" size="icon-sm" onClick={toggleFullscreen} disabled={!proxyVisible}>
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>

            <Button type="button" variant={consoleOpen ? "secondary" : "outline"} size="icon-sm" onClick={() => setConsoleOpen((value) => !value)}>
              <TerminalSquare className="h-4 w-4" />
            </Button>
          </div>

          {bookmarks.length > 0 ? (
            <div className="mt-2 flex max-h-20 flex-wrap gap-2 overflow-auto rounded-lg border border-border/60 bg-background/30 p-2">
              {bookmarks.map((bookmark) => (
                <div key={bookmark.id} className="inline-flex items-center gap-1 rounded-md border border-border/70 bg-background/60 px-2 py-1">
                  <button
                    type="button"
                    className="max-w-[160px] truncate text-xs text-foreground hover:underline"
                    title={bookmark.url}
                    onClick={() => navigate(bookmark.url, "Bookmark")}
                  >
                    {bookmark.label}
                  </button>
                  <button
                    type="button"
                    className="rounded p-0.5 text-muted-foreground transition hover:bg-destructive/20 hover:text-destructive"
                    onClick={() => setBookmarks((previous) => previous.filter((item) => item.id !== bookmark.id))}
                    aria-label="Remove bookmark"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <section className="min-h-0 flex-1 overflow-hidden rounded-2xl border border-border bg-card/40 backdrop-blur-md">
          <div ref={browserFrameWrapRef} className="relative h-full bg-[#060910]/90">
            {proxyVisible ? (
              currentUrl ? (
                <>
                  {loading ? (
                    <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/50 text-sm text-muted-foreground">
                      Loading proxied page...
                    </div>
                  ) : null}

                  <iframe
                    key={`scramjet-shell-${frameNonce}`}
                    ref={iframeRef}
                    src={`${SCRAMJET_MOUNT}&r=${frameNonce}`}
                    onLoad={() => {
                      clearLaunchTimeout()
                      setShellLoaded(true)
                      setLoading(false)
                      hookIframeConsole()
                      stabilizeYoutubeFrame()
                    }}
                    className="h-full w-full border-0"
                    referrerPolicy="no-referrer"
                    title="1Key Scramjet Session"
                  />
                </>
              ) : (
                blockedDomain ? (
                  <div className="relative flex h-full items-center justify-center p-6">
                    <div className="w-full max-w-md rounded-xl border border-red-500/35 bg-background/85 p-6 text-center">
                      <p className="text-sm font-semibold text-red-200">Site blocked</p>
                      <p className="mt-2 text-base font-medium text-foreground">{blockedDomain}</p>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {isYoutubeBlockedDomain ? "YouTube is currently broken right now." : "Google, Bing, and Yahoo are blocked here."}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {isYoutubeBlockedDomain ? "I'll fix it later, I promise." : "Use DuckDuckGo in the address bar."}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="relative flex h-full items-center justify-center overflow-hidden">
                    <img
                      src={PROXY_HOME_GIF}
                      alt=""
                      draggable={false}
                      className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center"
                    />
                    <div className="pointer-events-none absolute inset-0 bg-black/48" />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/42 via-black/22 to-black/58" />

                    <div className="relative z-10 flex h-full w-full items-start justify-center pt-10 sm:pt-14">
                      <div className="w-full max-w-3xl px-6 text-center">
                        <p className="font-[var(--font-orbitron)] text-7xl font-black tracking-[0.2em] text-white sm:text-8xl">1KEY</p>
                        <p className="mt-5 font-[var(--font-orbitron)] text-sm uppercase tracking-[0.18em] text-white/85 sm:text-base">
                          {homeTypedText}
                          <span className="ml-1 animate-pulse text-white/70">|</span>
                        </p>
                        <div className="mx-auto mt-6 inline-flex rounded-full border border-white/35 bg-black/35 px-4 py-2 text-xs text-white/85 backdrop-blur-md">
                          {activeCount}/{maxActive} using proxy • {queueSize} in queue
                        </div>
                      </div>
                    </div>
                  </div>
                )
              )
            ) : (
              <div className="flex h-full items-center justify-center p-8 text-center">
                <div className="max-w-lg">
                  <p className="text-6xl font-black tracking-[0.2em] text-foreground/90">1KEY</p>
                  <p className="mt-5 text-lg font-semibold text-foreground">
                    {status === "queued"
                      ? "Max people are currently using proxy."
                      : status === "locked_window"
                        ? "It appears another proxy window is open."
                        : status === "expired"
                          ? "Session timed out."
                        : "Proxy access is currently locked."}
                  </p>
                  {status === "queued" ? (
                    <p className="mt-2 text-sm text-muted-foreground">
                      {statusMessage || "Use the button below to enter queue."} {activeCount}/{maxActive} using now, {queueSize} in queue.
                    </p>
                  ) : status === "locked_window" ? (
                    <p className="mt-2 text-sm text-muted-foreground">
                      {statusMessage || "Please close your other proxy window and try again."} Try again in {retryAfterSeconds} seconds.
                    </p>
                  ) : status === "expired" ? (
                    <p className="mt-2 text-sm text-muted-foreground">
                      {statusMessage || "Inactivity confirmation timed out. Please re-enter queue."}
                    </p>
                  ) : (
                    <p className="mt-2 text-sm text-muted-foreground">
                      {activeCount}/{maxActive} people using proxy now. {queueSize} in queue.
                    </p>
                  )}
                  {(status === "queued" || status === "locked_window" || status === "expired") && effectiveStatusCode ? (
                    <p className="mt-1 text-xs uppercase tracking-[0.12em] text-muted-foreground/80">Code: {effectiveStatusCode}</p>
                  ) : null}

                  <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                    <Button type="button" onClick={() => void joinQueue(deviceId, windowId)} disabled={!deviceId || !windowId || joinBusy} className="min-w-36">
                      {joinBusy ? "Joining..." : "Join Queue"}
                    </Button>
                  </div>

                </div>
              </div>
            )}

            {proxyVisible && inactivityPromptOpen ? (
              <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/75 p-6 backdrop-blur-sm">
                <div className="w-full max-w-md rounded-2xl border border-border/80 bg-card/95 p-6 text-center shadow-2xl">
                  <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">Inactivity Check</p>
                  <h3 className="mt-2 text-2xl font-semibold text-foreground">Are you still there?</h3>
                  <p className="mt-3 text-sm text-muted-foreground">
                    Click yes within <span className="font-semibold text-foreground">{inactivityCountdownSec}s</span> to
                    keep your session active.
                  </p>
                  <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                    <Button type="button" onClick={confirmStillHere}>
                      Yes, I'm here
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => kickToCloakedPage("Session closed by user from inactivity check.")}
                    >
                      Leave
                    </Button>
                  </div>
                </div>
              </div>
            ) : null}

            {proxyVisible && consoleOpen ? (
              <div className="absolute inset-x-0 bottom-0 z-30 h-68 border-t border-border/80 bg-black/88 backdrop-blur-sm">
                <div className="flex items-center justify-between border-b border-border/70 px-3 py-2">
                  <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Developer Console (In-Frame)</p>
                  <div className="flex items-center gap-2">
                    <Button type="button" size="sm" variant="ghost" onClick={clearLogs}>
                      Clear
                    </Button>
                    <Button type="button" size="sm" variant="ghost" onClick={() => setConsoleOpen(false)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid h-[calc(100%-41px)] grid-rows-[1fr_auto]">
                  <div className="overflow-y-auto p-2 font-mono text-[11px]">
                    {logs.length === 0 ? (
                      <p className="text-muted-foreground">No logs yet.</p>
                    ) : (
                      logs
                        .slice()
                        .reverse()
                        .map((log) => (
                          <p
                            key={log.id}
                            className={
                              log.level === "error"
                                ? "text-red-300"
                                : log.level === "warn"
                                  ? "text-amber-200"
                                  : log.level === "info"
                                    ? "text-cyan-200"
                                    : "text-emerald-200"
                            }
                          >
                            [{new Date(log.at).toLocaleTimeString()}] {log.level.toUpperCase()} {log.message}
                          </p>
                        ))
                    )}
                  </div>

                  <form
                    className="flex items-center gap-2 border-t border-border/70 p-2"
                    onSubmit={(event) => {
                      event.preventDefault()
                      runConsoleCommand()
                    }}
                  >
                    <Input
                      value={consoleInput}
                      onChange={(event) => setConsoleInput(event.target.value)}
                      className="h-8 rounded-md border-border/70 bg-background/30 font-mono"
                      placeholder="Run JS in current proxied frame"
                    />
                    <Button type="submit" size="sm">
                      Run
                    </Button>
                  </form>
                </div>
              </div>
            ) : null}
          </div>
        </section>
      </div>

      <style jsx global>{`
        @keyframes proxy-rain {
          0% {
            transform: translateY(-16vh);
            opacity: 0;
          }
          20% {
            opacity: 0.85;
          }
          100% {
            transform: translateY(118vh);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  )
}
