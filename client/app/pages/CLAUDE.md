# client/app/pages

## Purpose
The route-level screens of the /app members SPA (Home, Lesson, Playbook, Playbook-page, Journal,
Lives, Live-replay, Materials, Chat). Each page fetches its data via lib/data.ts and renders the
four interaction states using components/. Pages are the only place that wires data → layout for
a route.

## Critical Rules
- ALWAYS render all four states: loading (sand/linen skeletons, PINNED aspect ratios — zero CLS),
  error (what/why/how-to-fix + retry), empty (warm copy + primary action), ready.
- ALWAYS fetch through lib/data.ts via `useQuery(fetch*, [deps])` — NEVER hand-roll fetch.
- NEVER import server runtime (db, env, providers); platform imports are `import type` only.
- Layout/visual primitives come from components/ and styles/global.css tokens — pages compose,
  they don't re-implement cards/rails or fork palette values.
- Chat: streaming text in an `aria-live="polite"` region; no animated typing indicator under
  `prefers-reduced-motion`; the "not therapy" line is persistent and non-dismissable.
- Honor the Lock-State UX: locked cards open the preview sheet, never a dead end.

## Imports (use from other modules)
```ts
// Pages are leaves — app.tsx imports them; nothing imports from a page.
import { useQuery } from '@/client/app/lib/use-query'
import { fetchCatalog } from '@/client/app/lib/data'
import { Rail, EmptyState, ErrorState } from '@/client/app/components/...'
```

## Recipe: New page
```tsx
export function ThingPage() {
  const { state, retry } = useQuery(() => fetchThing(), [])
  if (state.status === 'loading') return <ThingSkeleton />
  if (state.status === 'error') return <ErrorState error={state.error} onRetry={retry} />
  if (state.data.items.length === 0) return <EmptyState title="…" />
  return <section>…</section>
}
// Then add the route to router.tsx (+ test) and wire the switch arm in app.tsx.
```

## Verify
```sh
bun test client/app/pages && bunx tsc --noEmit
```
