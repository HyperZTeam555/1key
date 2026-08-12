"use client"

import React, { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import {
  DEFAULT_THEME_NAMES,
  FONT_OPTIONS,
  useSettings,
  type BackgroundType,
  type ColorTheme,
  type CursorPreset,
  type FontId,
  type FontScale,
  type GuiScale,
  type LanguageCode,
  type LaunchMode,
  type LetterSpacing,
  type ThemeColorOverrides,
  type ThemeOverride,
} from "@/lib/settings-context"
import { useUiText } from "@/lib/ui-text"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Info,
  Monitor,
  Languages,
  Layers,
  MousePointer2,
  Volume2,
  ShieldAlert,
  Type,
  Palette,
  Upload,
  RotateCcw,
  Sparkles,
  Gauge,
  ExternalLink,
} from "lucide-react"
import { deleteFile, putFile } from "@/lib/file-store"
import { withBasePath } from "@/lib/base-path"

const SECTIONS = [
  { id: "info", labelKey: "settings.section.info", icon: Info },
  { id: "site", labelKey: "settings.section.site", icon: Monitor },
  { id: "language", labelKey: "settings.section.language", icon: Languages },
  { id: "background", labelKey: "settings.section.background", icon: Layers },
  { id: "mouse", labelKey: "settings.section.mouse", icon: MousePointer2 },
  { id: "sound", labelKey: "settings.section.sound", icon: Volume2 },
  { id: "disguise", labelKey: "settings.section.disguise", icon: ShieldAlert },
  { id: "font", labelKey: "settings.section.font", icon: Type },
  { id: "theme", labelKey: "settings.section.theme", icon: Palette },
] as const

type SectionId = (typeof SECTIONS)[number]["id"]

const BACKGROUND_OPTIONS: Array<{ value: BackgroundType; label: string }> = [
  { value: "kinetic-dots", label: "Kinetic Dots (Default)" },
  { value: "plexus", label: "Neural Web" },
  { value: "falling-stars", label: "Falling Stars" },
  { value: "wave-field", label: "Wave Field" },
  { value: "grid-flow", label: "Grid Flow" },
  { value: "custom-image", label: "Custom Image/GIF" },
]

const CURSOR_PRESETS: Array<{ value: CursorPreset; label: string }> = [
  { value: "system", label: "System Default" },
  { value: "concept-dark", label: "Dark" },
  { value: "concept-light", label: "Light" },
]

const FONT_SCALES: Array<{ value: FontScale; label: string }> = [
  { value: "sm", label: "Small" },
  { value: "md", label: "Default" },
  { value: "lg", label: "Large" },
  { value: "xl", label: "Extra Large" },
]

const GUI_SCALES: Array<{ value: GuiScale; label: string }> = [
  { value: "0.75", label: "75%" },
  { value: "0.85", label: "85%" },
  { value: "0.9", label: "90%" },
  { value: "1", label: "100% (Default)" },
  { value: "1.1", label: "110%" },
  { value: "1.2", label: "120%" },
]

const LAUNCH_MODES: Array<{ value: LaunchMode; label: string }> = [
  { value: "about-blank", label: "about:blank (Default)" },
  { value: "blob", label: "blob: (Not Recommended)" },
]

const LANGUAGE_OPTIONS: Array<{ value: LanguageCode; label: string }> = [
  { value: "en-US", label: "English (Default)" },
  { value: "es-ES", label: "Spanish" },
  { value: "fr-FR", label: "French" },
  { value: "ru-RU", label: "Russian" },
  { value: "zh-CN", label: "Chinese (Simplified)" },
  { value: "ja-JP", label: "Japanese" },
  { value: "vi-VN", label: "Vietnamese" },
  { value: "hi-IN", label: "Hindi" },
  { value: "ar-SA", label: "Arabic" },
  { value: "pt-BR", label: "Portuguese (Brazil)" },
  { value: "de-DE", label: "German" },
  { value: "ko-KR", label: "Korean" },
  { value: "id-ID", label: "Indonesian" },
  { value: "tr-TR", label: "Turkish" },
  { value: "it-IT", label: "Italian" },
]

const LETTER_SPACING: Array<{ value: LetterSpacing; label: string }> = [
  { value: "tight", label: "Tight" },
  { value: "normal", label: "Normal" },
  { value: "wide", label: "Wide" },
  { value: "wider", label: "Wider" },
]

const KEY_OPTIONS = [
  { value: "a", label: "A" },
  { value: "b", label: "B" },
  { value: "c", label: "C" },
  { value: "d", label: "D" },
  { value: "e", label: "E" },
  { value: "f", label: "F" },
  { value: "g", label: "G" },
  { value: "h", label: "H" },
  { value: "i", label: "I" },
  { value: "j", label: "J" },
  { value: "k", label: "K" },
  { value: "l", label: "L" },
  { value: "m", label: "M" },
  { value: "n", label: "N" },
  { value: "o", label: "O" },
  { value: "p", label: "P" },
  { value: "q", label: "Q" },
  { value: "r", label: "R" },
  { value: "s", label: "S" },
  { value: "t", label: "T" },
  { value: "u", label: "U" },
  { value: "v", label: "V" },
  { value: "w", label: "W" },
  { value: "x", label: "X" },
  { value: "y", label: "Y" },
  { value: "z", label: "Z" },
  { value: "1", label: "1" },
  { value: "2", label: "2" },
  { value: "3", label: "3" },
  { value: "4", label: "4" },
  { value: "5", label: "5" },
  { value: "6", label: "6" },
  { value: "7", label: "7" },
  { value: "8", label: "8" },
  { value: "9", label: "9" },
  { value: "0", label: "0" },
  { value: "`", label: "`" },
  { value: "escape", label: "Esc" },
  { value: "tab", label: "Tab" },
  { value: " ", label: "Space" },
] as const

