# The 10-Star Editorial Course Experience — Strategy Document

> Created: 2026-04-08
> Reviews: office-hours (APPROVED), CEO review (CLEAR, 6/6 expansions), eng review (CLEAR, 0 critical gaps), design review (7→9/10)
> Source: /office-hours design doc + /plan-ceo-review + /plan-eng-review + /plan-design-review
> Pipeline: office-hours → plan-ceo-review → plan-eng-review → plan-design-review → **d-tasks** → d-code

## Purpose

Transform the course platform from "functional MVP with plain text rendering" into a 10-star editorial reading experience where the course itself practices the methodology it teaches. The course is the unboxing for the Claude skills (the real product). A cheap unboxing undercuts trust before the real product gets a chance.

## Problem Statement

Content is rendered as plain text with `whitespace-pre-wrap` (no markdown rendering). The design system (Ethereal Warmth, Instrument Serif/Sans, warm cream palette) exists in `decisions/design.md` but is barely applied to course components. For an ICP who has spent $4,700+ on self-help courses, this triggers "oh, another half-baked thing" before she ever reaches the skills.

## Core Thesis

Premium through subtraction, not addition. The ICP has taken every Kajabi course. Another dashboard triggers "here we go again." The anti-self-help positioning means the course should feel like reading a beautifully designed book, not taking an online course. The Steve Jobs insight: craft, not features.

**EUREKA:** No course platform in the landscape does what we're building. Video courses are passive. Text courses are passive. This is the first course where the reading experience itself practices the skill being taught (deciding) through in-class micro-decisions.

## Premises (validated by /office-hours + Codex)

1. The course is the unboxing for the skills (the real product)
2. Premium = craft, not features (typography, spacing, transitions, mobile-first)
3. Core features only. No quizzes, certificates, community, AI chatbot
4. Mobile must be perfect. ICP reads on her phone
5. Anti-self-help aesthetic. More like a beautifully designed book than a course platform
6. Architecture stays. Craft pass + targeted new features, not a rebuild

## Scope Decisions (from CEO Review — SCOPE EXPANSION)

| # | Proposal | Effort (CC) | Decision | Reasoning |
|---|----------|-------------|----------|-----------|
| 1 | In-Class Micro-Decisions | 2-3 days | ACCEPTED | The single biggest differentiator. Turns passive reading into active practice. |
| 2 | Your Journey Page | 2-3 days | ACCEPTED | Retention hook + growth engine. The screenshot IS the marketing. |
| 3 | Reading Analytics | 4 hours | ACCEPTED | Tiny effort, huge product intelligence. |
| 4 | Multi-Course Architecture | 1-2 days | ACCEPTED | Two-way door. Costs almost nothing now, saves weeks later. |
| 5 | Share Moments | 1-2 days | ACCEPTED | Organic growth. Every share is a free testimonial. |
| 6 | Reading Time + Session Memory | 2-3 hours | ACCEPTED | 30-minute delight. "Oh nice, they thought of that." |

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        BROWSER (Preact)                      │
│  ┌─────────┐  ┌──────────┐  ┌─────────┐  ┌──────────────┐  │
│  │Dashboard │  │ClassView │  │Journey  │  │Course Listing│  │
│  │(chapters)│  │(reading  │  │(timeline│  │(multi-course)│  │
│  │         │  │ room)    │  │ viz)    │  │             │  │
│  └────┬────┘  └────┬─────┘  └────┬────┘  └──────┬──────┘  │
│       └────────────┴─────────────┴───────────────┘          │
│  Mobile Bottom Nav: [ ← Back ] [ Next → ] [ ♥ ] [ ≡ ]      │
│  Client: Reading Analytics (IntersectionObserver)            │
│  Client: Session Memory (localStorage)                       │
│  Client: Reading Progress Bar (scroll %)                     │
└──────────────────────────┬───────────────────────────────────┘
                           │ htmx / fetch
┌──────────────────────────┴───────────────────────────────────┐
│                     HONO SERVER (SSR)                         │
│  GET  /courses                    → CourseListingPage         │
│  GET  /courses/:slug              → CourseDashboard           │
│  GET  /courses/:slug/module/:num  → ModuleLandingPage         │
│  GET  /courses/:slug/class/:id    → ClassView                 │
│  GET  /journey                    → YourJourneyPage           │
│  POST /api/decisions/save         → saveDecision (NEW)        │
│  POST /api/analytics/reading      → logReading (NEW)          │
│  GET  /api/share/:type/:id        → generateShareImage (NEW)  │
│  Content Provider: content/courses/{slug}/en/module-XX/...    │
└──────────────────────────┬───────────────────────────────────┘
                           │
