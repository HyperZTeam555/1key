import React from "react"
import { SettingsProvider } from "@/lib/settings-context"
import { Navigation } from "@/components/navigation"
import { ParticleSystem } from "@/components/particle-system"
import { Announcement } from "@/components/announcement"
import { ReloadGuard } from "@/components/reload-guard"
import { CursorManager } from "@/components/cursor-manager"
import { MouseFx } from "@/components/mouse-fx"
import { SoundEffects } from "@/components/sound-effects"
import { MusicPlayer } from "@/components/music-player"
import { ActiveUsers } from "@/components/active-users"

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="proto-shell proto-app-layout">
      <div className="proto-backdrop proto-backdrop-a" />
      <div className="proto-backdrop proto-backdrop-b" />
      <div className="proto-backdrop proto-backdrop-c" />
      <div className="proto-grid" />
      <SettingsProvider>
        <Announcement />
        <ActiveUsers />
        <ReloadGuard />
        <CursorManager />
        <SoundEffects />
        <MusicPlayer />
        <ParticleSystem />
        <MouseFx />
        <Navigation />
        <main className="relative z-10 proto-main-shell proto-content-shell">{children}</main>
      </SettingsProvider>
    </div>
  )
}
