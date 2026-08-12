import http from "node:http"
import { spawn } from "node:child_process"

const PB_PORT = 4097
const GATE_PORT = 4096
const GATE = `http://127.0.0.1:${GATE_PORT}`

const results = []
function check(name, pass, detail = "") {
  results.push({ name, pass })
  console.log(`${pass ? "PASS" : "FAIL"}  ${name}${detail ? `  (${detail})` : ""}`)
}

const seenFilters = []
const records = new Map()
let nextId = 1

const pb = http.createServer((req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${PB_PORT}`)
  const send = (code, body) => {
    res.writeHead(code, { "Content-Type": "application/json" })
    res.end(JSON.stringify(body))
  }

  if (url.pathname.endsWith("/auth-with-password")) {
    return send(200, { token: "mock-token" })
  }

  const filter = url.searchParams.get("filter")
  if (filter) seenFilters.push(filter)

  if (req.method === "GET") {
    const items = [...records.values()].filter((r) => {
      if (!filter) return true
      const match = /^expires_at (<=|>) "(.+)"$/.exec(filter)
      if (!match) return true
      const [, op, value] = match
      return op === ">" ? r.expires_at > value : r.expires_at <= value
    })
    return send(200, { page: 1, perPage: 1, totalItems: items.length, items: items.slice(0, 200) })
  }

  if (req.method === "POST") {
    let raw = ""
    req.on("data", (c) => (raw += c))
    req.on("end", () => {
      const body = JSON.parse(raw || "{}")
      const id = `rec${nextId++}`
      records.set(id, { id, ...body })
      send(200, { id, ...body })
    })
    return
  }

  if (req.method === "PATCH" || req.method === "DELETE") {
    const id = url.pathname.split("/").pop()
    if (req.method === "DELETE") records.delete(id)
    return send(200, { id })
  }

  return send(404, {})
})

const child = spawn("node", ["server/queue-gate.js"], {
  env: {
    ...process.env,
    PORT: String(GATE_PORT),
    PRESENCE_BACKEND: "pocketbase",
    POCKETBASE_URL: `http://127.0.0.1:${PB_PORT}`,
    POCKETBASE_ADMIN_EMAIL: "admin@example.com",
    POCKETBASE_ADMIN_PASSWORD: "password",
    POCKETBASE_COLLECTION: "presence_sessions",
    ACCESS_LOG_ENABLED: "0",
    PRESENCE_COUNT_CACHE_MS: "1000",
  },
  stdio: ["ignore", "pipe", "pipe"],
})
let log = ""
child.stdout.on("data", (d) => (log += d))
child.stderr.on("data", (d) => (log += d))

try {
  await new Promise((resolve) => pb.listen(PB_PORT, "127.0.0.1", resolve))

  for (let i = 0; i < 60; i += 1) {
    try {
      if ((await fetch(`${GATE}/health`)).ok) break
    } catch {}
    await new Promise((r) => setTimeout(r, 100))
  }

  const beat = await fetch(`${GATE}/presence/heartbeat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId: "session-abcdefghijkl" }),
  })
  const beatJson = await beat.json()

  check("heartbeat succeeds against pocketbase", beat.status === 200, `status=${beat.status}`)
  check("backend reports pocketbase", beatJson.backend === "pocketbase", `backend=${beatJson.backend}`)

  const stored = [...records.values()][0]
  check("a presence row was written", !!stored, `records=${records.size}`)

  const writtenDate = stored ? String(stored.expires_at) : ""
  check(
    "stored expires_at uses PocketBase space format, not ISO 'T'",
    /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(writtenDate),
    JSON.stringify(writtenDate),
  )

  const countRes = await fetch(`${GATE}/presence/count`)
  const countJson = await countRes.json()
  check(
    "live session is counted as online (was 0 with the ISO 'T' filter)",
    countJson.onlineCount >= 1,
    `onlineCount=${countJson.onlineCount}`,
  )

  const dateFilters = seenFilters.filter((f) => f.includes("expires_at"))
  check("gate issued expires_at filters", dateFilters.length > 0, `${dateFilters.length} filters`)
  check(
    "no filter uses the ISO 'T' separator",
    dateFilters.every((f) => !/\d{4}-\d{2}-\d{2}T\d{2}:/.test(f)),
    dateFilters[0] || "",
  )
  check(
    "filters use the space separator",
    dateFilters.every((f) => /\d{4}-\d{2}-\d{2} \d{2}:/.test(f)),
    dateFilters[0] || "",
  )

  const survived = records.size >= 1
  check("expiry sweep did not delete the live row", survived, `records=${records.size}`)
} catch (error) {
  console.error("HARNESS ERROR:", error.message)
  results.push({ name: "harness", pass: false })
} finally {
  child.kill("SIGTERM")
  pb.close()
  const failed = results.filter((r) => !r.pass)
  console.log(`\n${results.length - failed.length}/${results.length} passed`)
  if (failed.length && log) console.log("\n--- gate log ---\n" + log.trim())
  process.exit(failed.length === 0 ? 0 : 1)
}
