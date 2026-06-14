# free-intro (pages)

## Purpose
The SSR page surface of the free 3-lesson intro funnel: the `/free` page routes, the lesson view
(`lesson-view.tsx`) with its inline decision-block/email-gate script island, and the post-lesson-3
paywall. The funnel's server logic (anonymous sessions, email gate, account merge, export) lives in
features/(shared)/free-intro — this folder renders the experience and calls those `/api/free-intro/*`
and `/api/decisions/*` endpoints from the client.

## Critical Rules
- NEVER render lesson content from the DB-trusting path without escaping user-entered answers —
  the inline script HTML-escapes suggestions before injecting them.
- Inline scripts are best-effort: keep the try/catch UX (gold-border feedback, unlock), but do NOT
  `console.*` in shipped client scripts (the Stop hook warns on it).
- Lesson 1 is anonymous (saves to the anon session only); the email gate (Lesson 2) sets the Better
  Auth session cookie so L2/L3 decision API calls work — never call the decision API on L1.
- The `/paywall` route MUST be declared BEFORE the `/:lesson` wildcard (route ordering).
- Paid users hitting `/free` redirect to their course — check `getUserAccessTier`, never role.
- ALWAYS render through `renderPage()`; persist the A/B `?v` variant cookie when present.
- Design tokens only (bg-cream/gold/linen); text on gold is ink.

## Imports (use from other modules)
```ts
import { freeIntroPageRoutes } from '@/features/(life)/free-intro/routes'
import { FreeIntroLesson } from '@/features/(life)/free-intro/lesson-view'
import { FreeIntroPaywall } from '@/features/(life)/free-intro/paywall'
```

## Recipe: New funnel page
```tsx
// 1. Component in <name>.tsx (SSR Preact; inline <script> island for interactivity).
// 2. GET route in routes.tsx via renderPage(...); mind wildcard ordering (/:lesson last).
// 3. Server logic (sessions, merge) belongs in features/(shared)/free-intro, not here.
```

## Verify
```sh
bun test "features/(life)/free-intro" && bunx tsc --noEmit
```
