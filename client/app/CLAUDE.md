# client/app

## Purpose
The P3 members-area SPA (Preact, client-rendered, ADR 5) served at /app by the
features/(life)/app-shell SSR shell. Netflix LAYOUT (rails, poster cards, cover images) on
the Ethereal Warmth cream palette — NEVER dark mode; the lesson player sits in an ink
(#1A1714) canvas region, a palette token used as component background (ADR 19).

## Critical Rules
- NEVER use dark backgrounds outside the player canvas — cream/sand/linen everywhere else;
  ink (#1A1714) is ONLY the full-bleed player region (ADR 19)
- Text on gold is ALWAYS ink, never white (white-on-gold ≈2.7:1 fails WCAG AA)
- NEVER gray-scale, blur, or hide locked covers — full-color cover + ink-on-cream pill
  badge; a locked card tap ALWAYS opens the preview sheet (never a dead end)
- ALWAYS wrap non-essential animation in `motion-safe:` (prefers-reduced-motion is a
  primary path, ~35% of ICP); countdowns are static text per minute, never ticking
- Every screen ships loading (sand/linen skeletons, PINNED aspect ratios — zero CLS),
  empty (warm copy + primary action), and error (what/why/how-to-fix + retry) states
- API calls go through lib/data.ts → features/(shared)/api-client — NEVER hand-rolled fetch
- hls.js is NEVER imported statically — it is its own bundle entry (client/player-hls)
  lazy-loaded on the lesson route via lib/hls-loader.ts + the manifest in window.__APP_CONFIG__
- Rails are semantic `<section>` with real h2 headings; CSS scroll-snap + partial peek +
  desktop arrows; NO auto-scroll, NO hover-zoom; card hover = gold border + subtle shadow
- 44px minimum touch targets (bottom tab bar, cards, controls); `:focus-visible` gold ring
  comes from styles/global.css — never remove outlines
- NAV (P6 decision): the bottom bar holds SIX tabs (Home/Playbook/Journal/Chat/Lives/Materials),
  NOT a More/overflow menu. Chat is a primary surface; at 320px flex-1 gives each tab ~53px
  (still ≥44px) and labels fit at text-xs. Add a More/overflow only if a 7th primary tab ships.
  Rationale lives next to NAV_ITEMS in components/shell.tsx.
- Chat UI: streaming assistant text MUST be in an `aria-live="polite"` region; NO animated typing
  indicator under `prefers-reduced-motion` (motion-safe pulse only). Chat bubbles: user =
  ink-on-gold (right), assistant = ink-on-sand (left). The "not therapy" line is a persistent,
  non-dismissable muted line UNDER the input. The crisis callout is CALM (sand/gold/ink) — NEVER
  alarm-red. The budget-ceiling state is a DESIGNED warm state, not an error toast.
- Consume tokens from styles/global.css (bg-cream, bg-sand, border-linen, text-ink,
  text-body, text-muted, bg-gold, text-success, font-display, font-body) — never fork them
- Interview mode (ADR 11): an IN-PAGE PANEL on the playbook page (components/interview-panel.tsx),
  NOT a route. Rationale: the flow is page-scoped + short, the /app shell is ~24KB gzipped (no
  lazy-load budget pressure), and a panel keeps the interview co-located with the page whose
  fields it fills (no router state threading documentId). The entry button ("Fill this in with a
  few questions") sits on pages/playbook-page.tsx as an ALTERNATIVE to the typed fields — it never
  disrupts the typed fill-in. The panel walks one scripted question per free-text field (each turn
  persisted via the plain request/response /messages POST — the interview API is NOT SSE, unlike
  chat), then distills → renders components/interview-confirm.tsx. NOTHING writes to the playbook
  before the user explicitly accepts in InterviewConfirm (the ADR 11 trust write). Suggested fields
  are SAND-tinted; accepted ones flip to a GOLD ring — the proposed→confirmed distinction is the
  trust-critical visual. INTERVIEW_INVALID_STATE / network errors surface as a calm ErrorState with
  retry, never a crash. On confirm the page refetches so confirmed answers show.

## Test Seam (the documented mocking strategy)
Tests mock at the FETCH level through the api-client's own `ApiClientOptions.fetch` seam —
no `mock.module`, no passthrough proxies needed (this module never touches db/env):

```ts
import { setApiFetchForTests } from '@/client/app/lib/api'
import { jsonFetch } from '@/client/app/test-fixtures'

setApiFetchForTests(jsonFetch({ 'GET /api/catalog': { ok: true, data: catalogFixture } }))
afterEach(() => setApiFetchForTests(null)) // restore the real client
```

This exercises the full real path (hc proxy → createFetch → unwrap → envelope handling)
against fixture payloads. `jsonFetch` matches on `"METHOD /path"` keys.

## Imports (use from other modules)
```ts
// This is a leaf surface — nothing imports from client/app.
// Inside the SPA:
import { useRoute, navigate, Link } from '@/client/app/router'
import { fetchCatalog, type Catalog } from '@/client/app/lib/data'
import { createHeartbeatBatcher } from '@/client/app/lib/heartbeats'
```

## Recipe: New page
```tsx
// 1. Add the route to parseRoute() in router.ts (+ test)
// 2. pages/<name>.tsx — fetch via useQuery(fetch*, [deps]), render the four states:
export function ThingPage() {
  const { state, retry } = useQuery(() => fetchThing(), [])
  if (state.status === 'loading') return <ThingSkeleton />
  if (state.status === 'error') return <ErrorState error={state.error} onRetry={retry} />
  if (state.data.items.length === 0) return <EmptyState title="..." action={...} />
  return <section>...</section>
}
// 3. Wire the route in app.tsx; add the nav item ONLY if its wave has shipped
```

## Verify
```sh
bun test client/app && bunx tsc --noEmit && bun run build:client && bun platform/scripts/harden-check.ts
```

---
<!-- AUTO-GENERATED BELOW — do not edit manually -->

## Files
| File | Exports |
|------|---------|
| app.tsx | AppRoot |
| config.ts | AppConfig, getAppConfig |
| index.tsx | — |
| router.tsx | Route, APP_BASE, parseRoute, navigate, useRoute, Link |
| test-fixtures.ts | setTestUrl, jsonFetch, errorEnvelope, unlockedLesson, unlockedProgram, lockedProgram, catalogFixture, liveFixture, materialFixture, lessonFixture |

## Internal Dependencies
- features/(shared)

<!-- Generated: 2026-06-13T00:43:48.441Z -->
