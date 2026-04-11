# Product Requirements Document — Life Decisions V1
**Version:** 2.0
**Date:** 2026-04-06
**Status:** Draft (post-autoplan review)
**Review:** CEO + Design + Eng review complete. 26 decisions applied. See Decision Audit Trail.
**Author:** Henry + Claude
**Meta-doc:** decisions/lifedecisions/08-prd/meta.md
**Input:** decisions/lifedecisions/08-prd/input.md + raw.md
**Pipeline:** d-meta → d-input → d-plan (here)

## Document scope
**This document IS:** A PRD for Life Decisions V1 ($197/year). Defines what ships, what doesn't, user flows, feature requirements, data model, and success metrics. Written for a solo developer (Henry) + AI agents to build from without asking clarifying questions.
**This document is NOT:** The JTBD analysis (doc 07 — this consumes it). Not the methodology (doc 03). Not the course outline (doc 04). Not the landing page (doc 05). Not a technical architecture doc (doc 09 — this feeds it).
**Scope boundary:** Life Decisions B2C product only. Web app (course platform + onboarding + Wins Board) + AI skills in Claude Cowork. No Business Decisions features. No paid traffic. No content automation.
**Research status:** Inherits JTBD confidence levels. All product decisions are hypotheses until validated by real users.
**Primary reader:** Henry (to build it), AI agents (to implement features), Indy (to validate user-facing experience matches brand).

---

## 1. Product Overview + JTBD Traceability + Anxiety Architecture

### What Life Decisions V1 Is

A web application at rightdecision.io paired with Claude Cowork skills that together deliver The Right Decision methodology for personal life transformation.

