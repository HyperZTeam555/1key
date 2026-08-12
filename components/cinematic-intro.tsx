"use client"

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react"
import gsap from "gsap"
import * as THREE from "three"
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js"
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js"
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js"

type CinematicIntroProps = {
  onComplete?: () => void
  autoAdvance?: boolean
  durationSec?: number
}

type MonolithRig = {
  group: THREE.Group
  coreMesh: THREE.Mesh<THREE.BufferGeometry, THREE.MeshPhysicalMaterial>
  shellMesh: THREE.Mesh<THREE.BufferGeometry, THREE.MeshPhysicalMaterial>
  coreMaterial: THREE.MeshPhysicalMaterial
  shellMaterial: THREE.MeshPhysicalMaterial
  shardMaterial: THREE.MeshPhysicalMaterial
  shards: THREE.Mesh[]
  auraLight: THREE.PointLight
}

type LogoParticleRig = {
  points: THREE.Points<THREE.BufferGeometry, THREE.PointsMaterial>
  starts: Float32Array
  burstDir: Float32Array
  burstMag: Float32Array
  targets: Float32Array
  positions: Float32Array
}

type WarpFieldRig = {
  points: THREE.Points<THREE.BufferGeometry, THREE.PointsMaterial>
  positions: Float32Array
  zNear: number
  zFar: number
  spreadX: number
  spreadY: number
}

type IntroTheme = "midnight" | "cloud" | "matrix" | "ocean" | "ember" | "violet"

type IntroPalette = {
  sceneBg: string
  fog: string
  starFar: string
  starNear: string
  ember: string
  keyLight: string
  fillLight: string
  rimLight: string
  diskDeep: string
  diskMid: string
  diskGlow: string
  leftPlanet: {
    color: string
    emissive: string
    atmosphere: string
  }
  rightPlanet: {
    color: string
    emissive: string
    atmosphere: string
  }
  logoTint: string
  buttonBorder: string
  buttonText: string
  buttonBg: string
  buttonGlow: string
}

const INTRO_THEMES: IntroTheme[] = ["midnight", "cloud", "matrix", "ocean", "ember", "violet"]

const INTRO_PALETTES: Record<IntroTheme, IntroPalette> = {
  midnight: {
    sceneBg: "#020305",
    fog: "#020305",
    starFar: "#4f555f",
    starNear: "#dce4ee",
    ember: "#a6b1bf",
    keyLight: "#f2f6fb",
    fillLight: "#bcc8d8",
    rimLight: "#ffffff",
    diskDeep: "#05070b",
    diskMid: "#2b313a",
    diskGlow: "#d4dde8",
    leftPlanet: { color: "#1a1f27", emissive: "#0f1217", atmosphere: "#7d8796" },
    rightPlanet: { color: "#1d212a", emissive: "#10131a", atmosphere: "#939eae" },
    logoTint: "#f3f6fa",
    buttonBorder: "rgba(205, 216, 230, 0.74)",
    buttonText: "#f4f7fb",
    buttonBg: "rgba(8, 10, 14, 0.82)",
    buttonGlow: "rgba(171, 186, 206, 0.32)",
  },
  cloud: {
    sceneBg: "#dfe4ed",
    fog: "#dfe4ed",
    starFar: "#7d8898",
    starNear: "#d0d9ea",
    ember: "#c6cfde",
    keyLight: "#f4f7ff",
    fillLight: "#cad7f1",
    rimLight: "#f5f8ff",
    diskDeep: "#d4dae7",
    diskMid: "#8fa2be",
    diskGlow: "#f4f8ff",
    leftPlanet: { color: "#9eaec5", emissive: "#6f7f98", atmosphere: "#d9e1f1" },
    rightPlanet: { color: "#9da7b7", emissive: "#6f7888", atmosphere: "#e1e7f5" },
    logoTint: "#f7f9ff",
    buttonBorder: "rgba(122, 139, 169, 0.72)",
    buttonText: "#edf2ff",
    buttonBg: "rgba(42, 51, 68, 0.72)",
    buttonGlow: "rgba(146, 167, 206, 0.36)",
  },
  matrix: {
    sceneBg: "#041008",
    fog: "#041008",
    starFar: "#24683c",
    starNear: "#7edc90",
    ember: "#57b56f",
    keyLight: "#9cf3ad",
    fillLight: "#69c27d",
    rimLight: "#b8ffd3",
    diskDeep: "#06150a",
    diskMid: "#1e5a30",
    diskGlow: "#86df96",
    leftPlanet: { color: "#1f3725", emissive: "#112016", atmosphere: "#5a9f69" },
    rightPlanet: { color: "#223126", emissive: "#132118", atmosphere: "#77bb84" },
    logoTint: "#c8ffd1",
    buttonBorder: "rgba(129, 235, 148, 0.72)",
    buttonText: "#ceffd9",
    buttonBg: "rgba(8, 23, 11, 0.82)",
    buttonGlow: "rgba(102, 216, 124, 0.35)",
  },
  ocean: {
    sceneBg: "#041223",
    fog: "#041223",
    starFar: "#2d6d8f",
    starNear: "#89d4ff",
    ember: "#5bb8e8",
    keyLight: "#9ce6ff",
    fillLight: "#6ac8ef",
    rimLight: "#d0f4ff",
    diskDeep: "#041024",
    diskMid: "#155379",
    diskGlow: "#8fd9ff",
    leftPlanet: { color: "#1d3354", emissive: "#12243f", atmosphere: "#5ca3d8" },
    rightPlanet: { color: "#203047", emissive: "#142235", atmosphere: "#79bbe8" },
    logoTint: "#d9f2ff",
    buttonBorder: "rgba(134, 208, 255, 0.72)",
    buttonText: "#e4f7ff",
    buttonBg: "rgba(8, 22, 37, 0.8)",
    buttonGlow: "rgba(104, 179, 224, 0.35)",
  },
  ember: {
    sceneBg: "#170b05",
    fog: "#170b05",
    starFar: "#8f5631",
    starNear: "#f6c17e",
    ember: "#ff9d53",
    keyLight: "#ffd8a8",
    fillLight: "#ef9f5f",
    rimLight: "#ffe5bf",
    diskDeep: "#1a0d05",
    diskMid: "#8a3f1d",
    diskGlow: "#f6c07a",
    leftPlanet: { color: "#44251b", emissive: "#2a140d", atmosphere: "#cc7444" },
    rightPlanet: { color: "#4b2a1f", emissive: "#2f1810", atmosphere: "#e59a5e" },
    logoTint: "#ffe6c3",
    buttonBorder: "rgba(246, 173, 103, 0.75)",
    buttonText: "#fff0da",
    buttonBg: "rgba(33, 15, 7, 0.82)",
    buttonGlow: "rgba(241, 141, 66, 0.38)",
  },
  violet: {
    sceneBg: "#12071d",
    fog: "#12071d",
    starFar: "#70509d",
    starNear: "#d4b6ff",
    ember: "#b78cff",
    keyLight: "#d8b8ff",
    fillLight: "#af7dff",
    rimLight: "#eddcff",
    diskDeep: "#13081f",
    diskMid: "#5a2f8f",
    diskGlow: "#d4b4ff",
    leftPlanet: { color: "#33224f", emissive: "#1f1430", atmosphere: "#9e72d4" },
    rightPlanet: { color: "#3a2658", emissive: "#241739", atmosphere: "#ba8bea" },
    logoTint: "#f1e4ff",
    buttonBorder: "rgba(205, 164, 255, 0.75)",
    buttonText: "#f6edff",
    buttonBg: "rgba(26, 12, 41, 0.82)",
    buttonGlow: "rgba(171, 123, 237, 0.35)",
  },
}