const DISGUISE_PRESETS = [
  {
    id: "ixl",
    name: "IXL",
    icon: "https://www.ixl.com/dv3/powZqMuTE7du4asFrVyNGxxoqkw/yui3/opengraph/assets/square_og_ixl.png",
    title: "IXL | Math, Language Arts, Science, Social Studies, and Spanish",
  },
  {
    id: "powerschool",
    name: "PowerSchool",
    icon: "https://play-lh.googleusercontent.com/FfHxiXf0AEElwpDtQA-xZ0oViPXFvb9bMvDiLfwicGxDB9DHjwRGXfTPfub-vamgQik",
    title: "PowerSchool",
  },
  {
    id: "quizlet",
    name: "Quizlet",
    icon: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQi3JHZqvc5WZtPYOev3hYJztTVafRbKVLNXQ&s",
    title: "Quizlet",
  },
] as const

const MAX_BACKGROUND_BYTES = 1536 * 1024
const MAX_SOUND_BYTES = 1024 * 1024
const MAX_MUSIC_BYTES = 20 * 1024 * 1024

const readAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ""))
    reader.onerror = () => reject(new Error("Failed to read file"))
    reader.readAsDataURL(file)
  })

const rgbToHex = (r: number, g: number, b: number) =>
  `#${[r, g, b]
    .map((value) => Math.max(0, Math.min(255, value)).toString(16).padStart(2, "0"))
    .join("")}`

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))

const linearToSrgb = (channel: number) => {
  const x = clamp(channel, 0, 1)
  return x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055
}

const oklchToRgb = (L: number, C: number, Hdeg: number) => {
  const h = (Hdeg * Math.PI) / 180
  const a = C * Math.cos(h)
  const b = C * Math.sin(h)

  const l_ = L + 0.3963377774 * a + 0.2158037573 * b
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b
  const s_ = L - 0.0894841775 * a - 1.291485548 * b

  const l = l_ * l_ * l_
  const m = m_ * m_ * m_
  const s = s_ * s_ * s_

  const rLin = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s
  const gLin = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s
  const bLin = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s

  const r = Math.round(clamp(linearToSrgb(rLin), 0, 1) * 255)
  const g = Math.round(clamp(linearToSrgb(gLin), 0, 1) * 255)
  const bOut = Math.round(clamp(linearToSrgb(bLin), 0, 1) * 255)

  return { r, g, b: bOut }
}