┌──────────────────────────┴───────────────────────────────────┐
│                     POSTGRESQL (Railway)                      │
│  Existing: users, sessions, subscriptions, courseProgress,   │
│            bookmarks                                         │
│  New:      userDecisions, readingAnalytics                   │
└──────────────────────────────────────────────────────────────┘
```

### URL Scheme (decided: full paths)

```
/courses                                    → Course listing
/courses/life-decisions                     → Dashboard (chapter list)
/courses/life-decisions/module/1            → Module landing page
/courses/life-decisions/class/module-01/class-01  → Class view (reading room)
/journey                                    → Your Journey timeline
```

### New DB Tables

```sql
userDecisions(
  id uuid PK, userId uuid FK→users CASCADE,
  classId text NOT NULL, courseSlug text NOT NULL,
  decisionType text NOT NULL ('text' | 'choice'),
  prompt text NOT NULL, response text NOT NULL,
  createdAt timestamp DEFAULT now(), updatedAt timestamp DEFAULT now(),
  UNIQUE(userId, classId)
)

readingAnalytics(
  id uuid PK, userId uuid FK→users CASCADE,
  classId text NOT NULL, courseSlug text NOT NULL,
  timeSpentSec integer DEFAULT 0, scrollDepth integer DEFAULT 0,
  completedAt timestamp,
  createdAt timestamp DEFAULT now(), updatedAt timestamp DEFAULT now(),
  UNIQUE(userId, classId)
)
```

## Key Engineering Decisions (from Eng Review)

| Decision | Choice | Reasoning |
|----------|--------|-----------|
| Markdown renderer | marked (no DOMPurify server-side) | Content is trusted local .mdx files. Sanitize only user input for share images. |
| OG image generation | satori + @resvg/resvg-js | Standard approach. SVG fallback if resvg has Bun issues. Cache by decision ID. |
| Micro-decision locking | 5-minute edit window, then locked | Uses `createdAt` comparison. Handles typos without contradicting "decide and move." |
| Content migration | Atomic move in one commit | Pre-revenue, Railway deploys are atomic (container swap). No symlink bridge needed. |
| Analytics error handling | Swallow + log (fire-and-forget) | Analytics failure must never impact reading experience. |
| Editorial components | Custom marked extensions or CSS classes | `> [!quote]` and `> [!insight]` blockquote prefixes. Drop caps via CSS `::first-letter`. |

## Design Specifications (from Design Review — 7→9/10)

### The Reading Room (Class View)

- Centered single column, `max-width: 65ch`, generous margins
- Desktop: whitespace IS the design (like a book page, not a dashboard)
- Background: `--bg-primary` (#FAF8F5)
- Heading: Instrument Serif, `--text-primary` (#1A1714)
- Body: Instrument Sans, base/lg size, `line-height: 1.6`
- Subtle reading progress bar at top of viewport
- Entry animation: gentle fade-in (300ms, respect `prefers-reduced-motion`)
- Breadcrumb: "Module 1 > Class 2 of 4" with back-to-module link
- Previous/Next: chapter-style with class titles at bottom
- Practice classes: `--bg-secondary` (#F2EDE6) background, "Exercise" label

### The Micro-Decision Moment (THE 10-star moment)

**Choreography:**
1. User reads the last paragraph before the decision point
2. After a natural content break, the prompt container fades in (300ms, opacity + transform)
3. Prompt text in Instrument Serif italic: *"What is YOUR version of Luana's trap?"*
4. Below: single-line text input, sand background, `--accent` (#C4956A) border on focus
5. Below: warm amber button "I've decided" (NOT "Submit")
6. After submission: input fades out, replaced by pull quote in Instrument Serif with warm gold left border
7. Small "Decided · just now" label beneath
8. During 5-min edit window: small "Edit" link visible. After 5 min: disappears.
9. Respects `prefers-reduced-motion` — no fade, prompt is just there

### Dashboard ("The Quiet Chapter List")

- Chapter-list layout (like a book's table of contents), NOT a module grid
- Each module: number, title, subtitle, progress as "3 of 4 read"
- Current position: warm gold accent (`--accent`)
- Primary CTA: "Continue reading" — warm, inviting, not urgent
- Decision anchor (throughline) with editorial treatment
- Locked modules: "Chapters 3-9: available with full access" (graceful, not gray-out)
- Overall progress: subtle element in header, not dominating

### Journey Page (Timeline)

- Vertical timeline, centered on mobile
- Line: 2px `--bg-tertiary` (#E8E0D4)
- Decision nodes: 12px circles, `--accent` when decided, `--bg-tertiary` when future
- Decision text: Instrument Serif italic, `--text-primary`
- Date: Instrument Sans, `--text-muted`
- Throughline: warm gold banner at top (same as dashboard decision anchor)
- Empty state: "Your journey begins with your first decision. Start reading, and when the moment arrives, you'll know." + warm illustration + "Continue reading" CTA
- At course completion: share button appears

### Mobile Bottom Nav

- Fixed, 56px height (44px touch target + 12px safe area)
- Background: `--surface-white` (#FFFFFF), top border: 1px `--bg-tertiary`
- Items: Back, Next, Bookmark (gold heart when active), Menu
- Active icon: `--accent`, inactive: `--text-muted`
- Keyboard-accessible, `focus-visible` ring
- Safe area insets: `env(safe-area-inset-bottom)`

### Menu Overlay

- Full-screen overlay, warm cream `--bg-primary` background
- Contents: Course (dashboard link), Journey, Bookmarks, Account
- If paid: all module links visible
- Table of contents metaphor — matches the book aesthetic

### Share Card

- Server-side generated via satori + resvg
- Warm cream background, Instrument Serif for the user's decision text
- Right Decision branding
- Privacy: opt-in + preview before sharing (non-negotiable)
- Decision text sanitized before rendering (XSS prevention)
- Cached by (type, id) hash

### Interaction States

```
FEATURE              | LOADING        | EMPTY              | ERROR            | SUCCESS
---------------------|----------------|--------------------|-----------------|---------
Dashboard            | Skeleton       | "Begin your        | Retry CTA       | Chapter list
                     |                | journey" CTA       |                 |