type Rgb = { r: number; g: number; b: number }

const clampByte = (value: number) => Math.max(0, Math.min(255, Math.round(value)))

const parseComputedRgb = (value: string): Rgb | null => {
  const match = value.match(/rgba?\(([^)]+)\)/i)
  if (!match) return null
  const [r, g, b] = match[1]
    .split(",")
    .slice(0, 3)
    .map((part) => Number.parseFloat(part.trim()))
  if (![r, g, b].every((channel) => Number.isFinite(channel))) return null
  return { r: clampByte(r), g: clampByte(g), b: clampByte(b) }
}

const rgbToCss = (color: Rgb) => `rgb(${clampByte(color.r)}, ${clampByte(color.g)}, ${clampByte(color.b)})`
const rgba = (color: Rgb, alpha: number) => `rgba(${clampByte(color.r)}, ${clampByte(color.g)}, ${clampByte(color.b)}, ${alpha})`

const mixRgb = (a: Rgb, b: Rgb, t: number): Rgb => ({
  r: clampByte(a.r + (b.r - a.r) * t),
  g: clampByte(a.g + (b.g - a.g) * t),
  b: clampByte(a.b + (b.b - a.b) * t),
})

const scaleRgb = (color: Rgb, multiplier: number): Rgb => ({
  r: clampByte(color.r * multiplier),
  g: clampByte(color.g * multiplier),
  b: clampByte(color.b * multiplier),
})

function toRgbFallback(value: string, fallback: Rgb): Rgb {
  const probe = new THREE.Color()
  try {
    probe.set(value)
    return {
      r: clampByte(probe.r * 255),
      g: clampByte(probe.g * 255),
      b: clampByte(probe.b * 255),
    }
  } catch {
    return fallback
  }
}

function resolveCssColorToRgb(value: string): Rgb | null {
  if (typeof document === "undefined" || !value) return null
  const probe = document.createElement("span")
  probe.style.position = "absolute"
  probe.style.opacity = "0"
  probe.style.pointerEvents = "none"
  probe.style.color = value
  document.body.appendChild(probe)
  const computed = getComputedStyle(probe).color
  document.body.removeChild(probe)
  return parseComputedRgb(computed)
}

function buildIntroPalette(theme: IntroTheme): IntroPalette {
  const fallback = INTRO_PALETTES[theme]
  if (typeof window === "undefined") return fallback

  const rootStyles = getComputedStyle(document.documentElement)

  const pick = (variable: string, fallbackColor: string) =>
    resolveCssColorToRgb(rootStyles.getPropertyValue(variable).trim()) ??
    toRgbFallback(fallbackColor, { r: 255, g: 255, b: 255 })

  const bg = pick("--background", fallback.sceneBg)
  const fg = pick("--foreground", fallback.logoTint)
  const primary = pick("--primary", fallback.keyLight)
  const accent = pick("--accent", fallback.diskGlow)
  const card = pick("--card", fallback.diskMid)
  const border = pick("--border", fallback.starFar)
  const muted = pick("--muted", fallback.diskDeep)
  const deepShadow: Rgb = { r: 4, g: 4, b: 6 }

  const sceneBg = mixRgb(bg, deepShadow, 0.58)
  const diskMid = mixRgb(primary, card, 0.38)
  const diskGlow = mixRgb(accent, fg, 0.26)
  const starNear = mixRgb(fg, accent, 0.18)
  const starFar = mixRgb(primary, muted, 0.64)

  return {
    sceneBg: rgbToCss(sceneBg),
    fog: rgbToCss(mixRgb(sceneBg, deepShadow, 0.46)),
    starFar: rgbToCss(starFar),
    starNear: rgbToCss(starNear),
    ember: rgbToCss(mixRgb(accent, primary, 0.52)),
    keyLight: rgbToCss(mixRgb(fg, primary, 0.4)),
    fillLight: rgbToCss(mixRgb(accent, primary, 0.42)),
    rimLight: rgbToCss(mixRgb(fg, accent, 0.28)),
    diskDeep: rgbToCss(mixRgb(sceneBg, deepShadow, 0.42)),
    diskMid: rgbToCss(diskMid),
    diskGlow: rgbToCss(diskGlow),
    leftPlanet: {
      color: rgbToCss(mixRgb(primary, bg, 0.66)),
      emissive: rgbToCss(scaleRgb(mixRgb(primary, bg, 0.72), 0.55)),
      atmosphere: rgbToCss(mixRgb(accent, fg, 0.42)),
    },
    rightPlanet: {
      color: rgbToCss(mixRgb(accent, bg, 0.64)),
      emissive: rgbToCss(scaleRgb(mixRgb(accent, bg, 0.74), 0.52)),
      atmosphere: rgbToCss(mixRgb(primary, fg, 0.5)),
    },
    logoTint: rgbToCss(mixRgb(fg, accent, 0.12)),
    buttonBorder: rgba(mixRgb(border, fg, 0.35), 0.76),
    buttonText: rgbToCss(mixRgb(fg, accent, 0.08)),
    buttonBg: rgba(mixRgb(bg, deepShadow, 0.45), 0.84),
    buttonGlow: rgba(mixRgb(accent, primary, 0.5), 0.4),
  }
}

