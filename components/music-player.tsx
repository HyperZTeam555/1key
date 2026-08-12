"use client"

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react"
import { createPortal } from "react-dom"
import { usePathname } from "next/navigation"
import { useSettings } from "@/lib/settings-context"
import { getFile } from "@/lib/file-store"
import { Music2, Pause, Play, Repeat, Repeat1, RotateCcw, RotateCw } from "lucide-react"

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))

const cleanName = (name: string | null) => {
  if (!name) return "No track"
  const trimmed = name.trim()
  if (!trimmed) return "No track"
  return trimmed.replace(/\.[a-z0-9]{1,5}$/i, "")
}

const WIDGET_STATE_KEY = "1key-music-widget"
const EXPANDED_WIDTH = 320
const EXPANDED_HEIGHT = 180
const COLLAPSED_SIZE = 48

let sharedAudio: HTMLAudioElement | null = null
let sharedTrackId: string | null = null
let sharedObjectUrl: string | null = null
let sharedHasPlayed = false
let sharedCollapsed = false
let sharedWidgetPos: { left: number; top: number } | null = null

const getSharedAudio = () => {
  if (sharedAudio) return sharedAudio
  const audio = new Audio()
  audio.preload = "metadata"
  audio.volume = 1
  sharedAudio = audio
  return audio
}

type DragMode = "collapsed" | "expanded"

type DragState = {
  mode: DragMode
  startX: number
  startY: number
  startLeft: number
  startTop: number
  w: number
  h: number
  moved: boolean
  pointerId: number
  captureEl: HTMLElement | null
}

type PersistedWidgetState = {
  collapsed?: boolean
  left?: number
  top?: number
}

const readPersistedWidgetState = (): PersistedWidgetState | null => {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(WIDGET_STATE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as PersistedWidgetState
    if (!parsed || typeof parsed !== "object") return null
    return parsed
  } catch {
    return null
  }
}

const writePersistedWidgetState = (state: PersistedWidgetState) => {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(WIDGET_STATE_KEY, JSON.stringify(state))
  } catch {
  }
}

const getViewportBounds = () => {
  if (typeof document === "undefined") {
    return { width: 0, height: 0 }
  }
  const full = document.fullscreenElement
  if (full instanceof HTMLElement) {
    const rect = full.getBoundingClientRect()
    return {
      width: Math.max(0, Math.round(rect.width)),
      height: Math.max(0, Math.round(rect.height)),
    }
  }
  return { width: window.innerWidth, height: window.innerHeight }
}

