"use client"

import React, { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { useSettings } from "@/lib/settings-context"
import { useUiText } from "@/lib/ui-text"
import { Copy, ExternalLink, Check, Mail, Users, Link2 } from "lucide-react"

interface LinkEntry {
  id: number
  title: string
  url: string
  description?: string
  disableCopy?: boolean
  launchMode?: "direct" | "about-blank-embed"
  launchWarning?: {
    title: string
    body: string
    confirmLabel?: string
    readMs?: number
  }
}

interface CategoryData {
  name: string
  icon: React.ElementType
  links: LinkEntry[]
  message?: string
}

const categories: CategoryData[] = [
  {
    name: "1key Links",
    icon: Link2,
    links: [],
    message:
      "Mirror links are temporarily disabled to prevent links being blocked. You can view all our links in our discord.",
  },
  {
    name: "Partners",
    icon: Users,
    links: [
      {
        id: 2,
        title: "GN-Math",
        url: "https://codeprojects.org/projects/weblab/HJET5pwKiLHAclU8g71_rF3SDI-c3OCTWq-nvKEBaSE/",
        description: "Partner gaming site",
        disableCopy: true,
      },
      {
        id: 7,
        title: "Noah's Tutoring Hub",
        url: "/links/newnoahsgmaes.html",
        description: "Launch Noah's Tutoring Hub.",
        disableCopy: true,
        launchWarning: {
          title: "Loading Notice",
          body: "Noah's Tutoring Hub may show a white screen while loading for up to 1 minute. Please wait and do not close it too early.",
          confirmLabel: "Launch Site",
          readMs: 2500,
        },
      },
    ],
  },
]

export default function LinksPage() {
  const { settings } = useSettings()
  const { tx } = useUiText()

  const [copiedId, setCopiedId] = useState<number | null>(null)
  const [pendingLaunch, setPendingLaunch] = useState<LinkEntry | null>(null)
  const [launchProgress, setLaunchProgress] = useState(0)
  const [launchReady, setLaunchReady] = useState(false)
  const launchReadMs = pendingLaunch?.launchWarning?.readMs ?? 3000

  useEffect(() => {
    if (!pendingLaunch) {
      setLaunchProgress(0)
      setLaunchReady(false)
      return
    }

    setLaunchProgress(0)
    setLaunchReady(false)
    const raf = window.requestAnimationFrame(() => {
      setLaunchProgress(100)
    })
    const readyTimer = window.setTimeout(() => setLaunchReady(true), launchReadMs)

    return () => {
      window.cancelAnimationFrame(raf)
      window.clearTimeout(readyTimer)
    }
  }, [launchReadMs, pendingLaunch])

  const copyToClipboard = async (url: string, id: number) => {
    try {
      await navigator.clipboard.writeText(url)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
    }
  }

  const openHtmlWithMode = (html: string, sourceUrl: string) => {
    if (settings.launchMode === "blob") {
      const blob = new Blob([html], { type: "text/html" })
      const blobUrl = URL.createObjectURL(blob)
      window.open(blobUrl, "_blank", "noopener,noreferrer")
      window.setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000)
      return
    }

    const popup = window.open("about:blank", "_blank")
    if (!popup) return
    popup.document.open()
    popup.document.write(`<base href="${sourceUrl}">`)
    popup.document.write(html)
    popup.document.close()
  }

  const launchHtmlFile = async (url: string) => {
    try {
      const absoluteUrl = new URL(url, window.location.origin).toString()
      const response = await fetch(absoluteUrl)
      const html = await response.text()
      openHtmlWithMode(html, absoluteUrl)
    } catch {
      window.open(url, "_blank", "noopener,noreferrer")
    }
  }

  const launchUrl = (link: LinkEntry) => {
    if (link.launchMode === "about-blank-embed") {
      const popup = window.open("about:blank", "_blank")
      if (!popup) return

      popup.document.open()
      popup.document.write(`
        <!doctype html>
        <html lang="en">
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width,initial-scale=1" />
            <title>about:blank</title>
            <style>
              html, body {
                margin: 0;
                width: 100%;
                height: 100%;
                background: #000;
                overflow: hidden;
              }
              iframe {
                width: 100%;
                height: 100%;
                border: 0;
                display: block;
              }
            </style>
          </head>
          <body>
            <iframe id="exploit-frame" referrerpolicy="no-referrer"></iframe>
          </body>
        </html>
      `)
      popup.document.close()

      const iframe = popup.document.getElementById("exploit-frame") as HTMLIFrameElement | null
      if (iframe) {
        iframe.src = link.url
      }
      return
    }

    if (link.title === "GN-Math") {
      fetch("https://cdn.jsdelivr.net/gh/gn-math/gn-math-DONTDMCA@main/singlefile.html?t=" + Date.now())
        .then(r => r.text())
        .then((html) => openHtmlWithMode(html, link.url))
        .catch(() => {
          window.open(link.url, "_blank", "noopener,noreferrer")
        })
      return
    }

    if (link.url.toLowerCase().endsWith(".html")) {
      void launchHtmlFile(link.url)
    } else {
      window.open(link.url, "_blank", "noopener,noreferrer")
    }
  }

  return (
    <div className="min-h-screen pt-24 pb-12 proto-page-shell">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-4 tracking-[0.03em]">
            {tx("Links Directory")}
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {tx("Access mirrors and partner links all in one place.")}
          </p>
        </div>

        <div className="space-y-12">
          {categories.map((category) => (
            <section key={category.name}>
              <div className="flex items-center gap-4 mb-6">
                <category.icon className="w-6 h-6 text-foreground" />
                <h2 className="text-2xl font-bold text-foreground">{tx(category.name)}</h2>
                <div className="flex-1 h-px bg-border" />
              </div>

              {category.links.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {category.links.map((link) => (
                    <div
                      key={link.id}
                      className="group relative overflow-hidden h-full min-h-[170px] p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between bg-card/30 border-border hover:bg-card/50 hover:border-foreground/20"
                    >
                      <div className="min-w-0 space-y-2">
                        <h3 className="font-semibold text-foreground">{link.title}</h3>
                        <p className="text-sm text-muted-foreground break-words">
                          {link.description ? tx(link.description) : link.url}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 pt-4">
                        {!link.disableCopy && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(link.url, link.id)}
                            className="gap-2"
                          >
                            {copiedId === link.id ? (
                              <>
                                <Check className="w-4 h-4" />
                                <span className="hidden sm:inline">{tx("Copied")}</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4" />
                                <span className="hidden sm:inline">{tx("Copy")}</span>
                              </>
                            )}
                          </Button>
                        )}
                        <Button
                          size="sm"
                          onClick={() => {
                            if (link.launchMode === "about-blank-embed" || link.launchWarning) {
                              setPendingLaunch(link)
                              return
                            }
                            launchUrl(link)
                          }}
                          className="gap-2"
                        >
                          <ExternalLink className="w-4 h-4" />
                          <span className="hidden sm:inline">{tx("Launch")}</span>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 rounded-xl bg-card/30 border border-border text-center">
                  <Mail className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                  {category.name === "1key Links" ? (
                    <p className="text-muted-foreground">
                      Mirror links are temporarily disabled to prevent links being blocked. You can view all our links in our{" "}
                      <a
                        href="https://discord.gg/XK8vQGrfqv"
                        target="_blank"
                        rel="noreferrer"
                        className="text-sky-400 underline underline-offset-2 hover:text-sky-300"
                      >
                        discord
                      </a>
                      .
                    </p>
                  ) : (
                    <p className="text-muted-foreground">{category.message ? tx(category.message) : ""}</p>
                  )}
                </div>
              )}
            </section>
          ))}
        </div>

      </div>

      {pendingLaunch && (
        <div className="fixed inset-0 z-[100] bg-black/65 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl rounded-2xl border border-border bg-card/95 shadow-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-border">
              <h3 className="text-xl font-bold text-foreground">
                {pendingLaunch.launchWarning?.title ? tx(pendingLaunch.launchWarning.title) : tx("Launch Warning")}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">{tx("Please read before launching.")}</p>
            </div>

            <div className="px-6 py-5 space-y-3 text-sm text-foreground/90">
              {pendingLaunch.launchWarning ? (
                <p>{tx(pendingLaunch.launchWarning.body)}</p>
              ) : (
                <p>{tx("This link may take extra time to load depending on your network and browser.")}</p>
              )}
            </div>

            <div className="px-6 pb-6 flex items-center justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setPendingLaunch(null)}
              >
                {tx("Cancel")}
              </Button>
              <Button
                className="relative overflow-hidden min-w-[190px] disabled:opacity-100 disabled:cursor-not-allowed"
                disabled={!launchReady}
                onClick={() => {
                  launchUrl(pendingLaunch)
                  setPendingLaunch(null)
                }}
              >
                <span
                  className="absolute inset-y-0 left-0 bg-foreground/25 transition-[width] ease-linear"
                  style={{ width: `${launchProgress}%`, transitionDuration: `${launchReadMs}ms` }}
                />
                <span className="relative z-10">
                  {launchReady
                    ? tx(pendingLaunch.launchWarning?.confirmLabel ?? "Launch")
                    : tx("Reading Warning...")}
                </span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