function getStoredIntroTheme(): IntroTheme {
  try {
    const raw = localStorage.getItem("1key-settings")
    if (!raw) return "midnight"
    const parsed = JSON.parse(raw) as { colorTheme?: unknown } | null
    if (parsed && typeof parsed.colorTheme === "string" && INTRO_THEMES.includes(parsed.colorTheme as IntroTheme)) {
      return parsed.colorTheme as IntroTheme
    }
  } catch {
  }
  return "midnight"
}

const DISK_VERTEX = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const DISK_FRAGMENT = `
  uniform float uTime;
  uniform float uPulse;
  uniform vec3 uDeep;
  uniform vec3 uMid;
  uniform vec3 uGlow;
  varying vec2 vUv;

  void main() {
    vec2 uv = vUv;
    vec2 c = uv - 0.5;
    float rot = uTime * 0.07;
    float cs = cos(rot);
    float sn = sin(rot);
    c = mat2(cs, -sn, sn, cs) * c;
    uv = c + 0.5;
    float t = uTime * 0.16;

    float layerA = sin((uv.x * 9.2) + (uv.y * 5.4) + t);
    float layerB = sin((uv.x * 4.8) - (uv.y * 8.0) - (t * 1.4));
    float layerC = sin((uv.x * 14.0) + (uv.y * 2.7) + (t * 0.8));
    float field = (layerA * 0.45) + (layerB * 0.35) + (layerC * 0.2);

    float bands = sin((uv.y * 18.0) + (t * 2.0) + (sin(uv.x * 11.0) * 1.4)) * 0.5 + 0.5;
    float cloud = smoothstep(-0.65, 0.85, field);
    float horizon = smoothstep(1.0, 0.12, uv.y);
    float glow = cloud * horizon * (0.32 + (bands * 0.38));
    glow *= 0.5 + (uPulse * 0.3);

    vec3 color = mix(uDeep, uMid, cloud * 0.72);
    color = mix(color, uGlow, glow * 0.5);

    float alpha = (cloud * 0.2) + (glow * 0.34);
    gl_FragColor = vec4(color, alpha);
  }
`

function makeLogoCanvas(palette: IntroPalette): HTMLCanvasElement {
  const canvas = document.createElement("canvas")
  canvas.width = 1536
  canvas.height = 576
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Canvas 2D context unavailable")

  ctx.clearRect(0, 0, canvas.width, canvas.height)

  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
  gradient.addColorStop(0, palette.logoTint)
  gradient.addColorStop(0.55, palette.diskGlow)
  gradient.addColorStop(1, palette.diskMid)

  ctx.font = "900 360px Orbitron, Geist, sans-serif"
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.shadowColor = palette.buttonGlow
  ctx.shadowBlur = 16
  ctx.fillStyle = gradient
  ctx.fillText("1KEY", canvas.width * 0.5, canvas.height * 0.56)

  return canvas
}

function makeLogoTexture(canvas: HTMLCanvasElement): THREE.CanvasTexture {
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.minFilter = THREE.LinearMipmapLinearFilter
  texture.magFilter = THREE.LinearFilter
  texture.generateMipmaps = true
  return texture
}

function createStarfield(
  count: number,
  radius: number,
  color: THREE.ColorRepresentation,
  size: number,
  opacity: number
): THREE.Points<THREE.BufferGeometry, THREE.PointsMaterial> {
  const positions = new Float32Array(count * 3)
  for (let i = 0; i < count; i += 1) {
    const i3 = i * 3
    const r = radius * Math.pow(Math.random(), 0.42)
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(THREE.MathUtils.randFloatSpread(2))

    positions[i3] = r * Math.sin(phi) * Math.cos(theta)
    positions[i3 + 1] = r * Math.cos(phi) * 0.72
    positions[i3 + 2] = r * Math.sin(phi) * Math.sin(theta)
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3))

  const material = new THREE.PointsMaterial({
    color: new THREE.Color(color),
    size,
    transparent: true,
    opacity,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
  })

  return new THREE.Points<THREE.BufferGeometry, THREE.PointsMaterial>(geometry, material)
}

function createPlanet(
  radius: number,
  color: string,
  emissive: string,
  atmosphere: string,
  atmosphereOpacity: number
) {
  const group = new THREE.Group()

  const planet = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 40, 40),
    new THREE.MeshStandardMaterial({
      color: new THREE.Color(color),
      emissive: new THREE.Color(emissive),
      emissiveIntensity: 0.05,
      roughness: 0.88,
      metalness: 0.06,
    })
  )

  const atmosphereMesh = new THREE.Mesh(
    new THREE.SphereGeometry(radius * 1.08, 40, 40),
    new THREE.MeshBasicMaterial({
      color: new THREE.Color(atmosphere),
      transparent: true,
      opacity: atmosphereOpacity,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
    })
  )

  group.add(planet, atmosphereMesh)
  return { group, planet }
}

