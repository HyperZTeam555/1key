"use client"

import { useCallback, useEffect, useRef, type MouseEvent } from "react"
import Image from "next/image"
import Link from "next/link"
import { withBasePath } from "@/lib/base-path"

type PopularGame = {
  rank: 1 | 2 | 3
  slug: string
  title: string
  logo: string
  description: string
}

type TiltFx = {
  rx: number
  ry: number
  glowX: number
  glowY: number
  glowAlpha: number
  glowOpacity: number
  glowBlur: number
  shineOpacity: number
  active: boolean
}

const DEFAULT_TILT: TiltFx = {
  rx: 0,
  ry: 0,
  glowX: 50,
  glowY: 50,
  glowAlpha: 0.16,
  glowOpacity: 0.4,
  glowBlur: 12,
  shineOpacity: 0,
  active: false,
}

const POPULAR_GAMES: PopularGame[] = [
  {
    rank: 1,
    slug: "brotato",
    title: "Brotato",
    logo: "/images/title-cards/brotatocard.png",
    description: "Most replayed run this week.",
  },
  {
    rank: 2,
    slug: "balatro",
    title: "Balatro",
    logo: "/images/title-cards/vertlecard.png",
    description: "Fastest growth in repeat sessions.",
  },
  {
    rank: 3,
    slug: "drive-mad",
    title: "Drive Mad",
    logo: "/images/title-cards/verticalcard.png",
    description: "Most consistent long-session game.",
  },
]

function applyTiltFx(target: HTMLAnchorElement, fx: TiltFx) {
  const wrap = target.closest<HTMLElement>(".proto-tilt-wrap")
  if (!wrap) return

  wrap.style.setProperty("--tilt-rx", `${fx.rx.toFixed(2)}deg`)
  wrap.style.setProperty("--tilt-ry", `${fx.ry.toFixed(2)}deg`)
  wrap.style.setProperty("--tilt-scale", fx.active ? "1.02" : "1")
  wrap.style.setProperty("--glow-x", `${Math.round(fx.glowX)}%`)
  wrap.style.setProperty("--glow-y", `${Math.round(fx.glowY)}%`)
  wrap.style.setProperty("--glow-alpha", fx.glowAlpha.toFixed(3))
  wrap.style.setProperty("--glow-opacity", fx.glowOpacity.toFixed(3))
  wrap.style.setProperty("--glow-blur", `${Math.round(fx.glowBlur)}px`)

  const shine = target.querySelector<HTMLElement>(".proto-tilt-shine")
  if (!shine) return
  shine.style.opacity = fx.shineOpacity.toFixed(3)
  shine.style.background = `radial-gradient(circle at ${Math.round(fx.glowX)}% ${Math.round(fx.glowY)}%, rgba(255, 255, 255, 0.26) 0%, transparent 42%)`
}