**Two-app architecture:**
- **Web app** (rightdecision.io): interactive onboarding, course player (free + paid), Wins Board, auth, payment, progress tracking
- **Claude Cowork** (user's desktop): AI skills for each methodology phase — the exercises. Skills ask questions, user answers, AI structures the output into personal files

The two apps are **separate in V1**. No API connection between them. The web app teaches *why*. Claude Cowork does the *doing*. Connection (skills calling our API) is deferred to V1.1 — pending validation that users want it.

**Core job served (JTBD Section 3):**
> "When I've been going in circles on a decision that matters — and I've already tried understanding why I'm stuck — I want a structured process that forces me to actually decide and do, so I can stop being stuck and see real change in my life."

**Big Hire (acquisition):** Break out of the eternal self-help loop by making the ONE decision that matters. → JTBD Section 3
**Little Hire (retention):** Come back for information when life triggers a need. Course as reference + evolving content + Wins Board. → JTBD Section 3

**MVP scope (JTBD Section 9, adjusted by founder input):**
| In V1 | JTBD trace |
|---|---|
| Interactive onboarding (= methodology introduction) | Section 4: immediate action reduces anxiety |
| First-module-free (Module 1 of paid course, not separate content) | Section 4: anxiety reduction via low-commitment entry |
| Paid full course (3 acts, 9 modules) | Section 8: Learning Job modality |
| AI skills for each methodology phase | Section 8: Doing Job modality |
| Wins Board (write-only, anonymous, public feed) | Section 9: must-build, anxiety reduction via social proof |
| Soft paywall (free → paid conversion) | Section 4: pull factor |
| Lean onboarding (3 throughline questions pre-purchase, rich profile post-purchase) | Founder decision + review: reduces friction at highest-anxiety moment |
| Quick Start path (optional skip-to-decision after onboarding) | Section 7: minimize time preparing |
| Decision Anchor (throughline as persistent UI element on every page) | Section 3: one active decision focus |
| Soft time-bounded nudges | Section 7: top underserved outcome |

**Deferred to V1.1+:**
| Deferred | Why | Promotion signal |
|---|---|---|
| Decision primitive in web app | Founder: "does this add value?" — unproven | Users request to see their decision in the web app |
| Skills-to-API connection | V1 apps are separate, connection adds complexity | Users want to see their exercise outputs in the web app |
| Hard time-bounding | Risk of pressure-driven drop-off | Soft nudges show insufficient effect on preparation trap |
| Community features (comments, reactions on Wins Board) | Requires moderation, user base doesn't exist yet | Wins Board engagement is high, users request interaction |
| Daily content (podcast-to-blog-to-email) | Content pipeline not built, no podcast yet | Course retention metrics show episodic return is insufficient |
| Gamification / streaks | JTBD "don't build": contradicts "celebration over measurement" | Never — unless JTBD assumption is invalidated |
| Dashboards / life tracking | JTBD "don't build": creates illusion of progress | Never — unless JTBD assumption is invalidated |
| AI that decides for the user | JTBD "don't build": contradicts core thesis | Never |

**Confidence:** 🟡 hypothesis (scope decisions inherit JTBD confidence)

### Anxiety-Reduction Architecture

The JTBD identifies anxiety as a **Critical strength** barrier (Section 4). "Is this just the next cycle of the self-help loop?" is the #1 adoption barrier. V1 must structurally reduce this anxiety — not as UX polish but as core architecture.

| Anxiety-reduction mechanism | Implementation in V1 | JTBD trace |
|---|---|---|
| **Structural difference messaging** | Landing page + onboarding explain the three failure points of self-help and how the methodology addresses each (constraint identification, forced decision, AI decomposition) | Section 4: "another cycle" anxiety is Critical |
| **Immediate action** | Onboarding IS the first methodology step. User names their throughline decision before accessing the course. Real decision in Day 1, not Module 9. | Section 9: "immediate action" requirement |
| **Social proof (Wins Board)** | Public anonymous wins visible to all users, including non-logged-in visitors. "Someone like me broke the loop." | Section 4: Wins Board is ultimate anxiety reducer |
| **7-day money-back guarantee** | Prominently displayed on paywall and checkout. Operationalized through Stripe refund flow. | Section 9: standard but necessary |
| **Progressive revelation** | Don't dump all 9 modules upfront. Onboarding → first module → show next. Content reveals as user progresses. | Section 9: small first commitment |

### Architectural Prerequisites (from /autoplan review)

These must be resolved BEFORE Week 1 of implementation:

**1. Stripe: Subscription vs One-Time Payment**
The existing code uses `mode: 'payment'` (one-time). The PRD says "$197/year, auto-renewal." These are incompatible. **Decision required:** true Stripe subscription (`mode: 'subscription'`, Price ID, renewal webhooks, `subscriptions` table) OR annual one-time payment (no renewal, issue new payment links annually). Recommendation: true subscription — it aligns with "$197/year" pricing and auto-renewal language.

**2. Schema Migration Plan**
The existing schema diverges from the PRD data model in 5 places:

| Existing | PRD requires | Migration |
|---|---|---|
| `courseProgress.moduleId` (integer, 1-7) | `class_id` (string) + `course_id` (string) | Replace table or add new |
| `purchases` (one-time) | `subscriptions` (recurring) | New table + migrate webhook handling |
| — | `onboardingProfiles` | New table |
| — | `wins` | New table |
| — | `bookmarks` | New table |

**3. Anonymous Onboarding Session Strategy**
Onboarding captures data before account creation. Multi-step form needs persistence. **Strategy:** anonymous session UUID in a HttpOnly cookie (set at step 1). Pair with an `onboarding_sessions` table (session_id UUID, data JSONB, created_at, expires_at). Garbage-collect expired sessions daily. On account creation, consume session → write to `onboardingProfiles` → delete session.

**4. Purchase-to-User Linkage**
Stripe webhook fires before account creation. `purchases.userId` will be null. **Strategy:** on account creation, find most recent active purchase matching user's email → set `userId`. Add email to Stripe checkout session metadata via `customer_email` parameter.

**5. Free/Paid Course Gating**
Existing permissions block all course access for `free` role. **Strategy:** replace role-based gating with route-level logic that checks `course_id` against user's access tier. Free users access Module 1 content. Paid users access all modules.

### Acquisition Strategy (from /autoplan review)

The PRD has success metrics requiring 500+ users but no stated acquisition plan. Acquisition is addressed in docs 7-9 (social media setup, viral strategy, knowledge base). However, the PRD must include:

**Channel assumption:** Primary acquisition via organic social media (docs 7-8), content marketing (doc 9), and founder social. No paid traffic in V1.

**Acquisition kill signal:** If we cannot reach 50 paid users within 90 days of launch through organic/referral, we have an acquisition problem, not a product problem. Trigger: revisit distribution strategy, consider paid traffic, or pivot product form.

### Competitive Moat (from /autoplan review)

**Current moat: none.** The methodology is documented and copiable. Claude Cowork integration is a platform dependency.

**Data moat hypothesis:** As users complete onboarding profiles and AI skills, we accumulate anonymized patterns about which constraints are most common for which ICPs, which methodology phases have highest drop-off, and which decision types lead to successful resolution. After 1,000+ users, this pattern recognition becomes a competitive advantage that improves the product (better skill questions, better content targeting) and cannot be replicated without the user base.

**Action:** Treat onboarding data and (future) skill output data as strategic assets. Design the analytics pipeline to aggregate patterns, not just measure conversion.

---

## 2. User Personas + Entry Points

### Persona Mapping to JTBD Segments

The JTBD (Section 2) defines three segments by struggling moment, not demographics. Both Life Decisions personas (Stuck Achiever, Overthinker) can appear in any segment. The segments determine the onboarding experience.

| JTBD Segment | Struggling moment | Onboarding validation | Throughline likely to be |
|---|---|---|---|
| The Eternal Self-Improver | Has completed multiple self-help programs. Suspects the PATTERN is the problem. | "What have you tried before?" → multiple selections. "How long have you been stuck?" → years. | Breaking a cycle (leave the relationship, change careers, stop shrinking) |
| The Threshold Crosser | Specific discomfort (insomnia, anxiety, tension) just crossed the threshold. Body forced the issue. | "What brought you here today?" → life event. "What areas?" → health, relationships. | Resolving a specific discomfort (have the conversation, make the health change) |
| The Quiet Shrinker | Has been shrinking goals to fit comfort zone. A mirror moment made the resignation visible. | "What have you been avoiding?" → an aspiration she stopped naming. "How long?" → years. | Re-expanding ambition (start the business, move cities, pursue the thing she gave up on) |

### Entry Points

**Path 1: Landing page → Purchase → Onboarding → Full course**
User arrives from social media, search, or referral. Reads landing page. Pays $197. Creates account. Enters interactive onboarding. Accesses full course.

**Path 2: Landing page → Free onboarding → Soft paywall → Module 1 free**
User arrives but isn't ready to pay. Starts interactive onboarding (no account needed). Completes onboarding. Sees soft paywall. Chooses "No, take me to the free content." Provides email. Accesses Module 1 of the paid course for free.

**Path 3: Module 1 free → Upgrade → Full course**
User completes some/all of Module 1. Hits paywall at Module 2. Decides to upgrade. Pays $197. Existing progress preserved. Modules 2-9 unlocked.

**Path 4: Quick Start (optional)**
After onboarding, user can choose "Skip to my first exercise" instead of starting Module 1. Goes directly to the Phase 1 AI skill instructions. Course becomes a reference layer accessed when the user wants to understand *why*. This path addresses the JTBD top outcome: "minimize time preparing before deciding."

### Onboarding Flow (shared between free and paid)

The onboarding IS the course introduction. It serves triple duty: (1) captures rich profile data for ICP intelligence, (2) delivers the first methodology experience, (3) names the throughline decision.

**Onboarding steps (lean pre-purchase — 3 questions only):**

| Step | Screen type | Content | Data captured | Progress indicator |
|---|---|---|---|---|
| 1 | Full-bleed card, warm cream bg | "Before we start, let's understand where you are." Welcome copy. | — | Hidden (1 of 6) |
| 2 | Video top + text below, full-bleed | Introductory content: what The Right Decision is and isn't. 3-5 min video. | — | Visible (2 of 6) |
| 3 | Single question, full-bleed card | "What have you been avoiding for the longest?" (free text, 2-3 sentence prompt) | throughline_q1 | Visible (3 of 6) |
| 4 | Single question, full-bleed card | "If you could only change ONE thing in your life in 90 days, what would it be?" (free text) | throughline_q2 | Visible (4 of 6) |
| 5 | Single question + synthesis | "What decision, if you made it, would make everything else easier?" Based on Q1+Q2 context. Then: "Name your ONE decision in a single sentence." | throughline_q3 + throughline_named | Visible (5 of 6) |
| 6 | Email capture + soft paywall | "Enter your email to save your progress." Then: paywall with Decision Anchor showing their named throughline | email | Visible (6 of 6) |

**Soft paywall screen spec:**
- Above the fold: headline "You've named your decision. Now let's make it happen."
- Decision Anchor: user's throughline displayed in a prominent card — "Your decision: [throughline_named]"
- Primary CTA: gold button "Get the full methodology — $197/year" with "7-day money-back guarantee" below
- Secondary link: "No thanks, let me start with Module 1 for free" — smaller, below fold
- The throughline personalization is the conversion hook — user sees THEIR decision reflected back

**Rich profile (post-purchase, first login):**
After account creation, before course dashboard loads, a brief profile completion screen:
- Name (free text)
- Age range (select: 18-24, 25-29, 30-39, 40-49, 50+)
- "What areas of your life do you want to change?" (multi-select: health, career, relationships, money)
- "What have you tried before?" (multi-select: therapy, online courses, coaching, self-help books, meditation/spirituality, nothing)
- "How long have you been working on this?" (select: less than 6 months, 6-12 months, 1-2 years, 3-5 years, 5+ years)
- Skip button available ("I'll do this later") — profile completion is P1, not blocking

**UI rules for all onboarding steps:**
- One question per screen. Never batch questions.
- Back navigation: allowed on all steps except step 6 (email can't go back to remove email)
- Transition: explicit "Continue" button, not auto-advance
- State persistence: anonymous session UUID cookie → `onboarding_sessions` table (see Architectural Prerequisites)
- Mobile: full-width cards, 16px min font, thumb-reachable Continue button at bottom
- If user abandons and returns: cookie resumes at last completed step

**Success criteria for onboarding:**
- User has named a specific throughline decision (not an aspiration)
- Profile data is captured in the database
- Onboarding completion rate is tracked and becomes a key metric
- Time to complete: ~15-20 minutes (introductory content + questions)

**Confidence:** 🟡 hypothesis (onboarding flow), 🔴 guess (conversion rates, time estimates)

---

## 3. Post-Purchase User Flows

Pre-purchase flows (landing page → conversion) are defined in doc 05 (Landing Page Strategy). This section defines post-purchase product flows only.

### Flow 0: Payment → First Screen

**Trigger:** User clicks "Get the full course for $197/year" on soft paywall (or landing page CTA).

1. Stripe Checkout page (hosted by Stripe, `customer_email` pre-filled from onboarding)
2. Payment succeeds → Stripe webhook fires → creates subscription record (email-keyed, userId null initially)
3. Redirect to account creation: email (pre-filled), password or magic link
4. Account creation → find most recent active subscription matching email → set userId → consume onboarding_session → write to onboardingProfiles
5. Rich profile completion screen (name, age, areas, tried before, time stuck — skippable)
6. Course dashboard with Decision Anchor: "Your decision: [throughline]. Let's begin."
7. Two CTAs: "Start Module 1" (default) and "Quick Start: go to your first exercise" (optional)

**Error cases:**
- Payment fails → Stripe handles retry/error messaging → user returns to paywall
- Email already exists → prompt to log in. Onboarding session data preserved in cookie → linked on login
- Stripe webhook delay → "Setting up your account..." screen with 30-second polling, max 2 minutes. Fallback: "Your payment was received. Check your email for access." Send email with magic link once webhook processes.
- Webhook fires but account not yet created → subscription created with null userId, linked on account creation (email match)

**Data created:** User record, subscription record (linked by email then userId), onboarding profile (from session).

**Data created:** User record, Stripe customer ID, subscription record, onboarding profile linked to user.

### Flow 1: Course Consumption (Learning Job)

**Trigger:** User opens course dashboard.
**JTBD trace:** Section 8 (Learning Job) — "When I encounter a new concept about decisions, I want to understand how it applies to my specific situation."

**Course dashboard — three states:**

**State A: First login (0% complete)**
- Decision Anchor (sticky header): "Your decision: [throughline_named]" — Instrument Serif, warm amber underline
- Primary CTA: "Begin Module 1: The Wake-Up Call" (gold button, prominent)
- Secondary CTA: "Quick Start: go straight to your first exercise" (text link below)
- Module index (sidebar on desktop, collapsed on mobile): all 9 modules listed, Module 1 highlighted, 2-9 locked with soft lock icon
- No progress bar yet (nothing to show)

**State B: Returning user mid-course (e.g., Module 4 in progress)**
- Decision Anchor (sticky header, always visible)
- Primary CTA: "Continue: [current class title]" (resumes where they left off)
- Module index: completed modules with checkmark, current module highlighted with progress indicator, future modules with soft lock
- Progress bar: module-level (e.g., "Module 4 of 9") + class-level within current module (e.g., "Class 2 of 4")
- Wins count badge: "You've written [N] wins" (links to My Wins)

**State C: Course completed (100%)**
- Decision Anchor shows throughline + "Course complete" badge
- Primary CTA: "Write a win" or "Start a new cycle" (link to re-run skills)
- Module index: all modules with checkmarks, fully navigable as reference
- Full search available

**Class view:**
1. User clicks into a module → sees list of classes (3 theory + 1 practical per module)
2. Theory class: video player (embedded external) + text summary below + "Mark complete" button at bottom
3. Practical class: distinct "threshold moment" design — warm amber background, prominent instruction card: "Now you do the work." Shows what the skill will ask, what output to expect, and a "Mark as done" button for when they return
4. After completing all classes in a module → module marked complete, next module highlighted
5. Between modules: soft time nudge card — "Module 2 is about mapping your current state. We recommend 3-4 days with this before moving on." User can dismiss or proceed immediately.

**Practical class UI (distinct from theory):**
- Background: warm amber tint (#F2EDE6) — visually distinct from theory classes
- Header: "Exercise: [Phase Name]" in Instrument Serif
- Body: instruction card with 3 sections: (1) What this skill does, (2) What it will ask you, (3) What you'll get back
- CTA: "Open Claude Cowork" (informational — can't auto-launch, just instructions)
- Return state: "I've completed this exercise" button — on click, brief prompt: "What clarity did this give you?" (optional, 1 sentence, feeds into potential future win). Then marks complete with a celebration micro-moment (checkmark animation, warm amber flash).

**Reference navigation (for returning users):**
- Search (P1): full-text search across class summaries and key takeaways
- Module index: always visible in sidebar, shows completion status per module
- Bookmarks (P1): user can bookmark any class for quick return

**Decision Anchor spec:**
The throughline is the emotional center of the UI. It appears as a persistent element:
- Desktop: sticky bar below main nav, warm cream bg, "Your decision:" label in text-muted, throughline text in text-primary, Instrument Serif
- Mobile: collapsible — shows first 50 chars, tap to expand
- Always visible on: dashboard, module view, class view. Not on: Wins Board, settings, admin.

**Data created:** Progress records (user_id, class_id, course_id, completed_at). Bookmark records.

### Flow 2: AI Skill Execution (Doing Job)

**Trigger:** User reaches a practical class that says "Run the [Phase X] skill in Claude Cowork."
**JTBD trace:** Section 8 (Doing Job) — "When I'm at a specific step of the methodology, I want guided questions that pull the right answer out of me."

1. Practical class provides: (a) instructions to install/run the skill, (b) what the skill will ask, (c) what output to expect
2. User opens Claude Cowork on their desktop
3. User runs the skill (e.g., `/state-map`)
4. Skill asks deep questions → user answers in their own words
5. Skill saves: `raw.md` (exact user words) + `document.md` (structured output)
6. User reads their output. "Is this right? Did the AI capture what I meant?"
7. User returns to web app → manually marks the practical class as complete

**V1 boundary:** No automatic sync between Claude Cowork and web app. User's self-report ("I completed this") is the only signal. Structured output lives on the user's computer.

**Data created:** Progress record (practical class marked complete). Actual skill output lives in user's local files.

### Flow 3: Win Writing

**Trigger:** User feels they've achieved a milestone in their decision journey.
**JTBD trace:** Section 9 (must-build), Section 3 (social job — "be perceived as someone who acts").

1. User navigates to Wins Board (accessible from main navigation)
2. Clicks "Write a win"
3. Form:
   - Life area (select: health, relationships, career, money)
   - Win description (free text, max 280 characters — forces conciseness)
   - Prompt text: "What clarity or progress did you achieve? Not what you practiced — what you DID."
4. Submit → win appears on public feed immediately
5. Win is anonymous (no username, no avatar, no identifiable info)
6. User can see their own wins on a "My Wins" page (private)

**Context-based, not methodology-based:** The win form does NOT ask "which phase are you in?" It asks about real-world progress. "I have clarity on what I need to change" not "I completed Phase 1."

**Rate limit:** 3 wins per user per day. Prevents spam on the public-facing feed.

**Empty state (critical for launch):**
- Public feed with 0 wins: show 5-10 seeded wins written by Henry and Indy from their own methodology experience. Marked subtly as "Founding wins" but otherwise identical to user wins. Remove the "founding" tag once 20+ real wins exist.
- "My Wins" with 0 wins: motivational prompt — "You haven't written a win yet. When you achieve clarity or make progress on your decision, come here to mark it. What you DID matters more than what you practiced."

**Launch sequence requirement:** Before public launch, seed the Wins Board with 5-10 real wins from founder experience. This is NOT optional — an empty social proof wall increases anxiety instead of reducing it.

**Data created:** Win record (user_id for "My Wins" view, life_area, description, created_at, is_seed boolean). Public view strips user_id. Timestamps rounded to nearest hour on public feed (privacy).

### Flow 4: First-Module-Free Path

**Trigger:** User chooses "No thanks, let me start with Module 1 for free" on soft paywall.
**JTBD trace:** Section 4 (pull: low-commitment entry reduces anxiety).

1. User accesses the same course dashboard as paid users — but only Module 1 is unlocked
2. Module 1: "The Wake-Up Call" — same content as paid course (3 theory + 1 practical class)
3. Same mechanics: video + text summary, mark complete, progress tracking
4. Practical class (Phase 1 skill) IS accessible for free users — this is the differentiated experience
5. Upgrade prompt: inline card after completing Module 1 — "Ready for the next step? Modules 2-9 unlock with the full course." Also a persistent "Upgrade" CTA in nav for free users.
6. Modules 2-9 show in the sidebar but are locked (soft lock icon, module title visible, "Upgrade to unlock")
7. Upgrade → Stripe checkout → account upgrade → Modules 2-9 unlocked, Module 1 progress preserved

**Why first-module-free over separate mini-course (autoplan decision):** Same content, no second content track to maintain, user experiences the real product (not a sample), lower build cost, higher conversion intent (they're IN the product, not in a preview).

**Data created:** Progress records (same table, `course_id = 'full-course'`). Upgrade records.

**Confidence:** 🟡 hypothesis (all flows)

---

## 4. Feature Requirements (Prioritized)

### Priority Definitions
- **P0 — Must ship:** V1 does not launch without this. Directly addresses a top JTBD outcome or is architecturally required.
- **P1 — Should ship:** High-value addition for a minimum-delightful product. Can be cut if build timeline is tight.
- **P2 — Nice to have:** Adds polish. Cut first under pressure.

### P0 Features

**F1: Interactive Onboarding**
- **Description:** Onboarding flow as described in Section 2. Serves as course introduction, data capture, and throughline naming. Shared between free and paid users.
- **JTBD trace:** Section 4 (immediate action), Section 9 (anxiety reduction)
- **Acceptance criteria:** User completes onboarding in <20 minutes. Throughline decision captured as free text. Rich profile saved to DB. Completion rate tracked. Cannot access course content without completing onboarding.
- **Complexity:** M

**F2: Course Player**
- **Description:** Displays course content (video + text) from markdown files. Tracks progress. Supports sequential navigation (next class) and reference navigation (module index, search, bookmarks).
- **JTBD trace:** Section 8 (Learning Job), Section 3 (Little Hire: course-as-reference)
- **Acceptance criteria:** Video embeds play correctly. Text summaries render from markdown. Progress persists across sessions. Search finds classes by keyword in title/summary. Module index shows completion status. Bookmarks save/retrieve correctly.
- **Complexity:** L

**F3: First-Module-Free Gating**
- **Description:** Single course track. Module 1 is accessible to all users (free + paid). Modules 2-9 require active subscription. Gating is at the module level, checked per-request via `course_id`-scoped access logic (not role-based permissions). Free users see the full module index with locked indicators on 2-9.
- **JTBD trace:** Section 4 (anxiety reduction: low-commitment entry)
- **Acceptance criteria:** Free users access Module 1 content and practical class. Modules 2-9 show as locked with upgrade CTA. Paid users access all. Upgrade preserves Module 1 progress. Content loads from markdown files.
- **Complexity:** S (simpler than two separate course tracks)

**F4: Auth + Payment**
- **Description:** User authentication (Better Auth) and Stripe subscription for $197/year. 7-day money-back guarantee. Account creation after onboarding (email pre-filled). Magic link or password-based login.
- **JTBD trace:** Section 9 (anxiety reduction: money-back guarantee)
- **Acceptance criteria:** Signup, login, logout work. Stripe checkout creates subscription. Webhook handles payment events (success, failure, cancellation). Refund requestable within 7 days. Subscription status gates course access.
- **Complexity:** M

**F5: Wins Board**
- **Description:** Public anonymous feed of user wins. Write-only in V1 (no comments, no reactions). Categorized by life area. Context-based prompts ("what clarity or progress did you achieve?").
- **JTBD trace:** Section 9 (must-build), Section 4 (social proof reduces anxiety)
- **Acceptance criteria:** Any logged-in user can write a win. Wins appear on public feed (visible to all, including non-logged-in users). Anonymous — no user identification on public feed. Categorized by life area. User can view their own wins privately.
- **Complexity:** S

**F6: Soft Paywall**
- **Description:** After onboarding completion, users see a paywall screen with two options: pay $197/year or access free course. Prominent CTA for paid, clear secondary link for free.
- **JTBD trace:** Section 4 (pull factor: anti-self-help positioning + structured process)
- **Acceptance criteria:** Paywall appears only after onboarding completion. Both paths work correctly. Conversion rate tracked. A/B testable (paywall copy, CTA placement).
- **Complexity:** S

**F6.5: Navigation States**
- **Description:** Main nav varies by user state. Defines which nav items are visible for each permission level.
- **Nav states:**
  | User state | Nav items |
  |---|---|
  | Anonymous visitor | Logo, Wins Board (public), Login, Get Started |
  | Free user (email captured, no payment) | Logo, Course (Module 1), Wins Board, Upgrade, Account |
  | Paid user | Logo, Course (all modules), Wins Board, My Wins, Account |
  | Admin | All above + Admin |
- **JTBD trace:** Wins Board visible to anonymous visitors for anxiety reduction (Section 4)
- **Complexity:** S

**F6.6: Quick Start Path**
- **Description:** After onboarding, paid users see two options: "Start Module 1" (default) and "Quick Start: go to your first exercise" (links to Phase 1 practical class with skill instructions). Course becomes reference. Addresses JTBD top outcome.
- **JTBD trace:** Section 7 (minimize time preparing before deciding)
- **Acceptance criteria:** Quick Start link visible on first-login dashboard. Links to Module 1, Class 4 (practical). Works for paid users only (free users start Module 1 sequentially).
- **Complexity:** S

**F7: Soft Time Nudges**
- **Description:** Between modules, display suggested timelines ("Take 3-4 days with this before moving on"). Optional email reminders if user hasn't progressed in X days.
- **JTBD trace:** Section 7 (top outcome: minimize time preparing before deciding)
- **Acceptance criteria:** Nudge text displays between modules. No hard gates — user can proceed whenever. Email reminder sent after 7 days of inactivity (P1 if email integration is complex).
- **Complexity:** S (display), M (email reminders — move to P1 if needed)

### P1 Features

**F8: Email Reminders**
- **Description:** Automated emails for: inactivity (7 days no progress), module completion congratulations, onboarding incomplete (abandoned after email capture). Simple transactional emails, not a marketing automation system.
- **JTBD trace:** Section 4 (firing trigger: "I lost momentum and couldn't restart")
- **Acceptance criteria:** Emails send correctly. Unsubscribe works. No more than 1 email per week per trigger.
- **Complexity:** M

**F9: Course Search**
- **Description:** Full-text search across class titles and text summaries. Returns matching classes with context snippet.
- **JTBD trace:** Section 3 (Little Hire: course-as-reference navigation)
- **Acceptance criteria:** Search returns relevant results. Results link to the class. Works across both free and paid course content (paid users see all, free users see free only).
- **Complexity:** S

**F10: Bookmarks**
- **Description:** User can bookmark any class for quick access. Bookmarks page shows all saved classes.
- **JTBD trace:** Section 3 (Little Hire: course-as-reference)
- **Acceptance criteria:** Bookmark toggle on each class. Bookmarks page lists all saved classes. Remove bookmark works.
- **Complexity:** S

### P2 Features

**F11: Onboarding Analytics Dashboard (Admin)**
- **Description:** Admin view showing onboarding completion rates, drop-off points, profile data aggregates (age ranges, life areas, time stuck). For Henry to understand the funnel.
- **JTBD trace:** Founder decision (onboarding as key metric)
- **Acceptance criteria:** Shows completion rate, step-by-step drop-off, aggregate profile data.
- **Complexity:** M

**F12: A/B Testing Infrastructure**
- **Description:** Ability to serve different onboarding variants (paywall copy, email capture timing) and measure conversion rates.
- **JTBD trace:** Founder decision (A/B testable onboarding)
- **Acceptance criteria:** Two variants served randomly. Conversion tracked per variant.
- **Complexity:** M

### "Don't Build" List (JTBD Section 9 — enforced)

| Feature | Why NOT | JTBD reasoning |
|---|---|---|
| **Dashboards / life tracking** | Creates the "doing the work" disguise. Tracking feels productive without decisions. | Contradicts top outcome: "minimize time preparing" |
| **Live coaching / 1-on-1** | Outsources the diagnosis (Sin #2). Creates dependency. | Contradicts emotional job: "doing the real work myself" |
| **Community forums** | Low engagement, discussions about being stuck reinforce stuckness. | Social job better served by Wins Board |
| **Streak tracking / gamification** | Optimizes for consistency, not decisions. Streaks become the goal. | Contradicts: "celebration over measurement" |
| **AI that decides for user** | Outsources the decision — entire anti-thesis. | Contradicts core JTBD |
| **Decision primitive in web app** | Unproven value. Adds storage, state management, sync complexity. | Founder: "does this add value?" — deferred |
| **Skills-to-API sync** | Two separate apps in V1. Connection adds complexity without proven need. | Deferred to V1.1 |

**Confidence:** 🟡 hypothesis (priorities), 🔴 guess (complexity estimates)

---

## 5. Data Model + Decision Primitive

### Entity-Relationship Diagram

```
┌──────────────┐     ┌──────────────────┐     ┌──────────────────┐
│    User       │────<│  OnboardingProfile│     │   Subscription   │
│──────────────│     │──────────────────│     │──────────────────│
│ id (PK)      │     │ id (PK)          │     │ id (PK)          │
│ email        │     │ user_id (FK)     │     │ user_id (FK)     │
│ name         │     │ throughline_q1   │     │ stripe_customer  │
│ role         │     │ throughline_q2   │     │ stripe_sub_id    │
│ created_at   │     │ throughline_q3   │     │ status           │
│ updated_at   │     │ throughline_named│     │ current_period_end│
└──────────────┘     │ age_range        │     │ created_at       │
       │             │ life_areas[]     │     └──────────────────┘
       │             │ tried_before[]   │
       │             │ time_stuck       │
       │             │ completed_at     │
       │             └──────────────────┘
       │
       ├────<┌──────────────────┐
       │     │  CourseProgress   │
       │     │──────────────────│
       │     │ id (PK)          │
       │     │ user_id (FK)     │
       │     │ class_id (str)   │
       │     │ course_id (str)  │
       │     │ completed_at     │
       │     └──────────────────┘
       │
       ├────<┌──────────────────┐
       │     │    Bookmark       │
       │     │──────────────────│
       │     │ id (PK)          │
       │     │ user_id (FK)     │
       │     │ class_id (str)   │
       │     │ created_at       │
       │     └──────────────────┘
       │
       └────<┌──────────────────┐
             │      Win          │
             │──────────────────│
             │ id (PK)          │
             │ user_id (FK)     │
             │ life_area        │
             │ description      │
             │ created_at       │
             └──────────────────┘
```

**Entity count: 7.** User, OnboardingSession (temp), OnboardingProfile, Subscription, CourseProgress, Bookmark, Win.

**Additional entity: OnboardingSession (temporary)**
```
┌──────────────────────┐
│  OnboardingSession    │
│──────────────────────│
│ id (UUID PK)         │
│ session_data (JSONB) │
│ current_step (int)   │
│ created_at           │
│ expires_at           │  ← garbage-collected daily
└──────────────────────┘
```
Anonymous pre-account data store. Cookie holds session UUID. Consumed + deleted on account creation.

**Entity justifications:**
| Entity | JTBD justification |
|---|---|
| User | Required for auth, gating, progress |
| OnboardingProfile | Founder decision: rich data capture for ICP intelligence. Section 4: immediate action (throughline naming) |
| Subscription | Section 9: anxiety reduction (money-back guarantee requires tracking subscription age) |
| CourseProgress | Section 8: Learning Job requires progress tracking. Founder: DB-based tracking |
| Bookmark | Section 3: Little Hire requires reference navigation |
| Win | Section 9: must-build. Social proof + methodology embedding |

**Notes:**
- `class_id` and `course_id` are strings matching markdown file paths (e.g., `free-course/lesson-01`, `full-course/module-01/class-01`). Course content is NOT in the database — it's in the codebase as markdown files.
- `life_areas` and `tried_before` are PostgreSQL arrays (text[])
- No Decision entity in V1. The decision lives in Claude Cowork files. Deferred.

### Decision Primitive — State Machine (DEFERRED)

The JTBD (Section 3, Section 9) identified the decision as the central product primitive. After founder input, this is **deferred to V1.1**.

In V1, the throughline decision exists as:
- A free-text field in `OnboardingProfile.throughline_named`
- Displayed as context on the course dashboard ("Your decision: [text]")
- No states, no transitions, no versioning

**V1.1 state machine (if promoted):**
```
Named → Active → Decided → Executing → Resolved
  │                                        │
  └──── (abandoned) ◄─────────────────────┘
                                    (new cycle)
```

**Promotion signal:** Users request decision visibility/tracking in the web app, or retention data suggests users lose focus without it.

**Confidence:** 🟡 hypothesis (data model), 🔴 guess (entity sufficiency)

---

## 6. AI Skills Integration

### Two Modalities, Two Apps

The JTBD (Section 8) established that the course and AI skills serve fundamentally different jobs:
- **Course (web app):** Learning Job — "teach me why this matters"
- **Skills (Claude Cowork):** Doing Job — "guide me through the thinking"

**The boundary (JTBD Section 8):**
| Step | Manual — student thinks (VALUE) | AI — skill structures (FRICTION REMOVAL) |
|---|---|---|
| State mapping | Answers honest questions about life areas | Organizes into structured state map document |
| Target state | Describes conditions of life she wants | Formats as observable conditions with evidence |
| Constraint identification | Rates obstacles, gut-checks the selection | Surfaces highest-rated constraint, challenges choice |
| Decision commitment | Names decision, sets date, names witness | Formats decision statement, records commitment |
| Decomposition | Answers about capacity, safety, support | Generates objectives, tasks, habits with deadlines |
| Execution | Does daily task, records yes/no | Tracks progress, signals "hard but working" vs "not working" |
| Feedback | Answers weekly review questions | Updates state map, compares to target |
| Resolution | Determines if constraint is resolved | Confirms criteria met, prompts win story |

### Skill Lifecycle in V1

1. **Discovery:** Practical class in the course says "Now run the [Phase X] skill"
2. **Installation:** Course provides instructions to install the skill in Claude Cowork
3. **Execution:** User runs the skill → it asks questions → user answers
4. **Output:** Skill saves `raw.md` (exact user words) + `document.md` (structured output) to a local folder
5. **Cross-skill context:** Each skill reads output from previous skills in the same folder. The state map from Phase 1 informs Phase 3. The decision from Phase 4 shapes Phase 5.
6. **Completion signal:** User returns to web app and marks the practical class as complete (manual)

### Skills Map (One per Methodology Phase)

| Phase | Skill name | Input | Output | Cross-skill dependency |
|---|---|---|---|---|
| 1. Awareness + State Mapping | `/state-map` | User answers about finances, health, relationships, career | `state-map/raw.md` + `state-map/document.md` | None (first skill) |
| 2. Target State | `/target-state` | User describes conditions of life she wants | `target-state/raw.md` + `target-state/document.md` | Reads state-map for gap analysis |
| 3. Dominant Constraint | `/constraint` | User rates obstacles, gut-checks AI's suggestion | `constraint/raw.md` + `constraint/document.md` | Reads state-map + target-state |
| 4. The Decision | `/decide` | User names decision, date, witness | `decision/raw.md` + `decision/document.md` | Reads constraint |
| 5. Decomposition | `/decompose` | User answers about capacity, safety, support | `decompose/raw.md` + `decompose/document.md` | Reads decision |
| 6. Execution | `/execute` | Daily yes/no on tasks | `execute/log.md` (append-only) | Reads decompose |
| 7. Feedback | `/review` | Weekly reflection questions | `review/document.md` | Reads execute + state-map (comparison) |
| 8. Resolution | `/resolve` | User assesses if constraint is gone | `resolution/document.md` | Reads all previous |

### What Skills Must NEVER Do

- **Never decide for the user.** Skills ask questions and structure answers. They don't recommend what the constraint is, what the decision should be, or what to do. The user does ALL the thinking.
- **Never replace the course.** Skills are exercises, not lessons. They don't teach concepts. The course teaches why; the skill does the doing.
- **Never break context.** Each skill must read previous skill output. Disconnected skills produce disconnected methodology.

**Confidence:** 🟡 hypothesis (skill model), 🔴 guess (cross-skill context reliability)

---

## 7. Course Platform Requirements

### Content Model

Course content lives as **markdown files in the codebase**, not in the database.

```
content/
├── courses/
│   ├── free-course/
│   │   ├── course.md          # Course metadata (title, description)
│   │   ├── lesson-01/
│   │   │   ├── class.md       # Content: text summary, video URL, key takeaways
│   │   │   └── meta.md        # Metadata: title, duration, order
│   │   ├── lesson-02/
│   │   └── ...
│   └── full-course/
│       ├── course.md
│       ├── onboarding/        # Introduction classes (shared with onboarding)
│       ├── module-01/
│       │   ├── module.md      # Module metadata (title, description, time nudge)
│       │   ├── class-01/
│       │   ├── class-02/
│       │   ├── class-03/
│       │   └── class-04-practical/  # AI skill exercise
│       ├── module-02/
│       └── ...
└── skills/                    # AI skill files for Claude Cowork
    ├── state-map/
    ├── target-state/
    └── ...
```

**Content file format (class.md):**
```markdown
---
title: "The Wake-Up Call"
video_url: "https://youtube.com/embed/..."
duration: "35 min"
order: 1
type: theory | practical
skill: state-map  # only for practical classes
time_nudge: "Take 3-4 days with this module before moving on."  # only for last class in module
---

## Key Takeaways
- Point 1
- Point 2

## Summary
Full text summary of the class content...
```

### Navigation Model

**Sequential (primary for new users):**
- Course dashboard → Module list → Class list → Class view
- "Next class" button at bottom of each class
- Progress bar per module and overall
- Throughline decision displayed as persistent context

**Reference (for returning users — JTBD Little Hire):**
- Module index always visible in sidebar
- Search across all class titles and summaries (P1 feature)
- Bookmarks for quick access to specific classes (P1 feature)
- Completion badges on modules/classes

### Time-Bounded Phase Mechanics (Soft Nudges)

- Each module's last class displays the `time_nudge` from its metadata
- Nudge text: "Module X is about [topic]. We recommend spending [X] days with this before moving on."
- **No hard gates.** User can click "Next module" at any time.
- Email reminder (P1): if user hasn't opened the app in 7 days, send "You were working on [module name]. Ready to continue?"

### Content Loading Strategy

Markdown files are loaded at server startup into an in-memory Map keyed by `course_id/class_id`. This avoids per-request file I/O while keeping the corpus small (~40 files).

- **Module:** `providers/content.ts` — single provider, loads all course content at startup
- **Type:** `CourseClass { id, courseId, title, videoUrl, duration, order, type, skillName?, timeNudge?, content, keyTakeaways }`
- **Cache invalidation:** On deploy (server restart). No runtime invalidation needed for V1.

### Content Versioning + Redirect Map

V1 content is static — markdown files deployed with the code. For future content updates:
- Content files are versioned in git (natural versioning)
- Progress tracking uses `class_id` strings that map to file paths
- **Redirect map:** `content/redirects.json` — `{ "old-class-id": "new-class-id" }`. Created from Day 1 (even if empty). The course player resolves progress IDs through this map before querying. Prevents broken progress when content files are renamed during iteration.
- New classes added to a module don't invalidate existing progress

**Confidence:** 🟡 hypothesis (content model), 🔴 guess (reference navigation usage)

---

## 8. Non-Functional Requirements + Payment Flow

### Performance

| Metric | Target | Rationale |
|---|---|---|
| Page load (first contentful paint) | < 1.5s | Course content is markdown → SSR → fast |
| Time to interactive | < 2s | Preact is 3KB, minimal client JS |
| Video embed load | < 3s | External host handles video delivery |
| Search response | < 500ms | Small corpus (< 100 classes), simple full-text |
| API response (progress update) | < 200ms | Single DB write |

### Security

- **Auth:** Better Auth with email/password and magic link. Session-based.
- **CSRF:** Hono middleware, SameSite cookies
- **XSS:** Preact auto-escapes. Markdown rendered server-side with sanitization. **Wins Board:** win descriptions are stored and rendered as PLAIN TEXT only — no markdown parsing. Explicit test: submit `<script>alert(1)</script>` and verify it renders escaped.
- **Payment:** Stripe Checkout (hosted) — we never handle card data
- **Rate limiting:** On auth endpoints and win submission (prevent spam)

### Privacy

Decision data is deeply personal. V1 privacy requirements:
- **Onboarding data:** Stored in our PostgreSQL. Used only for product improvement and personalization. Never shared externally.
- **Throughline questions:** Free-text personal information. Encrypted at rest (Railway PostgreSQL encryption).
- **Wins:** Anonymous on public feed. User_id association stored but never exposed publicly.
- **Claude Cowork data:** Lives on user's computer. We never see it. This IS the privacy feature — "your data, your computer."
- **GDPR/CCPA basics:** Account deletion endpoint removes all user data. Export endpoint provides all stored data. Cookie consent for analytics.

### Accessibility

- Semantic HTML (headings, landmarks, ARIA where needed)
- Keyboard navigation for all interactive elements
- Color contrast meets WCAG AA (verified against design.md palette)
- Video: captions recommended but not P0 for V1

### Mobile Responsiveness

- **Desktop-first** design (users run Claude Cowork on desktop)
- **Mobile-responsive** for course consumption (reading/watching on phone)
- Wins Board fully mobile-functional (write wins on phone)
- No native app — responsive web only

### Payment Flow

**Purchase flow:**
1. User clicks CTA → Stripe Checkout (hosted page, not embedded)
2. Stripe handles card capture, validation, 3D Secure
3. Payment succeeds → Stripe webhook fires → server creates subscription record
4. Server redirects user to account creation / course dashboard
5. Subscription: $197/year, auto-renewal

**Money-back guarantee (7 days):**
- Displayed prominently: paywall, checkout, post-purchase confirmation email
- User requests refund: email to support (V1 — manual process) OR self-service button in account settings (P1)
- Refund processed through Stripe API
- After refund: subscription cancelled, course access revoked, account preserved (for future re-subscription)

**Payment failure / churn:**
- Stripe handles retry logic (3 attempts over 2 weeks)
- After final failure: subscription status → "past_due" → course access gated
- Reactivation: update payment method → Stripe retries → access restored

### Tech Stack (from coding.md)

| Layer | Technology | Notes |
|---|---|---|
| Runtime | Bun | Package manager, test runner, everything |
| Server | Hono | SSR + API routes, typed with AppRoutes |
| Frontend | Preact | 3KB, islands architecture for interactivity |
| Database | PostgreSQL (Railway) | Drizzle ORM, Zod validation |
| Auth | Better Auth | Session-based, email/password + magic link |
| Payment | Stripe | Checkout (hosted), webhooks, subscriptions |
| Styling | Tailwind CSS v4 | Design tokens from decisions/design.md |
| Content | Markdown files | Course content in codebase, parsed at build/request time |
| Video | External (YouTube/Bunny.net) | Embedded via iframe |

**Confidence:** 🟡 hypothesis (targets), 🔴 guess (whether these thresholds are sufficient)

---

## 9. Success Metrics + Validation Plan

### Primary Metrics

| Metric | Target (90 days) | JTBD trace | What it measures |
|---|---|---|---|
| **Onboarding completion rate** | > 60% | Section 4: immediate action | Does the methodology introduction hook users? |
| **Free → Paid conversion rate** | > 5% | Section 4: pull > anxiety | Does the soft paywall work? |
| **Course completion rate (paid)** | > 30% | Section 8: Learning Job | Do users finish the course? (industry avg: 5-15%) |
| **Win writing rate** | > 1 win per paid user (90 days) | Section 9: Wins Board engagement | Do users achieve and celebrate milestones? |
| **Day-30 retention (paid)** | > 70% | Section 3: Little Hire | Do users come back after the first month? |

### Churn Warning Signals (from JTBD Section 4 Firing Triggers)

| Firing trigger | Leading indicator | Detection method | Intervention |
|---|---|---|---|
| "I feel like I'm doing another practice" | User completes modules but never runs skills | Progress records: theory classes complete, practical classes skipped | Email: "The real work happens in the exercises. Have you tried the [Phase X] skill?" |
| "I finished but nothing changed" | User completes course but writes no wins | Full course completion + zero wins | Email: "You finished the course. What decision did you make?" |
| "The AI felt generic" | User runs one skill then stops | First practical class completed, no subsequent ones | Email: "The skills get more powerful as they read your previous answers." |
| "I lost momentum" | 14+ days of inactivity | Last progress record > 14 days ago | Email: "You were working on [module]. Ready to pick up?" |

### Assumption Validation Plan

| Assumption | Confidence | How we validate | Success signal | Pivot signal |
|---|---|---|---|---|
| Course + skills + Wins Board is the right V1 scope | 🟡 | Ship and measure engagement per component | Users engage with all three | One component has <10% engagement — cut or rethink |
| Soft nudges address the preparation trap | 🔴 | Compare time-per-module to suggested timeline | Average completion time per module within 2x of suggestion | Users spend 4x+ on early modules (still trapped in preparation) |
| Onboarding-as-introduction converts better than direct paywall | 🔴 | A/B test: onboarding-first vs direct checkout (P2) | Onboarding-first has higher conversion | Direct checkout converts better (onboarding adds friction) |
| Anonymous public Wins Board reduces anxiety | 🔴 | Track: do visitors who view Wins Board convert higher? | Wins Board viewers convert 2x+ vs non-viewers | No correlation between Wins Board views and conversion |
| Two-app architecture is acceptable to users | 🟡 | Track: do users actually run skills after course instructions? | >50% of users who reach practical classes run at least one skill | <20% run skills (the gap between web app and Cowork is too large) |
| Free mini-course is effective lead gen | 🔴 | Track: free users who convert vs direct paid signups | Free course produces >30% of paid conversions | Free course has high completion but near-zero conversion |

### Kill Criteria

These signals would cause a fundamental rethink of the product:

1. **<5% onboarding completion rate** after 100 starts → the methodology introduction is wrong or the data capture is too intrusive
2. **<1% free → paid conversion** after 500 free users → the free course doesn't create enough desire for the paid version
3. **<5% course completion rate (paid)** after 50 paid users → the course itself isn't compelling enough (even below industry average)
4. **Zero wins written** after 30 days with 20+ paid users → the Wins Board concept doesn't resonate
5. **>80% refund rate** within 7 days → the product doesn't match the landing page promise

**Confidence:** 🔴 guess (all targets are hypothesized — no baseline data exists)

---

## 10. MVP Scope + Deferred Items

### Build Dependency Graph

```
                    ┌────────────────┐
                    │  1. Auth +     │
                    │  Better Auth   │
                    └───────┬────────┘
                            │
                    ┌───────▼────────┐
                    │  2. Database   │
                    │  Schema +      │
                    │  Migrations    │
                    └───────┬────────┘
                            │
              ┌─────────────┼─────────────┐
              │             │             │
     ┌────────▼───────┐   ┌▼──────────┐  │
     │ 3. Onboarding  │   │ 4. Stripe │  │
     │ Flow + Profile │   │ Payment   │  │
     │ Data Capture   │   │ + Webhook │  │
     └────────┬───────┘   └─────┬─────┘  │
              │                 │         │
              └────────┬────────┘         │
                       │                  │
              ┌────────▼────────┐         │
              │  5. Soft Paywall │         │
              │  (free vs paid) │         │
              └────────┬────────┘         │
                       │                  │
              ┌────────▼────────┐  ┌──────▼──────┐
              │  6. Course      │  │ 7. Content  │
              │  Player + MD    │  │ Creation    │
              │  Rendering      │  │ (free+paid) │
              └────────┬────────┘  └──────┬──────┘
                       │                  │
                       └────────┬─────────┘
                                │
                    ┌───────────▼──────────┐
                    │  8. Progress         │
                    │  Tracking + UI       │
                    └───────────┬──────────┘
                                │
                    ┌───────────▼──────────┐
                    │  9. Wins Board       │
                    │  (write + public     │
                    │   feed + categories) │
                    └───────────┬──────────┘
                                │
                    ┌───────────▼──────────┐
                    │  10. AI Skills       │
                    │  (Claude Cowork —    │
                    │   built separately)  │
                    └─────────────────────┘
```

### Build Sequence (Solo Developer — 8 weeks)

| Phase | What | Dependencies | Notes |
|---|---|---|---|
| **Week 0** | Content validation: write Module 1 content + Phase 1 AI skill. Run 1 person through it. | None | Tests the product before the container. |
| **Week 1** | Resolve Stripe subscription vs one-time. Auth (Better Auth) + DB schema + migrations (all 7 entities). | None | Foundation. Schema must match PRD. |
| **Week 1-2** | Stripe integration (subscription checkout, webhooks for created/failed/cancelled, refund handling) | Auth, DB | Payment lifecycle must be complete. |
| **Week 2** | Onboarding flow (anonymous session, 3-question lean flow, session persistence, throughline naming) | Auth, DB | The entry point for all users. |
| **Week 2-3** | Course player (markdown loading via providers/content.ts, video embeds, Decision Anchor, 3 dashboard states) | Auth, DB | Core product. In-memory content map. |
| **Week 3** | Content creation (Module 1-3 minimum, practical class instructions, all markdown) | Course player | AI-assisted. |
| **Week 3.5** | **Content QA: Indy reviews all user-facing content against voice.md** | Content done | Non-negotiable. Content IS the product. |
| **Week 4** | Soft paywall (throughline personalization, upgrade flow) + first-module-free gating | Auth, Stripe, Onboarding | Conversion point. |
| **Week 4-5** | Progress tracking (class-level, course-id-scoped, no hard sequential gates) + Decision Anchor UI | Course player, DB | Aligned with soft nudges, not hard locks. |
| **Week 5** | Wins Board (write form, public feed, categories, "My Wins", empty state, seeding, rate limit 3/day) | Auth, DB | Seed with 5-10 founder wins before launch. |
| **Week 5-6** | Rich profile (post-purchase), nav states, soft time nudges, Quick Start path | Everything | Polish features. |
| **Week 6-7** | AI skills for Claude Cowork (Phase 1-4 minimum) | None (parallel) | Can be built alongside weeks 4-5. |
| **Week 7-8** | Polish, testing, content redirects.json, mobile QA, deploy | Everything | Ship. |

**Total: ~8 weeks.** Includes Week 0 content validation and content QA checkpoint. P1 features (email reminders, search, bookmarks) are buffer — cut under pressure without affecting core product.

### Deferred Items with Promotion Criteria

| Item | Deferred to | Why deferred | JTBD finding it serves | Promote when |
|---|---|---|---|---|
| **Decision primitive in web app** | V1.1 | Unproven value, adds complexity | Section 3, Section 9 | Users request decision visibility; or retention data shows users lose focus |
| **Skills-to-API connection** | V1.1 | Two separate apps in V1 | Section 8 | Users want exercise outputs visible in web app |
| **Hard time-bounding** | V1.1 | Risk of pressure-driven drop-off | Section 7 | Soft nudges show <10% effect on preparation time |
| **Wins Board community (comments, reactions)** | V2 | Requires moderation, user base | Section 3 (social job) | >50 active users, >100 wins written, users request interaction |
| **Daily content (podcast-to-blog-to-email)** | V2 | Content pipeline not built | Section 3 (Little Hire) | Retention drops after course completion |
| **Email reminders** | V1.1 | Adds email provider integration | Section 4 (firing trigger #4) | Inactivity rate >40% at 14 days |
| **Course search** | V1.1 | Reference nav is Little Hire, not Big Hire | Section 3 (Little Hire) | Users report difficulty finding specific content |
| **Bookmarks** | V1.1 | Reference nav addition | Section 3 (Little Hire) | Users report wanting to save specific classes |
| **A/B testing infrastructure** | V1.1 | Not needed until we have traffic | Founder decision | >100 users/month flowing through onboarding |
| **Admin analytics dashboard** | V1.1 | PostHog/manual queries work for early stage | Founder decision | PostHog data becomes insufficient for decision-making |
| **Skills for Phases 5-8** | V1.1 | Phases 1-4 cover the critical Prepare→Execute gap | Section 7 (top outcomes) | First cohort reaches Phase 5 |
| **Separate free mini-course** | REJECTED | First-module-free is lower build cost, higher conversion intent | autoplan review | Never — unless Module 1 alone doesn't convert |
| **Cohort model** | REJECTED | Solo dev constraint. Async-first is architecturally simpler. | autoplan CEO review | If retention <30% and isolation is the cause, revisit |

### Re-Engagement V1 (Without Wins Board Community)

The JTBD firing trigger #4 ("I lost momentum and couldn't restart") is addressed in V1 through:

1. **Wins Board as pull mechanism:** Seeing others' wins when returning creates a "people are doing this" signal
2. **Progress persistence:** User returns and sees exactly where they left off — no restart friction
3. **Throughline reminder:** Dashboard shows their named decision — reconnects them to why they started
4. **Soft nudge (if email is P0):** 7-day inactivity email with their module name and throughline

Full re-engagement architecture (push notifications, personalized content, re-onboarding) deferred to V2.

---

## Quality Checklist

- [x] Every P0 feature traces to a specific JTBD finding (section + finding reference)
- [x] The "don't build" list from JTBD Section 9 is explicitly enforced (Section 4 table)
- [x] The decision primitive is specified (deferred with clear reasoning and promotion criteria)
- [x] AI skills integration respects the manual-thinking/AI-structuring boundary (Section 6 table)
- [x] Course platform supports both sequential and reference navigation (Section 7)
- [x] Time-bounded phases specified as soft nudges (Section 4: F7, Section 7)
- [x] Onboarding maps to JTBD customer segments (Section 2 persona table)
- [x] Emotional job ("doing the real work") reflected in UX: no dashboards, no streaks, wins are about real progress
- [x] Anxiety-reduction features are P0 (Section 1: anxiety architecture table)
- [x] Total complexity achievable by one developer + AI in ~6 weeks (Section 10 build sequence)
- [x] Success metrics trace to Big Hire (onboarding completion, conversion) and Little Hire (retention, win writing)
- [x] Privacy requirements address personal decision data sensitivity (Section 8)
- [x] Tech stack matches coding.md (Section 8 table)
- [x] MVP scope matches JTBD Section 9 with founder adjustments (Wins Board promoted, decision primitive deferred)
- [x] Build sequence expressed as dependency graph (Section 10)
- [x] All five "must build" items addressed: Wins Board (V1 simplified), skills-as-exercises (V1), course-as-reference (V1 sequential + P1 search/bookmarks), decision primitive (deferred with criteria), time-bounded phases (V1 soft nudges)
- [x] Each JTBD firing trigger maps to a churn warning signal (Section 9 table)
- [x] Payment flow and money-back guarantee fully specified (Section 8)

- [x] Architectural prerequisites documented (Stripe model, schema migration, onboarding sessions, purchase linkage, free/paid gating)
- [x] UI specs for critical screens: onboarding steps, soft paywall, 3 dashboard states, practical class, Wins Board empty state
- [x] Nav states defined per user type (anonymous, free, paid, admin)
- [x] Decision Anchor specified as persistent UI element
- [x] Wins Board seeding plan and rate limiting (3/day) defined
- [x] Content loading strategy specified (in-memory map via providers/content.ts)
- [x] Content redirect map (redirects.json) specified for class_id stability
- [x] Acquisition strategy stated with channel assumption and kill signal
- [x] Competitive moat hypothesis (data moat) documented
- [x] Content QA checkpoint (Indy review) in build sequence

**Result: 28/28 criteria met (18 original + 10 from autoplan review).**

---

## Assumptions Registry

| Assumption | Confidence | Signal that proves it wrong |
|---|---|---|
| Two-app architecture (web + Cowork) is acceptable to users | 🟡 hypothesis | <20% of users reaching practical classes run a skill |
| Interactive onboarding converts better than direct paywall | 🔴 guess | A/B test shows direct checkout converts higher |
| Free mini-course is effective lead gen | 🔴 guess | <1% free → paid conversion after 500 free users |
| Soft nudges address the preparation trap | 🔴 guess | Users spend 4x+ suggested time on modules |
| Anonymous public Wins Board reduces new-user anxiety | 🔴 guess | No correlation between Wins Board views and conversion |
| Course + skills + Wins Board is the right V1 scope | 🟡 hypothesis | One component has <10% engagement |
| 6-week build timeline is realistic for solo dev + AI | 🔴 guess | Unforeseen complexity in auth, payment, or content |
| Desktop-first is correct (Cowork runs on desktop) | 🟡 hypothesis | >50% of course consumption is mobile |
| Rich onboarding data capture doesn't kill completion | 🟡 hypothesis | <40% onboarding completion rate |
| Context-based wins (not methodology-based) resonate | 🔴 guess | Users don't know what to write, or wins feel performative |
| Content-as-code (markdown) scales for V1 | 🟡 hypothesis | Content updates require deploys, causing friction |

---

## Decision Log

| Date | Decision | Why | Watch signal |
|---|---|---|---|
| 2026-04-06 | Onboarding = course introduction (shared free/paid) | Founder insight: first methodology experience IS the onboarding. Serves data capture + anxiety reduction + throughline naming. | If onboarding completion < 60% — too much friction |
| 2026-04-06 | Wins Board promoted to V1 (simplified) | Founder: "v1 should have the winning stuff." Write-only, anonymous, no community. | If zero wins written after 30 days |
| 2026-04-06 | Decision primitive deferred to V1.1 | Founder: "I don't think it makes sense for now... does this add value?" Unproven. | Users request decision visibility in web app |
| 2026-04-06 | Two separate apps (web + Cowork), no API sync | Simplest architecture. Matches "your data, your computer." | <20% skill execution rate from practical classes |
| 2026-04-06 | Free mini-course in V1 (separate content, not gated paid content) | Founder: free course is critical lead gen. Content is AI-generated markdown — low infra cost. | <1% free→paid conversion |
| 2026-04-06 | Soft paywall after onboarding (not before) | Founder: user invests time + names decision first → maximum conversion context. | A/B test shows earlier paywall converts better |
| 2026-04-06 | Rich profile data capture during onboarding | Founder: "a great way to know our users and know which copy to use." ICP intelligence. | Onboarding completion drops due to question fatigue |
| 2026-04-06 | Email capture last (before course unlock) | Founder: start without friction, ask for email only when value has been demonstrated. | Email capture rate is low because users bail before reaching that step |
| 2026-04-06 | Soft time nudges (no hard gates) | Reduces drop-off risk from pressure. Users can proceed at own pace. | Users spend 4x+ suggested time = nudges are invisible |

---

## Override Warnings

This document introduces decisions that update or adjust earlier documents:

1. **Wins Board promoted to V1.** JTBD Section 9 deferred it to V2. Founder overrides: simplified version (write-only, no community) ships in V1. Update roadmap.md.
2. **Decision primitive deferred.** JTBD Section 9 listed it as "must build" for V1. Founder defers: web app doesn't track the decision. Only a text label from onboarding. Update lifedecisions.md if it references the decision primitive.
3. **Free mini-course in V1.** Roadmap.md lists free course funnel (doc 06) as NOT STARTED. This PRD includes it in V1 scope. Doc 06 (free course funnel design) may need to be written or simplified.
4. **Interactive onboarding as methodology introduction.** Not in any existing document. New concept from this PRD. Course outline (doc 04) may need its "Onboarding" section updated to reflect that onboarding IS the introduction.
5. **Soft time nudges vs JTBD's time-bounded phases.** JTBD Section 7 ranked "minimize time spent preparing" as the #1 outcome (Opp 9). This PRD implements it as soft nudges, not hard gates. The JTBD finding still stands — we're testing whether soft is sufficient before going hard.

---

**Next step:** Technical Architecture (doc 09) translates these requirements into system design — routes, components, database schema, deployment. Build begins after architecture review.

---

<!-- AUTONOMOUS DECISION LOG -->
## Decision Audit Trail

| # | Phase | Decision | Classification | Principle | Rationale | Rejected |
|---|-------|----------|---------------|-----------|-----------|----------|
| 1 | CEO | Keep course-first, add Quick Start as taste decision | TASTE | P1 | Both voices say course contradicts JTBD, but founder accepted premise | Quick Start deferred to gate |
| 2 | CEO | Add channel assumption + acquisition kill signal | Mechanical | P1 | Both voices: no acquisition strategy, metrics assume traffic | — |
| 3 | CEO | Add Wins Board seeding plan to launch sequence | Mechanical | P6 | Both voices: empty board is anti-social-proof | — |
| 4 | CEO | Recommend 8 weeks with P1 as buffer | Mechanical | P3 | Both voices: 6 weeks has zero slack | — |
| 5 | CEO | Add data moat hypothesis to PRD | Mechanical | P1 | Both voices: no competitive moat analysis | — |
| 6 | CEO | Add content validation to Week 0 | Mechanical | P6 | Both voices: content untested before platform built | — |
| 7 | CEO | Document cohort model rejection | Mechanical | P5 | Subagent: cohort never evaluated. Rejected: solo dev constraint | Cohort model |
| 8 | CEO | Free mini-course vs first-module-free | TASTE | — | Both approaches viable, different tradeoffs | Surfaced at gate |
| 9 | CEO | Reduce onboarding to 3 pre-purchase, rest post-purchase | TASTE | P3 | Subagent: 10 questions contradicts anxiety reduction | Surfaced at gate |
| 10 | Design | Add step-level onboarding screen specs | Mechanical | P5 | 7/7 consensus: "woven between content" is ambiguous | — |
| 11 | Design | Add soft paywall layout with throughline personalization | Mechanical | P5 | Both voices: conversion-critical screen has zero spec | — |
| 12 | Design | Add 3 dashboard states (first login, mid, complete) | Mechanical | P1 | Both voices: primary screen is one sentence | — |
| 13 | Design | Add empty state specs + seeding plan | Mechanical | P6 | Both voices: empty Wins Board backfires | — |
| 14 | Design | Add practical class "threshold moment" design | Mechanical | P5 | Both voices: skill handoff is emotional dead zone | — |
| 15 | Design | Add mobile constraints for 3 critical flows | Mechanical | P1 | Both voices: mobile reading not designed | — |
| 16 | Design | Add nav states per user type table | Mechanical | P5 | Both voices: permissions + nav unspecified | — |
| 17 | Design | Add Decision Anchor as persistent UI element | TASTE | — | Both voices recommend but this is aesthetic/product taste | Surfaced at gate |
| 18 | Eng | Resolve Stripe subscription vs one-time BEFORE Week 1 | Mechanical | P5 | Both voices: code says payment, PRD says subscription | — |
| 19 | Eng | Add migration plan for 5 entity mismatches | Mechanical | P5 | Both voices: schema and PRD diverge | — |
| 20 | Eng | Specify email-based purchase linkage in Flow 0 | Mechanical | P1 | Both voices: webhook race = null userId = broken access | — |
| 21 | Eng | Add anonymous session strategy for onboarding | Mechanical | P1 | Both voices: multi-step form with no persistence | — |
| 22 | Eng | Remove hard sequential gates, align with soft nudges | Mechanical | P5 | Codex: code contradicts PRD promise | — |
| 23 | Eng | Add course-id-scoped access instead of role-based | Mechanical | P3 | Both voices: free users blocked from free course | — |
| 24 | Eng | Add rate limiting on Wins Board (3/user/day) | Mechanical | P1 | Both voices: public feed + no rate limit = spam risk | — |
| 25 | Eng | Add content redirects.json for class_id renames | Mechanical | P1 | Subagent: file path keys break on rename | — |
| 26 | Eng | Add Indy content QA checkpoint after Week 3 | Mechanical | P6 | Subagent: AI-generated content with no quality gate | — |

---

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | `/plan-ceo-review` | Scope & strategy | 1 | issues_resolved | 11 findings, 6/6 consensus confirmed, premises accepted |
| Design Review | `/plan-design-review` | UI/UX gaps | 1 | issues_resolved | 10 findings, 7/7 consensus confirmed, all specs added |
| Eng Review | `/plan-eng-review` | Architecture & tests | 1 | issues_resolved | 25 findings, 6/6 consensus confirmed, 5 schema fixes |
| CEO Voices | codex+subagent | Independent strategy | 1 | clean | 6/6 confirmed, 0 disagreements |
| Design Voices | codex+subagent | Independent UX | 1 | clean | 7/7 confirmed, 0 disagreements |
| Eng Voices | codex+subagent | Independent architecture | 1 | clean | 6/6 confirmed, 0 disagreements |

**VERDICT:** APPROVED. 26 decisions applied (22 mechanical, 4 taste). All cross-phase themes resolved. PRD v2.0 is implementation-ready pending Stripe model decision in Week 1.
