# Landing Page Implementation Handoff
**Version:** 1.0
**Date:** 2026-04-07
**Status:** Draft
**Author:** Henry + Codex
**Source:** .context/plans/landing-page-implementation-plan.md
**Use from:** Any worktree rooted at this repository. All paths below are repo-relative.
**Pipeline:** 05-landing-page (copy) -> 09-landing-page-prd (product spec) -> implementation-plan (this) -> execution

## Document scope
**This document IS:** A portable, execution-ready implementation plan for the Life Decisions landing page.
**This document is NOT:** The source of truth for copy or product requirements. Those remain in the linked decision docs.
**Primary reader:** Henry or any coding agent implementing the page in a separate worktree.

## Read these first
- `decisions/lifedecisions/09-landing-page-prd/document.md`
- `decisions/lifedecisions/05-landing-page/document.md`
- `decisions/design.md`
- `decisions/voice.md`

---

## Context
We need to build the Life Decisions landing page, the main sales page at `therightdecision.com`.

**Current state snapshot (2026-04-07):**
- The codebase is API-only. Routes return JSON via `success()`.
- TSX components exist for app surfaces like onboarding, dashboard, wins board, and paywall, but none are served as HTML pages.
- There is no SSR setup, no CSS build pipeline for page styles, and no static asset serving.
- Stripe checkout already works in `features/subscription/create-checkout.ts`.

**Goal:**
Ship a production-ready landing page as the first HTML page, and set up reusable SSR infrastructure that future pages can adopt.

## Locked decisions
- Illustrations: use placeholder boxes for now; swap to Nanobanana images later.
- Folder structure: `features/(life)/landing/`
- SSR scope: build shared infrastructure, not a one-off page renderer.

---

## How SSR should work

**Current API flow:**
```text
Browser -> GET /api/courses -> Hono handler -> c.json({ ok, data }) -> JSON response
```

**Target SSR flow:**
```text
Browser -> GET / -> Hono handler -> renderToString(<LandingPage />) -> c.html(fullHtmlDocument) -> HTML response
```

**Core pieces:**
1. `renderToString()` from `preact-render-to-string`
2. `c.html()` from Hono
3. A shared HTML shell that injects fonts, CSS, metadata, and page content

**Reuse target:**
Future pages should be able to do this:
```ts
app.get('/dashboard', requireAuth, async (c) => {
  const data = await fetchDashboardData(user)
  return c.html(renderPage(<CourseDashboard {...data} />))
})
```

---

## Gaps to close

### Engineering gaps
1. No HTML rendering pipeline
   - Fix: install `preact-render-to-string` and create shared `renderPage()` in `platform/server/render.tsx`
2. No CSS pipeline
   - Fix: create `styles/global.css`, compile to `public/styles.css`, add build/watch scripts
3. No static asset serving
   - Fix: add `public/` and Hono `serveStatic` middleware
4. Design tokens are not in code
   - Fix: define design-system tokens in `styles/global.css` via Tailwind v4 `@theme`
5. Fonts are not loaded
   - Fix: preload/load Instrument Serif and Instrument Sans in the shared HTML shell

### Design gaps
1. Existing Tailwind colors do not match the design system
2. Mobile section reordering is required for conversion
3. Illustration assets do not exist yet, so placeholders are required

---

## Implementation plan

### Phase 0: Infrastructure

**Step 1 - Install SSR dependency**
```sh
bun add preact-render-to-string
```

**Step 2 - Add static asset serving**
- Create `public/`
- Create `public/images/` as a placeholder asset directory
- Update `platform/server/app.ts` to use `serveStatic` from `hono/bun`

**Step 3 - Create global CSS**
Create `styles/global.css` with Tailwind v4 and design tokens:

```css
@import "tailwindcss";

@theme {
  --color-cream: #FAF8F5;
  --color-sand: #F2EDE6;
  --color-linen: #E8E0D4;
  --color-ink: #1A1714;
  --color-body: #6B6258;
  --color-muted: #A69D91;
  --color-gold: #C4956A;
  --color-gold-hover: #B07D4F;
  --color-success: #6B8F5E;
  --color-error: #C25B4A;
  --font-display: "Instrument Serif", serif;
  --font-body: "Instrument Sans", sans-serif;
}
```

**Step 4 - Add CSS scripts**
Update `package.json`:
- `"css:build": "bunx @tailwindcss/cli -i styles/global.css -o public/styles.css --minify"`
- `"css:dev": "bunx @tailwindcss/cli -i styles/global.css -o public/styles.css --watch"`
- Update `"build"` so CSS is built as part of the build flow

**Step 5 - Create shared SSR renderer**
Add `platform/server/render.tsx`:
- `renderPage(component, options)` wraps any page component in a full HTML shell
- Include fonts, `/styles.css`, metadata, and semantic HTML structure
- This is the reusable SSR entry point for all future pages

### Phase 1: Landing page feature wiring

**Step 6 - Create `features/(life)/landing/`**
- `CLAUDE.md`
- `landing.tsx`
- `routes.ts`

`routes.ts` should expose `GET /` and return `c.html(renderPage(<LandingPage />))`.

