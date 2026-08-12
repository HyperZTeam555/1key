"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Home, Gamepad2, Link2, Database, Settings, LayoutGrid, Globe } from "lucide-react"
import { StatusBar } from "./status-bar"
import { useUiText } from "@/lib/ui-text"
import { stripBasePath } from "@/lib/base-path"

export function Navigation() {
  const pathname = usePathname()
  const { t } = useUiText()
  const normalizedPath = stripBasePath(pathname || "/")
  const [railHovered, setRailHovered] = useState(false)
  const [railEverExpanded, setRailEverExpanded] = useState(false)
  const railRef = useRef<HTMLElement | null>(null)
  const railMinimized = !railHovered

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      const rail = railRef.current
      if (!rail) return
      const rect = rail.getBoundingClientRect()
      const inVerticalRange = event.clientY >= rect.top && event.clientY <= rect.bottom
      const inLeftActivationZone = event.clientX >= 0 && event.clientX <= rect.right
      setRailHovered(inVerticalRange && inLeftActivationZone)
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  useEffect(() => {
    if (railHovered) setRailEverExpanded(true)
  }, [railHovered])

  const navItems = [
    { href: "/home", label: t("nav.home"), icon: Home },
    { href: "/games", label: t("nav.games"), icon: Gamepad2 },
    { href: "/apps", label: t("nav.music"), icon: LayoutGrid },
    { href: "/links", label: t("nav.links"), icon: Link2 },
    { href: "/proxy", label: t("nav.proxy"), icon: Globe },
    { href: "/data", label: t("nav.data"), icon: Database },
    { href: "/settings", label: t("nav.settings"), icon: Settings },
  ]

  if (normalizedPath === "/") return null

  return (
    <>
      <aside
        ref={railRef}
        onMouseLeave={() => setRailHovered(false)}
        onFocusCapture={() => setRailHovered(true)}
        onBlurCapture={(event) => {
          const nextTarget = event.relatedTarget as Node | null
          if (!event.currentTarget.contains(nextTarget)) {
            setRailHovered(false)
          }
        }}
        className={cn(
          "hidden lg:flex fixed top-4 left-4 bottom-4 z-50 flex-col proto-rail-panel transition-[width] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]",
          railMinimized ? "w-16" : "w-24",
        )}
      >
        <Link href="/home" className={cn("proto-rail-brand", railMinimized && "pt-5")}>
          <span className="proto-rail-logo" aria-hidden="true">
            <Image
              src="/images/ui/key-turning.gif"
              alt=""
              width={64}
              height={64}
              unoptimized
              className="h-full w-full scale-[1.42] object-cover object-center"
            />
          </span>
          {!railMinimized && <span className="proto-rail-title">1KEY</span>}
        </Link>

        <div className={cn("mt-3 flex-1 flex flex-col gap-1 px-2", railMinimized && "items-center px-1")}>
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = normalizedPath === href || normalizedPath.startsWith(`${href}/`)
            return (
              <Link
                key={href}
                href={href}
                className={cn("proto-rail-link", railMinimized && "w-10 px-0 py-2", isActive && "proto-rail-link-active")}
                title={label}
              >
                <Icon className="h-4 w-4" />
                {!railMinimized && <span>{label}</span>}
              </Link>
            )
          })}
        </div>

        <div className={cn("px-2 pb-3 pt-2", railMinimized && "px-1")}>
          {railEverExpanded && (
            <div className={cn("min-w-0 overflow-hidden", railMinimized && "hidden")}>
              <StatusBar />
            </div>
          )}
        </div>
      </aside>

      <nav className="lg:hidden fixed bottom-3 left-3 right-3 z-50">
        <div className="proto-mobile-dock">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = normalizedPath === href || normalizedPath.startsWith(`${href}/`)
            return (
              <Link key={href} href={href} className={cn("proto-mobile-link", isActive && "proto-mobile-link-active")}>
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
