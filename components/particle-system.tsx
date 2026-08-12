"use client"

import { useEffect, useRef, useCallback } from "react"
import { useSettings } from "@/lib/settings-context"

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  opacity: number
  trail: { x: number; y: number }[]
  twinkle?: number
  twinkleSpeed?: number
}

interface PlexusNode {
  x: number
  y: number
  vx: number
  vy: number
  size: number
}

interface WavePoint {
  x: number
  baseY: number
  y: number
  offset: number
  amplitude: number
}

interface GeometricShape {
  x: number
  y: number
  vx: number
  vy: number
  rotation: number
  rotationSpeed: number
  size: number
  sides: number
  opacity: number
}

interface KineticDot {
  baseX: number
  baseY: number
  x: number
  y: number
  vx: number
  vy: number
  size: number
}

interface KineticRipple {
  x: number
  y: number
  startedAt: number
}

interface KineticBurstShape {
  x: number
  y: number
  vx: number
  vy: number
  rotation: number
  rotationSpeed: number
  size: number
  sides: number
  kind: "poly" | "plus" | "diamond"
  startedAt: number
  ttl: number
}

const hexToRgb = (hex: string) => {
  const normalized = hex.replace("#", "").trim()
  if (normalized.length === 3) {
    const r = parseInt(normalized[0] + normalized[0], 16)
    const g = parseInt(normalized[1] + normalized[1], 16)
    const b = parseInt(normalized[2] + normalized[2], 16)
    return { r, g, b }
  }
  if (normalized.length === 6) {
    const r = parseInt(normalized.slice(0, 2), 16)
    const g = parseInt(normalized.slice(2, 4), 16)
    const b = parseInt(normalized.slice(4, 6), 16)
    return { r, g, b }
  }
  return null
}

const toRgbString = (hex: string, fallback: string) => {
  const rgb = hexToRgb(hex)
  if (!rgb) return fallback
  return `${rgb.r}, ${rgb.g}, ${rgb.b}`
}

const getThemeColors = (colorTheme: string): { primary: string; secondary: string } => {
  switch (colorTheme) {
    case "cloud":
      return { primary: "100, 130, 180", secondary: "80, 110, 160" }
    case "matrix":
      return { primary: "0, 255, 100", secondary: "0, 200, 80" }
    case "ocean":
      return { primary: "100, 180, 255", secondary: "60, 140, 220" }
    case "ember":
      return { primary: "255, 160, 60", secondary: "255, 120, 40" }
    case "violet":
      return { primary: "180, 120, 255", secondary: "150, 90, 220" }
    case "midnight":
    default:
      return { primary: "255, 255, 255", secondary: "200, 200, 200" }
  }
}

