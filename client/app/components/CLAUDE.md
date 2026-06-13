# client/app/components

## Purpose
Presentational building blocks for the /app members SPA (Preact): poster/continue-watching
cards, horizontal rails, the ink player canvas, the locked-content preview sheet, the
playbook field + interview-confirm widgets, the bottom-tab shell, and the loading/empty/error
states. These render UI — data fetching and routing live elsewhere (pages/, lib/, router).

## Critical Rules
- NEVER fetch data or call the API here — components take props; pages own data via lib/data.ts.
- NEVER use dark backgrounds outside the player canvas — cream/sand/linen everywhere; ink
  (#1A1714) is ONLY the full-bleed player region (ADR 19).
- ALWAYS render text on gold as ink (`text-ink`), never white (white-on-gold fails WCAG AA).
- NEVER grayscale, blur, or hide locked covers — full-color cover + ink-on-cream pill badge;
  a locked card ALWAYS opens the preview sheet (never a dead end).
- ALWAYS wrap non-essential animation in `motion-safe:`; honor 44px minimum touch targets and
  the `:focus-visible` gold ring from styles/global.css.
- Consume design tokens from styles/global.css — never fork or hardcode palette values.

## Imports (use from other modules)
```ts
import { PosterCard, ContinueCard, PillBadge } from '@/client/app/components/cards'
import { Rail, RailItem } from '@/client/app/components/rail'
import { EmptyState, ErrorState, RailSkeleton, Skeleton } from '@/client/app/components/states'
import { PreviewSheet } from '@/client/app/components/preview-sheet'
import { AppShell } from '@/client/app/components/shell'
```

## Recipe: New presentational component
```tsx
// components/<name>.tsx — props in, JSX out. No fetch, no navigate side effects.
export function Thing({ title, locked }: { title: string; locked: boolean }) {
  return (
    <article class="rounded-md border border-linen bg-surface-white hover:border-gold">
      {/* tokens only; motion-safe: on any animation */}
    </article>
  )
}
```

## Verify
```sh
bun test client/app && bunx tsc --noEmit
```