function createWarpField(
  count: number,
  spreadX: number,
  spreadY: number,
  zNear: number,
  zFar: number,
  color: THREE.ColorRepresentation,
): WarpFieldRig {
  const positions = new Float32Array(count * 3)
  for (let i = 0; i < count; i += 1) {
    const i3 = i * 3
    positions[i3] = THREE.MathUtils.randFloatSpread(spreadX * 2)
    positions[i3 + 1] = THREE.MathUtils.randFloatSpread(spreadY * 2)
    positions[i3 + 2] = THREE.MathUtils.randFloat(zFar, zNear)
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3))

  const material = new THREE.PointsMaterial({
    color: new THREE.Color(color),
    size: 0.018,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
  })

  const points = new THREE.Points<THREE.BufferGeometry, THREE.PointsMaterial>(geometry, material)
  return { points, positions, zNear, zFar, spreadX, spreadY }
}

function createMonolithRig(palette: IntroPalette): MonolithRig {
  const group = new THREE.Group()

  const coreMaterial = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(palette.logoTint),
    emissive: new THREE.Color(palette.diskGlow),
    emissiveIntensity: 0.015,
    metalness: 1,
    roughness: 0.16,
    clearcoat: 0.88,
    clearcoatRoughness: 0.1,
    transparent: true,
    opacity: 1,
  })

  const shellMaterial = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(palette.diskMid),
    emissive: new THREE.Color(palette.diskDeep),
    emissiveIntensity: 0.08,
    metalness: 0.92,
    roughness: 0.22,
    transparent: true,
    opacity: 0.22,
  })

  const shardMaterial = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(palette.starNear),
    emissive: new THREE.Color(palette.diskMid),
    emissiveIntensity: 0.06,
    metalness: 1,
    roughness: 0.22,
    transparent: true,
    opacity: 0.88,
  })

  const coreMesh = new THREE.Mesh(new THREE.SphereGeometry(0.68, 52, 52), coreMaterial)
  coreMesh.rotation.y = Math.PI * 0.25
  coreMesh.rotation.x = Math.PI * 0.1

  const shellMesh = new THREE.Mesh(new THREE.SphereGeometry(0.9, 40, 40), shellMaterial)

  const shards: THREE.Mesh[] = []

  group.add(coreMesh, shellMesh)
  group.position.set(0, -0.02, 0)
  group.scale.setScalar(0.001)

  const auraLight = new THREE.PointLight(palette.fillLight, 0, 7, 2)
  auraLight.position.set(0, 0, 0)
  group.add(auraLight)

  return {
    group,
    coreMesh,
    shellMesh,
    coreMaterial,
    shellMaterial,
    shardMaterial,
    shards,
    auraLight,
  }
}

function createLogoParticleRig(count: number, canvas: HTMLCanvasElement, color: string): LogoParticleRig {
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Canvas 2D context unavailable")
  const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data

  const starts = new Float32Array(count * 3)
  const burstDir = new Float32Array(count * 3)
  const burstMag = new Float32Array(count)
  const targets = new Float32Array(count * 3)
  const positions = new Float32Array(count * 3)

  const alphaAt = (x: number, y: number) => pixels[(y * canvas.width + x) * 4 + 3]

  for (let i = 0; i < count; i += 1) {
    const i3 = i * 3
    let px = Math.floor(Math.random() * canvas.width)
    let py = Math.floor(Math.random() * canvas.height)

    for (let attempt = 0; attempt < 1200; attempt += 1) {
      const tx = Math.floor(Math.random() * canvas.width)
      const ty = Math.floor(Math.random() * canvas.height)
      if (alphaAt(tx, ty) > 45) {
        px = tx
        py = ty
        break
      }
    }

    const txNorm = (px / canvas.width) - 0.5
    const tyNorm = (py / canvas.height) - 0.5
    targets[i3] = txNorm * 8.9
    targets[i3 + 1] = -(tyNorm * 3.22)
    targets[i3 + 2] = THREE.MathUtils.randFloat(-0.16, 0.16)

    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(THREE.MathUtils.randFloatSpread(2))
    const r = THREE.MathUtils.randFloat(0.52, 0.82)
    starts[i3] = r * Math.sin(phi) * Math.cos(theta)
    starts[i3 + 1] = r * Math.cos(phi)
    starts[i3 + 2] = r * Math.sin(phi) * Math.sin(theta)

    const dir = new THREE.Vector3(
      THREE.MathUtils.randFloatSpread(2),
      THREE.MathUtils.randFloatSpread(2),
      THREE.MathUtils.randFloatSpread(2)
    ).normalize()

    burstDir[i3] = dir.x
    burstDir[i3 + 1] = dir.y
    burstDir[i3 + 2] = dir.z
    burstMag[i] = THREE.MathUtils.randFloat(4.8, 10.5)

    positions[i3] = starts[i3]
    positions[i3 + 1] = starts[i3 + 1]
    positions[i3 + 2] = starts[i3 + 2]
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3))

  const material = new THREE.PointsMaterial({
    color: new THREE.Color(color),
    size: 0.04,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
  })

  const points = new THREE.Points<THREE.BufferGeometry, THREE.PointsMaterial>(geometry, material)
  points.position.set(0, -0.1, 0.18)

  return { points, starts, burstDir, burstMag, targets, positions }
}

function updateLogoParticles(logo: LogoParticleRig, time: number, explosion: number, formProgress: number) {
  const burstT = THREE.MathUtils.clamp(explosion, 0, 1)
  const burstEased = 1 - Math.pow(1 - burstT, 3)
  const formT = THREE.MathUtils.clamp(formProgress, 0, 1)
  const formEased = formT * formT * (3 - 2 * formT)
  const count = logo.positions.length / 3

  for (let i = 0; i < count; i += 1) {
    const i3 = i * 3
    const bx = logo.starts[i3] + (logo.burstDir[i3] * logo.burstMag[i] * burstEased)
    const by = logo.starts[i3 + 1] + (logo.burstDir[i3 + 1] * logo.burstMag[i] * burstEased)
    const bz = logo.starts[i3 + 2] + (logo.burstDir[i3 + 2] * logo.burstMag[i] * burstEased)

    const turbulence = (1 - formEased) * (0.08 + (burstEased * 0.16))
    const wobbleX = Math.sin((time * 2.3) + i * 0.013) * turbulence
    const wobbleY = Math.cos((time * 2.0) + i * 0.011) * turbulence
    const wobbleZ = Math.sin((time * 1.7) + i * 0.017) * (turbulence * 0.46)
    const residualAmp = 0.002 + (formEased * 0.014)
    const residualX = Math.sin((time * 1.3) + i * 0.021) * residualAmp
    const residualY = Math.cos((time * 1.15) + i * 0.019) * residualAmp
    const residualZ = Math.sin((time * 1.05) + i * 0.017) * (residualAmp * 0.8)

    logo.positions[i3] = THREE.MathUtils.lerp(bx, logo.targets[i3], formEased) + wobbleX + residualX
    logo.positions[i3 + 1] = THREE.MathUtils.lerp(by, logo.targets[i3 + 1], formEased) + wobbleY + residualY
    logo.positions[i3 + 2] = THREE.MathUtils.lerp(bz, logo.targets[i3 + 2], formEased) + wobbleZ + residualZ
  }

  const attr = logo.points.geometry.getAttribute("position") as THREE.BufferAttribute
  attr.needsUpdate = true
}