export function ParticleSystem() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const plexusNodesRef = useRef<PlexusNode[]>([])
  const wavePointsRef = useRef<WavePoint[][]>([])
  const geometricShapesRef = useRef<GeometricShape[]>([])
  const kineticDotsRef = useRef<KineticDot[]>([])
  const kineticRipplesRef = useRef<KineticRipple[]>([])
  const kineticBurstShapesRef = useRef<KineticBurstShape[]>([])
  const kineticSpacingRef = useRef<number>(52)
  const mouseRef = useRef({ x: -1000, y: -1000 })
  const animationRef = useRef<number | undefined>(undefined)
  const timeRef = useRef(0)
  const { settings } = useSettings()

  const getParticleCount = useCallback(() => {
    if (settings.performanceMode) {
      return 20
    }
    switch (settings.particleIntensity) {
      case "low":
        return 60
      case "high":
        return 200
      default:
        return 120
    }
  }, [settings.particleIntensity, settings.performanceMode])

  const getPlexusNodeCount = useCallback(() => {
    if (settings.performanceMode) {
      return 30
    }
    switch (settings.particleIntensity) {
      case "low":
        return 50
      case "high":
        return 150
      default:
        return 80
    }
  }, [settings.particleIntensity, settings.performanceMode])

  const getWaveLineCount = useCallback(() => {
    if (settings.performanceMode) {
      return 3
    }
    switch (settings.particleIntensity) {
      case "low":
        return 4
      case "high":
        return 10
      default:
        return 6
    }
  }, [settings.particleIntensity, settings.performanceMode])

  const getGeometricCount = useCallback(() => {
    if (settings.performanceMode) {
      return 10
    }
    switch (settings.particleIntensity) {
      case "low":
        return 15
      case "high":
        return 50
      default:
        return 30
    }
  }, [settings.particleIntensity, settings.performanceMode])

  const getSpeedMultiplier = useCallback(() => {
    switch (settings.particleSpeed) {
      case "slow":
        return 1
      case "fast":
        return 3
      default:
        return 2
    }
  }, [settings.particleSpeed])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const applySize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    const relayoutKineticDots = () => {
      const spacing = kineticSpacingRef.current
      const margin = 6
      const cols = Math.ceil(canvas.width / spacing) + margin * 2 + 1
      const rows = Math.ceil(canvas.height / spacing) + margin * 2 + 1
      const existingDots = new Map(kineticDotsRef.current.map((dot) => [`${dot.baseX},${dot.baseY}`, dot]))

      kineticDotsRef.current = Array.from({ length: cols * rows }, (_, i) => {
        const col = i % cols
        const row = Math.floor(i / cols)
        const baseX = (col - margin) * spacing
        const baseY = (row - margin) * spacing
        const kept = existingDots.get(`${baseX},${baseY}`)
        if (kept) return kept
        const jitter = spacing * 0.08
        return {
          baseX,
          baseY,
          x: baseX + (Math.random() - 0.5) * jitter,
          y: baseY + (Math.random() - 0.5) * jitter,
          vx: 0,
          vy: 0,
          size: (settings.performanceMode ? 1.2 : 1.35) + Math.random() * 0.7,
        }
      })
    }

    const relayoutWaveField = () => {
      const lineCount = getWaveLineCount()
      const pointsPerLine = Math.max(3, Math.floor(canvas.width / 20))
      const previousLines = wavePointsRef.current

      wavePointsRef.current = Array.from({ length: lineCount }, (_, lineIndex) => {
        const baseY = (canvas.height / (lineCount + 1)) * (lineIndex + 1)
        const previousLine = previousLines[lineIndex]
        return Array.from({ length: pointsPerLine }, (_, i) => {
          const seed = previousLine && previousLine.length ? previousLine[i % previousLine.length] : undefined
          return {
            x: (canvas.width / (pointsPerLine - 1)) * i,
            baseY,
            y: baseY,
            offset: seed ? seed.offset : Math.random() * Math.PI * 2,
            amplitude: seed ? seed.amplitude : 20 + Math.random() * 30,
          }
        })
      })
    }

    const resize = () => {
      applySize()
      if (backgroundType === "kinetic-dots" && kineticDotsRef.current.length) {
        relayoutKineticDots()
      } else if (backgroundType === "wave-field" && wavePointsRef.current.length) {
        relayoutWaveField()
      }
    }

    applySize()
    window.addEventListener("resize", resize)

    const speedMultiplier = getSpeedMultiplier()
    const backgroundType = settings.backgroundType
    const themeColors = getThemeColors(settings.colorTheme || "midnight")
    const effectiveIntensity: "low" | "medium" | "high" = settings.performanceMode ? "low" : settings.particleIntensity

    const themeOverrideColors = settings.themeOverrides?.[settings.colorTheme]?.colors ?? {}
    const dotColor = toRgbString(themeOverrideColors.foreground ?? themeOverrideColors.primary ?? "", themeColors.primary)
    const primaryColor = toRgbString(themeOverrideColors.primary ?? "", themeColors.primary)
    const accentColor = toRgbString(themeOverrideColors.accent ?? "", themeColors.secondary)

    if (backgroundType === "custom-image") {
      particlesRef.current = []
      plexusNodesRef.current = []
      wavePointsRef.current = []
      geometricShapesRef.current = []
      kineticDotsRef.current = []
      kineticRipplesRef.current = []
      kineticBurstShapesRef.current = []
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      return () => {
        window.removeEventListener("resize", resize)
      }
    }

    if (backgroundType === "falling-stars") {
      const particleCount =
        effectiveIntensity === "high" ? 240 : effectiveIntensity === "low" ? 124 : 180
      particlesRef.current = Array.from({ length: particleCount }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.4 * speedMultiplier,
        vy: (0.9 + Math.random() * 1.8) * speedMultiplier,
        size: 1.8 + Math.random() * 3.4,
        opacity: 0.26 + Math.random() * 0.72,
        trail: [],
      }))
    } else if (backgroundType === "starfield") {
      const particleCount = getParticleCount()
      particlesRef.current = Array.from({ length: particleCount }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.15 * speedMultiplier,
        vy: (Math.random() - 0.5) * 0.15 * speedMultiplier,
        size: Math.random() * 1.6 + 0.4,
        opacity: Math.random() * 0.6 + 0.2,
        trail: [],
        twinkle: Math.random() * Math.PI * 2,
        twinkleSpeed: 0.6 + Math.random() * 1.2,
      }))
    } else if (backgroundType === "drift-dust") {
      const particleCount = getParticleCount()
      particlesRef.current = Array.from({ length: particleCount }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3 * speedMultiplier,
        vy: (Math.random() - 0.5) * 0.3 * speedMultiplier,
        size: Math.random() * 2.4 + 0.6,
        opacity: Math.random() * 0.4 + 0.1,
        trail: [],
        twinkle: Math.random() * Math.PI * 2,
        twinkleSpeed: 0.3 + Math.random() * 0.7,
      }))
    } else if (backgroundType === "plexus") {
      const nodeCount =
        effectiveIntensity === "high" ? 190 : effectiveIntensity === "low" ? 110 : 150
      plexusNodesRef.current = Array.from({ length: nodeCount }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5 * speedMultiplier,
        vy: (Math.random() - 0.5) * 0.5 * speedMultiplier,
        size: 2 + Math.random() * 3.2,
      }))
    } else if (backgroundType === "wave-field") {
      const lineCount = getWaveLineCount()
      const pointsPerLine = Math.floor(canvas.width / 20)
      wavePointsRef.current = Array.from({ length: lineCount }, (_, lineIndex) => {
        const baseY = (canvas.height / (lineCount + 1)) * (lineIndex + 1)
        return Array.from({ length: pointsPerLine }, (_, i) => ({
          x: (canvas.width / (pointsPerLine - 1)) * i,
          baseY,
          y: baseY,
          offset: Math.random() * Math.PI * 2,
          amplitude: 20 + Math.random() * 30,
        }))
      })
    } else if (backgroundType === "geometric-mesh") {
      const shapeCount = getGeometricCount()
      geometricShapesRef.current = Array.from({ length: shapeCount }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.8 * speedMultiplier,
        vy: (Math.random() - 0.5) * 0.8 * speedMultiplier,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.02 * speedMultiplier,
        size: 15 + Math.random() * 25,
        sides: Math.floor(Math.random() * 4) + 3,
        opacity: 0.1 + Math.random() * 0.3,
      }))
    } else if (backgroundType === "kinetic-dots") {
      const spacing = (() => {
        if (settings.performanceMode) return 56
        switch (settings.particleIntensity) {
          case "low":
            return 58
          case "high":
            return 34
          default:
            return 42
        }
      })()

      kineticSpacingRef.current = spacing
      const margin = 6
      const cols = Math.ceil(canvas.width / spacing) + margin * 2 + 1
      const rows = Math.ceil(canvas.height / spacing) + margin * 2 + 1

      kineticDotsRef.current = Array.from({ length: cols * rows }, (_, i) => {
        const col = i % cols
        const row = Math.floor(i / cols)
        const baseX = (col - margin) * spacing
        const baseY = (row - margin) * spacing
        const jitter = spacing * 0.08
        return {
          baseX,
          baseY,
          x: baseX + (Math.random() - 0.5) * jitter,
          y: baseY + (Math.random() - 0.5) * jitter,
          vx: 0,
          vy: 0,
          size: (settings.performanceMode ? 1.2 : 1.35) + Math.random() * 0.7,
        }
      })
      kineticRipplesRef.current = []
      kineticBurstShapesRef.current = []
    }

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY }
    }

    const handleMouseLeave = () => {
      mouseRef.current = { x: -1000, y: -1000 }
    }

    window.addEventListener("mousemove", handleMouseMove, { passive: true })
    window.addEventListener("mouseleave", handleMouseLeave, { passive: true })

    const handleClick = (e: MouseEvent) => {
      if (backgroundType !== "kinetic-dots") return
      if (settings.performanceMode) return

      const now = performance.now()
      kineticRipplesRef.current.push({ x: e.clientX, y: e.clientY, startedAt: now })
      kineticRipplesRef.current = kineticRipplesRef.current.slice(-3)

      const burstCount = settings.particleIntensity === "high" ? 16 : settings.particleIntensity === "low" ? 10 : 13
      for (let i = 0; i < burstCount; i++) {
        const angle = Math.random() * Math.PI * 2
        const speed = (1.4 + Math.random() * 2.8) * (settings.particleSpeed === "fast" ? 1.2 : 1)
        const kindRoll = Math.random()
        const kind: KineticBurstShape["kind"] = kindRoll < 0.65 ? "poly" : kindRoll < 0.85 ? "diamond" : "plus"

        kineticBurstShapesRef.current.push({
          x: e.clientX,
          y: e.clientY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.08,
          size: 9 + Math.random() * 16,
          sides: 3 + Math.floor(Math.random() * 4),
          kind,
          startedAt: now,
          ttl: 900 + Math.random() * 700,
        })
      }
      kineticBurstShapesRef.current = kineticBurstShapesRef.current.slice(-80)
    }

    if (backgroundType === "kinetic-dots") {
      window.addEventListener("click", handleClick, { passive: true })
    }

    const isTabVisible = () => document.visibilityState !== "hidden"
    let isAnimationRunning = false

    const drawKineticDots = () => {
      const dots = kineticDotsRef.current
      if (!dots.length) return

      const now = performance.now()
      const speedMode = settings.particleSpeed
      const waveSpeed = speedMode === "fast" ? 1.3 : speedMode === "slow" ? 0.85 : 1
      const spacing = kineticSpacingRef.current || 34
      const waveAmp = spacing *
        (settings.performanceMode ? 0.1 : settings.particleIntensity === "high" ? 0.14 : settings.particleIntensity === "low" ? 0.1 : 0.12)

      const spring = settings.performanceMode ? 0.015 : 0.018
      const friction = settings.performanceMode ? 0.91 : 0.895
      const repelRadius = settings.performanceMode ? 105 : 135
      const repelStrength = settings.performanceMode ? 0.9 : 1.2
      const swirlStrength = settings.performanceMode ? 0.14 : 0.3
      const maxOffset = spacing * (settings.performanceMode ? 1.35 : 1.6)
      const edgePad = spacing * 4

      timeRef.current += 0.01 * speedMultiplier * waveSpeed

      const maxRippleRadius = Math.max(canvas.width, canvas.height) * 0.65
      const rippleSpeed = (speedMode === "fast" ? 1.1 : speedMode === "slow" ? 0.8 : 0.95)
      const rippleRing = settings.performanceMode ? 16 : 22

      const ripples = kineticRipplesRef.current
      const rippleStates = ripples
        .map((ripple) => {
          const age = now - ripple.startedAt
          const radius = age * rippleSpeed
          const life = 1 - radius / maxRippleRadius
          return { ripple, radius, life }
        })
        .filter((state) => state.life > 0)

      kineticRipplesRef.current = rippleStates.map((state) => state.ripple)

      for (const dot of dots) {
        const waveX = Math.sin(timeRef.current + dot.baseY * 0.012) * waveAmp
        const waveY = Math.cos(timeRef.current + dot.baseX * 0.012) * waveAmp
        const targetX = dot.baseX + waveX
        const targetY = dot.baseY + waveY

        dot.vx += (targetX - dot.x) * spring
        dot.vy += (targetY - dot.y) * spring

        const dx = dot.x - mouseRef.current.x
        const dy = dot.y - mouseRef.current.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < repelRadius && dist > 0) {
          const force = (repelRadius - dist) / repelRadius
          dot.vx += (dx / dist) * force * repelStrength * 1.45
          dot.vy += (dy / dist) * force * repelStrength * 1.45
          dot.vx += (-dy / dist) * force * swirlStrength
          dot.vy += (dx / dist) * force * swirlStrength
        }

        let rippleBoost = 0
        for (const state of rippleStates) {
          const rx = dot.x - state.ripple.x
          const ry = dot.y - state.ripple.y
          const rDist = Math.sqrt(rx * rx + ry * ry)
          const diff = rDist - state.radius
          if (Math.abs(diff) < rippleRing && rDist > 0) {
            const pulse = (1 - Math.abs(diff) / rippleRing) * state.life
            rippleBoost = Math.max(rippleBoost, pulse)
            dot.vx += (rx / rDist) * pulse * 2.2
            dot.vy += (ry / rDist) * pulse * 2.2
          }
        }

        dot.vx *= friction
        dot.vy *= friction
        dot.x += dot.vx
        dot.y += dot.vy

        const ox = dot.x - targetX
        const oy = dot.y - targetY
        const od = Math.sqrt(ox * ox + oy * oy)
        if (od > maxOffset && od > 0) {
          const overflow = od - maxOffset
          const nx = ox / od
          const ny = oy / od
          const correction = Math.min(overflow, spacing * 0.55)

          dot.x -= nx * correction * 0.26
          dot.y -= ny * correction * 0.26
          dot.vx -= nx * correction * 0.052
          dot.vy -= ny * correction * 0.052
        }

        if (dot.x < -edgePad || dot.x > canvas.width + edgePad || dot.y < -edgePad || dot.y > canvas.height + edgePad) {
          continue
        }

        const near = dist < repelRadius ? 1 - dist / repelRadius : 0
        const size = dot.size * (1 + near * 1.25 + rippleBoost * 1.6)
        const opacity = Math.min(0.92, 0.2 + near * 0.62 + rippleBoost * 0.55)

        ctx.beginPath()
        ctx.arc(dot.x, dot.y, size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${dotColor}, ${opacity})`
        ctx.fill()
      }

      if (kineticBurstShapesRef.current.length) {
        const nextShapes: KineticBurstShape[] = []
        ctx.lineWidth = 2
        ctx.strokeStyle = `rgba(${dotColor}, 0.22)`

        for (const shape of kineticBurstShapesRef.current) {
          const age = now - shape.startedAt
          const life = 1 - age / shape.ttl
          if (life <= 0) continue

          shape.vx *= 0.985
          shape.vy *= 0.985
          shape.x += shape.vx * 1.8
          shape.y += shape.vy * 1.8
          shape.rotation += shape.rotationSpeed

          ctx.strokeStyle = `rgba(${dotColor}, ${0.28 * life})`

          if (shape.kind === "plus") {
            const s = shape.size * 0.75
            ctx.beginPath()
            ctx.moveTo(shape.x - s, shape.y)
            ctx.lineTo(shape.x + s, shape.y)
            ctx.moveTo(shape.x, shape.y - s)
            ctx.lineTo(shape.x, shape.y + s)
            ctx.stroke()
          } else if (shape.kind === "diamond") {
            drawPolygon(shape.x, shape.y, 4, shape.size, shape.rotation + Math.PI / 4)
            ctx.stroke()
          } else {
            drawPolygon(shape.x, shape.y, shape.sides, shape.size, shape.rotation)
            ctx.stroke()
          }

          nextShapes.push(shape)
        }
        kineticBurstShapesRef.current = nextShapes.slice(-120)
      }

    }

    const drawFallingStars = () => {
      const particleColor = primaryColor

      particlesRef.current.forEach((particle) => {
        particle.trail.push({ x: particle.x, y: particle.y })
        const maxTrailLength = settings.performanceMode ? 4 : 11
        if (particle.trail.length > maxTrailLength) {
          particle.trail.shift()
        }

        const dx = particle.x - mouseRef.current.x
        const dy = particle.y - mouseRef.current.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        const repelRadius = 120

        if (distance < repelRadius && distance > 0) {
          const force = (repelRadius - distance) / repelRadius
          particle.vx += (dx / distance) * force * 2
          particle.vy += (dy / distance) * force * 2
        }

        particle.vx *= 0.98
        particle.vy *= 0.99
        particle.vy += 0.02 * speedMultiplier

        particle.x += particle.vx
        particle.y += particle.vy

        if (particle.y > canvas.height + 10) {
          particle.y = -10
          particle.x = Math.random() * canvas.width
          particle.trail = []
        }
        if (particle.x < -10) particle.x = canvas.width + 10
        if (particle.x > canvas.width + 10) particle.x = -10

        particle.trail.forEach((pos, i) => {
          const trailOpacity = (i / particle.trail.length) * particle.opacity * 0.3
          ctx.beginPath()
          ctx.arc(pos.x, pos.y, particle.size * 0.62, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(${particleColor}, ${trailOpacity})`
          ctx.fill()
        })

        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${particleColor}, ${particle.opacity})`
        ctx.fill()
      })
    }

    const drawStarfield = () => {
      const starColor = primaryColor
      timeRef.current += 0.01 * speedMultiplier

      particlesRef.current.forEach((star) => {
        star.x += star.vx
        star.y += star.vy

        if (star.x < -10) star.x = canvas.width + 10
        if (star.x > canvas.width + 10) star.x = -10
        if (star.y < -10) star.y = canvas.height + 10
        if (star.y > canvas.height + 10) star.y = -10

        const twinkle = Math.sin(timeRef.current * (star.twinkleSpeed || 1) + (star.twinkle || 0))
        const opacity = Math.max(0.1, star.opacity * (0.6 + 0.4 * twinkle))

        ctx.beginPath()
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${starColor}, ${opacity})`
        ctx.fill()
      })
    }

    const drawDriftDust = () => {
      const dustColor = accentColor
      timeRef.current += 0.008 * speedMultiplier

      particlesRef.current.forEach((dust) => {
        dust.x += dust.vx
        dust.y += dust.vy

        if (dust.x < -20) dust.x = canvas.width + 20
        if (dust.x > canvas.width + 20) dust.x = -20
        if (dust.y < -20) dust.y = canvas.height + 20
        if (dust.y > canvas.height + 20) dust.y = -20

        const twinkle = Math.sin(timeRef.current * (dust.twinkleSpeed || 1) + (dust.twinkle || 0))
        const opacity = Math.max(0.05, dust.opacity * (0.7 + 0.3 * twinkle))

        ctx.beginPath()
        ctx.arc(dust.x, dust.y, dust.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${dustColor}, ${opacity})`
        ctx.fill()
      })
    }

    const drawGridFlow = () => {
      const gridColor = accentColor
      timeRef.current += (settings.performanceMode ? 0.0036 : 0.0052) * speedMultiplier

      const spacing =
        settings.performanceMode
          ? 112
          : effectiveIntensity === "high"
            ? 52
            : effectiveIntensity === "low"
              ? 86
              : 68
      const lineStep = settings.performanceMode ? spacing * 2 : spacing
      const waveAmplitude = settings.performanceMode ? 2.5 : effectiveIntensity === "high" ? 7.2 : 5.6
      const driftRate = settings.performanceMode ? 20 : 40
      const alpha = settings.performanceMode ? 0.11 : 0.18

      ctx.lineWidth = settings.performanceMode ? 0.85 : 1
      ctx.strokeStyle = `rgba(${gridColor}, ${alpha})`

      const offset = (timeRef.current * driftRate) % lineStep
      for (let x = -lineStep; x <= canvas.width + lineStep; x += lineStep) {
        ctx.beginPath()
        const wave = Math.sin(timeRef.current + x * 0.01) * waveAmplitude
        ctx.moveTo(x + offset, 0 + wave)
        ctx.lineTo(x + offset, canvas.height + wave)
        ctx.stroke()
      }

      for (let y = -lineStep; y <= canvas.height + lineStep; y += lineStep) {
        ctx.beginPath()
        const wave = Math.cos(timeRef.current + y * 0.01) * waveAmplitude
        ctx.moveTo(0 + wave, y + offset)
        ctx.lineTo(canvas.width + wave, y + offset)
        ctx.stroke()
      }
    }

    const drawPlexus = () => {
      const nodeColor = primaryColor
      const connectionDistance = settings.performanceMode ? 120 : 190

      plexusNodesRef.current.forEach((node) => {
        const dx = node.x - mouseRef.current.x
        const dy = node.y - mouseRef.current.y
        const mouseDist = Math.sqrt(dx * dx + dy * dy)
        const repelRadius = 150

        if (mouseDist < repelRadius && mouseDist > 0) {
          const force = (repelRadius - mouseDist) / repelRadius
          node.vx += (dx / mouseDist) * force * 0.5
          node.vy += (dy / mouseDist) * force * 0.5
        }

        node.vx *= 0.99
        node.vy *= 0.99

        node.vx += (Math.random() - 0.5) * 0.02 * speedMultiplier
        node.vy += (Math.random() - 0.5) * 0.02 * speedMultiplier

        const maxVel = 0.92 * speedMultiplier
        node.vx = Math.max(-maxVel, Math.min(maxVel, node.vx))
        node.vy = Math.max(-maxVel, Math.min(maxVel, node.vy))

        node.x += node.vx
        node.y += node.vy

        if (node.x < 0) node.x = canvas.width
        if (node.x > canvas.width) node.x = 0
        if (node.y < 0) node.y = canvas.height
        if (node.y > canvas.height) node.y = 0
      })

      for (let i = 0; i < plexusNodesRef.current.length; i++) {
        for (let j = i + 1; j < plexusNodesRef.current.length; j++) {
          const a = plexusNodesRef.current[i]
          const b = plexusNodesRef.current[j]
          const dist = Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2)

          if (dist < connectionDistance) {
            const opacity = (1 - dist / connectionDistance) * 0.5
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.strokeStyle = `rgba(${nodeColor}, ${opacity})`
            ctx.lineWidth = 1.2
            ctx.stroke()
          }
        }
      }

      plexusNodesRef.current.forEach((node) => {
        ctx.beginPath()
        ctx.arc(node.x, node.y, node.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${nodeColor}, 0.72)`
        ctx.fill()
      })
    }

    const drawWaveField = () => {
      const waveColor = primaryColor

      timeRef.current += 0.02 * speedMultiplier

      wavePointsRef.current.forEach((line, lineIndex) => {
        line.forEach((point) => {
          const mouseDx = point.x - mouseRef.current.x
          const mouseDy = point.baseY - mouseRef.current.y
          const mouseDist = Math.sqrt(mouseDx * mouseDx + mouseDy * mouseDy)
          const mouseInfluence = mouseDist < 200 ? (200 - mouseDist) / 200 * 50 : 0
          
          point.y = point.baseY + 
            Math.sin(timeRef.current + point.offset + point.x * 0.01) * point.amplitude -
            mouseInfluence * Math.sign(mouseDy || 1)
        })

        const opacity = 0.2 + (lineIndex / wavePointsRef.current.length) * 0.3
        ctx.beginPath()
        ctx.moveTo(line[0].x, line[0].y)

        for (let i = 1; i < line.length - 2; i++) {
          const xc = (line[i].x + line[i + 1].x) / 2
          const yc = (line[i].y + line[i + 1].y) / 2
          ctx.quadraticCurveTo(line[i].x, line[i].y, xc, yc)
        }

        ctx.strokeStyle = `rgba(${waveColor}, ${opacity})`
        ctx.lineWidth = 2
        ctx.stroke()

        line.forEach((point, i) => {
          if (i % 5 === 0) {
            ctx.beginPath()
            ctx.arc(point.x, point.y, 2, 0, Math.PI * 2)
            ctx.fillStyle = `rgba(${waveColor}, ${opacity * 0.8})`
            ctx.fill()
          }
        })
      })
    }

    const drawPolygon = (x: number, y: number, sides: number, size: number, rotation: number) => {
      ctx.beginPath()
      for (let i = 0; i < sides; i++) {
        const angle = rotation + (i * 2 * Math.PI) / sides
        const px = x + size * Math.cos(angle)
        const py = y + size * Math.sin(angle)
        if (i === 0) {
          ctx.moveTo(px, py)
        } else {
          ctx.lineTo(px, py)
        }
      }
      ctx.closePath()
    }

    const drawGeometricMesh = () => {
      const shapeColor = primaryColor
      const connectionDistance = settings.performanceMode ? 150 : 200

      geometricShapesRef.current.forEach((shape) => {
        const dx = shape.x - mouseRef.current.x
        const dy = shape.y - mouseRef.current.y
        const mouseDist = Math.sqrt(dx * dx + dy * dy)
        const repelRadius = 180

        if (mouseDist < repelRadius && mouseDist > 0) {
          const force = (repelRadius - mouseDist) / repelRadius
          shape.vx += (dx / mouseDist) * force * 0.3
          shape.vy += (dy / mouseDist) * force * 0.3
          shape.rotationSpeed += force * 0.01
        }

        shape.vx *= 0.99
        shape.vy *= 0.99
        shape.rotationSpeed *= 0.99

        shape.x += shape.vx
        shape.y += shape.vy
        shape.rotation += shape.rotationSpeed

        if (shape.x < -50) shape.x = canvas.width + 50
        if (shape.x > canvas.width + 50) shape.x = -50
        if (shape.y < -50) shape.y = canvas.height + 50
        if (shape.y > canvas.height + 50) shape.y = -50
      })

      for (let i = 0; i < geometricShapesRef.current.length; i++) {
        for (let j = i + 1; j < geometricShapesRef.current.length; j++) {
          const a = geometricShapesRef.current[i]
          const b = geometricShapesRef.current[j]
          const dist = Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2)

          if (dist < connectionDistance) {
            const opacity = (1 - dist / connectionDistance) * 0.2
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.strokeStyle = `rgba(${shapeColor}, ${opacity})`
            ctx.lineWidth = 1
            ctx.stroke()
          }
        }
      }

      geometricShapesRef.current.forEach((shape) => {
        drawPolygon(shape.x, shape.y, shape.sides, shape.size, shape.rotation)
        ctx.strokeStyle = `rgba(${shapeColor}, ${shape.opacity})`
        ctx.lineWidth = 1.5
        ctx.stroke()

        ctx.beginPath()
        ctx.arc(shape.x, shape.y, 2, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${shapeColor}, ${shape.opacity * 0.8})`
        ctx.fill()
      })
    }

    const animate = () => {
      if (!isAnimationRunning) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      switch (backgroundType) {
        case "kinetic-dots":
          drawKineticDots()
          break
        case "falling-stars":
          drawFallingStars()
          break
        case "starfield":
          drawStarfield()
          break
        case "drift-dust":
          drawDriftDust()
          break
        case "plexus":
          drawPlexus()
          break
        case "wave-field":
          drawWaveField()
          break
        case "geometric-mesh":
          drawGeometricMesh()
          break
        case "grid-flow":
          drawGridFlow()
          break
      }

      animationRef.current = requestAnimationFrame(animate)
    }

    const startAnimation = () => {
      if (isAnimationRunning || !isTabVisible()) return
      isAnimationRunning = true
      animationRef.current = requestAnimationFrame(animate)
    }

    const stopAnimation = () => {
      if (!isAnimationRunning) return
      isAnimationRunning = false
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
        animationRef.current = undefined
      }
    }

    const handleVisibilityChange = () => {
      if (isTabVisible()) {
        startAnimation()
      } else {
        stopAnimation()
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    startAnimation()

    return () => {
      window.removeEventListener("resize", resize)
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseleave", handleMouseLeave)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      if (backgroundType === "kinetic-dots") {
        window.removeEventListener("click", handleClick)
      }
      stopAnimation()
    }
  }, [
    settings.colorTheme,
    settings.themeOverrides,
    settings.backgroundType,
    settings.performanceMode,
    settings.particleIntensity,
    settings.particleSpeed,
    getParticleCount,
    getPlexusNodeCount,
    getWaveLineCount,
    getGeometricCount,
    getSpeedMultiplier,
  ])

  const hasCustomBackground = settings.backgroundType === "custom-image" && !!settings.customBackgroundImage

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={
        hasCustomBackground
          ? {
              backgroundImage: `url(${settings.customBackgroundImage})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }
          : { background: "transparent" }
      }
    />
  )
}