export function MusicPlayer() {
  const pathname = usePathname()
  const { settings, updateSettings } = useSettings()

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const widgetRef = useRef<HTMLDivElement | null>(null)
  const dragRef = useRef<DragState | null>(null)
  const dragCleanupRef = useRef<(() => void) | null>(null)
  const prevEnabledRef = useRef(settings.musicWidgetEnabled)

  const persistedInitRef = useRef<PersistedWidgetState | null>(null)
  if (!persistedInitRef.current) {
    persistedInitRef.current = readPersistedWidgetState()
  }

  if (!audioRef.current && typeof window !== "undefined") {
    audioRef.current = getSharedAudio()
  }

  const initialPos =
    sharedWidgetPos ??
    (typeof persistedInitRef.current?.left === "number" && typeof persistedInitRef.current?.top === "number"
      ? { left: persistedInitRef.current.left, top: persistedInitRef.current.top }
      : { left: settings.musicWidgetX, top: settings.musicWidgetY })

  const [loading, setLoading] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [hasPlayed, setHasPlayed] = useState(sharedHasPlayed)
  const [collapsed, setCollapsed] = useState(
    sharedCollapsed || persistedInitRef.current?.collapsed === true,
  )
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null)
  const [pos, setPos] = useState(() => initialPos)

  const posRef = useRef(pos)

  const setCollapsedState = useCallback((next: boolean) => {
    sharedCollapsed = next
    setCollapsed(next)
  }, [])

  const trackLabel = useMemo(() => cleanName(settings.musicName), [settings.musicName])

  useEffect(() => {
    posRef.current = pos
    sharedWidgetPos = pos
    writePersistedWidgetState({
      collapsed: sharedCollapsed,
      left: Math.round(pos.left),
      top: Math.round(pos.top),
    })
  }, [pos])

  useEffect(() => {
    sharedCollapsed = collapsed
    writePersistedWidgetState({
      collapsed,
      left: Math.round(posRef.current.left),
      top: Math.round(posRef.current.top),
    })
  }, [collapsed])

  useEffect(() => {
    if (sharedWidgetPos) return
    setPos({ left: settings.musicWidgetX, top: settings.musicWidgetY })
  }, [settings.musicWidgetX, settings.musicWidgetY])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const syncFromAudio = () => {
      const isPlaying = !audio.paused && !audio.ended
      setPlaying(isPlaying)
      if (audio.currentTime > 0 || sharedHasPlayed) {
        sharedHasPlayed = true
        setHasPlayed(true)
      }
    }

    const onPlay = () => {
      sharedHasPlayed = true
      setHasPlayed(true)
      setPlaying(true)
    }
    const onPause = () => syncFromAudio()
    const onEnded = () => syncFromAudio()

    audio.addEventListener("play", onPlay)
    audio.addEventListener("pause", onPause)
    audio.addEventListener("ended", onEnded)
    syncFromAudio()

    return () => {
      audio.removeEventListener("play", onPlay)
      audio.removeEventListener("pause", onPause)
      audio.removeEventListener("ended", onEnded)
    }
  }, [])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.loop = !!settings.musicLoop
  }, [settings.musicLoop])

  useEffect(() => {
    let cancelled = false
    const audio = audioRef.current
    if (!audio) return

    const clearTrack = () => {
      audio.pause()
      audio.currentTime = 0
      audio.removeAttribute("src")
      try {
        audio.load()
      } catch {
      }
      if (sharedObjectUrl) URL.revokeObjectURL(sharedObjectUrl)
      sharedObjectUrl = null
      sharedTrackId = null
      sharedHasPlayed = false
      setHasPlayed(false)
      setPlaying(false)
    }

    const loadTrack = async () => {
      if (!settings.musicId) {
        clearTrack()
        return
      }

      if (settings.musicId === sharedTrackId && !!audio.src) {
        return
      }

      setLoading(true)
      try {
        const record = await getFile(settings.musicId)
        if (cancelled) return
        if (!record?.blob) {
          clearTrack()
          return
        }

        const nextUrl = URL.createObjectURL(record.blob)
        if (sharedObjectUrl) URL.revokeObjectURL(sharedObjectUrl)

        sharedObjectUrl = nextUrl
        sharedTrackId = settings.musicId
        sharedHasPlayed = false

        audio.pause()
        audio.currentTime = 0
        audio.src = nextUrl
        audio.preload = "metadata"
        try {
          audio.load()
        } catch {
        }

        setHasPlayed(false)
        setPlaying(false)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadTrack()
    return () => {
      cancelled = true
    }
  }, [settings.musicId])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const wasEnabled = prevEnabledRef.current
    const isEnabled = settings.musicWidgetEnabled

    if (!isEnabled && wasEnabled) {
      audio.pause()
      audio.currentTime = 0
      try {
        audio.load()
      } catch {
      }
      sharedHasPlayed = false
      setHasPlayed(false)
      setPlaying(false)
      setCollapsedState(false)
    }

    if (isEnabled && !wasEnabled) {
      audio.pause()
      audio.currentTime = 0
      try {
        audio.load()
      } catch {
      }
      sharedHasPlayed = false
      setHasPlayed(false)
      setPlaying(false)
    }

    prevEnabledRef.current = isEnabled
  }, [setCollapsedState, settings.musicWidgetEnabled])

  useEffect(() => {
    if (typeof window === "undefined") return

    const updateTarget = () => {
      const full = document.fullscreenElement
      if (full && full instanceof HTMLElement) {
        setPortalTarget(full)
      } else {
        setPortalTarget(document.body)
      }
    }

    updateTarget()
    document.addEventListener("fullscreenchange", updateTarget)
    return () => document.removeEventListener("fullscreenchange", updateTarget)
  }, [])

  const statusText = loading
    ? "Loading..."
    : !settings.musicId
      ? "No Track"
      : playing
        ? "Playing"
        : hasPlayed
          ? "Paused"
          : "Ready"

  const togglePlay = async () => {
    const audio = audioRef.current
    if (!audio || !settings.musicId) return

    if (!audio.paused) {
      audio.pause()
      setPlaying(false)
      return
    }

    try {
      await audio.play()
      setPlaying(true)
      sharedHasPlayed = true
      setHasPlayed(true)
    } catch {
      setPlaying(false)
    }
  }

  const seekBy = (deltaSeconds: number) => {
    const audio = audioRef.current
    if (!audio) return
    if (!Number.isFinite(audio.duration) || audio.duration <= 0) return
    audio.currentTime = clamp(audio.currentTime + deltaSeconds, 0, audio.duration)
  }

  const persistPosition = useCallback(() => {
    const latest = posRef.current
    updateSettings({ musicWidgetX: Math.round(latest.left), musicWidgetY: Math.round(latest.top) })
  }, [updateSettings])

  const endDrag = useCallback(
    (openIfTap: boolean) => {
      const drag = dragRef.current
      dragRef.current = null

      if (dragCleanupRef.current) {
        dragCleanupRef.current()
        dragCleanupRef.current = null
      }

      if (drag?.captureEl && drag.pointerId >= 0) {
        try {
          drag.captureEl.releasePointerCapture?.(drag.pointerId)
        } catch {
        }
      }

      persistPosition()

      if (openIfTap && drag?.mode === "collapsed" && !drag.moved) {
        setCollapsedState(false)
      }
    },
    [persistPosition, setCollapsedState],
  )

  const beginDrag = (
    e: ReactPointerEvent<HTMLElement>,
    mode: DragMode,
    widthHint: number,
    heightHint: number,
  ) => {
    if (e.button !== 0) return
    e.preventDefault()
    e.stopPropagation()

    if (dragCleanupRef.current) {
      dragCleanupRef.current()
      dragCleanupRef.current = null
    }

    const captureEl = e.currentTarget
    try {
      captureEl.setPointerCapture?.(e.pointerId)
    } catch {
    }

    const startLeft = posRef.current.left
    const startTop = posRef.current.top

    dragRef.current = {
      mode,
      startX: e.clientX,
      startY: e.clientY,
      startLeft,
      startTop,
      w: widthHint,
      h: heightHint,
      moved: false,
      pointerId: e.pointerId,
      captureEl,
    }

    const onMove = (ev: PointerEvent) => {
      const drag = dragRef.current
      if (!drag) return

      if (typeof ev.buttons === "number" && ev.buttons === 0) {
        endDrag(true)
        return
      }

      const dx = ev.clientX - drag.startX
      const dy = ev.clientY - drag.startY
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) drag.moved = true

      const viewport = getViewportBounds()
      const margin = 10
      const maxLeft = Math.max(margin, viewport.width - drag.w - margin)
      const maxTop = Math.max(margin, viewport.height - drag.h - margin)
      const nextLeft = clamp(drag.startLeft + dx, margin, maxLeft)
      const nextTop = clamp(drag.startTop + dy, margin, maxTop)

      posRef.current = { left: nextLeft, top: nextTop }
      setPos({ left: nextLeft, top: nextTop })
    }

    const onPointerUp = () => endDrag(true)
    const onCancel = () => endDrag(false)
    const onBlur = () => endDrag(false)
    const onVisibility = () => {
      if (document.hidden) endDrag(false)
    }

    window.addEventListener("pointermove", onMove, true)
    window.addEventListener("pointerup", onPointerUp, true)
    window.addEventListener("pointercancel", onCancel, true)
    window.addEventListener("blur", onBlur)
    document.addEventListener("visibilitychange", onVisibility)
    document.addEventListener("fullscreenchange", onCancel)

    dragCleanupRef.current = () => {
      window.removeEventListener("pointermove", onMove, true)
      window.removeEventListener("pointerup", onPointerUp, true)
      window.removeEventListener("pointercancel", onCancel, true)
      window.removeEventListener("blur", onBlur)
      document.removeEventListener("visibilitychange", onVisibility)
      document.removeEventListener("fullscreenchange", onCancel)
    }
  }

  useEffect(() => {
    return () => {
      if (dragCleanupRef.current) {
        dragCleanupRef.current()
        dragCleanupRef.current = null
      }
      dragRef.current = null
    }
  }, [])

  const clampToViewport = useCallback(
    (target: { left: number; top: number }) => {
      const viewport = getViewportBounds()
      if (!viewport.width || !viewport.height) return target
      const rect = widgetRef.current?.getBoundingClientRect()
      const width = collapsed ? COLLAPSED_SIZE : (rect?.width ?? EXPANDED_WIDTH)
      const height = collapsed ? COLLAPSED_SIZE : (rect?.height ?? EXPANDED_HEIGHT)
      const margin = 10
      const maxLeft = Math.max(margin, viewport.width - width - margin)
      const maxTop = Math.max(margin, viewport.height - height - margin)
      const left = clamp(target.left, margin, maxLeft)
      const top = clamp(target.top, margin, maxTop)
      return left === target.left && top === target.top ? target : { left, top }
    },
    [collapsed],
  )

  useEffect(() => {
    const applyClamp = () => {
      if (dragRef.current) return
      setPos((prev) => {
        const next = clampToViewport(prev)
        if (next !== prev) posRef.current = next
        return next
      })
    }

    applyClamp()
    window.addEventListener("resize", applyClamp)
    document.addEventListener("fullscreenchange", applyClamp)
    return () => {
      window.removeEventListener("resize", applyClamp)
      document.removeEventListener("fullscreenchange", applyClamp)
    }
  }, [clampToViewport])

  const onExpandedDragStart = (e: ReactPointerEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement | null
    if (target?.closest("button, a, input, textarea, select, [role='button']")) return
    const rect = widgetRef.current?.getBoundingClientRect()
    beginDrag(e, "expanded", rect?.width ?? EXPANDED_WIDTH, rect?.height ?? EXPANDED_HEIGHT)
  }

  const onCollapsedDragStart = (e: ReactPointerEvent<HTMLButtonElement>) => {
    beginDrag(e, "collapsed", COLLAPSED_SIZE, COLLAPSED_SIZE)
  }

  if (pathname === "/" || !settings.musicWidgetEnabled || !portalTarget) return null

  const widget = (
    <>
      <style>{`
        @keyframes music-marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes music-eq {
          0% { transform: scaleY(0.35); opacity: 0.55; }
          50% { transform: scaleY(1); opacity: 1; }
          100% { transform: scaleY(0.4); opacity: 0.7; }
        }
      `}</style>
      {collapsed ? (
        <button
          type="button"
          onPointerDown={onCollapsedDragStart}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault()
              setCollapsedState(false)
            }
          }}
          style={{ left: pos.left, top: pos.top }}
          className="fixed z-[80] h-12 w-12 rounded-2xl border border-border bg-background/75 backdrop-blur-xl shadow-2xl shadow-black/30 flex items-center justify-center"
          aria-label="Open music player"
          title="Open music player"
        >
          {playing ? (
            <div className="flex items-end gap-1">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="block w-[3px] rounded-full bg-foreground/80"
                  style={{
                    height: i === 1 ? 16 : 12,
                    animation: `music-eq ${0.75 + i * 0.2}s ease-in-out ${i * 0.12}s infinite`,
                  }}
                />
              ))}
            </div>
          ) : (
            <Music2 className="h-5 w-5 text-foreground" />
          )}
        </button>
      ) : (
        <div
          ref={widgetRef}
          style={{ left: pos.left, top: pos.top }}
          className="fixed z-[80] w-[320px] select-none rounded-2xl border border-border bg-background/75 backdrop-blur-xl shadow-2xl shadow-black/30"
        >
          <div
            onPointerDown={onExpandedDragStart}
            className="flex items-center gap-3 px-4 pt-3 pb-2 cursor-grab active:cursor-grabbing"
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setCollapsedState(true)
              }}
              className="h-10 w-10 rounded-xl bg-secondary/60 border border-border flex items-center justify-center hover:bg-secondary/75 transition-colors"
              aria-label="Collapse music player"
              title="Collapse player"
            >
              {playing ? (
                <div className="flex items-end gap-1">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="block w-[3px] rounded-full bg-foreground/80"
                      style={{
                        height: i === 1 ? 14 : 10,
                        animation: `music-eq ${0.75 + i * 0.2}s ease-in-out ${i * 0.12}s infinite`,
                      }}
                    />
                  ))}
                </div>
              ) : (
                <Music2 className="h-5 w-5 text-foreground" />
              )}
            </button>

            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-foreground overflow-hidden">
                {trackLabel.length > 26 && playing ? (
                  <div
                    className="whitespace-nowrap flex gap-8 w-max"
                    style={{ animation: "music-marquee 10s linear infinite" }}
                  >
                    <span>{trackLabel}</span>
                    <span aria-hidden="true">{trackLabel}</span>
                  </div>
                ) : (
                  <div className="truncate">{trackLabel}</div>
                )}
              </div>
              <div className="text-xs text-muted-foreground truncate">{statusText}</div>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setCollapsedState(true)
              }}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Hide
            </button>
          </div>

          <div className="px-4 pb-4">
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => seekBy(-10)}
                className="h-10 w-10 rounded-xl border border-border bg-secondary/40 hover:bg-secondary/60 transition-colors flex items-center justify-center"
                aria-label="Back 10 seconds"
                disabled={!settings.musicId}
              >
                <div className="relative">
                  <RotateCcw className="h-4 w-4 text-foreground" />
                  <span className="absolute -right-[6px] -bottom-[7px] text-[9px] font-bold text-foreground">10</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => void togglePlay()}
                className="h-11 flex-1 rounded-xl border border-border bg-foreground text-background hover:bg-foreground/90 transition-colors flex items-center justify-center gap-2"
                disabled={!settings.musicId}
              >
                {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                <span className="text-sm font-medium">{playing ? "Pause" : "Play"}</span>
              </button>

              <button
                type="button"
                onClick={() => seekBy(10)}
                className="h-10 w-10 rounded-xl border border-border bg-secondary/40 hover:bg-secondary/60 transition-colors flex items-center justify-center"
                aria-label="Forward 10 seconds"
                disabled={!settings.musicId}
              >
                <div className="relative">
                  <RotateCw className="h-4 w-4 text-foreground" />
                  <span className="absolute -right-[6px] -bottom-[7px] text-[9px] font-bold text-foreground">10</span>
                </div>
              </button>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <button
                type="button"
                onClick={() => updateSettings({ musicLoop: !settings.musicLoop })}
                className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs transition-colors ${
                  settings.musicLoop
                    ? "border-foreground/20 bg-foreground/10 text-foreground"
                    : "border-border bg-secondary/30 text-muted-foreground hover:text-foreground"
                }`}
                disabled={!settings.musicId}
              >
                {settings.musicLoop ? <Repeat1 className="h-4 w-4" /> : <Repeat className="h-4 w-4" />}
                {settings.musicLoop ? "Loop On" : "Loop Off"}
              </button>
              <div className="text-[11px] text-muted-foreground">Drag top bar to move</div>
            </div>
          </div>
        </div>
      )}
    </>
  )

  return createPortal(widget, portalTarget)
}
