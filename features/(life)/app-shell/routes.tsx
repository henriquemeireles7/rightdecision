import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { Hono } from 'hono'
import { auth } from '@/platform/auth/config'
import { env } from '@/platform/env'
import { throwError } from '@/platform/errors'
import type { AppEnv } from '@/platform/types'
import { getSignedUrl } from '@/providers/storage'

/**
 * /app SSR shell (P3 members SPA) + /app/media/* signed-cover redirects.
 * Mounted in platform/server/routes.ts BEFORE the '/' catch-alls — deep links
 * (/app/lessons/:id) must land here, never 404 into marketing.
 */

const MANIFEST_PATH = join(process.cwd(), 'public', 'build', 'manifest.json')

function readBuildManifest(): Record<string, string> {
  try {
    return JSON.parse(readFileSync(MANIFEST_PATH, 'utf-8')) as Record<string, string>
  } catch {
    // Dev before the first `bun run build:client` — serve the shell without a bundle
    return {}
  }
}

const escAttr = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')

/** Config the SPA reads at boot (client/app/config.ts). PUBLIC values only. */
function buildAppConfig(manifest: Record<string, string>, streamCustomerCode: string | null) {
  return { manifest, streamCustomerCode }
}

function renderShell(manifest: Record<string, string>, streamCustomerCode: string | null): string {
  const config = buildAppConfig(manifest, streamCustomerCode)
  // </script> breakout guard — same escaping rule as platform/server/render.tsx escJs
  const configJson = JSON.stringify(config).replace(/</g, '\\u003c').replace(/>/g, '\\u003e')
  const bundle = manifest.app
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  <meta name="robots" content="noindex" />
  <title>Right Decision</title>
  <link rel="preload" href="/fonts/InstrumentSerif-Regular.woff2" as="font" type="font/woff2" crossorigin />
  <link rel="preload" href="/fonts/InstrumentSans-Regular.woff2" as="font" type="font/woff2" crossorigin />
  <link rel="stylesheet" href="/styles.css" />
</head>
<body class="bg-cream text-ink font-body">
  <div id="app"></div>
  <script>window.__APP_CONFIG__ = ${configJson}</script>
  ${bundle ? `<script type="module" src="${escAttr(bundle)}"></script>` : ''}
</body>
</html>`
}

/** R2 keys come from our own catalog rows, but never trust a URL path segment. */
function isSafeMediaKey(key: string): boolean {
  if (!key || key.startsWith('/') || key.includes('\\') || key.includes('\0')) return false
  return !key.split('/').some((segment) => segment === '..' || segment === '')
}

type RouteDeps = {
  /** Options injection for TESTS ONLY — production callers never pass these. */
  getSession?: (headers: Headers) => Promise<unknown>
  readManifest?: () => Record<string, string>
  signUrl?: (key: string) => Promise<string>
  streamCustomerCode?: string | null
}

export function createAppShellRoutes(deps: RouteDeps = {}) {
  const getSession = deps.getSession ?? ((headers: Headers) => auth.api.getSession({ headers }))
  const readManifest = deps.readManifest ?? readBuildManifest
  const signUrl = deps.signUrl ?? getSignedUrl
  const streamCustomerCode =
    deps.streamCustomerCode !== undefined
      ? deps.streamCustomerCode
      : (env.CLOUDFLARE_STREAM_CUSTOMER_CODE ?? null)

  return new Hono<AppEnv>()
    .get('/media/*', async (c) => {
      const session = await getSession(c.req.raw.headers)
      if (!session) return throwError(c, 'UNAUTHORIZED')

      const marker = '/media/'
      const path = c.req.path
      const key = decodeURIComponent(path.slice(path.indexOf(marker) + marker.length))
      if (!isSafeMediaKey(key)) return throwError(c, 'NOT_FOUND')

      try {
        // Short-lived signed GET — coverImageKey/thumbnailKey are R2 keys, never public
        return c.redirect(await signUrl(key), 302)
      } catch {
        // R2 unconfigured or the key vanished — a broken cover must not 500 the app
        return throwError(c, 'NOT_FOUND')
      }
    })
    .get('*', async (c) => {
      const session = await getSession(c.req.raw.headers)
      if (!session) {
        // Page routes redirect (course/page-routes.tsx pattern) — never the JSON 401
        return c.redirect(`/login?next=${encodeURIComponent(c.req.path)}`, 302)
      }
      return c.html(renderShell(readManifest(), streamCustomerCode))
    })
}

/** Mounted by the parent router (platform/server/routes.ts) under /app. */
export const appShellRoutes = createAppShellRoutes()
