"use client"

import { useEffect, useRef, useState } from "react"
import { Database, Download, RefreshCcw, Trash2, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useUiText } from "@/lib/ui-text"

type BackupPayload = {
  version: number
  createdAt: string
  origin: string
  localStorage: Record<string, string>
  cookies: Record<string, string>
}

const SETTINGS_STORAGE_KEY = "1key-settings"

const CONFIRM_RESTORE = "Restore this backup? This replaces your current settings and game saves on this site."
const CONFIRM_RESTORE_RELOAD = "Restore complete. Reload now?"
const CONFIRM_RESET_SETTINGS = "Reset app settings only? Your game saves stay untouched."
const CONFIRM_RESET_RELOAD = "Reload now to apply default settings?"
const CONFIRM_CLEAR_ALL = "Clear all data? This removes game saves, settings, and local cookies on this site."
const CONFIRM_CLEAR_RELOAD = "Reload now?"

const CONFIRM_PROMPTS = [
  CONFIRM_RESTORE,
  CONFIRM_RESTORE_RELOAD,
  CONFIRM_RESET_SETTINGS,
  CONFIRM_RESET_RELOAD,
  CONFIRM_CLEAR_ALL,
  CONFIRM_CLEAR_RELOAD,
]

const SETTINGS_KEY_PREFIXES = [
  SETTINGS_STORAGE_KEY,
  "1key-ui-i18n",
  "1key-announcement",
  "1key-music-widget",
  "1key-monolith-cinematic-v1",
  "1key-cursor-style",
  "1key-chunk-reload-at",
]

function isSettingsKey(key: string) {
  return SETTINGS_KEY_PREFIXES.some((prefix) => key === prefix || key.startsWith(`${prefix}:`))
}

function safeDecode(value: string) {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value)
}

type CookieEntry = { rawName: string; name: string; value: string }

function parseCookieEntries(raw: string): CookieEntry[] {
  const entries: CookieEntry[] = []
  const parts = raw.split(";").map((part) => part.trim()).filter(Boolean)
  for (const part of parts) {
    const separator = part.indexOf("=")
    if (separator === -1) continue
    const rawName = part.slice(0, separator).trim()
    entries.push({
      rawName,
      name: safeDecode(rawName),
      value: safeDecode(part.slice(separator + 1).trim()),
    })
  }
  return entries
}

function parseCookies(raw: string): Record<string, string> {
  const result: Record<string, string> = {}
  for (const { name, value } of parseCookieEntries(raw)) {
    result[name] = value
  }
  return result
}

function normalizeStorage(input: unknown): Record<string, string> {
  if (!input || typeof input !== "object") return {}
  const output: Record<string, string> = {}
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    output[String(key)] = typeof value === "string" ? value : JSON.stringify(value)
  }
  return output
}

function normalizeCookies(input: unknown): Record<string, string> {
  if (!input || typeof input !== "object") return {}
  const output: Record<string, string> = {}
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    output[String(key)] = typeof value === "string" ? value : String(value ?? "")
  }
  return output
}

