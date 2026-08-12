"use client"

import { useState, useEffect } from "react"
import { useSettings } from "@/lib/settings-context"
import { fetchPresenceCount, ONLINE_MAX_FALLBACK } from "@/lib/presence-client"

export function StatusBar() {
  const { settings } = useSettings()
  const [time, setTime] = useState<string>("")
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null)
  const [isCharging, setIsCharging] = useState(false)
  const [onlineCount, setOnlineCount] = useState<number | null>(null)
  const [maxOnline, setMaxOnline] = useState<number>(ONLINE_MAX_FALLBACK)
  const [onlineCapped, setOnlineCapped] = useState(false)

  useEffect(() => {
    if (!settings.showTime) {
      setTime("")
      return
    }

    const updateTime = () => {
      const now = new Date()
      setTime(
        now.toLocaleTimeString(settings.language || "en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: !settings.useMilitaryTime,
        })
      )
    }
    updateTime()
    const timeInterval = setInterval(updateTime, 1000)

    return () => clearInterval(timeInterval)
  }, [settings.showTime, settings.language, settings.useMilitaryTime])

  useEffect(() => {
    if (!settings.showBattery) {
      setBatteryLevel(null)
      setIsCharging(false)
      return
    }

    let cleanup: (() => void) | undefined
    const getBattery = async () => {
      try {
        if ("getBattery" in navigator) {
          const battery = await (navigator as Navigator & { getBattery: () => Promise<{
            level: number
            charging: boolean
            addEventListener: (event: string, callback: () => void) => void
            removeEventListener: (event: string, callback: () => void) => void
          }> }).getBattery()
          
          setBatteryLevel(Math.round(battery.level * 100))
          setIsCharging(battery.charging)

          const onLevelChange = () => {
            setBatteryLevel(Math.round(battery.level * 100))
          }
          const onChargingChange = () => {
            setIsCharging(battery.charging)
          }

          battery.addEventListener("levelchange", onLevelChange)
          battery.addEventListener("chargingchange", onChargingChange)

          cleanup = () => {
            battery.removeEventListener("levelchange", onLevelChange)
            battery.removeEventListener("chargingchange", onChargingChange)
          }
        }
      } catch {
      }
    }
    getBattery()

    return () => cleanup?.()
  }, [settings.showBattery])

  useEffect(() => {
    if (!settings.showOnlineCount) {
      setOnlineCount(null)
      setMaxOnline(ONLINE_MAX_FALLBACK)
      setOnlineCapped(false)
      return
    }

    let disposed = false

    const pollPresence = async () => {
      const result = await fetchPresenceCount()
      if (disposed || !result) return
      setOnlineCount(result.onlineCount)
      setMaxOnline(result.maxOnline || ONLINE_MAX_FALLBACK)
      setOnlineCapped(Boolean(result.capped))
    }

    void pollPresence()
    const intervalId = window.setInterval(() => {
      void pollPresence()
    }, 5000)

    return () => {
      disposed = true
      window.clearInterval(intervalId)
    }
  }, [settings.showOnlineCount])

  const getBatteryFillColor = () => {
    if (batteryLevel === null) return "bg-foreground/50"
    if (isCharging) return "bg-accent"
    if (batteryLevel <= 20) return "bg-destructive"
    if (batteryLevel <= 50) return "bg-foreground/55"
    return "bg-foreground/70"
  }

  const showOnline = settings.showOnlineCount
  const showClock = settings.showTime
  const showBattery = settings.showBattery && batteryLevel !== null
  const hasVisibleItems = showOnline || showClock || showBattery
  const onlineLabel =
    onlineCount === null
      ? "—"
      : onlineCapped
        ? `MAX/${maxOnline}`
        : `${Math.min(onlineCount, maxOnline)}/${maxOnline}`

  if (!hasVisibleItems) return null

  return (
    <div className="mt-2 w-full border-t border-foreground/26 pt-2">
      <div className="flex w-full min-w-0 flex-col gap-1">
      {showOnline && (
        <span className="inline-flex w-full min-w-0 items-center justify-center overflow-hidden rounded-md border border-border/60 bg-background/28 px-1.5 py-1 text-[10px] font-medium leading-none tabular-nums tracking-tight text-foreground/80">
          ON {onlineLabel}
        </span>
      )}

      {showClock && (
        <span className="inline-flex w-full min-w-0 items-center justify-center overflow-hidden rounded-md border border-border/60 bg-background/28 px-1.5 py-1 text-[10px] font-medium leading-none tabular-nums tracking-tight text-foreground/85">
          {time}
        </span>
      )}

      {showBattery && (
        <div className="inline-flex w-full min-w-0 items-center justify-center gap-1 rounded-md border border-border/60 bg-background/28 px-1 py-1">
          <span className="shrink-0 text-[9px] font-medium leading-none tabular-nums text-foreground/80">{batteryLevel}%</span>
          <div className="relative flex shrink-0 items-center">
            <div className="relative w-[1.2rem] h-[0.62rem] rounded-[0.1875rem] border-[0.09375rem] border-foreground/50 flex items-center p-[0.09375rem]">
              <div
                className={`h-full rounded-[0.09375rem] transition-all duration-300 ${getBatteryFillColor()}`}
                style={{ width: `${batteryLevel}%` }}
              />
              {isCharging && (
                <svg
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[0.4375rem] h-[0.4375rem] text-background drop-shadow-sm"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M13 2L4 14h7v8l9-12h-7V2z" />
                </svg>
              )}
            </div>
            <div className="w-[0.125rem] h-[0.3125rem] bg-foreground/50 rounded-r-[0.0625rem] -ml-[0.03125rem]" />
          </div>
        </div>
      )}
      </div>
    </div>
  )
}
