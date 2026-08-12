const STATIC_BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || (process.env.NODE_ENV === "production" ? "/1key" : "")

function hasBasePath(pathname: string, basePath: string): boolean {
  return pathname === basePath || pathname.startsWith(`${basePath}/`)
}

export function getRuntimeBasePath(pathname?: string): string {
  const candidate = pathname ?? (typeof window !== "undefined" ? window.location.pathname : "")

  if (STATIC_BASE_PATH && hasBasePath(candidate, STATIC_BASE_PATH)) {
    return STATIC_BASE_PATH
  }

  if (hasBasePath(candidate, "/1key")) {
    return "/1key"
  }

  return ""
}

export function stripBasePath(pathname: string): string {
  const basePath = getRuntimeBasePath(pathname)
  if (!basePath) return pathname || "/"

  const stripped = pathname.slice(basePath.length) || "/"
  return stripped.startsWith("/") ? stripped : `/${stripped}`
}

export function withBasePath(path: string, pathname?: string): string {
  if (!path) return path
  if (/^(https?:)?\/\//.test(path)) return path
  if (path.startsWith("data:") || path.startsWith("blob:")) return path

  const basePath = getRuntimeBasePath(pathname)
  if (!basePath) return path
  if (path === basePath || path.startsWith(`${basePath}/`)) return path

  return path.startsWith("/") ? `${basePath}${path}` : `${basePath}/${path}`
}
