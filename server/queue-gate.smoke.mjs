import { spawn } from "node:child_process"

const PORT = 4099
const BASE = `http://127.0.0.1:${PORT}`

const env = {
  ...process.env,
  PORT: String(PORT),
  PRESENCE_BACKEND: "memory",
  ACCESS_LOG_ENABLED: "0",
  MAX_ACTIVE: "2",
}

const child = spawn("node", ["server/queue-gate.js"], { env, stdio: ["ignore", "pipe", "pipe"] })
let startupLog = ""
child.stdout.on("data", (d) => (startupLog += d))
child.stderr.on("data", (d) => (startupLog += d))

const results = []
function check(name, pass, detail = "") {
  results.push({ name, pass, detail })
  console.log(`${pass ? "PASS" : "FAIL"}  ${name}${detail ? `  (${detail})` : ""}`)
}

async function post(path, body, raw = false) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: raw ? body : JSON.stringify(body),
  })
  let json = null
  try {
    json = await res.json()
  } catch {}
  return { status: res.status, json }
}

async function waitForBoot() {
  for (let i = 0; i < 50; i += 1) {
    try {
      const res = await fetch(`${BASE}/health`)
      if (res.ok) return true
    } catch {}
    await new Promise((r) => setTimeout(r, 100))
  }
  return false
}

try {
  if (!(await waitForBoot())) throw new Error(`server never booted:\n${startupLog}`)

  const victimDevice = "victim-device-aaaaaa"
  const victimWindow = "victim-window-aaaaaa"
  const join = await post("/join", { deviceId: victimDevice, windowId: victimWindow })
  check("join makes device active", join.json?.status === "active", `status=${join.json?.status}`)
  const victimToken = join.json?.token

  const attack = await post("/release", { deviceId: victimDevice, token: "bogus-token-value" })
  check("attacker with bogus token is rejected", attack.status === 403, `status=${attack.status}`)

  const afterAttack = await fetch(`${BASE}/status?deviceId=${victimDevice}&windowId=${victimWindow}`)
  const afterAttackJson = await afterAttack.json()
  check("victim session survives the attack", afterAttackJson.status === "active", `status=${afterAttackJson.status}`)

  const attack2 = await post("/release", { deviceId: victimDevice })
  check("attacker without windowId is rejected", attack2.status === 403, `status=${attack2.status}`)

  const legit = await post("/release", { deviceId: victimDevice, windowId: victimWindow, token: victimToken })
  check("owner can still release (token + windowId)", legit.status === 200, `status=${legit.status}`)

  const afterLegit = await fetch(`${BASE}/status?deviceId=${victimDevice}&windowId=${victimWindow}`)
  const afterLegitJson = await afterLegit.json()
  check("session actually released", afterLegitJson.status === "idle", `status=${afterLegitJson.status}`)

  await post("/join", { deviceId: "dev-a-aaaaaa", windowId: "win-a-aaaaaa" })
  await post("/join", { deviceId: "dev-b-bbbbbb", windowId: "win-b-bbbbbb" })
  const queuedJoin = await post("/join", { deviceId: "dev-c-cccccc", windowId: "win-c-cccccc" })
  check("third device is queued (MAX_ACTIVE=2)", queuedJoin.json?.status === "queued", `status=${queuedJoin.json?.status}`)
  const queuedRelease = await post("/release", { deviceId: "dev-c-cccccc", windowId: "win-c-cccccc" })
  check("queued client can release with windowId only", queuedRelease.status === 200, `status=${queuedRelease.status}`)

  const reloadDevice = "reload-device-aaaa"
  const firstJoin = await post("/join", { deviceId: reloadDevice, windowId: "reload-window-one" })
  check("device joins from first window", firstJoin.json?.status === "queued" || firstJoin.json?.status === "active", `status=${firstJoin.json?.status}`)

  const afterReload = await post("/join", { deviceId: reloadDevice, windowId: "reload-window-two" })
  check(
    "reload while queued is not locked out",
    afterReload.json?.status !== "locked_window",
    `status=${afterReload.json?.status}`,
  )

  const reloadStatus = await fetch(`${BASE}/status?deviceId=${reloadDevice}&windowId=reload-window-two`)
  const reloadStatusJson = await reloadStatus.json()
  check(
    "reloaded window owns the entry",
    reloadStatusJson.status !== "locked_window",
    `status=${reloadStatusJson.status}`,
  )

  await post("/release", { deviceId: reloadDevice, windowId: "reload-window-two" })

  await post("/join", { deviceId: "dev-d-dddddd", windowId: "win-d-dddddd" })
  const bypass = await post("/join", { deviceId: "bypass-device-x", windowId: "bypass-window-x", adminCode: "1key" })
  check("hardcoded backdoor no longer activates", bypass.json?.status !== "active", `status=${bypass.json?.status}`)

  const anyDomain = await fetch(`${BASE}/caddy/ask?domain=some-new-mirror.example.org`)
  check("caddy/ask approves any valid domain (by design)", anyDomain.status === 200, `status=${anyDomain.status}`)

  const good = await fetch(`${BASE}/caddy/ask?domain=1key.lol`)
  check("caddy/ask approves the primary domain", good.status === 200, `status=${good.status}`)

  const sub = await fetch(`${BASE}/caddy/ask?domain=eu.mirror.example.com`)
  check("caddy/ask approves subdomains", sub.status === 200, `status=${sub.status}`)

  const malformed = await fetch(`${BASE}/caddy/ask?domain=not-a-domain`)
  check("caddy/ask still 400s malformed input", malformed.status === 400, `status=${malformed.status}`)

  const badJson = await post("/join", "{not json", true)
  check("malformed JSON returns 400 (was 500)", badJson.status === 400, `status=${badJson.status}`)

  const nullBody = await post("/join", "null", true)
  check("JSON null body returns 400 (was a 500 crash)", nullBody.status === 400, `status=${nullBody.status}`)

  const arrayBody = await post("/join", "[]", true)
  check("JSON array body returns 400", arrayBody.status === 400, `status=${arrayBody.status}`)

  const huge = await post("/join", "x".repeat(200_000), true).catch(() => ({ status: "conn-reset", json: null }))
  check("oversized body returns a real 413 (not a socket reset)", huge.status === 413, `status=${huge.status}`)

  const health = await fetch(`${BASE}/health`)
  const healthJson = await health.json()
  check("server healthy after abuse", health.status === 200 && healthJson.ok === true)

  check("MAX_ACTIVE parsed correctly", healthJson.maxActive === 2, `maxActive=${healthJson.maxActive}`)

  console.log("\n--- startup log ---\n" + startupLog.trim())
} catch (error) {
  console.error("HARNESS ERROR:", error.message)
  results.push({ name: "harness", pass: false })
} finally {
  child.kill("SIGTERM")
  const failed = results.filter((r) => !r.pass)
  console.log(`\n${results.length - failed.length}/${results.length} passed`)
  process.exit(failed.length === 0 ? 0 : 1)
}