Class View           | Fade-in        | N/A                | Plain text FB   | Rendered MDX
Micro-Decision       | —              | Prompt + input     | "Could not save"| Locked quote
Journey              | Skeleton       | "Your journey      | Retry CTA       | Timeline
                     |                | begins..." + CTA   |                 |
Share Card           | Spinner        | N/A                | Retry           | Preview + share
Course Listing       | Skeleton       | "Courses coming    | Retry CTA       | Course cards
                     |                | soon"              |                 |
```

### Performance Budget

- First Contentful Paint < 1.5s on 3G mobile
- Total page weight < 500KB (excluding cached fonts)
- Fonts: Instrument Serif + Sans via Google Fonts, `font-display: swap` (self-host if FOUT is visible)
- Images: WebP, max 150KB per illustration, lazy loaded (eager for hero)
- No JS framework additions. Transitions via CSS. Reading progress via vanilla JS (<1KB)

### Accessibility

- WCAG 2.1 AA contrast on all cream backgrounds
- `font-display: swap` on all fonts
- All bottom nav items keyboard-accessible with `focus-visible`
- `prefers-reduced-motion` respected throughout
- Heading hierarchy: h1 for class title, h2/h3 for content
- Touch targets: 44px minimum
- Journey timeline: `role="list"` with `role="listitem"`

## Implementation Order

| Phase | Steps | What Ships | Effort (CC) |
|-------|-------|-----------|-------------|
| 0 | Validate + Spike | Read Module 1 with Indy on phone. Spike marked rendering. | 1 day |
| 1 | Core Craft | MDX rendering, design tokens, class view (reading room), dashboard (chapter list), mobile bottom nav | 3-5 days |
| 2 | Multi-Course | Content provider refactor, courses.json, course listing page, atomic content directory move | 1-2 days |
| 3 | Micro-Decisions | userDecisions table, MicroDecision component, API, content tagging, 5-min edit window | 2-3 days |
| 4 | Journey + Analytics | Your Journey page, reading analytics, timeline component | 2-3 days |
| 5 | Editorial + Art | Pull quotes, callouts, drop caps, AI illustrations (DALL-E 3), page transitions | 3-5 days |
| 6 | Share + Polish | Share moments (satori), reading time, session memory, time nudge polish | 2-3 days |

**Total: 14-22 wall-clock days with CC+gstack.** Each phase ships independently.

### Parallel Lanes

- **Lane A:** Phase 1 → Phase 2 (sequential, shared content provider)
- **Lane B:** Phase 5 (AI illustrations + editorial — independent after Phase 1)
- **Lane C:** Phase 3 → Phase 4 → Phase 6 (sequential, decision chain)
- Execute: Phase 1 first. Then launch A + B + C in parallel.

## The Assignment (Step 0)

Before building: sit down with Indy and read through Module 1 together on a phone. Not desktop. Phone. Notice what feels wrong. Write down 5 specific things. That list validates or adjusts every design decision above.

## Future Vision (Captured, Not In Scope)

1. Multi-course content (10+ bonus courses: AI for health, relationships, personality)
2. Free content strategy (product-led growth, mini-methodology course)
3. AI agent platform (personal decision agent, usage-based pricing)
4. Native mobile app
5. Reflection checkpoints (deferred pending reading experience validation)
6. Dark mode (Phase 2, doesn't fit warm cream brand identity for Phase 1)
7. Offline/PWA reading

## Review Summary

| Review | Status | Key Findings |
|--------|--------|-------------|
| /office-hours | APPROVED | Book metaphor, subtraction over addition, anti-Kajabi |
| /plan-ceo-review | CLEAR | 6/6 expansions accepted (micro-decisions, journey, analytics, multi-course, share, session memory) |
| /plan-eng-review | CLEAR | No DOMPurify server-side, satori+resvg, 5-min edit window, 3 parallel lanes, 0 critical gaps |
| /plan-design-review | 7→9/10 | Micro-decision choreography, centered column desktop, menu overlay, journey timeline tokens |
| Outside voice (Codex) | 22 findings | Strategic calibration resolved (build full, then sell), typo correction resolved (5-min window) |
