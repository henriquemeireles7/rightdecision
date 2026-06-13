# client/player-hls

## Purpose
The lazy hls.js chunk for the lesson player (ADR 5 / P3 bundle budget). A separate bundle
entry (NOT a code-split chunk) so the /app shell stays ≤100KB gzipped: the shell dynamic-
imports this module's hashed URL from the manifest (window.__APP_CONFIG__.manifest) only
on the lesson route, and only when the browser lacks native HLS (Safari plays natively).

## Critical Rules
- NEVER import hls.js anywhere else — this entry is the ONLY static hls.js import
- NEVER render anything here — this entry exports Hls and does not touch the DOM
- ALWAYS use the light build (hls.light) — captions are WebVTT side-files via <track>,
  not in-manifest subtitles; the full build blows the 120KB budget for nothing
- Budget row lives in BUNDLE_BUDGETS (platform/scripts/harden-check.ts): ≤120KB gzipped

## Imports (use from other modules)
```ts
// Never imported statically. Loaded at runtime by client/app/lib/hls-loader.ts:
// const mod = await import(manifest['player-hls'])  → mod.default is the Hls class
```

## Recipe: Consuming from the SPA
```ts
import { loadHls } from '@/client/app/lib/hls-loader'
const Hls = await loadHls() // null when manifest entry missing or import fails
if (Hls?.isSupported()) new Hls().attachMedia(video)
```

## Verify
```sh
bun run build:client && bun platform/scripts/harden-check.ts
```

---
<!-- AUTO-GENERATED BELOW — do not edit manually -->

## Files
| File | Exports |
|------|---------|
| hls-light.d.ts | default |
| index.tsx | — |

<!-- Generated: 2026-06-13T00:43:48.444Z -->
