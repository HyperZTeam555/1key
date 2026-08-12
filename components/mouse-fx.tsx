"use client"

import { useEffect, useRef } from "react"
import { useSettings } from "@/lib/settings-context"

type TrailPoint = { x: number; y: number; t: number }

type ShapeParticle = {
  x: number
  y: number
  vx: number
  vy: number
  rotation: number
  rotationSpeed: number
  size: number
  sides: number
  bornAt: number
  ttl: number
  kind: "poly" | "plus" | "diamond"
}

const TRAIL_LIFE_MS = 155
const MAX_TRAIL_POINTS = 84
const MIN_MOVE_SQ = 3
const SAMPLE_GAP_MS = 10
const FAST_JUMP_SQ = 900

const hexToRgb = (hex: string) => {
  const normalized = hex.replace("#", "").trim()
  if (normalized.length === 3) {
    return {
      r: parseInt(normalized[0] + normalized[0], 16),
      g: parseInt(normalized[1] + normalized[1], 16),
      b: parseInt(normalized[2] + normalized[2], 16),
    }
  }
  if (normalized.length === 6) {
    return {
      r: parseInt(normalized.slice(0, 2), 16),
      g: parseInt(normalized.slice(2, 4), 16),
      b: parseInt(normalized.slice(4, 6), 16),
    }
  }
  return null
}