export function DailyGamesSection() {
  const rafBySlugRef = useRef<Record<string, number>>({})

  const queueTiltUpdate = useCallback((slug: string, target: HTMLAnchorElement, fx: TiltFx) => {
    const currentRaf = rafBySlugRef.current[slug]
    if (currentRaf) {
      window.cancelAnimationFrame(currentRaf)
    }

    rafBySlugRef.current[slug] = window.requestAnimationFrame(() => {
      applyTiltFx(target, fx)
      delete rafBySlugRef.current[slug]
    })
  }, [])

  const setTiltFromPointer = useCallback(
    (slug: string, event: MouseEvent<HTMLAnchorElement>) => {
      const rect = event.currentTarget.getBoundingClientRect()
      const px = (event.clientX - rect.left) / rect.width
      const py = (event.clientY - rect.top) / rect.height
      const rotateY = Math.max(-14, Math.min(14, (px - 0.5) * 28))
      const rotateX = Math.max(-14, Math.min(14, (0.5 - py) * 28))
      const dx = px - 0.5
      const dy = py - 0.5
      const dist = Math.min(1, Math.sqrt(dx * dx + dy * dy) / 0.7071)

      queueTiltUpdate(slug, event.currentTarget, {
        rx: rotateX,
        ry: rotateY,
        glowX: px * 100,
        glowY: py * 100,
        glowAlpha: 0.16 + dist * 0.46,
        glowOpacity: 0.4 + dist * 0.5,
        glowBlur: 12 + dist * 20,
        shineOpacity: 0.22 + dist * 0.34,
        active: true,
      })
    },
    [queueTiltUpdate],
  )

  const resetTilt = useCallback(
    (slug: string, event: MouseEvent<HTMLAnchorElement>) => {
      queueTiltUpdate(slug, event.currentTarget, DEFAULT_TILT)
    },
    [queueTiltUpdate],
  )

  useEffect(() => {
    return () => {
      for (const rafId of Object.values(rafBySlugRef.current)) {
        window.cancelAnimationFrame(rafId)
      }
      rafBySlugRef.current = {}
    }
  }, [])

  return (
    <section className="pb-24 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-border/60 bg-card/28 p-7 sm:p-10 shadow-[inset_0_1px_0_color-mix(in_oklab,var(--foreground)_10%,transparent),0_16px_42px_color-mix(in_oklab,var(--background)_72%,transparent)]">
          <h2 className="mb-8 text-center text-3xl sm:text-4xl font-bold tracking-tight text-foreground">Popular Games</h2>

          <div className="mt-14 grid grid-cols-1 items-end justify-items-center gap-7 md:grid-cols-3 lg:gap-10">
            {POPULAR_GAMES.map((game) => {
              const orderClass =
                game.rank === 1 ? "md:order-2" : game.rank === 2 ? "md:order-1" : "md:order-3"
              const depthClass =
                game.rank === 1
                  ? "md:-translate-y-8 md:scale-[1.05]"
                  : game.rank === 2
                    ? "md:-translate-y-3"
                    : "md:translate-y-2"

              return (
                <div key={game.slug} className={`proto-tilt-wrap relative ${orderClass} ${depthClass}`}>
                  <Link
                    href={`/games/game?id=${game.slug}`}
                    onMouseMove={(event) => setTiltFromPointer(game.slug, event)}
                    onMouseLeave={(event) => resetTilt(game.slug, event)}
                    className={`proto-tilt-card group relative block h-[398px] w-[252px] sm:h-[424px] sm:w-[268px] overflow-hidden rounded-3xl border bg-card/78 ${
                      game.rank === 1
                        ? "border-accent/45 shadow-[0_26px_56px_color-mix(in_oklab,var(--accent)_34%,transparent)]"
                        : game.rank === 2
                          ? "border-primary/35 shadow-[0_20px_38px_color-mix(in_oklab,var(--primary)_26%,transparent)]"
                          : "border-foreground/20 shadow-[0_18px_34px_color-mix(in_oklab,var(--foreground)_16%,transparent)]"
                    }`}
                  >
                    <Image
                      src={withBasePath(game.logo)}
                      alt={game.title}
                      fill
                      sizes="280px"
                      className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-background/72 via-background/22 to-transparent" />
                    <div className="proto-tilt-shine" />

                    <div className="absolute left-3 top-3 rounded-full border border-border/80 bg-background/75 px-2.5 py-1 text-[11px] font-semibold tracking-[0.12em] text-foreground/85">
                      #{game.rank}
                    </div>

                    <div className="absolute inset-x-0 bottom-0 p-4">
                      <p className="text-xl font-semibold leading-tight text-foreground">{game.title}</p>
                      <p className="mt-1 text-xs text-foreground/62">{game.description}</p>
                    </div>
                  </Link>
                  {game.rank === 1 && (
                    <div className="pointer-events-none absolute inset-0 -z-10 rounded-[28px] bg-[radial-gradient(circle_at_50%_18%,color-mix(in_oklab,var(--accent)_28%,transparent),transparent_58%)] blur-[1px]" />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
