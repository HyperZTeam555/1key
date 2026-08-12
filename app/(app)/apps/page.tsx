"use client"

import { useRouter } from "next/navigation"

const APP_PROXY_HANDOFF_KEY = "1key-proxy-app-handoff-url"

type AppItem = {
  name: string
  image: string
  url: string
}

const APPS: AppItem[] = [
  { name: "CapCut", image: "/apps/capcut.png", url: "https://capcut.com/" },
  { name: "Discord", image: "/apps/discord.png", url: "https://discord.com/" },
  { name: "Gauth Math", image: "/apps/guath.webp", url: "https://www.gauthmath.com/" },
  { name: "GitHub", image: "/apps/github.png", url: "https://github.com/" },
  { name: "Music", image: "/apps/music.png", url: "https://monochrome.tf/" },
  { name: "TikTok", image: "/apps/tiktok.png", url: "https://tiktok.com/" },
  { name: "Twitch", image: "/apps/twitch.png", url: "https://www.twitch.tv/" },
  { name: "Venge IO", image: "/apps/venge.jpeg", url: "https://venge.io/" },
].sort((left, right) => left.name.localeCompare(right.name, undefined, { sensitivity: "base" }))

export default function AppsPage() {
  const router = useRouter()

  const openInProxy = (url: string) => {
    if (url.startsWith("/")) {
      router.push(url)
      return
    }

    try {
      sessionStorage.setItem(APP_PROXY_HANDOFF_KEY, url)
    } catch {
    }
    router.push("/proxy")
  }

  return (
    <div className="h-screen overflow-hidden proto-page-shell">
      <div className="h-full w-full overflow-auto p-3 sm:p-4 lg:p-5">
        <div className="mx-auto w-full max-w-[1500px]">
          <div className="rounded-2xl border border-border/70 bg-card/50 p-4 backdrop-blur-md sm:p-5">
            <h1 className="text-xl font-semibold tracking-wide text-foreground sm:text-2xl">Apps</h1>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {APPS.map((app) => (
              <button
                key={app.name}
                type="button"
                onClick={() => openInProxy(app.url)}
                className="group overflow-hidden rounded-2xl border border-border/70 bg-card/45 text-left backdrop-blur-md transition hover:border-primary/55 hover:bg-card/70"
              >
                <div className="aspect-[5/3] overflow-hidden bg-black/35">
                  <img
                    src={app.image}
                    alt={app.name}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                    loading="lazy"
                  />
                </div>
                <div className="px-3 py-2.5">
                  <p className="truncate text-sm font-medium text-foreground">{app.name}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