const cssColorToHex = (color: string) => {
  if (typeof window === "undefined") return null

  const toHexFromComputed = (value: string) => {
    const trimmed = value.trim().toLowerCase()
    if (!trimmed) return null
    if (trimmed.startsWith("#")) return trimmed.length === 4 ? `#${trimmed[1]}${trimmed[1]}${trimmed[2]}${trimmed[2]}${trimmed[3]}${trimmed[3]}` : trimmed

    const oklchMatch = trimmed.match(
      /oklch\(\s*([\d.]+%?)\s+([\d.]+)\s+([\d.]+)(deg|rad|turn|grad)?(?:\s*\/\s*([\d.]+%?))?\s*\)/,
    )
    if (oklchMatch) {
      const rawL = oklchMatch[1]
      const L =
        rawL.endsWith("%")
          ? parseFloat(rawL) / 100
          : parseFloat(rawL) > 1.2
          ? parseFloat(rawL) / 100
          : parseFloat(rawL)
      const C = parseFloat(oklchMatch[2])
      const rawH = parseFloat(oklchMatch[3])
      const unit = oklchMatch[4] || "deg"
      const Hdeg =
        unit === "rad"
          ? (rawH * 180) / Math.PI
          : unit === "turn"
          ? rawH * 360
          : unit === "grad"
          ? rawH * 0.9
          : rawH

      const rgb = oklchToRgb(L, C, Hdeg)
      return rgbToHex(rgb.r, rgb.g, rgb.b)
    }

    const rgbMatch = trimmed.match(/rgba?\(\s*([\d.]+)[, ]+([\d.]+)[, ]+([\d.]+)/)
    if (rgbMatch) return rgbToHex(Number(rgbMatch[1]), Number(rgbMatch[2]), Number(rgbMatch[3]))

    const srgbMatch = trimmed.match(/color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/)
    if (srgbMatch) {
      return rgbToHex(Math.round(Number(srgbMatch[1]) * 255), Math.round(Number(srgbMatch[2]) * 255), Math.round(Number(srgbMatch[3]) * 255))
    }

    return null
  }

  const direct = toHexFromComputed(color)
  if (direct) return direct

  const el = document.createElement("span")
  el.style.color = color
  el.style.display = "none"
  document.body.appendChild(el)
  const computed = getComputedStyle(el).color
  document.body.removeChild(el)
  const computedHex = toHexFromComputed(computed)
  if (computedHex) return computedHex

  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d")
  if (!ctx) return null
  ctx.fillStyle = "#000000"
  ctx.fillStyle = computed
  const normalized = String(ctx.fillStyle || "")
  return toHexFromComputed(normalized)
}

const getCssVarHex = (varName: string) => {
  if (typeof window === "undefined") return "#000000"
  const raw = getComputedStyle(document.documentElement).getPropertyValue(varName).trim()
  return cssColorToHex(raw) ?? "#000000"
}

export default function SettingsPage() {
  const { settings, updateSettings } = useSettings()
  const { t, tx } = useUiText()
  const [section, setSection] = useState<SectionId>("info")
  const [error, setError] = useState<string | null>(null)

  const bgUploadRef = useRef<HTMLInputElement>(null)
  const clickSoundRef = useRef<HTMLInputElement>(null)
  const musicRef = useRef<HTMLInputElement>(null)
  const tabIconRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const applyHash = () => {
      const hash = window.location.hash.replace("#", "")
      const match = SECTIONS.find((s) => s.id === hash)
      if (match) setSection(match.id)
    }
    applyHash()
    window.addEventListener("hashchange", applyHash)
    return () => window.removeEventListener("hashchange", applyHash)
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return
    const nextHash = `#${section}`
    if (window.location.hash !== nextHash) {
      history.replaceState(null, "", nextHash)
    }
  }, [section])

  const sectionLabel = (id: SectionId) => {
    const match = SECTIONS.find((item) => item.id === id)
    return match ? t(match.labelKey) : t("settings.title")
  }

  const themeLabel = useMemo(() => {
    const overrideName = settings.themeOverrides?.[settings.colorTheme]?.name
    return overrideName?.trim() || DEFAULT_THEME_NAMES[settings.colorTheme]
  }, [settings.colorTheme, settings.themeOverrides])

  const [resolvedThemeColors, setResolvedThemeColors] = useState(() => ({
    background: "#000000",
    foreground: "#ffffff",
    card: "#111111",
    border: "#333333",
    primary: "#ffffff",
    accent: "#22d3ee",
  }))

  useEffect(() => {
    if (typeof window === "undefined") return
    let raf2 = 0
    const raf1 = window.requestAnimationFrame(() => {
      raf2 = window.requestAnimationFrame(() => {
        setResolvedThemeColors({
          background: getCssVarHex("--background"),
          foreground: getCssVarHex("--foreground"),
          card: getCssVarHex("--card"),
          border: getCssVarHex("--border"),
          primary: getCssVarHex("--primary"),
          accent: getCssVarHex("--accent"),
        })
      })
    })
    return () => {
      window.cancelAnimationFrame(raf1)
      if (raf2) window.cancelAnimationFrame(raf2)
    }
  }, [settings.colorTheme, settings.themeOverrides])

  const themeOverrideColors = settings.themeOverrides?.[settings.colorTheme]?.colors ?? {}
  const currentThemeColors = {
    background: themeOverrideColors.background ?? resolvedThemeColors.background,
    foreground: themeOverrideColors.foreground ?? resolvedThemeColors.foreground,
    card: themeOverrideColors.card ?? resolvedThemeColors.card,
    border: themeOverrideColors.border ?? resolvedThemeColors.border,
    primary: themeOverrideColors.primary ?? resolvedThemeColors.primary,
    accent: themeOverrideColors.accent ?? resolvedThemeColors.accent,
  }

  const updateThemeOverride = (patch: Partial<ThemeOverride>) => {
    const theme = settings.colorTheme
    const current = settings.themeOverrides?.[theme] ?? {}
    const next: ThemeOverride = {
      ...current,
      ...patch,
      colors: { ...(current.colors ?? {}), ...(patch.colors ?? {}) },
    }
    updateSettings({
      themeOverrides: { ...(settings.themeOverrides ?? {}), [theme]: next },
    })
  }

  const updateThemeColor = (key: keyof ThemeColorOverrides, value: string) => {
    updateThemeOverride({ colors: { [key]: value } })
  }

  const resetTheme = () => {
    const theme = settings.colorTheme
    const { [theme]: _, ...rest } = settings.themeOverrides ?? {}
    updateSettings({ themeOverrides: rest })
  }

  const handleBackgroundUpload = async (file: File) => {
    if (file.size > MAX_BACKGROUND_BYTES) {
      setError("Background file is too large. Try a smaller image or shorter GIF.")
      return
    }
    const dataUrl = await readAsDataUrl(file)
    updateSettings({ customBackgroundImage: dataUrl, backgroundType: "custom-image" })
  }

  const handleSoundUpload = async (file: File, target: "clickSound") => {
    if (file.size > MAX_SOUND_BYTES) {
      setError("Click sound is too large. Keep it short (it plays the entire file).")
      return
    }
    const dataUrl = await readAsDataUrl(file)
    updateSettings({ [target]: dataUrl } as never)
  }

  const generateId = () => {
    try {
      if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID()
    } catch {
    }
    return `music_${Date.now()}_${Math.random().toString(16).slice(2)}`
  }

  const handleMusicUpload = async (file: File) => {
    if (file.size > MAX_MUSIC_BYTES) {
      setError("Music file is too large. Try a shorter/smaller file.")
      return
    }

    const id = generateId()
    await putFile({ id, name: file.name, blob: file, updatedAt: Date.now() })

    if (settings.musicId) {
      try {
        await deleteFile(settings.musicId)
      } catch {
      }
    }

    updateSettings({
      musicId: id,
      musicName: file.name,
      musicWidgetEnabled: true,
    })
  }

  const clearMusic = async () => {
    const id = settings.musicId
    updateSettings({ musicId: null, musicName: null, musicWidgetEnabled: false, musicLoop: false })
    if (id) {
      try {
        await deleteFile(id)
      } catch {
      }
    }
    clearFileInput(musicRef)
  }

  const handleTabIconUpload = async (file: File) => {
    if (file.size > 512 * 1024) {
      setError("Tab icon is too large. Try a smaller image.")
      return
    }
    const dataUrl = await readAsDataUrl(file)
    updateSettings({ tabIcon: dataUrl })
  }

  const clearFileInput = (ref: React.RefObject<HTMLInputElement | null>) => {
    if (ref.current) ref.current.value = ""
  }

  const getIntensityLabel = () => {
    switch (settings.backgroundType) {
      case "kinetic-dots":
        return { title: "Dot Density", description: "Controls how many dots are on screen" }
      case "plexus":
        return { title: "Node Density", description: "Control the number of connected nodes" }
      case "falling-stars":
        return { title: "Star Count", description: "Control the number of shooting stars" }
      case "wave-field":
        return { title: "Wave Lines", description: "Control the number of flowing waves" }
      case "grid-flow":
        return { title: "Grid Density", description: "Control how tight the grid lines feel" }
      default:
        return { title: "Particle Intensity", description: "Control the number of particles" }
    }
  }

  const getSpeedLabel = () => {
    switch (settings.backgroundType) {
      case "kinetic-dots":
        return { title: "Wave Speed", description: "Controls how energetic the grid feels" }
      case "plexus":
        return { title: "Drift Speed", description: "Adjust how fast nodes drift around" }
      case "falling-stars":
        return { title: "Fall Speed", description: "Adjust the speed of falling stars" }
      case "wave-field":
        return { title: "Wave Speed", description: "Adjust how fast waves flow" }
      case "grid-flow":
        return { title: "Flow Speed", description: "Adjust how fast the grid flows" }
      default:
        return { title: "Particle Speed", description: "Adjust the speed of particles" }
    }
  }

  const intensityLabels = getIntensityLabel()
  const speedLabels = getSpeedLabel()
  const displayedParticleIntensity = settings.performanceMode ? "low" : settings.particleIntensity

  return (
    <div className="min-h-screen pt-24 pb-12 proto-page-shell">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-[0.03em] text-foreground">{t("settings.title")}</h1>
            <p className="text-sm text-muted-foreground mt-1">{t("settings.subtitle")}</p>
          </div>
          <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground">
            <span className="px-2 py-1 rounded-md border border-border bg-card/40">{tx("Theme")}: {themeLabel}</span>
            <span className="px-2 py-1 rounded-md border border-border bg-card/40">
              {tx("Background")}: {BACKGROUND_OPTIONS.find((b) => b.value === settings.backgroundType)?.label ?? tx("Custom")}
            </span>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-foreground">
            <div className="flex items-center justify-between gap-4">
              <span>{error}</span>
              <Button variant="ghost" size="sm" onClick={() => setError(null)}>
                {t("common.dismiss")}
              </Button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-6">
          <aside className="md:sticky md:top-24 h-fit">
            <div className="rounded-2xl backdrop-blur-xl border border-border bg-card/30 p-3">
              <div className="md:hidden mb-3">
                <Label className="text-xs text-muted-foreground">{t("settings.sectionLabel")}</Label>
                <Select value={section} onValueChange={(value) => setSection(value as SectionId)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SECTIONS.map(({ id, labelKey }) => (
                      <SelectItem key={id} value={id}>
                        {t(labelKey)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <nav className="hidden md:flex flex-col gap-1">
                {SECTIONS.map(({ id, labelKey, icon: Icon }) => {
                  const active = id === section
                  return (
                    <button
                      key={id}
                      onClick={() => setSection(id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                        active
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{t(labelKey)}</span>
                    </button>
                  )
                })}
              </nav>
            </div>
          </aside>

          <section className="rounded-2xl backdrop-blur-xl border border-border bg-card/30 p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-semibold text-foreground">
                  {section === "info" ? "Credits" : sectionLabel(section)}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {section === "info"
                    ? "This page recognizes the people and projects that made 1key possible."
                    : t("settings.switchSections")}
                </p>
              </div>
            </div>

            {section === "info" && (
              <div className="space-y-6 text-sm text-foreground/90 leading-relaxed">
                <div className="rounded-xl border border-border bg-background/40 p-4">
                  <h4 className="font-semibold text-foreground">Core Team</h4>
                  <p className="mt-2 text-muted-foreground">595k as Owner, Developer, and Hosting</p>
                </div>

                <div className="rounded-xl border border-border bg-background/40 p-4">
                  <h4 className="font-semibold text-foreground">Features</h4>
                  <ul className="mt-2 space-y-2 text-muted-foreground">
                    <li>GN-Math for game assets</li>
                    <li>UGS for game assets</li>
                    <li>Monochrome for music source</li>
                  </ul>
                </div>

                <div className="rounded-xl border border-border bg-background/40 p-4">
                  <h4 className="font-semibold text-foreground">Legal and Contact</h4>
                  <p className="mt-2 text-muted-foreground">
                    Contact for legal requests and support: frankprice437@gmail.com
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button asChild size="sm" variant="outline" className="gap-2 bg-transparent">
                      <Link href={withBasePath("/privacy")}>
                        Privacy Policy
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button asChild size="sm" variant="outline" className="gap-2 bg-transparent">
                      <Link href={withBasePath("/terms")}>
                        Terms of Service
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button asChild size="sm" variant="outline" className="gap-2 bg-transparent">
                      <Link href={withBasePath("/dmca")}>
                        DMCA
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button asChild size="sm" variant="outline" className="gap-2 bg-transparent">
                      <a href="https://discord.gg/XK8vQGrfqv" target="_blank" rel="noreferrer">
                        Discord
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {section === "site" && (
              <div className="space-y-8">
                <div className="rounded-xl border border-border bg-background/30 p-4 text-sm text-muted-foreground">
                  {t("settings.site.header")}
                </div>

                <div className="flex items-center justify-between gap-4">
                  <div>
                    <Label className="text-foreground font-medium">{t("settings.site.showTime.title")}</Label>
                    <p className="text-sm text-muted-foreground">{t("settings.site.showTime.desc")}</p>
                  </div>
                  <Switch
                    checked={settings.showTime}
                    onCheckedChange={(checked) => updateSettings({ showTime: checked })}
                  />
                </div>

                <div className="flex items-center justify-between gap-4">
                  <div>
                    <Label className="text-foreground font-medium">{t("settings.site.showBattery.title")}</Label>
                    <p className="text-sm text-muted-foreground">{t("settings.site.showBattery.desc")}</p>
                  </div>
                  <Switch
                    checked={settings.showBattery}
                    onCheckedChange={(checked) => updateSettings({ showBattery: checked })}
                  />
                </div>

                <div className="flex items-center justify-between gap-4">
                  <div>
                    <Label className="text-foreground font-medium">{t("settings.site.guiScale.title")}</Label>
                    <p className="text-sm text-muted-foreground">{t("settings.site.guiScale.desc")}</p>
                  </div>
                  <Select
                    value={settings.guiScale}
                    onValueChange={(value) => updateSettings({ guiScale: value as GuiScale })}
                  >
                    <SelectTrigger className="w-56">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {GUI_SCALES.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <div>
                    <Label className="text-foreground font-medium">{t("settings.site.launchMode.title")}</Label>
                    <p className="text-sm text-muted-foreground">{t("settings.site.launchMode.desc")}</p>
                  </div>
                  <Select
                    value={settings.launchMode}
                    onValueChange={(value) => updateSettings({ launchMode: value as LaunchMode })}
                  >
                    <SelectTrigger className="w-56">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LAUNCH_MODES.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="h-px bg-border" />

                <div className="flex items-center justify-between gap-4">
                  <div>
                    <Label className="text-foreground font-medium">{t("settings.site.showOnline.title")}</Label>
                    <p className="text-sm text-muted-foreground">{t("settings.site.showOnline.desc")}</p>
                  </div>
                  <Switch
                    checked={settings.showOnlineCount}
                    onCheckedChange={(checked) => updateSettings({ showOnlineCount: checked })}
                  />
                </div>

                <div className="h-px bg-border" />

                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <RotateCcw className="w-5 h-5 text-foreground" />
                    <div>
                      <Label className="text-foreground font-medium">{t("settings.site.reload.title")}</Label>
                      <p className="text-sm text-muted-foreground">{t("settings.site.reload.desc")}</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.preventReloads}
                    onCheckedChange={(checked) => updateSettings({ preventReloads: checked })}
                  />
                </div>
              </div>
            )}

            {section === "language" && (
              <div className="space-y-8">
                <div className="rounded-xl border border-border bg-background/30 p-4 text-sm text-muted-foreground">
                  {t("settings.language.header")}
                </div>

                <div className="flex items-center justify-between gap-4">
                  <div>
                    <Label className="text-foreground font-medium">{t("settings.language.title")}</Label>
                    <p className="text-sm text-muted-foreground">{t("settings.language.desc")}</p>
                  </div>
                  <Select
                    value={settings.language}
                    onValueChange={(value) => updateSettings({ language: value as LanguageCode })}
                  >
                    <SelectTrigger className="w-56">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="h-px bg-border" />

                <div className="flex items-center justify-between gap-4">
                  <div>
                    <Label className="text-foreground font-medium">{t("settings.site.military.title")}</Label>
                    <p className="text-sm text-muted-foreground">{t("settings.site.military.desc")}</p>
                  </div>
                  <Switch
                    checked={settings.useMilitaryTime}
                    onCheckedChange={(checked) => updateSettings({ useMilitaryTime: checked })}
                  />
                </div>
              </div>
            )}

            {section === "background" && (
              <div className="space-y-8">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Layers className="w-5 h-5 text-foreground" />
                    <div>
                      <Label className="text-foreground font-medium">{tx("Background Style")}</Label>
                      <p className="text-sm text-muted-foreground">{tx("Choose your animated background effect.")}</p>
                    </div>
                  </div>
                  <Select
                    value={settings.backgroundType}
                    onValueChange={(value) => updateSettings({ backgroundType: value as BackgroundType })}
                  >
                    <SelectTrigger className="w-56">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BACKGROUND_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {settings.backgroundType === "custom-image" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <Upload className="w-5 h-5 text-foreground" />
                        <div>
                          <Label className="text-foreground font-medium">{tx("Upload Background")}</Label>
                          <p className="text-sm text-muted-foreground">{tx("PNG/JPG/AVIF/GIF up to ~1.5MB.")}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          ref={bgUploadRef}
                          type="file"
                          accept="image/png,image/jpeg,image/jpg,image/avif,image/gif,image/webp"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0]
                            if (!file) return
                            setError(null)
                            try {
                              await handleBackgroundUpload(file)
                            } catch {
                              setError(tx("Failed to upload background."))
                            }
                          }}
                        />
                        <Button variant="outline" onClick={() => bgUploadRef.current?.click()} className="gap-2">
                          <Upload className="w-4 h-4" />
                          {tx("Choose File")}
                        </Button>
                        {settings.customBackgroundImage && (
                          <Button
                            variant="ghost"
                            onClick={() => {
                              updateSettings({ customBackgroundImage: null })
                              clearFileInput(bgUploadRef)
                            }}
                          >
                            {tx("Clear")}
                          </Button>
                        )}
                      </div>
                    </div>

                    {settings.customBackgroundImage ? (
                      <div className="rounded-2xl overflow-hidden border border-border bg-background/40">
                        <div className="relative aspect-video w-full">
                          <img
                            src={settings.customBackgroundImage}
                            alt={tx("Custom background preview")}
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-border bg-background/30 p-6 text-sm text-muted-foreground">
                        {tx("Upload an image or a short GIF to use as your background.")}
                      </div>
                    )}
                  </div>
                )}

                <div className="h-px bg-border" />

                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-foreground" />
                    <div>
                      <Label className="text-foreground font-medium">{intensityLabels.title}</Label>
                      <p className="text-sm text-muted-foreground">{intensityLabels.description}</p>
                    </div>
                  </div>
                  <Select
                    value={displayedParticleIntensity}
                    onValueChange={(value: "low" | "medium" | "high") => updateSettings({ particleIntensity: value })}
                    disabled={settings.performanceMode || settings.backgroundType === "custom-image"}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">{tx("Low")}</SelectItem>
                      <SelectItem value="medium">{tx("Medium")}</SelectItem>
                      <SelectItem value="high">{tx("High")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Gauge className="w-5 h-5 text-foreground" />
                    <div>
                      <Label className="text-foreground font-medium">{speedLabels.title}</Label>
                      <p className="text-sm text-muted-foreground">{speedLabels.description}</p>
                    </div>
                  </div>
                  <Select
                    value={settings.particleSpeed}
                    onValueChange={(value: "slow" | "normal" | "fast") => updateSettings({ particleSpeed: value })}
                    disabled={settings.backgroundType === "custom-image"}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="slow">{tx("Slow")}</SelectItem>
                      <SelectItem value="normal">{tx("Normal")}</SelectItem>
                      <SelectItem value="fast">{tx("Fast")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <RotateCcw className="w-5 h-5 text-foreground" />
                    <div>
                      <Label className="text-foreground font-medium">{tx("Performance Mode")}</Label>
                      <p className="text-sm text-muted-foreground">{tx("Reduces animation load for slower devices.")}</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.performanceMode}
                    onCheckedChange={(checked) => updateSettings({ performanceMode: checked })}
                  />
                </div>
              </div>
            )}

            {section === "mouse" && (
              <div className="space-y-8">
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <MousePointer2 className="w-5 h-5 text-foreground" />
                      <div>
                        <Label className="text-foreground font-medium">{tx("Cursor Preset")}</Label>
                        <p className="text-sm text-muted-foreground">{tx("Pick a preset cursor.")}</p>
                      </div>
                    </div>
                    <Select
                      value={settings.cursorPreset}
                      onValueChange={(value) => updateSettings({ cursorPreset: value as CursorPreset })}
                    >
                      <SelectTrigger className="w-56">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CURSOR_PRESETS.map((preset) => (
                          <SelectItem key={preset.value} value={preset.value}>
                            {preset.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="h-px bg-border" />

                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <Label className="text-foreground font-medium">{tx("Trail")}</Label>
                      <p className="text-sm text-muted-foreground">{tx("A clean lightsaber trail behind your cursor.")}</p>
                    </div>
                    <Switch
                      checked={settings.mouseTrailEnabled}
                      onCheckedChange={(checked) => updateSettings({ mouseTrailEnabled: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <Label className="text-foreground font-medium">{tx("Trail Color")}</Label>
                    <input
                      type="color"
                      value={settings.mouseTrailColor}
                      onChange={(e) => updateSettings({ mouseTrailColor: e.target.value })}
                      className="h-10 w-14 rounded-lg border border-border bg-transparent p-1"
                    />
                  </div>
                </div>

                <div className="h-px bg-border" />

                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <Label className="text-foreground font-medium">{tx("Shapes")}</Label>
                      <p className="text-sm text-muted-foreground">
                        {tx("Emits subtle shapes behind your cursor that fade out.")}
                      </p>
                    </div>
                    <Switch
                      checked={settings.mouseShapesEnabled}
                      onCheckedChange={(checked) => updateSettings({ mouseShapesEnabled: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <Label className="text-foreground font-medium">{tx("Shapes Color")}</Label>
                    <input
                      type="color"
                      value={settings.mouseShapesColor}
                      onChange={(e) => updateSettings({ mouseShapesColor: e.target.value })}
                      className="h-10 w-14 rounded-lg border border-border bg-transparent p-1"
                    />
                  </div>
                </div>
              </div>
            )}

            {section === "sound" && (
              <div className="space-y-8">
                <div className="rounded-xl border border-border bg-background/30 p-4 text-sm text-muted-foreground">
                  {tx("Click sounds play in the UI (not inside games). Music is stored on your device and can be played from a movable mini player.")}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Volume2 className="w-5 h-5 text-foreground" />
                      <div>
                        <Label className="text-foreground font-medium">{tx("Click Sound")}</Label>
                        <p className="text-sm text-muted-foreground">
                          {tx("Audio file up to ~1MB. Plays the entire file, so keep it short.")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        ref={clickSoundRef}
                        type="file"
                        accept="audio/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0]
                          if (!file) return
                          setError(null)
                          try {
                            await handleSoundUpload(file, "clickSound")
                          } catch {
                            setError(tx("Failed to upload click sound."))
                          }
                        }}
                      />
                      <Button variant="outline" onClick={() => clickSoundRef.current?.click()} className="gap-2">
                        <Upload className="w-4 h-4" />
                        {tx("Upload")}
                      </Button>
                      {settings.clickSound && (
                        <Button
                          variant="ghost"
                          onClick={() => {
                            updateSettings({ clickSound: null })
                            clearFileInput(clickSoundRef)
                          }}
                        >
                          {tx("Clear")}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="h-px bg-border" />

                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Sparkles className="w-5 h-5 text-foreground" />
                      <div>
                        <Label className="text-foreground font-medium">{tx("Music")}</Label>
                        <p className="text-sm text-muted-foreground">{tx("Upload a track (up to ~20MB) and toggle the player.")}</p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.musicWidgetEnabled}
                      onCheckedChange={(checked) => updateSettings({ musicWidgetEnabled: checked })}
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-background/40 p-4">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-foreground truncate">
                        {settings.musicName ? settings.musicName : tx("No track uploaded")}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {tx("The mini player is draggable and includes play/pause, loop, and 10-second skip controls.")}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        ref={musicRef}
                        type="file"
                        accept="audio/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0]
                          if (!file) return
                          setError(null)
                          try {
                            await handleMusicUpload(file)
                          } catch {
                            setError(tx("Failed to save music file."))
                          }
                        }}
                      />
                      <Button variant="outline" onClick={() => musicRef.current?.click()} className="gap-2">
                        <Upload className="w-4 h-4" />
                        {settings.musicId ? tx("Replace") : tx("Upload")}
                      </Button>
                      {settings.musicId && (
                        <Button variant="ghost" onClick={() => void clearMusic()}>
                          {tx("Clear")}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {section === "disguise" && (
              <div className="space-y-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <ShieldAlert className="w-6 h-6 text-foreground" />
                    <div>
                      <Label className="text-foreground font-medium">{tx("Disguise Presets")}</Label>
                      <p className="text-sm text-muted-foreground">{tx("Quickly change the tab to look like something else.")}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {DISGUISE_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        onClick={() =>
                          updateSettings({
                            tabTitle: preset.title,
                            tabIcon: preset.icon,
                          })
                        }
                        className="flex items-center gap-3 p-4 rounded-xl bg-secondary/40 border border-border hover:bg-secondary hover:border-foreground/20 transition-all"
                      >
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-background shrink-0">
                          <Image
                            src={preset.icon || "/images/ui/placeholder.svg"}
                            alt={preset.name}
                            width={40}
                            height={40}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-medium text-foreground">{preset.name}</p>
                          <p className="text-xs text-muted-foreground line-clamp-2">{preset.title}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="h-px bg-border" />

                <div className="space-y-4">
                  <Label className="text-foreground font-medium">{tx("Tab Title")}</Label>
                  <Input
                    value={settings.tabTitle}
                    onChange={(e) => updateSettings({ tabTitle: e.target.value })}
                    placeholder={tx("Enter custom tab title...")}
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Upload className="w-5 h-5 text-foreground" />
                      <div>
                        <Label className="text-foreground font-medium">{tx("Tab Icon (Favicon)")}</Label>
                        <p className="text-sm text-muted-foreground">{tx("Upload a custom image for the tab icon.")}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        ref={tabIconRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0]
                          if (!file) return
                          setError(null)
                          try {
                            await handleTabIconUpload(file)
                          } catch {
                            setError(tx("Failed to upload tab icon."))
                          }
                        }}
                      />
                      <Button variant="outline" onClick={() => tabIconRef.current?.click()} className="gap-2">
                        <Upload className="w-4 h-4" />
                        {tx("Upload")}
                      </Button>
                      {settings.tabIcon && (
                        <Button
                          variant="ghost"
                          onClick={() => {
                            updateSettings({ tabIcon: null })
                            clearFileInput(tabIconRef)
                          }}
                        >
                          {tx("Clear")}
                        </Button>
                      )}
                    </div>
                  </div>

                  {settings.tabIcon && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg border border-border overflow-hidden bg-background">
                        <img src={settings.tabIcon} alt={tx("Tab icon preview")} className="w-full h-full object-cover" />
                      </div>
                      <p className="text-sm text-muted-foreground">{tx("Preview")}</p>
                    </div>
                  )}
                </div>

                <div className="h-px bg-border" />

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <ShieldAlert className="w-5 h-5 text-foreground" />
                    <div>
                      <Label className="text-foreground font-medium">{tx("Panic Button")}</Label>
                      <p className="text-sm text-muted-foreground">{tx("Press two keys at the same time to navigate away.")}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] items-end gap-3">
                    <div>
                      <Label className="text-foreground font-medium mb-2 block">{tx("Key 1")}</Label>
                      <Select value={settings.panicKey1} onValueChange={(value) => updateSettings({ panicKey1: value })}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={tx("Select Key")} />
                        </SelectTrigger>
                        <SelectContent>
                          {KEY_OPTIONS.map((key) => (
                            <SelectItem key={key.value} value={key.value}>
                              {key.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="text-muted-foreground font-medium text-center pb-3">+</div>

                    <div>
                      <Label className="text-foreground font-medium mb-2 block">{tx("Key 2")}</Label>
                      <Select value={settings.panicKey2} onValueChange={(value) => updateSettings({ panicKey2: value })}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={tx("Select Key")} />
                        </SelectTrigger>
                        <SelectContent>
                          {KEY_OPTIONS.map((key) => (
                            <SelectItem key={key.value} value={key.value}>
                              {key.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label className="text-foreground font-medium mb-2 block">{tx("Redirect URL")}</Label>
                    <Input
                      value={settings.panicUrl}
                      onChange={(e) => updateSettings({ panicUrl: e.target.value })}
                      placeholder={tx("Enter URL (example.com or https://example.com)")}
                    />
                  </div>
                </div>

              </div>
            )}

            {section === "font" && (
              <div className="space-y-8">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Type className="w-5 h-5 text-foreground" />
                    <div>
                      <Label className="text-foreground font-medium">{tx("Font")}</Label>
                      <p className="text-sm text-muted-foreground">{tx("Choose a font, size, spacing, and weight.")}</p>
                    </div>
                  </div>
                  <Select
                    value={settings.fontId}
                    onValueChange={(value) => updateSettings({ fontId: value as FontId })}
                  >
                    <SelectTrigger className="w-64">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FONT_OPTIONS.map((font) => (
                        <SelectItem key={font.id} value={font.id}>
                          {font.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <div>
                    <Label className="text-foreground font-medium">{tx("Font Size")}</Label>
                    <p className="text-sm text-muted-foreground">{tx("A safe range from small to large.")}</p>
                  </div>
                  <Select
                    value={settings.fontScale}
                    onValueChange={(value) => updateSettings({ fontScale: value as FontScale })}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FONT_SCALES.map((scale) => (
                        <SelectItem key={scale.value} value={scale.value}>
                          {scale.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <div>
                    <Label className="text-foreground font-medium">{tx("Letter Spacing")}</Label>
                    <p className="text-sm text-muted-foreground">{tx("Adjust spacing without going overboard.")}</p>
                  </div>
                  <Select
                    value={settings.letterSpacing}
                    onValueChange={(value) => updateSettings({ letterSpacing: value as LetterSpacing })}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LETTER_SPACING.map((spacing) => (
                        <SelectItem key={spacing.value} value={spacing.value}>
                          {spacing.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <div>
                    <Label className="text-foreground font-medium">{tx("Bold Font")}</Label>
                    <p className="text-sm text-muted-foreground">{tx("Makes the default text weight a bit stronger.")}</p>
                  </div>
                  <Switch checked={settings.boldFont} onCheckedChange={(checked) => updateSettings({ boldFont: checked })} />
                </div>

                <div className="h-px bg-border" />

                <Button
                  variant="outline"
                  onClick={() =>
                    updateSettings({
                      fontId: "geist",
                      fontScale: "md",
                      letterSpacing: "normal",
                      boldFont: false,
                    })
                  }
                >
                  {tx("Reset Font Settings")}
                </Button>
              </div>
            )}

            {section === "theme" && (
              <div className="space-y-8">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Palette className="w-5 h-5 text-foreground" />
                    <div>
                      <Label className="text-foreground font-medium">{tx("Theme")}</Label>
                      <p className="text-sm text-muted-foreground">{tx("Edit a built-in theme (auto-saves).")}</p>
                    </div>
                  </div>
                  <Select
                    value={settings.colorTheme}
                    onValueChange={(value) => updateSettings({ colorTheme: value as ColorTheme })}
                  >
                    <SelectTrigger className="w-56">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(DEFAULT_THEME_NAMES) as ColorTheme[]).map((theme) => (
                        <SelectItem key={theme} value={theme}>
                          {settings.themeOverrides?.[theme]?.name?.trim() || DEFAULT_THEME_NAMES[theme]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label className="text-foreground font-medium">{tx("Theme Name")}</Label>
                  <Input
                    value={settings.themeOverrides?.[settings.colorTheme]?.name ?? DEFAULT_THEME_NAMES[settings.colorTheme]}
                    onChange={(e) => updateThemeOverride({ name: e.target.value })}
                    placeholder={tx("Theme name...")}
                  />
                  <p className="text-xs text-muted-foreground">
                    {tx("Renaming a theme changes how it shows up in the dropdown.")}
                  </p>
                </div>

                <div className="h-px bg-border" />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(
                    [
                      ["background", "Background"],
                      ["foreground", "Foreground"],
                      ["card", "Card"],
                      ["border", "Border"],
                      ["primary", "Primary"],
                      ["accent", "Accent"],
                    ] as Array<[keyof ThemeColorOverrides, string]>
                  ).map(([key, label]) => (
                    <div key={key} className="rounded-xl border border-border bg-background/40 p-4 flex items-center justify-between gap-4">
                      <div>
                        <Label className="text-foreground font-medium">{tx(label)}</Label>
                        <p className="text-xs text-muted-foreground">
                          {settings.themeOverrides?.[settings.colorTheme]?.colors?.[key] ? tx("Custom") : tx("Default")}
                        </p>
                      </div>
                      <input
                        type="color"
                        value={currentThemeColors[key] ?? "#000000"}
                        onChange={(e) => updateThemeColor(key, e.target.value)}
                        className="h-10 w-14 rounded-lg border border-border bg-transparent p-1"
                      />
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between gap-4">
                  <Button variant="outline" onClick={resetTheme}>
                    Reset Theme to Default
                  </Button>
                  <p className="text-xs text-muted-foreground text-right">
                    This only resets colors + name for <span className="font-medium text-foreground">{themeLabel}</span>.
                  </p>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