const rgba = (hex: string, alpha: number) => {
  const rgb = hexToRgb(hex)
  if (!rgb) return `rgba(255, 255, 255, ${alpha})`
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`
}

const drawPolygon = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  sides: number,
  size: number,
  rotation: number,
) => {
  ctx.beginPath()
  for (let i = 0; i < sides; i++) {
    const angle = rotation + (i * 2 * Math.PI) / sides
    const px = x + size * Math.cos(angle)
    const py = y + size * Math.sin(angle)
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.closePath()
}

export function MouseFx() {
  const { settings } = useSettings()
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const rafRef = useRef<number | null>(null)
  const pointsRef = useRef<TrailPoint[]>([])
  const shapesRef = useRef<ShapeParticle[]>([])
  const lastShapeAtRef = useRef<number>(0)
  const lastMoveAtRef = useRef<number>(0)

  useEffect(() => {
    const enabled = settings.mouseTrailEnabled || settings.mouseShapesEnabled
    if (!enabled) {
      pointsRef.current = []
      shapesRef.current = []
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = null
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext("2d")
        ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
      }
      return
    }

    const canvas = document.createElement("canvas")
    canvas.className = "fixed inset-0 pointer-events-none z-40"
    canvas.style.width = "100%"
    canvas.style.height = "100%"
    document.body.appendChild(canvas)
    canvasRef.current = canvas

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const clearTrail = () => {
      pointsRef.current = []
    }

    const resize = () => {
      const dpr = Math.min(1.35, Math.max(1, window.devicePixelRatio || 1))
      canvas.width = Math.floor(window.innerWidth * dpr)
      canvas.height = Math.floor(window.innerHeight * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener("resize", resize)

    const handleMove = (e: MouseEvent) => {
      const now = performance.now()
      const last = pointsRef.current[pointsRef.current.length - 1]

      if (last) {
        const dx = e.clientX - last.x
        const dy = e.clientY - last.y
        const distSq = dx * dx + dy * dy

        if (distSq < MIN_MOVE_SQ) return

        if (now - last.t < SAMPLE_GAP_MS && distSq < FAST_JUMP_SQ) return

        if (distSq > FAST_JUMP_SQ) {
          pointsRef.current.push({
            x: last.x + dx * 0.5,
            y: last.y + dy * 0.5,
            t: last.t + (now - last.t) * 0.5,
          })
        }
      }

      pointsRef.current.push({ x: e.clientX, y: e.clientY, t: now })
      if (pointsRef.current.length > MAX_TRAIL_POINTS) {
        pointsRef.current = pointsRef.current.slice(-MAX_TRAIL_POINTS)
      }

      lastMoveAtRef.current = now

      if (settings.mouseShapesEnabled && now - lastShapeAtRef.current > 80) {
        lastShapeAtRef.current = now
        const kindRoll = Math.random()
        const kind: ShapeParticle["kind"] = kindRoll < 0.6 ? "poly" : kindRoll < 0.85 ? "diamond" : "plus"

        shapesRef.current.push({
          x: e.clientX + (Math.random() - 0.5) * 8,
          y: e.clientY + (Math.random() - 0.5) * 8,
          vx: (Math.random() - 0.5) * 0.35,
          vy: 0.2 + Math.random() * 0.7,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.06,
          size: 6 + Math.random() * 8,
          sides: 3 + Math.floor(Math.random() * 4),
          bornAt: now,
          ttl: 1000 + Math.random() * 500,
          kind,
        })
      }
    }

    const handleLeave = () => clearTrail()
    const handleBlur = () => clearTrail()
    const handleVisibility = () => {
      if (document.hidden) clearTrail()
    }

    window.addEventListener("mousemove", handleMove, { passive: true })
    window.addEventListener("mouseleave", handleLeave)
    window.addEventListener("blur", handleBlur)
    document.addEventListener("visibilitychange", handleVisibility)

    const draw = () => {
      const now = performance.now()
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)

      pointsRef.current = pointsRef.current.filter((point) => now - point.t <= TRAIL_LIFE_MS)
      if (pointsRef.current.length > MAX_TRAIL_POINTS) {
        pointsRef.current = pointsRef.current.slice(-MAX_TRAIL_POINTS)
      }

      if (now - lastMoveAtRef.current > TRAIL_LIFE_MS + 40) {
        pointsRef.current = []
      }

      if (settings.mouseTrailEnabled && pointsRef.current.length >= 2) {
        const color = settings.mouseTrailColor
        const points = pointsRef.current
        const segmentCount = points.length - 1
        const head = points[points.length - 1]

        const drawLayer = (maxWidth: number, alphaScale: number, blur: number) => {
          ctx.save()
          ctx.globalCompositeOperation = "lighter"
          ctx.lineCap = "round"
          ctx.lineJoin = "round"
          ctx.shadowColor = rgba(color, 0.75 * alphaScale)
          ctx.shadowBlur = blur

          for (let i = 1; i < points.length; i++) {
            const a = points[i - 1]
            const b = points[i]
            const t = i / segmentCount
            const eased = Math.pow(t, 0.72)
            const width = 0.7 + maxWidth * eased
            const alpha = (0.06 + 0.9 * eased) * alphaScale

            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.lineWidth = width
            ctx.strokeStyle = rgba(color, alpha)
            ctx.stroke()
          }

          ctx.restore()
        }

        drawLayer(18, 0.28, 14)
        drawLayer(10.8, 0.5, 6)
        drawLayer(6.6, 0.8, 2)

        ctx.save()
        ctx.globalCompositeOperation = "lighter"
        ctx.fillStyle = rgba(color, 0.2)
        ctx.shadowColor = rgba(color, 0.92)
        ctx.shadowBlur = 18
        ctx.beginPath()
        ctx.arc(head.x, head.y, 9, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }

      if (settings.mouseShapesEnabled && shapesRef.current.length) {
        const nextShapes: ShapeParticle[] = []

        for (const shape of shapesRef.current) {
          const age = now - shape.bornAt
          const life = Math.max(0, 1 - age / shape.ttl)
          if (life <= 0) continue

          shape.vy += 0.012
          shape.vx *= 0.992
          shape.vy *= 0.992
          shape.x += shape.vx * 5
          shape.y += shape.vy * 5
          shape.rotation += shape.rotationSpeed

          ctx.lineWidth = 2
          ctx.globalCompositeOperation = "lighter"
          ctx.shadowColor = rgba(settings.mouseShapesColor, 0.24 * life)
          ctx.shadowBlur = 8
          ctx.strokeStyle = rgba(settings.mouseShapesColor, 0.2 * life)

          if (shape.kind === "plus") {
            const s = shape.size * 0.75
            ctx.beginPath()
            ctx.moveTo(shape.x - s, shape.y)
            ctx.lineTo(shape.x + s, shape.y)
            ctx.moveTo(shape.x, shape.y - s)
            ctx.lineTo(shape.x, shape.y + s)
            ctx.stroke()
          } else if (shape.kind === "diamond") {
            drawPolygon(ctx, shape.x, shape.y, 4, shape.size, shape.rotation + Math.PI / 4)
            ctx.stroke()
          } else {
            drawPolygon(ctx, shape.x, shape.y, shape.sides, shape.size, shape.rotation)
            ctx.stroke()
          }

          nextShapes.push(shape)
        }

        shapesRef.current = nextShapes.slice(-110)
        ctx.globalCompositeOperation = "source-over"
        ctx.shadowBlur = 0
      }

      rafRef.current = requestAnimationFrame(draw)
    }

    rafRef.current = requestAnimationFrame(draw)

    return () => {
      window.removeEventListener("resize", resize)
      window.removeEventListener("mousemove", handleMove)
      window.removeEventListener("mouseleave", handleLeave)
      window.removeEventListener("blur", handleBlur)
      document.removeEventListener("visibilitychange", handleVisibility)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = null
      canvas.remove()
      canvasRef.current = null
    }
  }, [
    settings.mouseTrailEnabled,
    settings.mouseTrailColor,
    settings.mouseShapesEnabled,
    settings.mouseShapesColor,
  ])

  return null
}
