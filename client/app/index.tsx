/// <reference lib="dom" />
/**
 * /app shell bundle entrypoint — placeholder for the P3 members SPA.
 * Mounted into <div id="app"> by the /app shell SSR route (manifest-driven).
 * Budget: ≤100KB gzipped (BUNDLE_BUDGETS in platform/scripts/harden-check.ts).
 */
import { render } from 'preact'

function App() {
  return <div>hello</div>
}

const root = document.getElementById('app')
if (root) render(<App />, root)
