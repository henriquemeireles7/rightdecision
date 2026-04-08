# Design System — Right Decision

## Product Context
- **What this is:** Online course platform + future AI decision-making agent
- **Who it's for:** Millennial women (30s-50s) who have "done the work" but are stuck
- **Space/industry:** Self-development, anti-self-help
- **Project type:** Course platform (Phase 1), AI platform (Phase 2)

## Aesthetic Direction
- **Direction:** Ethereal Warmth
- **Decoration level:** Intentional (subtle warm grain, natural light shadows, not sterile, not noisy)
- **Mood:** Morning light through linen curtains. Calm authority. "You already know what to do. We help you see it clearly." Not corporate. Not hustle-culture. Not spiritual-woo. The visual opposite of both.
- **Reference sites:** Intercom (warm beige, approachable), Stripe (polish, precision), Linear (clean engineering)
- **Anti-patterns:** No purple gradients. No 3-column icon grids. No centered-everything. No decorative blobs. No AI slop.

## Typography
- **Display/Hero:** Instrument Serif — elegant without being precious. Serifs signal intellectual depth in a tech product. Used only for the biggest headings.
- **Body:** Instrument Sans — same family, cohesive. Clean, modern, excellent readability.
- **UI/Labels:** Instrument Sans (weight 500-600)
- **Data/Tables:** Instrument Sans (`font-variant-numeric: tabular-nums`)
- **Code/Prompts:** Geist Mono — clean monospace for AI prompt templates (disable ligatures: `font-variant-ligatures: none`)
- **Loading:** Google Fonts `family=Instrument+Sans:wght@400;500;600;700&family=Instrument+Serif:ital@0;1` + Geist Mono. Use `font-display: swap` on all `@font-face` declarations.
- **Fluid type:** Use `clamp()` for hero/display text so it scales between mobile and desktop without breakpoints. Fixed `rem` values for body/UI text.
- **Scale (modular ratio ~1.333 — Perfect Fourth):**
  - xs: 12px / 0.75rem
  - sm: 14px / 0.875rem
  - base: 16px / 1rem (minimum body size, never go below)
  - lg: 19px / 1.1875rem
  - xl: 24px / 1.5rem
  - 2xl: 32px / 2rem
  - 3xl: 36px / 2.25rem
  - 4xl: clamp(2.5rem, 2rem + 2vw, 3rem)
  - hero: clamp(2.75rem, 2rem + 3vw, 3.5rem)
- **Line length:** `max-width: 65ch` on reading text (prose paragraphs, course content)
- **Vertical rhythm:** base line-height 1.6 for body, 1.2 for headings. Spacing between text blocks should be multiples of `line-height × font-size`.

## Color
- **Approach:** Restrained (one accent + warm neutrals, color is rare and meaningful)
- **Distribution:** 60-30-10 rule — 60% neutrals (cream/sand), 30% secondary (linen/surface), 10% accent (gold)
- **Color space:** Use OKLCH for any computed colors (tints, hover states, transparency). OKLCH is perceptually uniform — `oklch(70% 0.15 60)` produces predictable results unlike HSL.
- **Palette:**
  - `--bg-primary`: #FAF8F5 — warm off-white, main background
  - `--bg-secondary`: #F2EDE6 — sand, cards and sections
  - `--bg-tertiary`: #E8E0D4 — linen, hover states and borders
  - `--text-primary`: #1A1714 — warm near-black, headings
  - `--text-secondary`: #6B6258 — warm gray-brown, body text
  - `--text-muted`: #A69D91 — soft taupe, captions and timestamps (still must meet 4.5:1 contrast on its background)
  - `--accent`: #C4956A — warm amber/gold, CTAs and active states
  - `--accent-hover`: #B07D4F — deeper amber, hover states
  - `--surface-white`: #FFFFFF — true white, inputs and modals
  - `--success`: #6B8F5E — sage green, completed states
  - `--error`: #C25B4A — terracotta, errors
  - `--warning`: #D4A843 — warm gold, warnings
  - `--info`: #7B8FA6 — muted blue-gray, informational
- **Rules:** Never use pure `#000` or `#fff` for text/backgrounds outside of inputs/modals. Never rely on color alone to convey information — always pair with text, icons, or patterns.
- **Dark mode:** Not for Phase 1. The warm cream palette IS the brand identity. Consider for Phase 2 AI platform where dark mode fits the "agent" context.

## Spacing
- **Base unit:** 8px
- **Density:** Comfortable (generous breathing room, not cramped, not drowning)
- **Scale:** 2xs(2) xs(4) sm(8) md(16) lg(24) xl(32) 2xl(48) 3xl(64) 4xl(96)

## Layout
- **Approach:** Grid-disciplined with generous breathing room
- **Grid:** 12-column, 1200px max-width
- **Max content width:** 1200px (outer), 800px (text content), 640px (reading)
- **Border radius:**
  - sm: 8px (buttons, inputs, tags)
  - md: 12px (cards, alerts)
  - lg: 16px (modals, hero sections)
  - full: 9999px (pills, badges)

