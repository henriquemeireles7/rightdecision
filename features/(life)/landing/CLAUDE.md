# landing

## Purpose
Landing page — main sales page at therightdecision.com. Pure SSR, zero client JS. Converts visitors to Stripe Checkout.

## Critical Rules
- NEVER add client-side JavaScript — this is 100% server-rendered HTML
- NEVER invent copy — ALL text comes from decisions/lifedecisions/05-landing-page/document.md
- ALWAYS use design tokens from styles/global.css (bg-cream, text-ink, font-display, etc.)
- ALWAYS use renderPage() from platform/server/render.tsx for the HTML shell
- ALWAYS use CTAButton component for checkout links (never raw <a> to Stripe)
- CTA buttons link to /api/checkout/redirect (GET endpoint, returns 303)

## Imports (use from other modules)
```ts
import { renderPage } from '@/platform/server/render'
import { env } from '@/platform/env'
```

## Recipe: New Section Component
```tsx
// features/(life)/landing/components/my-section.tsx
export function MySection() {
  return (
    <section class="py-3xl">
      <div class="max-w-[800px] mx-auto px-md">
        {/* Section content */}
      </div>
    </section>
  )
}
```

## Verify
```sh
bun test features/(life)/landing/
bunx tsc --noEmit features/(life)/landing/routes.ts
```
