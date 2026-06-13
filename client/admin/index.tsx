/// <reference lib="dom" />
/**
 * /admin SPA bundle entrypoint — mounted into <div id="admin"> by the admin shell SSR
 * route (features/(admin)/shell/routes.ts, manifest-driven). Budget row lives in
 * BUNDLE_BUDGETS (platform/scripts/harden-check.ts).
 */
import { render } from 'preact'
import { setUnauthorizedHandler } from '@/features/(shared)/api-client'
import { AdminApp } from './app'

// Session expired mid-session → back to login (registered ONCE at boot).
setUnauthorizedHandler(() => {
  window.location.assign('/login')
})

const root = document.getElementById('admin')
if (root) render(<AdminApp />, root)
