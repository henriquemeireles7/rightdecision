# Product Requirements Document — Life Decisions Landing Page
**Version:** 1.0
**Date:** 2026-04-07
**Status:** Draft
**Author:** Henry + Claude
**Source:** decisions/lifedecisions/05-landing-page/document.md (copy strategy)
**Pipeline:** 05-landing-page (copy) → 09-landing-page-prd (this) → d-tasks → d-code

## Document scope
**This document IS:** An implementation-ready PRD for the Life Decisions landing page at rightdecision.io. Defines every section, component, interaction, visual spec, and integration needed to ship the sales page.
**This document is NOT:** The full platform PRD (that's 08-prd). Not the copy strategy (that's 05-landing-page). Not a design mockup.
**Scope boundary:** One page. Frontend + Stripe Checkout. No course player, no onboarding flow, no auth. Those live in the platform PRD.
**Primary reader:** Henry (builds it), AI agents (implement components)

---

## 1. Product Overview

### What this page does
The landing page is the primary sales surface for Life Decisions ($197/year). It converts visitors from organic social, search, and referrals into paying customers via Stripe Checkout.

### JTBD trace
- **Big Hire:** "Break out of the eternal self-help loop" (JTBD Section 3) — the page must communicate structural difference from everything she's tried before
- **Anxiety reduction:** "Is this just the next cycle?" (JTBD Section 4) — the page must reduce this anxiety through honest positioning, no fake scarcity, and real founder story
- **Forces of progress:** Push (stuck despite doing the work) + Pull (one decision changes everything) — the page leverages both

### Entry points
| Source | Expected behavior |
|---|---|
| Social media link | Lands on hero, scrolls through page |
| Google search | Lands on hero or deep-linked FAQ section |
| Direct referral | Lands on hero |
| Email campaign | Lands on hero or offer section via anchor link |

### Success metrics
| Metric | 90-day target | Kill signal |
|---|---|---|
| Visitor → Checkout click rate | >3% | <1% after 1000 visitors |
| Checkout → Purchase conversion | >50% (Stripe Checkout handles this) | <30% |
| Mobile bounce rate | <60% | >80% |
| Page load (LCP) | <2.5s | >4s |
| Scroll depth (50%+) | >40% of visitors | <20% |

---

## 2. Page Architecture

### Section order (desktop)

| # | Section | Component | Purpose | CTA |
|---|---|---|---|---|
| 1 | Hero | `HeroSection` | 5-second pitch: what/who/action | Primary |
| 2 | Problem + Price Anchor | `ProblemSection` | Mirror her world, plant $3-5K anchor | Soft scroll |
| 3 | Mechanism | `MechanismSection` | Why nothing worked + 3-phase solution | Primary |
| 4 | Transformation | `TransformationSection` | Before/after with Maria's numbers | None |
| 5 | Curriculum | `CurriculumSection` | 3 acts, 9 modules as hooks | Primary |
| 6 | Founder Story | `FounderSection` | Henry + Indy credibility | None |
| 7 | Social Proof | `SocialProofSection` | Honest launch version | None |
| 8 | Offer Stack | `OfferSection` | Price + value + guarantee | Primary |
| 9 | Disqualification | `DisqualSection` | NOT for / IS for filter | None |
| 10 | FAQ | `FAQSection` | Objection handling (accordion) | None |
| 11 | Final CTA | `FinalCTASection` | Closing push | Primary |

### Section order (mobile) — reordered for conversion

| Priority | Section | Why |
|---|---|---|
| 1 | Hero (headline + CTA only) | Hook + action immediately |
| 2 | Problem (shortened to 2 paragraphs) | Recognition |
| 3 | Offer + Guarantee (moved UP) | Price anxiety resolved in first 3 screens |
| 4 | Mechanism (3 bullets, not full prose) | Structural difference |
| 5 | Curriculum (accordion per act) | What they get |
| 6 | Founder story (collapsed, expandable) | Trust |
| 7 | FAQ (accordion) | Objections |
| 8 | Final CTA | Close |

