"use client"

import { useEffect, useMemo, useState } from "react"
import { usePathname } from "next/navigation"
import Script from "next/script"

const GA_IDS_BY_HOST: Record<string, string> = {
  "1key.lol": "G-QLEBVT7XNK",
  "www.1key.lol": "G-QLEBVT7XNK",
  "1key.pages.dev": "G-WJCYTZV0V9",
  "edu.rkimport.com": "G-QLEBVT7XNK",
  "college.rkimport.com": "G-QLEBVT7XNK",
  "edu.tvjumbleanswers.com": "G-QLEBVT7XNK",
  "safety.tvjumbleanswers.com": "G-QLEBVT7XNK",
}

function resolveMeasurementId(hostname: string): string | null {
  const normalized = hostname.toLowerCase().replace(/\.$/, "")
  return GA_IDS_BY_HOST[normalized] ?? null
}

function resolvePageSection(pathname: string): string {
  const section = pathname.split("/").filter(Boolean)[0]
  return section || "home"
}

export function DomainAnalytics() {
  const pathname = usePathname()
  const [measurementId, setMeasurementId] = useState<string | null>(null)

  const pagePath = useMemo(() => {
    if (typeof window === "undefined") return pathname
    const query = window.location.search.replace(/^\?/, "")
    return query ? `${pathname}?${query}` : pathname
  }, [pathname])

  useEffect(() => {
    if (typeof window === "undefined") return
    setMeasurementId(resolveMeasurementId(window.location.hostname))
  }, [])

  useEffect(() => {
    if (!measurementId || typeof window === "undefined") return
    const gtagFn = (window as Window & { gtag?: (...args: unknown[]) => void }).gtag
    if (!gtagFn) return
    gtagFn("event", "page_view", {
      page_path: pagePath,
      page_location: window.location.href,
      page_title: document.title,
      page_section: resolvePageSection(pathname),
    })
  }, [measurementId, pagePath, pathname])

  if (!measurementId) return null

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script id={`gtag-init-${measurementId}`} strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = window.gtag || gtag;
          gtag('js', new Date());
          gtag('config', '${measurementId}', { send_page_view: false });
        `}
      </Script>
    </>
  )
}