function disposeMaterial(material: THREE.Material | THREE.Material[]) {
  if (Array.isArray(material)) {
    for (const m of material) {
      const withMap = m as THREE.Material & { map?: THREE.Texture | null }
      if (withMap.map) withMap.map.dispose()
      m.dispose()
    }
    return
  }

  const withMap = material as THREE.Material & { map?: THREE.Texture | null }
  if (withMap.map) withMap.map.dispose()
  material.dispose()
}

function disposeObject(root: THREE.Object3D) {
  root.traverse((child) => {
    const node = child as THREE.Object3D & {
      geometry?: THREE.BufferGeometry
      material?: THREE.Material | THREE.Material[]
    }
    if (node.geometry) node.geometry.dispose()
    if (node.material) disposeMaterial(node.material)
  })
}

export default function CinematicIntro({
  onComplete,
  autoAdvance = false,
  durationSec = 5.9,
}: CinematicIntroProps) {
  const mountRef = useRef<HTMLDivElement | null>(null)
  const enterButtonRef = useRef<HTMLButtonElement | null>(null)
  const rafRef = useRef<number | null>(null)
  const completedRef = useRef(false)
  const [showEnter, setShowEnter] = useState(false)
  const [introPalette, setIntroPalette] = useState<IntroPalette>(() => {
    if (typeof window === "undefined") return INTRO_PALETTES.midnight
    const initialTheme = getStoredIntroTheme()
    return buildIntroPalette(initialTheme)
  })
  const refreshIntroPalette = useCallback(() => {
    const theme = getStoredIntroTheme()
    setIntroPalette(buildIntroPalette(theme))
  }, [])

  const complete = useCallback(() => {
    if (completedRef.current) return
    completedRef.current = true
    onComplete?.()
  }, [onComplete])

  useEffect(() => {
    refreshIntroPalette()
    const rafId = window.requestAnimationFrame(refreshIntroPalette)
    const timeoutId = window.setTimeout(refreshIntroPalette, 80)

    const observer = new MutationObserver(() => {
      refreshIntroPalette()
    })
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "style"],
    })

    const onStorage = () => {
      refreshIntroPalette()
    }
    window.addEventListener("storage", onStorage)

    return () => {
      window.cancelAnimationFrame(rafId)
      window.clearTimeout(timeoutId)
      observer.disconnect()
      window.removeEventListener("storage", onStorage)
    }
  }, [refreshIntroPalette])

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return
    completedRef.current = false
    setShowEnter(false)

    const activeTheme = getStoredIntroTheme()
    const palette = buildIntroPalette(activeTheme)
    setIntroPalette(palette)

    if (typeof window.WebGLRenderingContext === "undefined") {
      setShowEnter(true)
      return
    }

    const width = Math.max(1, mount.clientWidth || window.innerWidth || 1)
    const height = Math.max(1, mount.clientHeight || window.innerHeight || 1)

    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" })
    } catch {
      setShowEnter(true)
      return
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    renderer.setSize(width, height)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 0.74
    mount.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(palette.sceneBg)
    scene.fog = new THREE.FogExp2(palette.fog, 0.018)

    const camera = new THREE.PerspectiveCamera(46, width / height, 0.1, 220)
    camera.position.set(0, 0.12, 13.5)
    scene.add(camera)

    const composer = new EffectComposer(renderer)
    composer.addPass(new RenderPass(scene, camera))
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(width, height), 0.34, 0.34, 0.42)
    composer.addPass(bloomPass)

    const hemi = new THREE.HemisphereLight(palette.keyLight, palette.sceneBg, 0.62)
    const keyLight = new THREE.DirectionalLight(palette.keyLight, 0.9)
    keyLight.position.set(4.2, 5.8, 6.4)
    const fill = new THREE.PointLight(palette.fillLight, 0.62, 28, 2)
    fill.position.set(-3.8, 1.6, 3.9)
    const rim = new THREE.PointLight(palette.rimLight, 0.72, 30, 2)
    rim.position.set(0, 0.7, -4.4)
    scene.add(hemi, keyLight, fill, rim)

    const starsFar = createStarfield(12000, 140, palette.starFar, 0.038, 0.45)
    const starsNear = createStarfield(4200, 70, palette.starNear, 0.048, 0.0)
    const embers = createStarfield(1800, 10, palette.ember, 0.028, 0.0)
    scene.add(starsFar, starsNear, embers)

    const diskUniforms = {
      uTime: { value: 0 },
      uPulse: { value: 0.14 },
      uDeep: { value: new THREE.Color(palette.diskDeep) },
      uMid: { value: new THREE.Color(palette.diskMid) },
      uGlow: { value: new THREE.Color(palette.diskGlow) },
    }
    const diskMaterial = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
      uniforms: diskUniforms,
      vertexShader: DISK_VERTEX,
      fragmentShader: DISK_FRAGMENT,
    })
    const disk = new THREE.Mesh(new THREE.PlaneGeometry(180, 110), diskMaterial)
    disk.position.set(0, 0.0, -72)
    scene.add(disk)

    const planetFarLeft = createPlanet(
      8.7,
      palette.leftPlanet.color,
      palette.leftPlanet.emissive,
      palette.leftPlanet.atmosphere,
      0.12,
    )
    planetFarLeft.group.position.set(-30, 16, -118)
    scene.add(planetFarLeft.group)

    const planetFarRight = createPlanet(
      5.1,
      palette.rightPlanet.color,
      palette.rightPlanet.emissive,
      palette.rightPlanet.atmosphere,
      0.11,
    )
    planetFarRight.group.position.set(24, -10, -90)
    scene.add(planetFarRight.group)

    const warpField = createWarpField(1600, 28, 16, -24, -170, palette.starFar)
    scene.add(warpField.points)
    const warpFieldNear = createWarpField(1100, 16, 9, -10, -95, palette.starNear)
    warpFieldNear.points.material.size = 0.026
    warpFieldNear.points.material.opacity = 0
    scene.add(warpFieldNear.points)

    const monolith = createMonolithRig(palette)
    scene.add(monolith.group)

    const logoCanvas = makeLogoCanvas(palette)
    const logoTexture = makeLogoTexture(logoCanvas)
    const logoPlaneMaterial = new THREE.MeshBasicMaterial({
      map: logoTexture,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.NormalBlending,
      color: new THREE.Color(palette.logoTint),
    })
    const logoPlane = new THREE.Mesh(new THREE.PlaneGeometry(9.2, 3.35), logoPlaneMaterial)
    logoPlane.position.set(0, -0.1, 0.32)
    logoPlane.scale.setScalar(0.14)
    logoPlane.visible = false
    scene.add(logoPlane)

    const logoParticles = createLogoParticleRig(2800, logoCanvas, palette.diskGlow)
    scene.add(logoParticles.points)

    const state = {
      diskPulse: 0.14,
      nearStarOpacity: 0,
      monolithGlow: 0,
      explosion: 0,
      flash: 0,
      travel: 0,
      logoProgress: 0,
      logoParticleOpacity: 0,
      logoPlaneOpacity: 0,
    }

    const timeline = gsap.timeline({ defaults: { ease: "power2.inOut" } })

    timeline
      .to(state, { nearStarOpacity: 0.52, diskPulse: 0.44, duration: 1.1 }, 0)
      .to(embers.material, { opacity: 0.16, duration: 1.0, ease: "sine.inOut" }, 0)
      .to(camera.position, { x: 0.1, y: 0.08, duration: 1.35, ease: "sine.inOut" }, 0)

      .to(monolith.group.scale, { x: 1.08, y: 1.08, z: 1.08, duration: 1.4, ease: "expo.out" }, 0.25)
      .to(monolith.group.rotation, { y: 1.1, x: -0.08, duration: 1.45, ease: "sine.out" }, 0.35)
      .to(state, { monolithGlow: 0.94, duration: 1.2 }, 0.52)
      .to(state, { monolithGlow: 1.08, duration: 0.12, ease: "sine.inOut", yoyo: true, repeat: 1 }, 1.56)
      .to(
        monolith.group.position,
        {
          keyframes: [
            { x: -0.05, y: -0.016, duration: 0.045 },
            { x: 0.06, y: -0.025, duration: 0.045 },
            { x: -0.045, y: -0.017, duration: 0.045 },
            { x: 0.055, y: -0.024, duration: 0.045 },
            { x: 0, y: -0.02, duration: 0.055 },
          ],
          ease: "power1.inOut",
        },
        1.54
      )
      .to(
        monolith.group.rotation,
        {
          x: -0.13,
          z: 0.03,
          duration: 0.11,
          yoyo: true,
          repeat: 1,
          ease: "sine.inOut",
        },
        1.56
      )

      .to(state, { explosion: 1, duration: 0.88, ease: "power4.out" }, 1.8)
      .to(state, { flash: 1, duration: 0.08, ease: "power3.out" }, 1.8)
      .to(state, { flash: 0, duration: 0.45, ease: "power2.out" }, 1.88)
      .to(monolith.group.scale, { x: 1.55, y: 1.55, z: 1.55, duration: 0.2, ease: "power2.out" }, 1.8)
      .to(monolith.group.scale, { x: 0.001, y: 0.001, z: 0.001, duration: 0.36, ease: "power3.in" }, 2.02)
      .to(state, { monolithGlow: 0.0, duration: 0.6 }, 1.98)
      .to(state, { logoParticleOpacity: 1, duration: 0.12, ease: "power2.out" }, 1.82)
      .to(state, { logoParticleOpacity: 0.8, duration: 1.45, ease: "power2.out" }, 2.06)

      .add(() => {
        logoPlane.visible = true
      }, 2.18)
      .add(() => {
        monolith.group.visible = false
      }, 2.24)
      .to(state, { logoProgress: 1, logoPlaneOpacity: 0.78, duration: 2.45, ease: "power2.out" }, 2.15)
      .to(state, { logoParticleOpacity: 0.56, duration: 2.1, ease: "sine.out" }, 2.3)
      .to(logoPlane.scale, { x: 1, y: 1, z: 1, duration: 2.35, ease: "expo.out" }, 2.2)
      .to(embers.material, { opacity: 0.31, duration: 0.7, ease: "sine.out" }, 1.85)
      .to(embers.material, { opacity: 0.08, duration: 2.4, ease: "sine.inOut" }, 2.5)
      .to(camera.position, { x: -0.03, z: 16.95, y: -0.01, duration: 2.6, ease: "power2.inOut" }, 2.22)
      .to(state, { diskPulse: 0.2, duration: 2.45, ease: "sine.out" }, 2.3)
      .to(state, { logoParticleOpacity: 0.92, duration: 0.24, ease: "sine.out" }, 4.45)
      .to(state, { logoParticleOpacity: 0.66, duration: 0.7, ease: "sine.out" }, 4.69)
      .to(state, { travel: 1.45, nearStarOpacity: 0.84, duration: 1.25, ease: "power2.out" }, 4.74)
      .to(state, { travel: 1.2, duration: 2.2, ease: "sine.inOut" }, 6.05)
      .to(camera.position, { z: 17.45, duration: 1.7, ease: "sine.inOut" }, 4.86)
      .call(() => {
        setShowEnter(true)
      }, [], 4.78)

    if (autoAdvance && durationSec > 0) {
      timeline.call(() => complete(), [], durationSec)
    }

    const clock = new THREE.Clock()

    const animate = () => {
      rafRef.current = window.requestAnimationFrame(animate)

      const elapsed = clock.getElapsedTime()
      const delta = Math.min(clock.getDelta(), 0.05)

      starsFar.rotation.y += delta * (0.004 + (state.travel * 0.019))
      starsFar.rotation.x += delta * (0.0007 + (state.travel * 0.004))
      starsNear.rotation.y -= delta * (0.006 + (state.travel * 0.043))
      starsNear.rotation.x += delta * (0.0009 + (state.travel * 0.007))
      embers.rotation.y += delta * 0.075
      embers.rotation.x += delta * 0.024
      embers.position.y = -0.06 + (Math.sin(elapsed * 0.6) * 0.03)
      starsNear.material.opacity = state.nearStarOpacity

      planetFarLeft.planet.rotation.y += delta * 0.012
      planetFarLeft.group.position.y = 16 + (Math.sin(elapsed * 0.12) * 0.42)
      planetFarLeft.group.position.x = -30 + (Math.sin(elapsed * 0.18) * 0.55 * state.travel)
      planetFarLeft.group.position.z = -118 + (Math.cos(elapsed * 0.16) * 2.2 * state.travel)
      planetFarRight.planet.rotation.y -= delta * 0.02
      planetFarRight.group.position.y = -10 + (Math.cos(elapsed * 0.15) * 0.36)
      planetFarRight.group.position.x = 24 + (Math.cos(elapsed * 0.21) * 0.44 * state.travel)
      planetFarRight.group.position.z = -90 + (Math.sin(elapsed * 0.17) * 1.8 * state.travel)

      const updateWarpField = (
        field: WarpFieldRig,
        speedScale: number,
        driftXScale: number,
        driftYScale: number,
        baseOpacity: number,
        opacityScale: number,
        baseSize: number,
        sizeScale: number
      ) => {
        const travelSpeed = state.travel * speedScale
        field.points.material.opacity = baseOpacity + (state.travel * opacityScale)
        field.points.material.size = baseSize + (state.travel * sizeScale)
        if (travelSpeed <= 0.001) return

        const positions = field.positions
        const count = positions.length / 3
        for (let i = 0; i < count; i += 1) {
          const i3 = i * 3
          const laneJitter = 1 + (Math.sin((elapsed * 0.8) + (i * 0.017)) * 0.24)
          positions[i3 + 2] += delta * travelSpeed * laneJitter
          const depth = THREE.MathUtils.clamp((positions[i3 + 2] - field.zFar) / (field.zNear - field.zFar), 0, 1)
          const depthBoost = 0.38 + (depth * 0.96)
          positions[i3] += Math.sin((elapsed * 0.22) + (i * 0.1)) * delta * state.travel * driftXScale * depthBoost
          positions[i3 + 1] += Math.cos((elapsed * 0.18) + (i * 0.08)) * delta * state.travel * driftYScale * depthBoost

          if (positions[i3 + 2] > field.zNear) {
            positions[i3] = THREE.MathUtils.randFloatSpread(field.spreadX * 2)
            positions[i3 + 1] = THREE.MathUtils.randFloatSpread(field.spreadY * 2)
            positions[i3 + 2] = field.zFar
          }
        }

        const warpAttr = field.points.geometry.getAttribute("position") as THREE.BufferAttribute
        warpAttr.needsUpdate = true
      }

      updateWarpField(warpField, 84, 0.9, 0.58, 0.02, 0.56, 0.018, 0.062)
      updateWarpField(warpFieldNear, 148, 1.45, 1.0, 0.0, 0.46, 0.026, 0.11)

      const prevSwayX = (camera.userData.__swayX as number | undefined) ?? 0
      const prevSwayY = (camera.userData.__swayY as number | undefined) ?? 0
      const prevSwayZ = (camera.userData.__swayZ as number | undefined) ?? 0
      const prevRoll = (camera.userData.__swayRoll as number | undefined) ?? 0
      const swayX = (Math.sin(elapsed * 0.42) * 0.06 + Math.sin(elapsed * 1.02) * 0.045) * state.travel
      const swayY = (Math.cos(elapsed * 0.38) * 0.04 + Math.sin(elapsed * 0.74) * 0.03) * state.travel
      const swayZ = Math.sin(elapsed * 0.34) * (0.11 * state.travel)
      const roll = Math.sin(elapsed * 0.48) * (0.02 * state.travel)
      camera.position.x += swayX - prevSwayX
      camera.position.y += swayY - prevSwayY
      camera.position.z += swayZ - prevSwayZ
      camera.rotation.z += roll - prevRoll
      camera.userData.__swayX = swayX
      camera.userData.__swayY = swayY
      camera.userData.__swayZ = swayZ
      camera.userData.__swayRoll = roll

      diskUniforms.uTime.value = elapsed
      diskUniforms.uPulse.value = state.diskPulse + state.flash + (Math.sin(elapsed * 1.8) * 0.08)
      disk.position.x = (Math.sin(elapsed * 0.12) * 0.85) + (Math.sin(elapsed * 0.9) * state.travel * 0.4)
      disk.position.y = (Math.cos(elapsed * 0.08) * 0.55) + (Math.cos(elapsed * 0.7) * state.travel * 0.26)
      disk.rotation.z += delta * (0.018 + (state.travel * 0.06))

      monolith.coreMesh.rotation.y += delta * (0.34 + (state.monolithGlow * 0.5))
      monolith.coreMesh.rotation.x += delta * 0.12
      monolith.shellMesh.rotation.y -= delta * 0.22
      monolith.shellMesh.rotation.x += delta * 0.08

      monolith.coreMaterial.emissiveIntensity = 0.012 + (state.monolithGlow * 0.09)
      monolith.coreMaterial.opacity = THREE.MathUtils.clamp(1 - (state.explosion * 1.3), 0, 1)
      monolith.shellMaterial.emissiveIntensity = 0.05 + (state.monolithGlow * 0.11)
      monolith.shellMaterial.opacity = THREE.MathUtils.clamp((0.17 + (state.monolithGlow * 0.2)) * (1 - (state.explosion * 1.2)), 0, 1)
      monolith.shardMaterial.opacity = 0
      monolith.auraLight.intensity = 0.02 + (state.monolithGlow * 1.2)

      logoParticles.points.material.opacity = state.logoParticleOpacity
      logoPlaneMaterial.opacity = state.logoPlaneOpacity * (0.92 + (Math.sin(elapsed * 1.55) * 0.06))
      if (state.logoProgress > 0.985) {
        logoPlane.position.x = Math.sin(elapsed * 0.82) * 0.04
        logoPlane.position.y = -0.1 + (Math.cos(elapsed * 1.06) * 0.028)
        logoPlane.rotation.z = (Math.sin(elapsed * 0.76) * 0.013) + (Math.sin(elapsed * 1.93) * 0.004)
        logoPlane.scale.setScalar(1 + (Math.sin(elapsed * 1.24) * 0.012))
      } else {
        logoPlane.position.x = 0
        logoPlane.position.y = -0.1
        logoPlane.rotation.z = 0
      }
      updateLogoParticles(logoParticles, elapsed, state.explosion, state.logoProgress)

      fill.intensity = 0.56 + (Math.sin(elapsed * 1.5) * 0.05) + (state.flash * 0.95)
      rim.intensity = 0.64 + (Math.cos(elapsed * 1.2) * 0.06) + (state.flash * 0.88)
      bloomPass.strength = 0.3 + (state.logoProgress * 0.11) + (state.flash * 0.68) + (state.travel * 0.08)

      composer.render()
    }

    animate()

    const onResize = () => {
      const width = Math.max(1, mount.clientWidth || window.innerWidth || 1)
      const height = Math.max(1, mount.clientHeight || window.innerHeight || 1)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.setSize(width, height)
      composer.setSize(width, height)
      bloomPass.setSize(width, height)
    }

    window.addEventListener("resize", onResize)

    return () => {
      window.removeEventListener("resize", onResize)
      timeline.kill()

      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current)
      }

      disposeObject(starsFar)
      disposeObject(starsNear)
      disposeObject(embers)
      disposeObject(disk)
      disposeObject(warpField.points)
      disposeObject(warpFieldNear.points)
      disposeObject(planetFarLeft.group)
      disposeObject(planetFarRight.group)
      disposeObject(monolith.group)
      disposeObject(logoPlane)
      disposeObject(logoParticles.points)
      logoTexture.dispose()

      composer.dispose()
      renderer.dispose()

      if (renderer.domElement.parentElement === mount) {
        mount.removeChild(renderer.domElement)
      }
    }
  }, [autoAdvance, complete, durationSec])

  useEffect(() => {
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        completedRef.current = false
      }
    }

    window.addEventListener("pageshow", onPageShow)
    return () => {
      window.removeEventListener("pageshow", onPageShow)
    }
  }, [])

  useEffect(() => {
    const button = enterButtonRef.current
    if (!button) return

    gsap.killTweensOf(button)
    if (showEnter) {
      gsap.fromTo(
        button,
        { autoAlpha: 0, y: 18, scale: 0.86, filter: "blur(6px)" },
        { autoAlpha: 1, y: 0, scale: 1, filter: "blur(0px)", duration: 0.75, ease: "power3.out" }
      )
      return
    }

    gsap.set(button, { autoAlpha: 0, y: 18, scale: 0.86, filter: "blur(6px)" })
  }, [showEnter])

  useEffect(() => {
    if (!showEnter) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault()
        complete()
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => {
      window.removeEventListener("keydown", onKeyDown)
    }
  }, [showEnter, complete])

  return (
    <div
      className="relative h-screen w-full overflow-hidden"
      style={{ backgroundColor: introPalette.sceneBg }}
    >
      <div ref={mountRef} className="absolute inset-0" />
      <div className="pointer-events-none absolute inset-0 flex items-end justify-center pb-14">
        <button
          ref={enterButtonRef}
          type="button"
          disabled={!showEnter}
          onClick={complete}
          className="rounded-full px-9 py-3 text-[13px] font-semibold tracking-[0.24em] ring-1 backdrop-blur-md transition-all duration-200 hover:-translate-y-[1px] active:translate-y-[1px]"
          onMouseEnter={(event) => {
            event.currentTarget.style.boxShadow = `0 0 36px ${introPalette.buttonGlow}, 0 0 72px ${introPalette.buttonGlow}`
          }}
          onMouseLeave={(event) => {
            event.currentTarget.style.boxShadow = `0 0 22px ${introPalette.buttonGlow}`
          }}
          onFocus={(event) => {
            event.currentTarget.style.boxShadow = `0 0 36px ${introPalette.buttonGlow}, 0 0 72px ${introPalette.buttonGlow}`
          }}
          onBlur={(event) => {
            event.currentTarget.style.boxShadow = `0 0 22px ${introPalette.buttonGlow}`
          }}
          style={
            {
              pointerEvents: showEnter ? "auto" : "none",
              border: `1px solid ${introPalette.buttonBorder}`,
              color: introPalette.buttonText,
              background: introPalette.buttonBg,
              boxShadow: `0 0 22px ${introPalette.buttonGlow}`,
              opacity: showEnter ? undefined : 0,
              visibility: showEnter ? undefined : "hidden",
              transform: showEnter ? undefined : "translateY(18px) scale(0.86)",
              filter: showEnter ? undefined : "blur(6px)",
              ["--tw-ring-color" as const]: introPalette.buttonBorder,
            } as CSSProperties
          }
        >
          <span className="inline-block translate-x-[2px]">ENTER</span>
        </button>
      </div>
    </div>
  )
}
