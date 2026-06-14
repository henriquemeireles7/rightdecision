# landing/components

## Purpose
The section components that compose the Life Decisions sales page (hero, mechanism, offer,
curriculum, transformation, problem, disqualification, social-proof, founder, faq, next-cohort,
final-cta, footer) plus the shared CTAButton/ScrollCTA. Pure SSR Preact — assembled by
features/(life)/landing/landing.tsx into one zero-client-JS page.

## Critical Rules
- NEVER add client-side JavaScript — every section is 100% server-rendered HTML.
- NEVER invent copy — all text comes from the landing-page strategy doc (and A/B HEADLINES maps
  keyed by the `a|b|c|d` variant); components receive copy/variant via props, they don't author it.
- ALWAYS link checkout CTAs through `CTAButton` (→ `/api/checkout/redirect`, a GET 303) — never a
  raw `<a>` to Stripe.
- ALWAYS use design tokens from styles/global.css (bg-cream, text-ink, bg-gold, font-display);
  text on gold is ink. Honor the AI-slop anti-patterns (no glassmorphism, no identical 3-col grids).
- Each component is a self-contained `<section>` — no cross-section state, no shared mutable module
  scope; spacing via `gap`, not margins between siblings.

## Imports (use from other modules)
```ts
import { CTAButton, ScrollCTA } from '@/features/(life)/landing/components/cta-button'
import { Hero } from '@/features/(life)/landing/components/hero'
// landing.tsx imports each section; nothing else imports from here.
```

## Recipe: New section component
```tsx
// landing/components/<name>.tsx
export function MySection({ variant }: { variant: 'a' | 'b' | 'c' | 'd' }) {
  return (
    <section class="py-3xl">
      <div class="max-w-[800px] mx-auto px-md">{/* copy from the strategy doc only */}</div>
    </section>
  )
}
// Then compose it into landing.tsx in the right funnel order.
```

## Verify
```sh
bun test "features/(life)/landing" && bunx tsc --noEmit
```