**Below the fold on mobile (accessible but not critical):** Transformation, Social Proof, Disqualification.

### CTA placement map
CTAs appear at 6 points: Hero, after Problem (scroll link), after Mechanism, after Curriculum, Offer section, Final CTA. All primary CTAs share the same text and link to Stripe Checkout.

---

## 3. Component Specifications

### 3.1 HeroSection

**Layout:** Full-width, centered text, max-width 800px for copy. No hero image — text does the work.

**Elements:**
- Headline (Instrument Serif, hero size 56px/3.5rem, `--text-primary`)
- Subheadline (Instrument Sans, lg 19px, `--text-secondary`, max-width 640px)
- CTA button (gold `--accent` bg, white text, sm radius 8px, 18px font, min 48px height)
- Guarantee line below CTA (Instrument Sans, sm 14px, `--text-muted`)

**Headline (default):**
> The one thing that transforms your life in less than 7 days.

**Headline variants for A/B testing:**

| Variant | Copy | Hook type |
|---|---|---|
| A (default) | "The one thing that transforms your life in less than 7 days" | Promise |
| B | "You already know what to do. You just haven't decided." | Mirror |
| C | "Stop preparing. Start deciding." | Command |
| D | "You don't need another course. You need one decision." | Contrast |

**A/B implementation:** Variants stored as a simple array. Selection via URL param (`?v=b`) or random assignment with localStorage persistence. No external A/B tool in V1. Pick winner after 1000 visitors using PostHog funnel analysis.

**Subheadline:**
> A methodology + AI that turns stuck goals into clear decisions and daily actions. Not therapy. Not motivation. Just clarity.

**CTA text:** "Start for $197/year"
**Below CTA:** "7-day money-back guarantee. Cancel anytime."

