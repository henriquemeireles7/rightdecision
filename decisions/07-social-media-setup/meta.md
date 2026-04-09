# META-DOC: Social Media Setup

## Purpose
Define the complete social media infrastructure: all accounts, their identity, what they post, how content flows from podcasts to platforms, and the operational plan to actually run it. This document is what Henry and Indy use to set up accounts in one session and what AI agents use to generate/distribute content.

## Scope
**This document IS:** Account registry, bio copy, visual specs, content playbook, cross-posting rules, engagement protocol, podcast-to-distribution pipeline, analytics framework, and setup checklist.
**This document is NOT:** The content automation pipeline (doc #8 covers OpusClip, AI-generated content, folder-based automation). Not the knowledge base structure (doc #9). Not paid traffic (doc #21). Not the manifesto copy (doc #2, which feeds into this).

## Primary reader
Indy (creates accounts, posts content, engages), Henry (tech setup, integrations, automation hooks), AI agents (generate template-based content and descriptions).

## Input documents
- `decisions/02-manifesto/document.md` — voice, seven angles, eight sins, hooks by awareness level, brand vocabulary, Indy Test
- `decisions/01-business-model/document.md` — ICP, pricing, distribution strategy (Phase 1: organic, Phase 2: paid)
- `decisions/04-course-outline/document.md` — 9 modules, 3 acts, topic structure for podcast content
- `DESIGN.md` — Ethereal Warmth palette, Instrument Serif + Sans, warm cream/beige/gold
- `decisions/human.md` — writing rules, anti-patterns, Henry's and Indy's voice patterns

## Expert council
1. **Gary Vaynerchuk** — content pyramid (one long-form → many short-form), platform-native adaptation, $1.80 engagement strategy
2. **Jasmine Star** — small business social strategy, master 1-2 platforms before expanding, Instagram-first for the ICP
3. **Alex Hormozi** ($100M Leads) — content-to-distribution funnel, volume thesis, organic reach math
4. **Paddy Galloway** — YouTube strategy, thumbnails, titles, algorithm mechanics, session time
5. **Platform documentation** — TikTok Creator Portal, Instagram professional dashboard, YouTube Creator Academy

## Research summary
**Layer 1 (Established):** Social media setup for infobusinesses follows: choose platforms → define identity → create content categories → establish cadence → measure results. Gary Vee's content pyramid (1 long-form → 30+ micro-content pieces) is the standard repurposing framework for small teams.

**Layer 2 (Trending):** In 2026, platform algorithms increasingly punish cross-posted content (TikTok watermarks on Reels get suppressed). Native content wins. Podcast-to-social is the dominant B2C infobusiness distribution model. Short-form video drives discovery; long-form drives trust and conversion.

**Layer 3 (First principles):** 13 accounts with a 2-person team is operationally dangerous. Must have: (1) a phased rollout that prioritizes high-ROI platforms first, (2) a repurposing workflow that makes 13 accounts feasible, (3) clear rules for what's cross-posted vs native vs skipped.

**Adjacent wisdom:** Stand-up comedy tour model: record the special (podcast), distribute clips (shorts), build audience (social), sell tickets (subscription). The podcast IS the source material; social channels are distribution endpoints.

## Document-level failure modes
1. **Launches 13 accounts simultaneously and feeds none.** Without a phased rollout, the team burns out in 3 weeks. Must prioritize which platforms get active first.
2. **Cross-posts identical content everywhere.** Instagram suppresses TikTok-watermarked Reels. Each platform has different optimal formats. A cross-posting matrix is essential.
3. **Posts without engaging.** Content without community response is a broadcast, not social media. Engagement protocol is required.
4. **No measurement.** Without KPIs at 30/60/90 days, can't distinguish a failing strategy from one that needs time.
5. **Personal accounts feel like brand sock puppets.** Indy and Henry's personal accounts must feel authentically personal, not like brand extensions with different handles.
6. **Content categories not tied to buyer journey.** If every post is top-of-funnel awareness, the audience grows but never converts to $197/year.

## Sections

### SECTION 1: Account Registry + Access Management
**Answers:** All 13 accounts in a table: platform, handle, type (personal/brand), owner, purpose. Plus: credential storage, admin access, backup emails.
**Done when:** Every account has a confirmed-available handle, a designated owner, and credentials stored in a password manager. A third party could recover access to any account.
**Failure modes:**
- Handles unavailable and no fallback naming convention
- No credential management plan (what if Indy loses her phone?)
- Missing: who has admin access to brand accounts (both founders? one?)
**Max length:** 1 page (table + access protocol)
**Confidence:** 🟡 hypothesis (handles need availability check)

### SECTION 2: Bio + Description Copy
**Answers:** Per-account bios within platform character limits. Personal accounts (Indy/Henry voice) vs brand account (Right Decision voice). Each bio includes: who, what they do, CTA.
**Done when:** Every bio passes the Indy Test. Character limits are respected per platform. A stranger reading any bio can understand what the account is about and what to do next.
**Failure modes:**
- Writing 13 identical bios with different names
- Exceeding platform character limits (TikTok: 80 chars, Instagram: 150, X: 160, Facebook: 101, YouTube: 1000)
- No refresh cadence — bios should update with launches and campaigns
**Max length:** 2 pages (table with platform, account, bio text, CTA)
**Confidence:** 🟡 hypothesis

### SECTION 3: Visual Identity Spec Sheets
**Answers:** Profile photos, cover images, and branded asset specs per platform. How Ethereal Warmth (DESIGN.md) adapts to circular crops, banner safe zones, and mobile rendering. Asset dimensions per platform.
**Done when:** A designer or AI agent can produce all visual assets from this section's specs without asking questions. Assets render correctly on mobile for every platform.
**Failure modes:**
- Generic specs that don't account for platform-specific crops (TikTok: circular 200x200, YouTube banner: 2560x1440 with safe zone)
- Ethereal Warmth palette looks washed out on dark-mode mobile TikTok
- No distinction between personal and brand visual treatment
**Max length:** 2 pages (dimension tables + design guidelines)
**Confidence:** 🟢 validated (DESIGN.md is complete)

### SECTION 4: Content Playbook by Account + Platform
**Answers:** What each account posts (content categories), in what format (templates), mapped to the buyer journey (awareness → consideration → conversion). Merges content categories with posting templates.
**Done when:** A content creator can open this section, pick an account + stage, and produce a post without asking what to write about. Each platform has format-specific templates (YouTube thumbnails, TikTok caption formulas, Instagram carousel layouts, X thread structure).
**Failure modes:**
- All content is top-of-funnel awareness with no conversion content
- Templates become stale — needs built-in refresh triggers
- Personal accounts have the same content categories as brand accounts (should differ)
- Posting templates don't respect platform-native formats (vertical video dimensions, carousel specs)
**Max length:** 4-5 pages (biggest section — one subsection per platform)
**Confidence:** 🟡 hypothesis

### SECTION 5: Cross-Posting Rules + Adaptation Matrix
**Answers:** What content goes everywhere, what gets adapted per platform, what is native-only. Explicit rules for: watermark removal, aspect ratio adaptation, caption reformatting, hashtag differences, CTA differences.
**Done when:** For any piece of content, the team knows: does this go to all 13 accounts, a subset, or just one? And what changes for each destination?
**Failure modes:**
- Cross-posts TikTok videos to Instagram with watermarks (Instagram suppresses these)
- Identical text across platforms with different cultures (X is punchy, Facebook is conversational, Instagram is visual-first)
- No distinction between "adapt" (same content, reformatted) and "native" (platform-unique content)
**Max length:** 2 pages (matrix table + rules)
**Confidence:** 🟡 hypothesis

### SECTION 6: Content Engine — Podcast-to-Distribution Pipeline
**Answers:** How 2 podcasts/day become content for 13 accounts. The repurposing workflow: record podcast → extract clips (doc #8 automates this) → adapt per platform → post. Plus: podcast types mapped to course modules, the dual purpose (distribution + training), and the transition trigger from 2/day to 1 live/day.
**Done when:** The team knows: what kind of podcast to record, how long, on what topic (mapped to 7 angles), and where each output goes. The transition trigger from podcast to live is a specific metric, not a vague intention.
**Failure modes:**
- Dual purpose produces content that's mediocre at both jobs (social-optimized ≠ course-training-optimized)
- 2 podcasts/day is unsustainable without a realistic time budget (recording + editing + distribution)
- No connection to podcast platforms (Apple, Spotify) — only social distribution mentioned
- Transition trigger is a vague "when we're ready" instead of a metric
**Max length:** 2-3 pages
**Confidence:** 🔴 guess (untested cadence, untested dual-purpose model)

### SECTION 7: Phased Rollout + Operational Capacity
**Answers:** Which platforms launch first, which are deferred, and why. Operational capacity assessment: hours/day required to run N active accounts. Phase 1 platforms (highest ROI for ICP), Phase 2 (expand after rhythm established), Phase 3 (full 13).
**Done when:** The team has a week-1 launch plan that does not require feeding 13 accounts simultaneously. Operational hours are estimated per phase.
**Failure modes:**
- Launches everything at once, abandons 10 accounts in week 3
- Prioritizes wrong platforms (ICP is women 30-50 — probably not X/Twitter-first)
- No kill criteria for underperforming platforms
**Max length:** 1-2 pages
**Confidence:** 🔴 guess (no data on which platform converts best for this ICP)

### SECTION 8: Engagement + Community Response Protocol
**Answers:** Reply cadence per platform. DM handling rules. Comment strategy. How personal vs brand accounts engage differently. Time budget for engagement vs posting.
**Done when:** Indy knows: check Instagram DMs every X hours, reply to comments within Y hours, spend Z minutes/day engaging on other accounts.
**Failure modes:**
- Posting without engaging (broadcast mode — algorithms punish this)
- No rules for brand voice in replies (easy to go off-brand in casual comments)
- No escalation path for negative comments or potential crises
**Max length:** 1-2 pages
**Confidence:** 🟡 hypothesis

### SECTION 9: Analytics, KPIs + Funnel Tracking
**Answers:** What metrics matter per platform at 30/60/90 days. The funnel: impressions → profile visits → link clicks → landing page → $197 subscription. Link-in-bio tool selection. Attribution tracking.
**Done when:** The team has a weekly dashboard routine: check these 5 numbers, if this number drops below X, do Y.
**Failure modes:**
- Tracks vanity metrics (followers) instead of conversion metrics (link clicks, landing page visits)
- No link-in-bio strategy (how do 13 accounts funnel to rightdecision.io?)
- No attribution: can't tell which platform drives actual sales
**Max length:** 1-2 pages (metric tables + dashboard template)
**Confidence:** 🔴 guess (no data yet)

### SECTION 10: Platform Compliance + Algorithm Guide
**Answers:** Key algorithm mechanics per platform (what gets rewarded, what gets suppressed). Content policy risks for self-development content. Verification/badge strategy.
**Done when:** Content creators know the 3 most important algorithm signals per platform AND the content types that risk takedown.
**Failure modes:**
- Creates content that's algorithmically penalized (wrong aspect ratio, watermarks, external links in captions)
- Self-development content flagged under health/wellness restrictions
- Ignores verification opportunities that boost reach
**Max length:** 2 pages (table per platform)
**Confidence:** 🟡 hypothesis

### SECTION 11: Initial Setup + Ongoing Health Checklist
**Answers:** Step-by-step account creation guide. Platform-specific settings (SEO, discoverability, linked accounts, notification settings). Plus: 7-day and 30-day health checks (analytics connected? posting schedule running? engagement happening?).
**Done when:** Someone can follow the checklist and have all Phase 1 accounts live in one session. Health checks have specific dates and criteria.
**Failure modes:**
- Setup-only with no follow-up verification
- Missing platform-specific settings (TikTok creator account toggle, Instagram professional account, YouTube handle claim)
- No mention of podcast platform setup (Apple, Spotify) alongside social accounts
**Max length:** 2 pages (checklist format)
**Confidence:** 🟢 validated (execution, not strategy)

## Quality checklist
- [ ] Every account has bio copy within platform character limits
- [ ] All 13 accounts listed with confirmed-available handles (or fallback convention)
- [ ] Posting templates are platform-native (not generic across platforms)
- [ ] Distribution plan has specific numbers (posts/day/platform) per rollout phase
- [ ] Podcast format defined with dual purpose explicit and tension addressed
- [ ] Visual specs reference DESIGN.md palette with platform-specific dimension tables
- [ ] Cross-posting matrix explicitly says what goes where and what gets adapted
- [ ] Buyer journey is mapped: which content drives awareness vs consideration vs conversion
- [ ] Engagement protocol has time budgets, not just "reply to comments"
- [ ] KPI framework has 30/60/90 day targets per platform
- [ ] Phased rollout exists — NOT all 13 accounts on day 1
- [ ] Podcast platforms (Apple, Spotify) included alongside social platforms
- [ ] Every section passes the Indy Test for customer-facing copy

## Assumptions registry
| Assumption | Confidence | Signal that proves it wrong |
|---|---|---|
| Handles (indykaz, henrykaz, therightdecision) are available on all platforms | 🔴 guess | Check before writing bios |
| 2 podcasts/day is operationally sustainable for 2 founders | 🔴 guess | Recording takes >3 hours/day total |
| Women 30-50 are reachable on TikTok (not just Instagram) | 🟡 hypothesis | TikTok audience skews too young for this ICP |
| Personal channels (Indy, Henry) drive more trust than brand channel alone | 🟡 hypothesis | Brand account outperforms personal accounts in engagement |
| Podcast clips are the highest-ROI short-form content type | 🟡 hypothesis | Original short-form outperforms clips |
| Instagram is the highest-converting platform for this ICP | 🟡 hypothesis | Another platform drives more link clicks per impression |
| 13 accounts is operationally feasible with automation (doc #8) | 🔴 guess | Even with automation, quality degrades beyond 6-8 active accounts |

## Adversarial review summary
Adversarial review (Claude subagent) flagged 7 missing sections, 2 overlaps, and 6 blind spots. Key resolutions:
- **Cross-posting rules added as dedicated section** (HIGH — Instagram suppresses TikTok watermarks)
- **Engagement protocol added** (HIGH — posting without engaging = dead accounts)
- **Analytics/KPI framework added** (HIGH — can't improve what you don't measure)
- **Phased rollout added** (HIGH — 13 accounts day-1 is operationally suicidal)
- **Content Categories + Posting Templates merged** into Content Playbook (were overlapping)
- **Distribution Cadence + Podcast merged** into Content Engine section (were the same topic split awkwardly)
- **Platform compliance/algorithm guide added** (MEDIUM — algo-ignorant content gets suppressed)
- **Podcast platforms noted** (Apple, Spotify — missing from original scope)
- **YouTube noted as structurally different** — gets subsection in Content Playbook, not same treatment as short-form platforms

## Reader journey
**After this document:** Doc #8 (Short-Video Viral Strategy) takes the accounts, templates, and cross-posting rules from this doc and automates the pipeline. Doc #9 (Knowledge Base Strategy) defines how podcast transcripts feed back into the knowledge base.
**Last section should bridge to:** "Accounts are set up. Content engine is defined. Now automate the distribution (doc #8)."

## Decision log
| Date | Decision | Why | Watch signal |
|---|---|---|---|
| 2026-04-06 | 11 sections (expanded from original 8 based on adversarial review) | Missing engagement, analytics, cross-posting, phased rollout, compliance | If 11 is too many, merge compliance into content playbook |
| 2026-04-06 | Phased rollout instead of simultaneous launch | 2-person team cannot feed 13 accounts quality content from day 1 | If automation (doc #8) makes simultaneous launch feasible, collapse phases |
| 2026-04-06 | Personal vs brand accounts have distinct voice/content rules | Adversarial review flagged "sock puppet" risk | If maintaining distinct voices is too costly, merge personal into brand |
| 2026-04-06 | Podcast platforms (Apple, Spotify) included in scope | Podcasts are a core distribution channel; ignoring audio platforms is a gap | If podcasts don't drive discovery via audio platforms, deprioritize |
