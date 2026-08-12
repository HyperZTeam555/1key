"use client"

import { useState, useEffect } from "react"
import { X, Sparkles } from "lucide-react"
import { useUiText } from "@/lib/ui-text"

const ANNOUNCEMENT_KEY = "1key-announcement-v32-feb24-seen"

export function Announcement() {
  const [show, setShow] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const { t } = useUiText()

  useEffect(() => {
    let hasSeenAnnouncement: string | null = null
    try {
      hasSeenAnnouncement = localStorage.getItem(ANNOUNCEMENT_KEY)
    } catch {
      hasSeenAnnouncement = null
    }
    if (!hasSeenAnnouncement) {
      setShow(true)
    }
  }, [])

  const handleDismiss = () => {
    setIsClosing(true)
    setTimeout(() => {
      try {
        localStorage.setItem(ANNOUNCEMENT_KEY, "true")
      } catch {
        setShow(false)
        return
      }
      setShow(false)
    }, 200)
  }

  if (!show) return null

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-200 ${isClosing ? "opacity-0" : "opacity-100"}`}
      onClick={handleDismiss}
    >
      <div 
        className={`relative w-full max-w-lg bg-card border border-border rounded-xl shadow-2xl transition-all duration-200 ${isClosing ? "scale-95 opacity-0" : "scale-100 opacity-100"}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-accent/20">
              <Sparkles className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">{t("announcement.title")}</h2>
              <p className="text-xs text-muted-foreground">{t("announcement.subtitle")}</p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            aria-label={t("announcement.closeAria")}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4 text-sm text-foreground/90 leading-relaxed">
          <p className="font-medium text-foreground">{t("announcement.highlights")}</p>
          <p>{t("announcement.line1")}</p>
          <p>{t("announcement.line2")}</p>
          <p>{t("announcement.line3")}</p>
          <p>{t("announcement.line4")}</p>
          <p className="font-medium text-foreground">{t("announcement.thanks")}</p>
        </div>

        <div className="px-6 py-4 border-t border-border">
          <button
            onClick={handleDismiss}
            className="w-full py-2.5 px-4 bg-accent text-accent-foreground font-medium rounded-lg hover:bg-accent/90 transition-colors"
          >
            {t("announcement.gotIt")}
          </button>
        </div>
      </div>
    </div>
  )
}
