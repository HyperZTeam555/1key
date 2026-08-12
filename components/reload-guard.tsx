"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import { useSettings } from "@/lib/settings-context"

const WARNING_MESSAGE =
  "This popup prevents accidental reloads and loss of progress. If you want to disable this and risk accidental reloads, turn it off at the bottom of Settings."

export function ReloadGuard() {
  const { settings } = useSettings()
  const pathname = usePathname()

  useEffect(() => {
    if (!settings.preventReloads) return
    if (pathname === "/") return

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      const skip = (window as Window & { __skipUnloadWarning?: boolean }).__skipUnloadWarning
      if (skip) return

      event.preventDefault()
      event.returnValue = WARNING_MESSAGE
      return WARNING_MESSAGE
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [settings.preventReloads, pathname])

  return null
}
