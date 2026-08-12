"use client"

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react"

export type ColorTheme = "midnight" | "cloud" | "matrix" | "ocean" | "ember" | "violet"

export type BackgroundType =
  | "kinetic-dots"
  | "plexus"
  | "falling-stars"
  | "wave-field"
  | "grid-flow"
  | "custom-image"
  | "geometric-mesh"
  | "starfield"
  | "drift-dust"

export type CursorPreset = "system" | "concept-light" | "concept-dark"
export type FontId = "geist" | "plus-jakarta-sans" | "space-grotesk" | "orbitron" | "bebas-neue"
export type FontScale = "sm" | "md" | "lg" | "xl"
export type LetterSpacing = "tight" | "normal" | "wide" | "wider"
export type GuiScale = "0.75" | "0.85" | "0.9" | "1" | "1.1" | "1.2"
export type LaunchMode = "about-blank" | "blob"
export type LanguageCode =
  | "en-US"
  | "es-ES"
  | "fr-FR"
  | "ru-RU"
  | "zh-CN"
  | "ja-JP"
  | "vi-VN"
  | "hi-IN"
  | "ar-SA"
  | "pt-BR"
  | "de-DE"
  | "ko-KR"
  | "id-ID"
  | "tr-TR"
  | "it-IT"

export type ThemeColorOverrides = Partial<{
  background: string
  foreground: string
  primary: string
  accent: string
  card: string
  border: string
}>

export type ThemeOverride = {
  name?: string
  colors?: ThemeColorOverrides
}

export type ThemeOverrides = Partial<Record<ColorTheme, ThemeOverride>>

export interface Settings {
  colorTheme: ColorTheme
  themeOverrides: ThemeOverrides
  backgroundType: BackgroundType
  particleIntensity: "low" | "medium" | "high"
  particleSpeed: "slow" | "normal" | "fast"
  performanceMode: boolean
  customBackgroundImage: string | null

  showTime: boolean
  showBattery: boolean
  showOnlineCount: boolean
  guiScale: GuiScale
  launchMode: LaunchMode
  language: LanguageCode
  useMilitaryTime: boolean

  fontId: FontId
  fontScale: FontScale
  letterSpacing: LetterSpacing
  boldFont: boolean

  cursorPreset: CursorPreset
  mouseTrailEnabled: boolean
  mouseTrailColor: string
  mouseShapesEnabled: boolean
  mouseShapesColor: string

  clickSound: string | null
  musicId: string | null
  musicName: string | null
  musicWidgetEnabled: boolean
  musicLoop: boolean
  musicWidgetX: number
  musicWidgetY: number

  tabTitle: string
  tabIcon: string | null
  panicKey1: string
  panicKey2: string
  panicUrl: string
  preventReloads: boolean
}

interface SettingsContextType {
  settings: Settings
  updateSettings: (newSettings: Partial<Settings>) => void
}

const defaultSettings: Settings = {
  colorTheme: "midnight",
  themeOverrides: {},
  backgroundType: "kinetic-dots",
  particleIntensity: "medium",
  particleSpeed: "normal",
  performanceMode: false,
  customBackgroundImage: null,

  showTime: true,
  showBattery: true,
  showOnlineCount: false,
  guiScale: "1",
  launchMode: "about-blank",
  language: "en-US",
  useMilitaryTime: false,

  fontId: "geist",
  fontScale: "md",
  letterSpacing: "normal",
  boldFont: false,

  cursorPreset: "system",
  mouseTrailEnabled: false,
  mouseTrailColor: "#ffffff",
  mouseShapesEnabled: false,
  mouseShapesColor: "#ffffff",

  clickSound: null,
  musicId: null,
  musicName: null,
  musicWidgetEnabled: false,
  musicLoop: false,
  musicWidgetX: 18,
  musicWidgetY: 88,

  tabTitle: "1key",
  tabIcon: null,
  panicKey1: "",
  panicKey2: "",
  panicUrl: "",
  preventReloads: false,
}

