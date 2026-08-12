"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function MusicRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/apps")
  }, [router])

  return (
    <div className="h-screen overflow-hidden proto-page-shell">
      <div className="flex h-full w-full items-center justify-center">
        <p className="text-sm uppercase tracking-[0.2em] text-foreground/80">Opening Apps...</p>
      </div>
    </div>
  )
}
