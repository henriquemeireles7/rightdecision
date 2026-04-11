# INPUT: PRD (Life Decisions)

## Key Decisions Made

### 1. Two-App Architecture
- **Web app** (rightdecision.io): course player, onboarding, auth, payment, Wins Board, progress tracking
- **Claude Cowork** (user's desktop): AI skills, decision work, methodology exercises, file storage
- **V1 connection:** None. The two apps are separate. Skills-to-API connection deferred to V1.1
- **Rationale:** Simplest to build. Matches "your computer, your data" positioning. Skills are docs-only.

### 2. Onboarding = Course Introduction
- Onboarding IS the first step of the methodology, not a separate flow
- User can't see the course until onboarding is complete
- Shared between free and paid users (same onboarding, different course unlocked after)
- Data capture happens DURING the onboarding, woven into the experience
- Email capture is the LAST step before course unlock + soft paywall
- Soft paywall after onboarding: "Get the full course for $197/year" / "No, take me to my free course"
- Onboarding completion rate = key metric for both free and paid funnels
- A/B testable: email timing, paywall placement

### 3. Decision Primitive — DEFERRED
- No decision object in the web app for V1
- The decision lives in Claude Cowork files (raw.md, document.md per methodology phase)
- The web app doesn't need to know about the decision
- V1.1 question: should skills call our API to sync structured output to the platform?
- Founder's test: "does this add value?" — unproven for V1

### 4. Time-Bounded Phases — Soft Nudges
- Suggested timelines per phase (e.g., "3 days recommended for state mapping")
- Reminders (email? in-app?) but user can proceed at own pace
- No hard gates, no forced waiting
- Rationale: reduces drop-off risk from pressure while addressing the preparation trap

### 5. Wins Board — IN V1 (Simplified)
- Write-only: user writes milestone wins (not just resolution wins)
- Context-based wins: "I have clarity on X" not "I completed Phase 3"
- The win is about doing the WORK, not doing the PRACTICE
- Public feed: all wins visible, anonymous (no usernames)
- Categorized by life area: health, relationships, career, money
- NO comments, NO community features, NO reactions
- Serves: social proof for new users, retention for existing users, methodology embedding

### 6. Course Content Architecture
- **Format:** Video (externally hosted) + text summary per class
- **Storage:** Markdown files in codebase (content/courses/[course-name]/...)
- **Videos:** External hosting (YouTube unlisted, Vimeo, or Bunny.net) — embedded in page
- **Progress:** PostgreSQL tracking (user_id + class_id + completed_at)
- **Navigation:** Sequential progression + reference navigation (search, bookmarks)

### 7. Two Courses in V1
- **Free mini-course:** Simplified methodology, different content, standalone lead gen
- **Paid full course:** 3 acts, 9 modules, ~23 hours, the complete methodology
- **Same platform:** Both courses run on the same web app infrastructure
- **Same onboarding:** Shared onboarding flow, diverges at soft paywall
- **Content is code:** Markdown files, AI-generated copy. Infra work is minimal.

### 8. Onboarding Data Capture — Rich Profile
Collected during interactive onboarding:
- Name
- 3 throughline questions ("What have you been avoiding?", "One thing to change in 90 days?", "What decision would make everything else easier?")
- Age range
- Life areas to change (health/career/relationships/money — multi-select)
- What they've tried before (therapy/courses/coaching/books/nothing — multi-select)
- How long they've been stuck
- Email (captured LAST, before course unlock)

### 9. Free User Flow
1. User arrives (from landing page, social media, etc.)
2. Starts interactive onboarding (no account needed)
3. Answers onboarding questions (rich profile captured)
4. Watches/reads introductory content
5. Email capture (last step before unlock)
6. Soft paywall: "Full course $197/year" vs "Free mini-course"
7. If free: access to free mini-course
8. If paid: Stripe checkout → account creation → full course

## JTBD Scope Adjustments from Founder Input

### Promoted from V2 to V1:
- **Wins Board** (simplified: write-only, anonymous, public feed, no community)
- **Free mini-course** (was doc 06, NOT STARTED — now required for V1)

### Deferred from V1:
- **Decision primitive** (no decision object in web app — lives in Claude Cowork)
- **Skills-to-API connection** (no sync between Claude Cowork and web app)
- **Hard time-bounding** (soft nudges only)

### New for V1 (not in JTBD):
- **Interactive onboarding as methodology introduction** (shared free/paid flow)
- **Soft paywall after onboarding** (free → paid conversion point)
- **Rich profile data capture** (ICP intelligence for copy/marketing)
- **A/B testable onboarding** (email timing, paywall placement)

## Tech Stack (from coding.md)
- Bun, Hono, Preact, Drizzle, Zod, PostgreSQL (Railway), Better Auth, Stripe, Tailwind
- Course content: Markdown files in codebase
- Video hosting: External (YouTube unlisted / Vimeo / Bunny.net)
- Design system: Ethereal Warmth (decisions/design.md)
