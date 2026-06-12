# client

## Purpose
Browser bundle entrypoints. Each subdirectory `client/<entry>/index.tsx` becomes one
content-hashed bundle in `public/build/` via `bun run build:client` (Bun.build, target browser),
recorded in `public/build/manifest.json` for the /app shell SSR route. Server code stays SSR —
only true SPA surfaces get an entry here.

## Critical Rules
- NEVER add a new entry without adding a budget row to BUNDLE_BUDGETS in
  platform/scripts/harden-check.ts — unbudgeted bundles fail `bun run check`
- NEVER import server runtime code (db, env, providers) — browser bundles only; platform imports
  must be `import type`
- ALWAYS keep marketing/SSR pages at 0KB client JS — bundles exist ONLY for SPA surfaces (/app)
- ALWAYS reference bundles through manifest.json (content-hashed filenames change every build) —
  never hardcode a hashed filename
- public/build/ is generated output: gitignored, biome-excluded — NEVER commit or lint it
- API calls go through features/(shared)/api-client — never hand-rolled fetch

## Imports (use from other modules)
```ts
// SSR shell reads the manifest (P3):
// const manifest = JSON.parse(readFileSync('public/build/manifest.json', 'utf-8'))
// <script type="module" src={manifest.app}></script>
```

## Recipe: New bundle entry
```tsx
// client/<entry>/index.tsx
import { render } from 'preact'

function App() {
  return <div>…</div>
}

const root = document.getElementById('app')
if (root) render(<App />, root)
```
Then add `{ entry: '<entry>', maxGzipBytes: ... }` to BUNDLE_BUDGETS in
platform/scripts/harden-check.ts and run `bun run build:client`.

## Verify
```sh
bun run build:client && bun platform/scripts/harden-check.ts
```