## Motion
- **Approach:** Minimal-functional (only transitions that aid comprehension)
- **Easing:** enter(`cubic-bezier(0.25, 1, 0.5, 1)` — quart-out) exit(`ease-in`) move(`ease-in-out`). Never use bounce or elastic easing.
- **Duration:** micro(100-150ms) for hover/toggle, state-change(200-300ms) for panels/modals, structural(300-500ms) for layout shifts. Exit = 75% of entrance duration.
- **Performance:** Only animate `transform` and `opacity`. For height transitions, use `grid-template-rows: 0fr → 1fr` (no layout thrashing).
- **Accessibility:** Always respect `prefers-reduced-motion: reduce` — disable all non-essential animation. ~35% of older populations (our ICP) have this enabled.
- **Rules:** No scroll animations. No entrance effects. No bouncing. The content IS the effect. Calm products don't animate.

## Interaction States
Every interactive element must handle these 8 states (not all visual — but all accounted for):
1. **Default** — resting appearance
2. **Hover** — cursor over (desktop only, use `@media (hover: hover)`)
3. **Focus** — keyboard navigation (use `:focus-visible`, never `outline: none` without replacement)
4. **Active** — being pressed/clicked
5. **Disabled** — not available (reduced opacity + `cursor: not-allowed`)
6. **Loading** — processing (spinner or skeleton, never freeze the UI)
7. **Error** — invalid state (terracotta border/text)
8. **Success** — completed action (sage green confirmation)

## Component Patterns
- **Buttons:** Primary (gold bg, white text), Secondary (sand bg, dark text), Ghost (transparent, border). All buttons: min 44px touch target even if visually smaller.
- **Cards:** White surface, 1px linen border, md radius. Hover: gold border, subtle shadow. Only use cards for truly distinct content or clear interaction boundaries — never nest cards inside cards.
- **Inputs:** White surface, linen border, sm radius. Focus: gold border + `box-shadow` ring.
- **Alerts:** Tinted backgrounds matching semantic color (success=green tint, error=red tint)
- **Modals:** Use native `<dialog>` element with `inert` attribute on background content. Never roll custom overlay logic.
- **Tooltips/Dropdowns:** Use Popover API where supported, fallback to positioned absolute.
- **Module cards:** White surface, left-accent for active state, numbered badges
- **Prompt templates:** Sand background, monospace text in white card, "Copy" action in gold
- **Navigation:** Logo in Instrument Serif, links in sans, gold CTA button
- **Empty states:** Onboarding opportunity, not dead ends. Show what the user CAN do, not just "nothing here."
- **Error messages:** Three-part framework: what happened → why → how to fix it. Never use humor for errors.

## Z-Index Scale
Semantic layers — never use arbitrary values like `9999`:
- `--z-dropdown`: 100
- `--z-sticky`: 200
- `--z-modal-backdrop`: 300
- `--z-modal`: 400
- `--z-toast`: 500
- `--z-tooltip`: 600

## Responsive
- **Approach:** Mobile-first. Use `min-width` media queries only — never desktop-first `max-width`.
- **Breakpoints:** Let content dictate breakpoints. Default: `sm(640px)` `md(768px)` `lg(1024px)`. Three is usually enough.
- **Component-level:** Use `@container` queries for components that need to adapt to their container, not the viewport.
- **Input detection:** Use `@media (hover: hover)` and `@media (pointer: fine/coarse)` to adapt hover effects and touch targets by device capability.
- **Safe areas:** Use `env(safe-area-inset-*)` for content near screen edges (notches, rounded corners).
- **Testing:** Test on at least one real iPhone and one real Android. Simulators miss touch behavior and font rendering.

## Accessibility
- **Contrast:** All text must meet WCAG 2.1 AA (4.5:1 for normal text, 3:1 for large text). Check `--text-muted` on every background it appears on.
- **Touch targets:** Minimum 44×44px interactive area, even if the visual element is smaller (use padding).
- **Focus indicators:** Never remove focus outlines. Use `:focus-visible` for keyboard-only ring (gold `box-shadow`).
- **Motion:** Wrap all non-essential animations in `@media (prefers-reduced-motion: no-preference)`.
- **Color:** Never use color as the sole indicator — pair with icons, text, or patterns.
- **Semantic HTML:** Use `<button>` for actions, `<a>` for navigation. Use `<dialog>` for modals. Use heading hierarchy (h1→h2→h3, never skip).
- **Link text:** Must be meaningful standalone ("View pricing plans" not "Click here").

## The AI Slop Test
Before shipping any page, ask: "Would someone immediately recognize this was AI-generated?" If yes, redesign. Common AI slop patterns to avoid:
- Glassmorphism / frosted glass effects
- Gradient text on metrics or numbers
- Identical 3-column icon+heading+text card grids
- Everything centered with no visual hierarchy
- Dark mode with glowing neon accents
- Monospace font used as lazy "technical" aesthetic
- Generic stock-photo hero sections
- "Built with AI" badge-flex energy

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-04-02 | Initial design system created | Ethereal Warmth aesthetic for agent-first self-development platform. Inspired by Intercom warmth + Stripe precision. Instrument Serif for intellectual depth. |
| 2026-04-02 | No dark mode for Phase 1 | Warm cream palette IS the brand identity. Dark mode would flatten personality. Revisit for Phase 2 AI platform. |
| 2026-04-02 | Instrument Serif for display | Serif in a tech/course product signals depth and intellectual weight. Differentiates from all-sans competitors. |
