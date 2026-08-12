"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Check, ChevronDown, ChevronUp, Copy, ExternalLink, Gamepad2 } from "lucide-react"
import { useUiText } from "@/lib/ui-text"

const CHANGE_LOG = [
  {
    version: "v3.3",
    date: "Updated Feb 27",
    notes: [
      "Replaced remaining GitHack links with jsDelivr for better reliability.",
      "Added the official site domain: 1key.lol.",
      "Added new animations and polished motion across the UI.",
      "Added new Data backup/restore options and controls.",
      "Updated Popular Games ranking and added Roulette Hero.",
    ],
  },
  {
    version: "v3.2",
    date: "Updated Feb 24",
    notes: [
      "Entire UI overhaul with a refreshed layout pass.",
      "Added 1Key mirror links with launch and copy actions.",
      "Shipped the new intro and updated background motion behavior.",
      "Added new games and fixed major UI bugs across pages.",
    ],
  },
  {
    version: "v3.1",
    date: "Updated Feb 19",
    notes: [
      "Added 8 new games.",
      "Moved the fullscreen action into the top game bar.",
      "Added Open in Tab launch support with about:blank and optional blob mode.",
      "Added language settings.",
      "Added a military time setting.",
    ],
  },
  {
    version: "v3",
    date: "Updated Feb 17",
    notes: [
      "Updated to v3 and refreshed the release baseline.",
      "Added multiple Zelda titles and a large batch of new games (total now 202).",
      "Fixed Solar Smash launch flow and replaced the old Balatro runtime with a cleaner build path.",
      "Removed Deadly Descents due to major breakage (if you have a working build, DM me).",
      "Moved Reload Protection to the correct Settings section and added load warnings for heavier games.",
    ],
  },
  {
    version: "v2.9",
    date: "Updated Feb 13",
    notes: [
      "Added the new Data tab with local backup/restore tools for saved progress.",
      "Added upload + restore flow with console-style status logs and reload prompt.",
      "Added more games and cleaned up game routing/search behavior.",
      "Expanded text animation and polished dynamic typing/motion updates across the site.",
      "General fixes and stability improvements across Links, Games, and Settings flows.",
    ],
  },
  {
    version: "v2.8",
    date: "Updated Feb 12",
    notes: [
      "Shipped a full settings overhaul with a cleaner section-based layout.",
      "Added expanded sound settings with uploadable music and improved player controls.",
      "Improved mouse settings with smoother trail behavior and better visual customization.",
      "Added a new default interactive background with denser nodes and improved ripple feel.",
      "Refined the intro flow with updated visuals and better stability.",
    ],
  },
  {
    version: "v2.7",
    date: "Updated Feb 10",
    notes: [
      "Added Time Shooter 3: SWAT.",
      "Expanded game catalog with new releases and fixes.",
      "Improved fullscreen stability for game sessions.",
      "Adjusted game warnings and UI polish across pages.",
    ],
  },
  {
    version: "v2.6",
    date: "Updated Feb 9",
    notes: [
      "Added major wave of new games.",
      "Updated announcement messaging and support reminder.",
      "Refined intro redirect timing and loading flow.",
      "General cleanup for game launch behavior.",
    ],
  },
  {
    version: "v2.5",
    date: "Updated Feb 8",
    notes: [
      "Added proxy/exploit communication section and roadmap note.",
      "Added Plants vs Zombies and additional community-requested games.",
      "Expanded hidden-search support for FNAF-related titles.",
      "Updated site announcement for active development status.",
    ],
  },
  {
    version: "v2.4",
    date: "Updated Feb 5",
    notes: [
      "Added large batch of new games.",
      "Updated proxy options and supporting links.",
      "Refreshed in-site update messaging.",
      "Improved organization of game listings.",
    ],
  },
  {
    version: "v2.3",
    date: "Updated Feb 4",
    notes: [
      "Added proxy tab flow and launch guard rails.",
      "Improved proxy fallback handling and messaging.",
      "Expanded links tab with partner proxy entries.",
      "Shipped additional game additions and fixes.",
    ],
  },
]

const HERO_LINES = [
  "Your gateway to unlimited gaming.",
  "Customize your settings!",
  "Play Drive Mad!",
  "Hop on Minecraft!",
  "1key on top.",
  "We got the best games.",
  "Want a game? Just request it!",
  "I answer my emails.",
  "Change your font!",
  "Disguise your tab!",
  "Play Plinko!",
  "Go gamble on Mines!",
]

