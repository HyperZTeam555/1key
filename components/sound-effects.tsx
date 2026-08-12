"use client"

import { useEffect, useRef } from "react"
import { useSettings } from "@/lib/settings-context"

export function SoundEffects() {
  const { settings } = useSettings()

  const clickPoolRef = useRef<HTMLAudioElement[]>([])
  const clickIndexRef = useRef(0)

  useEffect(() => {
    clickPoolRef.current = []
    clickIndexRef.current = 0

    if (!settings.clickSound) return

    const poolSize = 4
    clickPoolRef.current = Array.from({ length: poolSize }, () => {
      const audio = new Audio(settings.clickSound as string)
      audio.preload = "auto"
      audio.volume = 0.5
      try {
        audio.load()
      } catch {
      }
      return audio
    })
  }, [settings.clickSound])

  useEffect(() => {
    const handleClick = () => {
      const pool = clickPoolRef.current
      if (!pool.length) return

      const audio = pool[clickIndexRef.current % pool.length]
      clickIndexRef.current = (clickIndexRef.current + 1) % pool.length

      try {
        audio.currentTime = 0
      } catch {
      }
      audio.play().catch(() => {})
    }

    window.addEventListener("click", handleClick, true)

    return () => {
      window.removeEventListener("click", handleClick, true)
    }
  }, [])

  return null
}