export const DEFAULT_THEME_NAMES: Record<ColorTheme, string> = {
  midnight: "Midnight",
  cloud: "Cloud",
  matrix: "Matrix",
  ocean: "Ocean",
  ember: "Ember",
  violet: "Violet",
}

export const FONT_OPTIONS: Array<{ id: FontId; label: string; css: string }> = [
  { id: "geist", label: "Geist (Default)", css: "Geist, ui-sans-serif, system-ui, -apple-system, sans-serif" },
  {
    id: "plus-jakarta-sans",
    label: "Plus Jakarta Sans",
    css: "var(--font-plus-jakarta-sans), ui-sans-serif, system-ui, -apple-system, sans-serif",
  },
  { id: "space-grotesk", label: "Space Grotesk", css: "var(--font-space-grotesk), ui-sans-serif, system-ui, sans-serif" },
  { id: "orbitron", label: "Orbitron", css: "var(--font-orbitron), ui-sans-serif, system-ui, sans-serif" },
  { id: "bebas-neue", label: "Bebas Neue", css: "var(--font-bebas-neue), ui-sans-serif, system-ui, sans-serif" },
]

const FONT_SCALE_PX: Record<FontScale, string> = {
  sm: "14px",
  md: "16px",
  lg: "18px",
  xl: "20px",
}

const LETTER_SPACING_CSS: Record<LetterSpacing, string> = {
  tight: "-0.02em",
  normal: "0em",
  wide: "0.03em",
  wider: "0.06em",
}

const RTL_LANGUAGES = new Set<LanguageCode>(["ar-SA"])

const THEME_OVERRIDE_VARS = [
  "--background",
  "--foreground",
  "--card",
  "--card-foreground",
  "--popover",
  "--popover-foreground",
  "--primary",
  "--primary-foreground",
  "--secondary",
  "--secondary-foreground",
  "--muted",
  "--muted-foreground",
  "--accent",
  "--accent-foreground",
  "--border",
  "--input",
  "--ring",
  "--sidebar",
  "--sidebar-foreground",
  "--sidebar-primary",
  "--sidebar-primary-foreground",
  "--sidebar-accent",
  "--sidebar-accent-foreground",
  "--sidebar-border",
  "--sidebar-ring",
  "--glass",
  "--glass-border",
]

const hexToRgb = (hex: string) => {
  const normalized = hex.replace("#", "").trim()
  if (normalized.length === 3) {
    const r = parseInt(normalized[0] + normalized[0], 16)
    const g = parseInt(normalized[1] + normalized[1], 16)
    const b = parseInt(normalized[2] + normalized[2], 16)
    return { r, g, b }
  }
  if (normalized.length === 6) {
    const r = parseInt(normalized.slice(0, 2), 16)
    const g = parseInt(normalized.slice(2, 4), 16)
    const b = parseInt(normalized.slice(4, 6), 16)
    return { r, g, b }
  }
  return null
}

const contrastColor = (hex: string) => {
  const rgb = hexToRgb(hex)
  if (!rgb) return "#ffffff"
  const luminance = (0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b) / 255
  return luminance > 0.6 ? "#000000" : "#ffffff"
}

