/**
 * /admin SSR shell — serves the admin SPA's HTML (hashed bundle from
 * public/build/manifest.json) and the /admin/media/* signed-redirect for R2 images.
 * Gated by session + admin ROLE: unauthenticated → /login redirect, non-admin → 404
 * (never 403 — the panel's existence is not advertised).
 */
import { readFileSync } from 'node:fs'
import type { MiddlewareHandler } from 'hono'
import { Hono } from 'hono'
import { auth } from '@/platform/auth/config'
import type { AppEnv } from '@/platform/types'
import { getSignedUrl } from '@/providers/storage'

type SessionLike = { user: Record<string, unknown> } | null

export type ShellDeps = {
  /** Injection seams for TESTS ONLY — production callers never pass these. */
  getSession?: (headers: Headers) => Promise<SessionLike>
  loadManifest?: () => Record<string, string>
  signMediaUrl?: (key: string) => Promise<string>
}

const MANIFEST_PATH = 'public/build/manifest.json'

/** Hashed filenames only change across deploys (server restarts) — cache after first read. */
let cachedManifest: Record<string, string> | null = null
function readManifest(): Record<string, string> {
  cachedManifest ??= JSON.parse(readFileSync(MANIFEST_PATH, 'utf-8')) as Record<string, string>
  return cachedManifest
}

function shellHtml(bundleSrc: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="robots" content="noindex" />
  <title>Admin — The Right Decision</title>
  <link rel="preload" href="/fonts/InstrumentSerif-Regular.woff2" as="font" type="font/woff2" crossorigin />
  <link rel="preload" href="/fonts/InstrumentSans-Regular.woff2" as="font" type="font/woff2" crossorigin />
  <link rel="stylesheet" href="/styles.css" />
</head>
<body class="bg-cream text-ink font-body">
  <div id="admin"></div>
  <script type="module" src="${bundleSrc}"></script>
</body>
</html>`
}

export function createAdminShellRoutes(deps: ShellDeps = {}) {
  const getSession =
    deps.getSession ??
    ((headers: Headers) => auth.api.getSession({ headers }) as Promise<SessionLike>)
  const loadManifest = deps.loadManifest ?? readManifest
  const signMediaUrl = deps.signMediaUrl ?? ((key: string) => getSignedUrl(key))

  const requireAdminOr404: MiddlewareHandler<AppEnv> = async (c, next) => {
    const session = await getSession(c.req.raw.headers)
    if (!session) return c.redirect('/login')
    if (session.user.role !== 'admin') return c.notFound()
    await next()
  }

  const serveShell = (c: Parameters<MiddlewareHandler<AppEnv>>[0]) => {
    let manifest: Record<string, string>
    try {
      manifest = loadManifest()
    } catch {
      return c.text('Admin bundle not built yet — run `bun run build:client` and reload.', 503)
    }
    const bundleSrc = manifest.admin
    if (!bundleSrc) {
      return c.text('Admin bundle not built yet — run `bun run build:client` and reload.', 503)
    }
    return c.html(shellHtml(bundleSrc))
  }

  return (
    new Hono<AppEnv>()
      .use(requireAdminOr404)
      // Signed-redirect for R2 images (covers/candidates) — bytes never proxy through Hono.
      .get('/media/*', async (c) => {
        const key = c.req.path.replace(/^\/admin\/media\//, '')
        if (!key) return c.notFound()
        return c.redirect(await signMediaUrl(key), 302)
      })
      // The SPA owns every other /admin path — always serve the same shell.
      .get('/', (c) => serveShell(c))
      .get('/*', (c) => serveShell(c))
  )
}

export const adminShellRoutes = createAdminShellRoutes()