**Step 7 - Mount landing routes**
Update `platform/server/routes.ts`:
- Import landing routes
- Mount them after `/api/*` routes
- Only `GET /` should resolve to the landing page

### Phase 2: Section components

All components are pure Preact TSX with zero client JS.

| # | File | Component | Notes |
|---|---|---|---|
| 1 | `components/cta-button.tsx` | `CTAButton` | Gold CTA, links to `/api/checkout/redirect` |
| 2 | `components/hero.tsx` | `HeroSection` | Headline variants, subheadline, CTA, guarantee |
| 3 | `components/problem.tsx` | `ProblemSection` | Long-form prose, price anchoring, mobile truncation |
| 4 | `components/mechanism.tsx` | `MechanismSection` | Insight prose + 3 phase cards + placeholders |
| 5 | `components/transformation.tsx` | `TransformationSection` | Before/after framing, Maria metrics |
| 6 | `components/curriculum.tsx` | `CurriculumSection` | 3 acts using `<details>/<summary>` |
| 7 | `components/founder.tsx` | `FounderSection` | Henry + Indy story |
| 8 | `components/social-proof.tsx` | `SocialProofSection` | Honest launch-state proof |
| 9 | `components/offer.tsx` | `OfferSection` | Checklist, comparison, guarantee, CTA |
| 10 | `components/disqualification.tsx` | `DisqualSection` | NOT for / IS for |
| 11 | `components/faq.tsx` | `FAQSection` | FAQ accordion with `<details>/<summary>` |
| 12 | `components/final-cta.tsx` | `FinalCTASection` | Final close + CTA |

### Phase 3: CTA to Stripe Checkout

**Step 8 - Add a redirect endpoint**
Update `features/subscription/create-checkout.ts`:

```ts
checkoutRoutes.get('/redirect', async (c) => {
  const session = await payments.checkout.sessions.create({ ... })
  return c.redirect(session.url!, 303)
})
```

This keeps CTA buttons as plain anchors:
```html
<a href="/api/checkout/redirect">Start for $197/year</a>
```

### Phase 4: Headline variant support

**Step 9 - Add simple A/B routing logic**
- Read `?v=a|b|c|d`
- If absent, assign a random variant
- Set cookie `lp_variant` so subsequent requests stay consistent
- Pass variant into `HeroSection`
- Defer analytics tracking until PostHog integration exists

### Phase 5: Mobile responsiveness

**Step 10 - Add responsive rules**
- Use flexbox `order` to move Offer to position 3 on mobile
- Hero headline scales down on small screens
- Problem section gets a truncated mobile version using `<details>`
- Founder section collapses on mobile

### Phase 6: Tests

**Step 11 - Landing page tests**
Create `features/(life)/landing/landing.test.ts`:
- `GET /` returns `200`
- Response has `Content-Type: text/html`
- Response contains expected section headings
- Response contains CTA link to `/api/checkout/redirect`
- `?v=b` renders variant B headline
- `lp_variant` cookie persists

**Step 12 - Checkout redirect test**
Add a test in `features/subscription/`:
- `GET /api/checkout/redirect` creates a Stripe session
- Response is a `303` redirect

---

## File map

### New files
```text
styles/global.css
public/.gitkeep
platform/server/render.tsx
features/(life)/landing/CLAUDE.md
features/(life)/landing/landing.tsx
features/(life)/landing/routes.ts
features/(life)/landing/landing.test.ts
features/(life)/landing/components/cta-button.tsx
features/(life)/landing/components/hero.tsx
features/(life)/landing/components/problem.tsx
features/(life)/landing/components/mechanism.tsx
features/(life)/landing/components/transformation.tsx
features/(life)/landing/components/curriculum.tsx
features/(life)/landing/components/founder.tsx
features/(life)/landing/components/social-proof.tsx
features/(life)/landing/components/offer.tsx
features/(life)/landing/components/disqualification.tsx
features/(life)/landing/components/faq.tsx
features/(life)/landing/components/final-cta.tsx
```

### Files to modify
```text
platform/server/app.ts
platform/server/routes.ts
features/subscription/create-checkout.ts
package.json
.gitignore
```

### Files to reuse without planned code changes
```text
providers/payments.ts
platform/env.ts
platform/errors.ts
decisions/lifedecisions/05-landing-page/document.md
decisions/design.md
decisions/voice.md
```

---

## Verification checklist
1. `bun run css:build`
2. Start the app outside the agent session with `bun run dev`
3. `curl http://localhost:3000` returns a full HTML document
4. `http://localhost:3000` renders with Instrument Serif/Sans, cream palette, and gold CTAs
5. At mobile width, Offer moves to position 3
6. Clicking a CTA redirects to Stripe Checkout in test mode
7. `http://localhost:3000?v=b` renders the B headline
8. `bun test`
9. `bun run check`
10. Lighthouse LCP is under 2.5s

---

## Freshness check before executing in another worktree
This plan assumes the repo still matches the 2026-04-07 snapshot above. Before implementing, quickly re-check:
- `package.json`
- `platform/server/app.ts`
- `platform/server/routes.ts`
- `features/subscription/create-checkout.ts`
- whether `public/` and `styles/` already exist

If any of those changed materially, update this plan first instead of following it blindly.
