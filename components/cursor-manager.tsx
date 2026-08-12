"use client"

import { useEffect } from "react"
import { useSettings } from "@/lib/settings-context"

const STYLE_ID = "1key-cursor-style"

const cursorValue = (url: string | null, fallback: string) => {
  if (!url) return fallback
  return `url("${url}") 0 0, ${fallback}`
}

const CONCEPT_CURSOR = {
  dark: {
    default: "/cursor-concept-3-free/cursor/dark/arrow.cur",
    pointer: "/cursor-concept-3-free/cursor/dark/hand.cur",
    text: "/cursor-concept-3-free/cursor/dark/ibeam.cur",
  },
  light: {
    default: "/cursor-concept-3-free/cursor/light/arrow.cur",
    pointer: "/cursor-concept-3-free/cursor/light/hand.cur",
    text: "/cursor-concept-3-free/cursor/light/ibeam.cur",
  },
} as const

export function CursorManager() {
  const { settings } = useSettings()

  useEffect(() => {
    const existing = document.getElementById(STYLE_ID)
    const remove = () => existing?.remove()

    if (settings.cursorPreset === "system") {
      remove()
      return
    }

    let defaultUrl: string | null = null
    let pointerUrl: string | null = null
    let textUrl: string | null = null

    if (settings.cursorPreset === "concept-dark") {
      defaultUrl = CONCEPT_CURSOR.dark.default
      pointerUrl = CONCEPT_CURSOR.dark.pointer
      textUrl = CONCEPT_CURSOR.dark.text
    } else if (settings.cursorPreset === "concept-light") {
      defaultUrl = CONCEPT_CURSOR.light.default
      pointerUrl = CONCEPT_CURSOR.light.pointer
      textUrl = CONCEPT_CURSOR.light.text
    }

    if (!defaultUrl && !pointerUrl && !textUrl) {
      remove()
      return
    }

    const css = `
      html, body { cursor: ${cursorValue(defaultUrl, "auto")} !important; }
      body * { cursor: inherit !important; }
      a, button, summary,
      [role="button"], [role="link"],
      input[type="button"], input[type="submit"], input[type="reset"],
      input[type="checkbox"], input[type="radio"], input[type="range"],
      .cursor-pointer { cursor: ${cursorValue(pointerUrl ?? defaultUrl, "pointer")} !important; }
      input, textarea, select,
      [contenteditable="true"], [contenteditable=""],
      .cursor-text { cursor: ${cursorValue(textUrl ?? defaultUrl, "text")} !important; }
    `

    const style = document.createElement("style")
    style.id = STYLE_ID
    style.textContent = css

    if (existing) existing.replaceWith(style)
    else document.head.appendChild(style)

    return () => {
      style.remove()
    }
  }, [settings.cursorPreset])

  return null
}
