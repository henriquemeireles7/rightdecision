/// <reference lib="dom" />
/**
 * /app shell bundle entrypoint — the P3 members SPA.
 * Mounted into <div id="app"> by the /app shell SSR route (manifest-driven).
 * Budget: ≤100KB gzipped (BUNDLE_BUDGETS in platform/scripts/harden-check.ts);
 * hls.js lives in the separate player-hls entry, lazy-loaded on the lesson route.
 */
import { render } from 'preact'
import { setUnauthorizedHandler } from '@/features/(shared)/api-client'
import { AppRoot } from './app'

// Expired session mid-use → back through login, then straight back here
setUnauthorizedHandler(() => {
  location.assign(`/login?next=${encodeURIComponent(location.pathname)}`)
})

const root = document.getElementById('app')
if (root) render(<AppRoot />, root)