const rgba = (hex: string, alpha: number) => {
  const rgb = hexToRgb(hex)
  if (!rgb) return `rgba(0, 0, 0, ${alpha})`
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`
}

const applyThemeOverrides = (theme: ColorTheme, overrides: ThemeOverrides) => {
  const root = document.documentElement
  const override = overrides?.[theme]
  const colors = override?.colors ?? {}

  THEME_OVERRIDE_VARS.forEach((variable) => root.style.removeProperty(variable))

  const setIf = (variable: string, value: string | undefined) => {
    if (!value) return
    root.style.setProperty(variable, value)
  }

  setIf("--background", colors.background)
  setIf("--foreground", colors.foreground)
  setIf("--card", colors.card)
  setIf("--border", colors.border)

  if (colors.foreground) {
    setIf("--card-foreground", colors.foreground)
    setIf("--popover-foreground", colors.foreground)
    setIf("--secondary-foreground", colors.foreground)
    setIf("--muted-foreground", colors.foreground)
    setIf("--sidebar-foreground", colors.foreground)
    setIf("--sidebar-accent-foreground", colors.foreground)
  }
  if (colors.card) {
    setIf("--popover", colors.card)
    setIf("--secondary", colors.card)
    setIf("--muted", colors.card)
    setIf("--input", colors.card)
  }

  if (colors.primary) {
    setIf("--primary", colors.primary)
    setIf("--primary-foreground", contrastColor(colors.primary))
    setIf("--sidebar-primary", colors.primary)
    setIf("--sidebar-primary-foreground", contrastColor(colors.primary))
  }

  if (colors.accent) {
    setIf("--accent", colors.accent)
    setIf("--accent-foreground", contrastColor(colors.accent))
    setIf("--ring", colors.accent)
    setIf("--sidebar-accent", colors.accent)
  }

  if (colors.background) {
    setIf("--sidebar", colors.background)
    setIf("--glass", rgba(colors.background, 0.65))
  }
  if (colors.border) {
    setIf("--sidebar-border", colors.border)
    setIf("--glass-border", rgba(colors.border, 0.4))
  }
  if (colors.accent) {
    setIf("--sidebar-ring", colors.accent)
  }
}

const applyFontSettings = (settings: Settings) => {
  const root = document.documentElement
  const fontCss = (FONT_OPTIONS.find((option) => option.id === settings.fontId)?.css ?? FONT_OPTIONS[0].css).trim()
  root.style.setProperty("--font-sans", fontCss)
  root.style.setProperty("--app-font", fontCss)
  root.style.setProperty("--app-font-size", FONT_SCALE_PX[settings.fontScale] ?? FONT_SCALE_PX.md)
  root.style.setProperty("--app-letter-spacing", LETTER_SPACING_CSS[settings.letterSpacing] ?? LETTER_SPACING_CSS.normal)
  root.style.setProperty("--app-font-weight", settings.boldFont ? "700" : "400")

  if (document.body) {
    document.body.style.fontFamily = fontCss
  }
}

const normalizeSettings = (raw: unknown): Settings => {
  const next: Settings = { ...defaultSettings }
  if (!raw || typeof raw !== "object") return next
  const candidate = raw as Partial<Settings>

  ;(Object.keys(defaultSettings) as Array<keyof Settings>).forEach((key) => {
    if (candidate[key] !== undefined) {
      ;(next as Settings & Record<string, unknown>)[key] = candidate[key] as never
    }
  })

  const isColorTheme = (value: unknown): value is ColorTheme =>
    typeof value === "string" && (Object.keys(DEFAULT_THEME_NAMES) as string[]).includes(value)

  if (!isColorTheme(next.colorTheme)) next.colorTheme = defaultSettings.colorTheme

  const isBackgroundType = (value: unknown): value is BackgroundType =>
    typeof value === "string" &&
    [
      "kinetic-dots",
      "plexus",
      "falling-stars",
      "wave-field",
      "grid-flow",
      "custom-image",
      "geometric-mesh",
      "starfield",
      "drift-dust",
    ].includes(value)

  if (!isBackgroundType(next.backgroundType)) next.backgroundType = defaultSettings.backgroundType

  if (!next.themeOverrides || typeof next.themeOverrides !== "object") next.themeOverrides = {}

  const isFontId = (value: unknown): value is FontId =>
    typeof value === "string" && FONT_OPTIONS.some((option) => option.id === value)
  if (!isFontId(next.fontId)) next.fontId = defaultSettings.fontId

  const isFontScale = (value: unknown): value is FontScale => typeof value === "string" && value in FONT_SCALE_PX
  if (!isFontScale(next.fontScale)) next.fontScale = defaultSettings.fontScale

  const isLetterSpacing = (value: unknown): value is LetterSpacing =>
    typeof value === "string" && value in LETTER_SPACING_CSS
  if (!isLetterSpacing(next.letterSpacing)) next.letterSpacing = defaultSettings.letterSpacing

  const isCursorPreset = (value: unknown): value is CursorPreset =>
    typeof value === "string" && ["system", "concept-light", "concept-dark"].includes(value)
  if (!isCursorPreset(next.cursorPreset)) next.cursorPreset = defaultSettings.cursorPreset

  const toNullableString = (value: unknown) => (typeof value === "string" ? value : null)
  next.customBackgroundImage = toNullableString(next.customBackgroundImage)
  next.tabIcon = toNullableString(next.tabIcon)
  next.clickSound = toNullableString(next.clickSound)
  next.musicId = toNullableString(next.musicId)
  next.musicName = toNullableString(next.musicName)

  if (typeof next.musicWidgetEnabled !== "boolean") next.musicWidgetEnabled = defaultSettings.musicWidgetEnabled
  if (typeof next.musicLoop !== "boolean") next.musicLoop = defaultSettings.musicLoop
  if (typeof next.musicWidgetX !== "number") next.musicWidgetX = defaultSettings.musicWidgetX
  if (typeof next.musicWidgetY !== "number") next.musicWidgetY = defaultSettings.musicWidgetY

  if (typeof next.showTime !== "boolean") next.showTime = defaultSettings.showTime
  if (typeof next.showBattery !== "boolean") next.showBattery = defaultSettings.showBattery
  if (typeof next.showOnlineCount !== "boolean") next.showOnlineCount = defaultSettings.showOnlineCount
  if (typeof next.guiScale !== "string" || !["0.75", "0.85", "0.9", "1", "1.1", "1.2"].includes(next.guiScale)) {
    next.guiScale = defaultSettings.guiScale
  }
  if (typeof next.launchMode !== "string" || !["about-blank", "blob"].includes(next.launchMode)) {
    next.launchMode = defaultSettings.launchMode
  }
  if (
    typeof next.language !== "string" ||
    ![
      "en-US",
      "es-ES",
      "fr-FR",
      "ru-RU",
      "zh-CN",
      "ja-JP",
      "vi-VN",
      "hi-IN",
      "ar-SA",
      "pt-BR",
      "de-DE",
      "ko-KR",
      "id-ID",
      "tr-TR",
      "it-IT",
    ].includes(next.language)
  ) {
    next.language = defaultSettings.language
  }
  if (typeof next.useMilitaryTime !== "boolean") {
    next.useMilitaryTime = defaultSettings.useMilitaryTime
  }

  if (typeof next.mouseTrailColor !== "string") next.mouseTrailColor = defaultSettings.mouseTrailColor
  if (typeof next.mouseShapesColor !== "string") next.mouseShapesColor = defaultSettings.mouseShapesColor

  return next
}

const loadSettings = () => {
  if (typeof window === "undefined") return defaultSettings
  try {
    const saved = localStorage.getItem("1key-settings")
    if (!saved) return defaultSettings
    return normalizeSettings(JSON.parse(saved))
  } catch {
    return defaultSettings
  }
}

const QUOTA_ERROR_NAMES = ["QuotaExceededError", "NS_ERROR_DOM_QUOTA_REACHED"]

const isQuotaExceeded = (error: unknown) =>
  error instanceof DOMException && (QUOTA_ERROR_NAMES.includes(error.name) || error.code === 22 || error.code === 1014)

const SALVAGE_STEPS: ((settings: Settings) => Settings)[] = [
  (settings) => ({ ...settings, clickSound: null }),
  (settings) => ({ ...settings, clickSound: null, customBackgroundImage: null }),
]

const writeSettings = (settings: Settings) => {
  try {
    localStorage.setItem("1key-settings", JSON.stringify(settings))
    return
  } catch (error) {
    if (!isQuotaExceeded(error)) return
  }

  for (const salvage of SALVAGE_STEPS) {
    try {
      localStorage.setItem("1key-settings", JSON.stringify(salvage(settings)))
      return
    } catch {
    }
  }
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(loadSettings)
  const [mounted, setMounted] = useState(false)
  const pressedKeysRef = useRef<Set<string>>(new Set())
  const settingsRef = useRef(settings)

  useEffect(() => {
    settingsRef.current = settings
  }, [settings])

  useEffect(() => {
    if (!mounted) return

    const clearPressedKeys = () => {
      pressedKeysRef.current.clear()
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()
      pressedKeysRef.current.add(key)

      const { panicKey1, panicKey2, panicUrl } = settingsRef.current
      if (!panicKey1 || !panicKey2 || !panicUrl) return

      const key1 = panicKey1.toLowerCase()
      const key2 = panicKey2.toLowerCase()
      if (key !== key1 && key !== key2) return

      if (!pressedKeysRef.current.has(key === key1 ? key2 : key1)) return

      ;(window as Window & { __skipUnloadWarning?: boolean }).__skipUnloadWarning = true
      window.location.href = panicUrl.startsWith("http") ? panicUrl : `https://${panicUrl}`
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      pressedKeysRef.current.delete(e.key.toLowerCase())
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") clearPressedKeys()
    }

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)
    window.addEventListener("blur", clearPressedKeys)
    window.addEventListener("pagehide", clearPressedKeys)
    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
      window.removeEventListener("blur", clearPressedKeys)
      window.removeEventListener("pagehide", clearPressedKeys)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [mounted])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    writeSettings(settings)

    const themeClasses = Object.keys(DEFAULT_THEME_NAMES).map((theme) => `theme-${theme}`)
    document.documentElement.classList.remove(...themeClasses)
    if (settings.colorTheme && settings.colorTheme !== "midnight") {
      document.documentElement.classList.add(`theme-${settings.colorTheme}`)
    }

    applyThemeOverrides(settings.colorTheme, settings.themeOverrides)

    applyFontSettings(settings)
    document.documentElement.classList.toggle("app-bold", !!settings.boldFont)

    document.documentElement.style.setProperty("--app-gui-scale", settings.guiScale || "1")

    document.title = settings.tabTitle || "1key"
    const language = settings.language || "en-US"
    document.documentElement.lang = language
    document.documentElement.dir = RTL_LANGUAGES.has(language) ? "rtl" : "ltr"

    const rawTabIcon = typeof settings.tabIcon === "string" ? settings.tabIcon.trim() : ""
    const blockedIcon =
      !!rawTabIcon &&
      /(scramjet|1key\.lol\/scramjet|duckduckgo\.com\/favicon|google\.com\/favicon|bing\.com\/favicon)/i.test(rawTabIcon)
    const effectiveIcon = !blockedIcon && rawTabIcon ? rawTabIcon : "/favicon.ico?v=20260301i"
    const iconRels = ["icon", "shortcut icon", "apple-touch-icon"]
    iconRels.forEach((rel) => {
      let link = document.querySelector(`link[rel='${rel}']`) as HTMLLinkElement | null
      if (!link) {
        link = document.createElement("link")
        link.rel = rel
        document.head.appendChild(link)
      }
      link.href = effectiveIcon
    })
  }, [mounted, settings])

  const updateSettings = (newSettings: Partial<Settings>) => {
    const next = { ...settingsRef.current, ...newSettings }
    settingsRef.current = next
    setSettings(next)
    if (typeof window !== "undefined") {
      writeSettings(next)
    }
  }

  if (!mounted) {
    return <div className="min-h-screen bg-background" />
  }

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider")
  }
  return context
}
