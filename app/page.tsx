"use client"

import { useCallback } from "react"
import CinematicIntro from "@/components/cinematic-intro"

export default function IntroPage() {
  const handleComplete = useCallback(() => {
    const current = window.location.href
    const base = current.endsWith("/") ? current : `${current}/`
    window.location.assign(new URL("home/", base).toString())
  }, [])

  return <CinematicIntro onComplete={handleComplete} />
}
