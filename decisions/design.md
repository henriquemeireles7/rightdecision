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
- **Data/Tables:** Instrument Sans (tabular-nums)
- **Code/Prompts:** Geist Mono — clean monospace for AI prompt templates
- **Loading:** Google Fonts `family=Instrument+Sans:wght@400;500;600;700&family=Instrument+Serif:ital@0;1` + Geist Mono
- **Scale:**
  - xs: 12px / 0.75rem
  - sm: 14px / 0.875rem
  - base: 16px / 1rem
  - lg: 19px / 1.1875rem
  - xl: 24px / 1.5rem
  - 2xl: 32px / 2rem
  - 3xl: 36px / 2.25rem
  - 4xl: 48px / 3rem
  - hero: 56px / 3.5rem

## Color
- **Approach:** Restrained (one accent + warm neutrals, color is rare and meaningful)
- **Palette:**
  - `--bg-primary`: #FAF8F5 — warm off-white, main background
  - `--bg-secondary`: #F2EDE6 — sand, cards and sections
  - `--bg-tertiary`: #E8E0D4 — linen, hover states and borders
  - `--text-primary`: #1A1714 — warm near-black, headings
  - `--text-secondary`: #6B6258 — warm gray-brown, body text
  - `--text-muted`: #A69D91 — soft taupe, captions and timestamps
  - `--accent`: #C4956A — warm amber/gold, CTAs and active states
  - `--accent-hover`: #B07D4F — deeper amber, hover states
  - `--surface-white`: #FFFFFF — true white, inputs and modals
  - `--success`: #6B8F5E — sage green, completed states
  - `--error`: #C25B4A — terracotta, errors
  - `--warning`: #D4A843 — warm gold, warnings
  - `--info`: #7B8FA6 — muted blue-gray, informational
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
- **Easing:** enter(ease-out) exit(ease-in) move(ease-in-out)
- **Duration:** micro(100ms) short(150ms) medium(200ms)
- **Rules:** No scroll animations. No entrance effects. No bouncing. The content IS the effect. Calm products don't animate.

## Component Patterns
- **Buttons:** Primary (gold bg, white text), Secondary (sand bg, dark text), Ghost (transparent, border)
- **Cards:** White surface, 1px linen border, md radius. Hover: gold border, subtle shadow.
- **Inputs:** White surface, linen border, sm radius. Focus: gold border.
- **Alerts:** Tinted backgrounds matching semantic color (success=green tint, error=red tint)
- **Module cards:** White surface, left-accent for active state, numbered badges
- **Prompt templates:** Sand background, monospace text in white card, "Copy" action in gold
- **Navigation:** Logo in Instrument Serif, links in sans, gold CTA button

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-04-02 | Initial design system created | Ethereal Warmth aesthetic for agent-first self-development platform. Inspired by Intercom warmth + Stripe precision. Instrument Serif for intellectual depth. |
| 2026-04-02 | No dark mode for Phase 1 | Warm cream palette IS the brand identity. Dark mode would flatten personality. Revisit for Phase 2 AI platform. |
| 2026-04-02 | Instrument Serif for display | Serif in a tech/course product signals depth and intellectual weight. Differentiates from all-sans competitors. |