**Background:** `--bg-primary` (#FAF8F5)
**Spacing:** 96px top padding, 64px bottom padding (4xl / 3xl)

### 3.2 ProblemSection

**Layout:** Centered prose, max-width 640px (reading width). Long-form copy.

**Visual treatment:** No cards, no columns. Pure editorial prose on `--bg-primary`. Section divider: thin 1px `--bg-tertiary` line, 64px margin.

**Copy structure (from 05-landing-page/document.md Section 2):**
1. Opening — "You've done the work." (recognition hook)
2. The pattern — movement but no progress
3. The loop — consume, process, feel better, get hit, repeat
4. Price anchor — "$3,000-5,000 spent on understanding"
5. Closing question — "How many decisions did it produce?"

**Mobile version:** Truncated to opening + loop + price anchor (2 paragraphs, not 5). Full version available via "Read more" expand.

**Typography:** Body text in Instrument Sans, base 16px, `--text-secondary`. Key phrases in bold `--text-primary`. Line-height 1.7 for readability.

**End CTA:** Text link "See how The Right Decision is different" with arrow, scrolls to Mechanism section.

### 3.3 MechanismSection

**Layout:** Two parts — insight (prose) then 3-phase visual.

**Part 1 — The insight (prose, max-width 640px):**
Copy from 05-landing-page Section 3. Key message: "You have a decision problem, not an understanding problem." Three failure points of self-help, each addressed by a mechanism.

**Part 2 — Three-phase visual:**

| Phase | Label | Description | Visual |
|---|---|---|---|
| 1 | See Clearly | Map where you are and where you want to be. Find the ONE thing in the way. | Custom illustration: warm-toned, minimal line art of a person looking at a simple map |
| 2 | Decide | Name it. Commit. Set a date. Tell someone. | Custom illustration: warm-toned, minimal line art of a person writing on a single card |
| 3 | Move | One task per day. AI skill guides each step. | Custom illustration: warm-toned, minimal line art of a person taking a step forward |

**Phase card layout:** Horizontal row on desktop (3 columns), vertical stack on mobile. Each card: `--bg-secondary` background, md radius 12px, numbered badge (1/2/3) in `--accent`, phase label in Instrument Serif xl, description in Instrument Sans base.

**Custom images:** Generate using **Nanobanana** (Google). Style: warm minimal line art on cream/transparent background, matching `--bg-primary` palette. No photorealistic images. No stock photos. The illustrations should feel hand-drawn, warm, and intentional — matching the Ethereal Warmth aesthetic.

**Nanobanana prompt direction for each illustration:**
- Style: "Minimal warm-toned line illustration, single continuous line, cream background, gold accent (#C4956A), no fill, elegant and calm"
- Phase 1: Person standing before a simple landscape with one clear path highlighted
- Phase 2: Person at a desk writing one sentence on a card, decisive posture
- Phase 3: Person mid-stride on a path, light and unburdened

**Mobile:** Phases stack vertically. Prose simplified to 3 bullet points.

**CTA:** Gold button "Start for $197/year" after phase cards.

### 3.4 TransformationSection

**Layout:** Two-column on desktop (before/after). Single column on mobile.

**Content:** Maria's story with specific numbers.

**Before state (left column):**
- Score: 18/50
- Career: 3/10
- Insomnia: 5 nights/week
- Savings: $800

**After state (right column):**
- Score: 35/50
- New job: $4,200 → $6,800/month
- Sleep: 5/10 → 8/10
- Savings: $800 → $3,200

**Visual treatment:** Before column on `--bg-secondary` with `--text-muted` numbers. After column on `--surface-white` with `--accent` numbers and `--success` checkmarks. Simple number comparison, not a dashboard or chart.

**Header copy:**
> Imagine it's a Tuesday. Three months from now.

**Footer copy:**
> One decision. One cycle. Seventeen points.

### 3.5 CurriculumSection

**Layout:** 3 accordion blocks, one per act. Expanded by default on desktop, collapsed on mobile.

**Act structure:**

| Act | Title | Months | Modules |
|---|---|---|---|
| I | See Clearly | Month 1 | 1. The Wake-Up Call, 2. Where You Actually Are, 3. Where You Want to Be |
| II | Decide | Month 2 | 4. The One Thing in the Way, 5. The Decision, 6. The Plan |
| III | Move | Month 3 | 7. Doing the Thing, 8. What Reality Tells You, 9. Resolution + Next Loop |

**Card design per act:** Act number in `--accent` badge. Act title in Instrument Serif xl. Module list as numbered items with brief one-line descriptions. Left accent border in `--accent` for active/expanded state.

**Summary line below curriculum:**
> 9 modules. 3 months. 10 documents about YOUR life. AI skills you can run again for your next decision.

**CTA:** Gold button "Start the course" after summary.

### 3.6 FounderSection

**Layout:** Centered prose, max-width 640px. Optional: small circular photos of Henry and Indy (if available), otherwise text-only.

**Custom image option:** If no real photos, generate warm minimal portrait illustrations via Nanobanana matching the Phase illustrations style. Two small circular illustrations side by side above the story text.

**Copy:** From 05-landing-page Section 6. Henry's story (stuck despite success → action produced clarity) + Indy's parallel journey + why they built this.

**Design:** `--bg-secondary` background for the full section. Pulls it visually apart from surrounding sections.

### 3.7 SocialProofSection

**Launch version (Day 1):**
Honest copy: "We're not going to show you fake testimonials." Founder credentials + methodology research basis (Theory of Constraints, BJ Fogg). "We're new. This is honest."

**Post-launch version (100+ customers):**
Replace with Wins Board feed — real customer victories, anonymized, categorized by life area. Component should support both modes via a simple boolean flag.

**Layout:** Centered text, max-width 640px. `--bg-primary` background.

### 3.8 OfferSection

**Layout:** Single centered card on `--surface-white`, md radius, with structured checklist.

**Elements:**
1. Price headline: "The Right Decision — $197/year" (Instrument Serif 2xl)
2. Included checklist (checkmarks in `--success`):
   - 9-module course (~23 hours, 3 months at 2h/week)
   - 9 AI-powered Claude skills — one per exercise
   - 9 practical exercises producing YOUR documents
   - Weekly review framework
   - All future course + skill updates
   - Your decision archive on your computer — you own your data
   - AI setup class (no tech knowledge needed)
3. NOT included list (X marks in `--text-muted`):
   - No live coaching (because we don't want you dependent)
   - No community forums (but Wins Board coming soon)
   - No "motivation" (because decisions, not motivation)
4. Price comparison: "One therapy session: $150-300. The Right Decision: $197/year. That's $16/month."
5. Guarantee box: bordered card, `--warning` accent, "7-day money-back guarantee" prominently displayed
6. CTA: large gold button "Start for $197/year — 7-day guarantee"

### 3.9 DisqualSection

**Layout:** Two-column on desktop. Left: "Don't buy this if" (with X icons). Right: "This IS for you if" (with checkmark icons).

**Design:** `--bg-secondary` background. Clean, scannable. Mobile: stacked vertically, "IS for you" first.

### 3.10 FAQSection

**Layout:** Accordion pattern, max-width 800px centered. 6 questions from 05-landing-page Section 10.

**Accordion behavior:** Click to expand/collapse. Only one open at a time. First item open by default.

**Design:** Clean dividers between items. Question in Instrument Sans weight 600. Answer in base weight, `--text-secondary`.

### 3.11 FinalCTASection

**Layout:** Centered, minimal. `--bg-primary` background.

**Copy:**
> You've spent years understanding why you're stuck.
> You already know enough.
> The only thing missing is the decision.

**CTA:** Same gold button as hero. "Start for $197/year"
**Below CTA:** "7-day money-back guarantee. Cancel anytime. Your first decision happens in Week 1."

---

## 4. Visual Assets

### Custom illustrations (Nanobanana)

| Asset | Where used | Nanobanana prompt direction |
|---|---|---|
| Phase 1 illustration | MechanismSection | Minimal line art, person surveying a landscape, one path highlighted, warm gold line on cream |
| Phase 2 illustration | MechanismSection | Minimal line art, person writing on a single card, decisive posture, warm gold on cream |
| Phase 3 illustration | MechanismSection | Minimal line art, person mid-stride, light and forward, warm gold on cream |
| Founder portraits (optional) | FounderSection | Two warm minimal portrait sketches, circular crop, matching line art style |

**Style guide for all Nanobanana illustrations:**
- Line weight: medium, consistent
- Color: single accent color `#C4956A` (gold) on `#FAF8F5` (cream) background, or transparent
- Style: continuous line art, minimal, no fill, no gradients
- Mood: calm, intentional, warm — NOT corporate, NOT hustle-culture
- Format: SVG preferred (scalable, small file size), PNG fallback at 2x resolution
- Size: max 400x400px per illustration

### Typography assets
- Preload: Instrument Serif (italic + regular), Instrument Sans (400, 500, 600, 700)
- Source: Google Fonts
- Loading strategy: `<link rel="preload">` in `<head>`, `font-display: swap`

### No stock photos
Zero stock photography. The page is text + custom line art + solid backgrounds. This is a design decision (from 05-landing-page): "The words do the work."

---

## 5. Technical Specifications

### Stack
- **Renderer:** Hono SSR (zero client JS for initial render)
- **Styling:** Tailwind CSS v4 with design tokens from design.md
- **Interactivity:** Preact islands for FAQ accordion and mobile section toggles only
- **Framework:** Single Hono route serving the full page as SSR HTML

### Page structure
```
pages/
  landing.tsx          ← Hono SSR page, max 20 lines (wiring only)

features/
  (life)/
    landing-page/
      CLAUDE.md
      components/
        hero.tsx
        problem.tsx
        mechanism.tsx
        transformation.tsx
        curriculum.tsx
        founder.tsx
        social-proof.tsx
        offer.tsx
        disqualification.tsx
        faq.tsx           ← Preact island (accordion interactivity)
        final-cta.tsx
        cta-button.tsx    ← Shared CTA button component
      landing-page.tsx    ← Assembles all sections
      landing-page.test.ts
```

### Stripe Checkout integration
- **Flow:** CTA button → Stripe Checkout (hosted) → /purchase/success
- **Mode:** `mode: 'subscription'` (aligns with "$197/year" auto-renewal)
- **Implementation:** Single API endpoint `POST /api/checkout` that creates a Stripe Checkout Session and returns the URL
- **No client-side Stripe.js needed** — redirect to hosted checkout
- **Webhook:** `checkout.session.completed` → creates purchase record (handled by platform, not this PRD)

### A/B testing (headline variants)
- 4 variants stored in a constant array
- Selection: URL param `?v=a|b|c|d` for manual testing, random with localStorage for organic traffic
- Tracking: PostHog event `landing_headline_variant` with variant ID
- Winner selection: after 1000 visitors, compare funnel conversion per variant in PostHog

### Performance targets
| Metric | Target | How |
|---|---|---|
| First Contentful Paint | <1.5s | SSR, no client JS for initial render |
| Largest Contentful Paint | <2.5s | No hero image, preloaded fonts |
| Total page weight | <100KB (excluding fonts) | No images except custom illustrations |
| Font load | <50KB | Subset if needed, preload critical weights |
| Time to Interactive | <2s | Minimal Preact islands, lazy-load below fold |

### Third-party scripts
- **Above the fold:** None. Zero third-party scripts before the fold.
- **Below the fold (lazy-loaded):**
  - PostHog analytics (loaded after user interaction or 3s delay)
  - Stripe redirect (on CTA click only, not preloaded)

### SEO
- `<title>`: "The Right Decision — Life Decisions Course"
- `<meta name="description">`: "A methodology + AI that turns stuck goals into clear decisions. $197/year. 7-day guarantee."
- Open Graph tags for social sharing (og:title, og:description, og:image)
- og:image: generate a simple branded card via Nanobanana (1200x630px, cream bg, headline text, gold accent)
- Semantic HTML: `<header>`, `<main>`, `<section>`, `<footer>`
- No JavaScript required for content rendering (SSR)

### Accessibility
- All interactive elements keyboard-navigable
- FAQ accordion: `aria-expanded`, `aria-controls`, Enter/Space to toggle
- Color contrast: all text meets WCAG AA (verified: `--text-primary` on `--bg-primary` = 14.5:1)
- CTA buttons: min 48px touch target
- Skip navigation link for screen readers
- Alt text on all Nanobanana illustrations

### Mobile responsiveness
- Breakpoints: `sm` (640px), `md` (768px), `lg` (1024px)
- Mobile-first CSS: base styles are mobile, larger breakpoints add desktop layout
- Section reordering on mobile via CSS order property (see Section 2 mobile order)
- Touch targets: 48px minimum on all interactive elements
- Font scaling: hero headline 36px on mobile (down from 56px)

---

## 6. Don't Build List

| Feature | Why NOT | When to reconsider |
|---|---|---|
| Video hero / background video | Adds weight, slows LCP, text does the work | If bounce rate >70% after 1000 visitors |
| Chat widget / intercom | Adds complexity, no one to staff it | After first 100 customers |
| Email capture popup | Aggressive, contradicts anti-self-help positioning | Never — use the free course funnel instead |
| Countdown timers / fake scarcity | ICP burned by fake scarcity, trust > pressure | Never |
| Testimonial carousel | No real testimonials at launch | After 10+ real customer wins |
| Dark mode | Warm cream IS the brand identity | Phase 2 platform only |
| Multi-language | English first, PT-BR later | After product-market fit confirmed |
| Animated scroll effects | "Calm products don't animate" (design.md) | Never |
| Cookie consent banner | Only needed when PostHog is added | When analytics goes live |

---

## 7. Launch Checklist

### Pre-launch
- [ ] All 11 sections rendering correctly on desktop and mobile
- [ ] Stripe Checkout integration working (test mode → live mode)
- [ ] All 4 headline variants accessible via URL param
- [ ] Fonts preloaded, LCP < 2.5s verified
- [ ] Nanobanana illustrations generated and optimized (SVG or compressed PNG)
- [ ] og:image generated for social sharing
- [ ] FAQ accordion keyboard-accessible
- [ ] Mobile section reordering verified on real device
- [ ] Copy reviewed against voice.md (Indy Test passed)
- [ ] All links working (CTAs → Stripe, scroll links → correct sections)

### Post-launch (first 30 days)
- [ ] PostHog tracking live (page views, scroll depth, CTA clicks, variant assignment)
- [ ] Monitor: bounce rate, scroll depth 50%, CTA click rate per variant
- [ ] After 1000 visitors: pick headline winner, lock it in
- [ ] After first 10 customers: add real wins to SocialProofSection
- [ ] Weekly: check page speed (should stay <2.5s LCP)

---

## 8. Decision Audit Trail

| Date | Decision | Why | Revisit signal |
|---|---|---|---|
| 2026-04-07 | Landing page as separate PRD from platform | Landing page is purely frontend, ships independently of course player/onboarding | If landing page needs dynamic content from the platform |
| 2026-04-07 | Hono SSR, not SPA | Zero client JS for marketing page = fastest possible load. Preact islands only for FAQ accordion. | If interactive features are needed (A/B, personalization) |
| 2026-04-07 | Nanobanana for custom illustrations | Custom warm line art > stock photos. Matches Ethereal Warmth aesthetic. Free tool. | If illustration quality insufficient, consider commissioning an illustrator |
| 2026-04-07 | No email capture on landing page | Landing page sells the paid course. Free course funnel is a separate flow. Mixing creates confusion. | If paid conversion <1%, add free course CTA as secondary |
| 2026-04-07 | Mobile section reordering (Offer moved up) | ICP decides on phone. Price anxiety must resolve in first 3 screens. | If mobile conversion equals desktop, reorder may be unnecessary |
| 2026-04-07 | Simple localStorage A/B, not external tool | No external dependencies for V1. PostHog funnel analysis is sufficient. | After 10K visitors, consider proper A/B platform |
| 2026-04-07 | Stripe subscription mode (not one-time) | "$197/year" implies auto-renewal. Subscription mode handles renewal automatically. | If churn is high, consider annual one-time with manual renewal |

---

## Appendix: Image Generation Reference (Nanobanana)

### What is Nanobanana
Nanobanana is a Google tool for generating custom images using AI. It produces high-quality illustrations that can be directed with style prompts.

### How to use for this project
1. Go to Nanobanana (Google search: "nanobanana google")
2. Use the style prompt template below for consistency across all illustrations
3. Generate at 2x resolution, export as PNG, optimize with `squoosh` or similar
4. If SVG is supported, prefer SVG for scalability

### Style prompt template
```
Minimal line illustration on cream background (#FAF8F5).
Single continuous warm gold line (#C4956A). No fill, no gradients.
Clean, elegant, calm. Hand-drawn feeling but precise.
Style: minimal editorial illustration for a premium self-development brand.
Not corporate. Not hustle-culture. Not spiritual.
[SPECIFIC SCENE DESCRIPTION HERE]
```

### Generated assets checklist
- [ ] Phase 1: Person surveying landscape with one clear path
- [ ] Phase 2: Person writing on a card, decisive posture
- [ ] Phase 3: Person mid-stride, light and forward
- [ ] Founder portraits: Two warm minimal portrait sketches (optional)
- [ ] OG image: 1200x630px branded card for social sharing