function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className={className} fill="currentColor">
      <path d="M13.545 2.907A13.227 13.227 0 0 0 10.227 2a.06.06 0 0 0-.064.027 9.89 9.89 0 0 0-.417.846 12.19 12.19 0 0 0-3.488 0 9.57 9.57 0 0 0-.424-.846.06.06 0 0 0-.064-.027 13.19 13.19 0 0 0-3.32.909.055.055 0 0 0-.025.022C.533 5.58-.32 8.167.099 10.72a.08.08 0 0 0 .032.053 13.28 13.28 0 0 0 3.988 2.018.06.06 0 0 0 .067-.022 9.59 9.59 0 0 0 .82-1.349.06.06 0 0 0-.033-.084 8.69 8.69 0 0 1-1.246-.595.06.06 0 0 1-.006-.1c.084-.062.168-.127.248-.192a.06.06 0 0 1 .063-.009c2.618 1.196 5.455 1.196 8.042 0a.06.06 0 0 1 .064.008c.082.066.166.131.25.193a.06.06 0 0 1-.004.1 8.12 8.12 0 0 1-1.247.594.06.06 0 0 0-.032.085 10.39 10.39 0 0 0 .82 1.348.06.06 0 0 0 .067.023 13.25 13.25 0 0 0 3.99-2.018.06.06 0 0 0 .03-.052c.5-2.95-.838-5.514-2.325-7.79a.05.05 0 0 0-.024-.023ZM5.06 9.73c-.79 0-1.437-.724-1.437-1.612 0-.888.636-1.613 1.437-1.613.807 0 1.45.73 1.437 1.613 0 .888-.636 1.612-1.437 1.612Zm5.326 0c-.79 0-1.437-.724-1.437-1.612 0-.888.636-1.613 1.437-1.613.807 0 1.45.73 1.437 1.613 0 .888-.63 1.612-1.437 1.612Z" />
    </svg>
  )
}

function shuffleLines(lines: string[]) {
  const next = [...lines]
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[next[i], next[j]] = [next[j], next[i]]
  }
  return next
}