function clearAllCookies() {
  for (const { rawName } of parseCookieEntries(document.cookie)) {
    document.cookie = `${rawName}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
  }
}

function removeSettingsOnly() {
  const keysToDelete: string[] = []
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index)
    if (!key) continue
    if (isSettingsKey(key)) keysToDelete.push(key)
  }
  for (const key of keysToDelete) {
    localStorage.removeItem(key)
  }
}

function sanitizeSettingsValue(value: string): string {
  let parsed: unknown
  try {
    parsed = JSON.parse(value)
  } catch {
    return value
  }
  if (!isPlainRecord(parsed) || !isPlainRecord(parsed.themeOverrides)) return value

  let droppedColor = false
  const themeOverrides: Record<string, unknown> = {}

  for (const [theme, override] of Object.entries(parsed.themeOverrides)) {
    if (!isPlainRecord(override) || !isPlainRecord(override.colors)) {
      themeOverrides[theme] = override
      continue
    }
    const colors: Record<string, string> = {}
    for (const [colorName, colorValue] of Object.entries(override.colors)) {
      if (typeof colorValue === "string") {
        colors[colorName] = colorValue
        continue
      }
      droppedColor = true
    }
    themeOverrides[theme] = { ...override, colors }
  }

  if (!droppedColor) return value
  return JSON.stringify({ ...parsed, themeOverrides })
}

function buildPayload(): BackupPayload {
  const storage: Record<string, string> = {}
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index)
    if (!key) continue
    storage[key] = localStorage.getItem(key) ?? ""
  }

  return {
    version: 3,
    createdAt: new Date().toISOString(),
    origin: window.location.origin,
    localStorage: storage,
    cookies: parseCookies(document.cookie),
  }
}

export default function DataPage() {
  const { tx } = useUiText()
  const [busy, setBusy] = useState(false)
  const [statusText, setStatusText] = useState("")
  const [lastBackupName, setLastBackupName] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    for (const prompt of CONFIRM_PROMPTS) tx(prompt)
  }, [tx])

  const createBackup = async () => {
    if (busy) return
    setBusy(true)
    setStatusText("")

    try {
      const payload = buildPayload()
      const backupName = `1key-backup-${new Date().toISOString().replace(/[:.]/g, "-")}.1keybackup`
      const json = JSON.stringify(payload, null, 2)
      const blob = new Blob([json], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement("a")
      anchor.href = url
      anchor.download = backupName
      document.body.appendChild(anchor)
      anchor.click()
      document.body.removeChild(anchor)
      URL.revokeObjectURL(url)

      setLastBackupName(backupName)
      setStatusText("Backup created successfully.")
    } catch {
      setStatusText("Backup failed. Your browser blocked the download.")
    } finally {
      setBusy(false)
    }
  }

  const restoreBackupFromFile = async (file: File) => {
    if (busy) return
    setBusy(true)
    setStatusText("")

    try {
      const text = await file.text()
      const parsed = JSON.parse(text) as Partial<BackupPayload> & Record<string, unknown>

      if (!isPlainRecord(parsed) || (!isPlainRecord(parsed.localStorage) && !isPlainRecord(parsed.cookies))) {
        setStatusText("That file is not a 1key backup. Nothing was changed.")
        return
      }

      const importedStorage = normalizeStorage(parsed.localStorage)
      const importedCookies = normalizeCookies(parsed.cookies)

      if (Object.keys(importedStorage).length === 0 && Object.keys(importedCookies).length === 0) {
        setStatusText("That backup is empty. Nothing was changed.")
        return
      }

      const confirmed = window.confirm(tx(CONFIRM_RESTORE))
      if (!confirmed) {
        setStatusText("Restore cancelled.")
        return
      }

      clearAllCookies()
      for (const [key, value] of Object.entries(importedCookies)) {
        try {
          document.cookie = `${encodeURIComponent(key)}=${encodeURIComponent(value)}; path=/; max-age=31536000; samesite=lax`
        } catch {
        }
      }

      localStorage.clear()
      for (const [key, value] of Object.entries(importedStorage)) {
        localStorage.setItem(key, key === SETTINGS_STORAGE_KEY ? sanitizeSettingsValue(value) : value)
      }

      setStatusText("Backup restored. Reload to apply everything.")
      window.setTimeout(() => {
        if (window.confirm(tx(CONFIRM_RESTORE_RELOAD))) {
          window.location.reload()
        }
      }, 120)
    } catch {
      setStatusText("Restore failed. Please choose a valid backup file.")
    } finally {
      setBusy(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const resetSettings = () => {
    if (busy) return
    const confirmed = window.confirm(tx(CONFIRM_RESET_SETTINGS))
    if (!confirmed) return

    removeSettingsOnly()
    setStatusText("Settings reset complete.")

    window.setTimeout(() => {
      if (window.confirm(tx(CONFIRM_RESET_RELOAD))) {
        window.location.reload()
      }
    }, 120)
  }

  const clearAllLocalData = () => {
    if (busy) return
    const confirmed = window.confirm(tx(CONFIRM_CLEAR_ALL))
    if (!confirmed) return

    try {
      clearAllCookies()
    } catch {
    }
    localStorage.clear()
    setStatusText("All data cleared.")

    window.setTimeout(() => {
      if (window.confirm(tx(CONFIRM_CLEAR_RELOAD))) {
        window.location.reload()
      }
    }, 120)
  }

  return (
    <div className="min-h-screen pt-24 pb-12 proto-page-shell">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-4 tracking-[0.03em]">{tx("Data")}</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {tx("Create a backup file of your local progress and restore it anytime.")}
          </p>
        </div>

        {statusText && (
          <div className="mb-6 rounded-xl border border-border bg-card/35 px-4 py-3 text-sm text-foreground/90">
            {tx(statusText)}
          </div>
        )}

        <div className="rounded-2xl border border-border bg-card/30 p-6 space-y-5">
          <div className="flex items-center gap-3">
            <Database className="w-5 h-5 text-foreground" />
            <h2 className="text-xl font-semibold text-foreground">{tx("Backup + Restore")}</h2>
          </div>

          <p className="text-sm text-muted-foreground">
            {tx("Use this before switching devices or clearing browser data.")}
          </p>

          {lastBackupName && (
            <div className="rounded-lg border border-border bg-background/40 p-3 text-xs text-muted-foreground break-all">
              {tx("Last backup:")} {lastBackupName}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={() => void createBackup()} disabled={busy} className="justify-start gap-2">
              <Download className="w-4 h-4" />
              {tx("Create Backup")}
            </Button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".1keybackup,.json,application/json"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (!file) return
                void restoreBackupFromFile(file)
              }}
            />
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => fileInputRef.current?.click()}
              className="justify-start gap-2 bg-transparent"
            >
              <Upload className="w-4 h-4" />
              {busy ? tx("Working...") : tx("Restore Backup")}
            </Button>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-border bg-card/30 p-6 space-y-4">
          <h2 className="text-xl font-semibold text-foreground">{tx("Quick Tools")}</h2>
          <p className="text-sm text-muted-foreground">
            {tx("Simple cleanup actions if something feels broken.")}
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="outline" onClick={resetSettings} disabled={busy} className="justify-start gap-2 bg-transparent">
              <RefreshCcw className="w-4 h-4" />
              {tx("Reset Settings")}
            </Button>
            <Button variant="destructive" onClick={clearAllLocalData} disabled={busy} className="justify-start gap-2">
              <Trash2 className="w-4 h-4" />
              {tx("Clear all data")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