export function HeroSection() {
  const { t } = useUiText()
  const discordInvite = "https://discord.gg/XK8vQGrfqv"
  const [lineOrder, setLineOrder] = useState<string[]>(HERO_LINES)
  const [lineIndex, setLineIndex] = useState(0)
  const [typedText, setTypedText] = useState("")
  const [phase, setPhase] = useState<"typing" | "pause" | "deleting">("typing")
  const [discordCopied, setDiscordCopied] = useState(false)
  const longestLine = useMemo(
    () => HERO_LINES.reduce((longest, line) => (line.length > longest.length ? line : longest), ""),
    [],
  )

  useEffect(() => {
    setLineOrder(shuffleLines(HERO_LINES))
    setLineIndex(0)
    setTypedText("")
    setPhase("typing")
  }, [])

  useEffect(() => {
    const currentLine = lineOrder[lineIndex] ?? ""
    let timer: number | undefined

    if (phase === "typing") {
      if (typedText.length < currentLine.length) {
        timer = window.setTimeout(() => {
          setTypedText(currentLine.slice(0, typedText.length + 1))
        }, 45)
      } else {
        timer = window.setTimeout(() => setPhase("pause"), 1200)
      }
    } else if (phase === "pause") {
      timer = window.setTimeout(() => setPhase("deleting"), 550)
    } else if (phase === "deleting") {
      if (typedText.length > 0) {
        timer = window.setTimeout(() => {
          setTypedText((prev) => prev.slice(0, -1))
        }, 24)
      } else {
        const atEnd = lineIndex >= lineOrder.length - 1
        if (atEnd) {
          setLineOrder(shuffleLines(HERO_LINES))
          setLineIndex(0)
        } else {
          setLineIndex((prev) => prev + 1)
        }
        setPhase("typing")
      }
    }

    return () => {
      if (timer) window.clearTimeout(timer)
    }
  }, [lineIndex, lineOrder, phase, typedText])

  const copyDiscord = async () => {
    try {
      await navigator.clipboard.writeText(discordInvite)
      setDiscordCopied(true)
      window.setTimeout(() => setDiscordCopied(false), 1600)
    } catch {
      const textArea = document.createElement("textarea")
      textArea.value = discordInvite
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand("copy")
      document.body.removeChild(textArea)
      setDiscordCopied(true)
      window.setTimeout(() => setDiscordCopied(false), 1600)
    }
  }

  return (
    <section className="proto-hero min-h-[62vh] pt-24 pb-8 relative z-10">
      <div className="max-w-[88rem] mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid xl:grid-cols-12 gap-6">
          <div className="xl:col-span-8 proto-panel-surface rounded-3xl p-5 sm:p-6">
            <div className="flex items-end">
              <h1 className="text-6xl sm:text-8xl lg:text-9xl font-bold tracking-[0.04em] text-foreground proto-logo-title">
                1Key
              </h1>
            </div>

            <div className="relative mt-3 max-w-3xl">
              <p className="invisible text-lg sm:text-xl leading-relaxed">{longestLine}</p>
              <p
                className="absolute inset-0 text-lg sm:text-xl text-muted-foreground leading-relaxed"
                aria-live="polite"
              >
                {typedText}
                <span className="inline-block ml-1 w-[0.08em] h-[1em] align-[-0.12em] bg-foreground/70 animate-pulse" />
              </p>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild size="lg" className="rounded-full px-8 proto-btn-main">
                <Link href="/games">
                  <Gamepad2 className="w-5 h-5 mr-2" />
                  {t("hero.browseGames")}
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="rounded-full px-8 bg-transparent"
              >
                <Link href="/links">
                  {t("hero.exploreLinks")}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="rounded-full px-8 bg-transparent"
              >
                <Link href="/settings">
                  Customize
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
            </div>
          </div>

          <div className="xl:col-span-4">
            <div className="rounded-3xl border border-border/70 bg-card/12 p-5 sm:p-6 backdrop-blur-xl">
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Community</p>
              <h3 className="mt-2 text-2xl font-semibold text-foreground">Social</h3>

              <div className="mt-5 rounded-2xl border border-border/70 bg-background/40 p-4">
                <div className="flex items-center gap-2 text-sm text-foreground/90">
                  <DiscordIcon className="h-4 w-4 text-foreground/85" />
                  <span>Discord:</span>
                  <a
                    href={discordInvite}
                    target="_blank"
                    rel="noreferrer"
                    className="truncate text-foreground/80 underline-offset-2 hover:underline"
                  >
                    discord.gg/XK8vQGrfqv
                  </a>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Button asChild size="sm" className="h-8 rounded-lg px-3">
                    <a href={discordInvite} target="_blank" rel="noreferrer">
                      <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                      Launch
                    </a>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={copyDiscord}
                    className="h-8 rounded-lg bg-transparent px-3"
                  >
                    {discordCopied ? <Check className="mr-1.5 h-3.5 w-3.5" /> : <Copy className="mr-1.5 h-3.5 w-3.5" />}
                    {discordCopied ? "Copied" : "Copy"}
                  </Button>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-border/70 bg-background/26 p-4 text-sm text-foreground/85">
                Requests are open. Drop game ideas and feature feedback in Discord.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export function HomeChangelogSection() {
  const { t, tx } = useUiText()
  const [showAllChangelog, setShowAllChangelog] = useState(false)

  const changeLog = useMemo(
    () =>
      CHANGE_LOG.map((entry) => ({
        ...entry,
        notes: entry.notes.map(tx),
        date: tx(entry.date),
      })),
    [tx],
  )
  const visibleChangeLog = showAllChangelog ? changeLog : changeLog.slice(0, 3)

  return (
    <section className="relative z-10 pb-10">
      <div className="max-w-[88rem] mx-auto w-full px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-border/72 bg-card/10 p-5 backdrop-blur-xl sm:p-6 proto-subsurface">
          <div className="mb-5">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{t("hero.projectUpdates")}</p>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">{t("hero.changelog")}</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visibleChangeLog.map((entry) => (
              <article
                key={entry.version}
                className="rounded-2xl border border-border/72 bg-background/10 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/55 hover:shadow-[0_0_20px_color-mix(in_oklab,var(--accent)_20%,transparent)]"
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold text-foreground">{entry.version}</h3>
                  <span className="text-xs uppercase tracking-[0.12em] text-muted-foreground">{entry.date}</span>
                </div>
                <ul className="space-y-1.5 text-sm text-muted-foreground">
                  {entry.notes.slice(0, 3).map((note) => (
                    <li key={note}>- {note}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>

          {changeLog.length > 3 && (
            <div className="mt-4 flex justify-center">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAllChangelog((previous) => !previous)}
                className="rounded-full bg-background/28 border-border/80"
              >
                {showAllChangelog ? "Show Less" : "Show All Updates"}
                {showAllChangelog ? <ChevronUp className="w-4 h-4 ml-2" /> : <ChevronDown className="w-4 h-4 ml-2" />}
              </Button>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
