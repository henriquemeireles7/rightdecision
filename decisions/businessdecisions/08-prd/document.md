# Product Requirements Document — Business Decisions V1 (Phase 1)
**Version:** 1.0
**Date:** 2026-04-07
**Status:** Draft
**Author:** Henry + Claude
**Input:** decisions/businessdecisions/07-jtbd/document.md
**Pipeline:** d-jtbd → **d-prd** (here) → d-tasks → d-code
**Reference:** decisions/08-short-video-viral-strategy/document.md (content pipeline = BD MVP)

## Document scope
**This document IS:** A PRD for Business Decisions V1 — Phase 1 only (content pipeline + analytics). Defines what ships, what doesn't, feature requirements, data model, integration specs, and success metrics. Written for a solo developer (Henry) + AI agents to build from without asking clarifying questions.
**This document is NOT:** The JTBD analysis (doc 07 — this consumes it). Not the content pipeline design (doc 08 — this builds on it). Not the BD methodology. Not Phase 2-4 features (AI agents, multi-client, payments).
**Scope boundary:** Business Decisions Phase 1: content pipeline automation + analytics. Internal dogfooding only. No external customers, no course, no multi-tenancy.
**Research status:** ALL features are hypotheses. Pre-revenue, no external customer data. Henry is the first and only user (dogfooding). Confidence tags inherited from JTBD.
**Primary reader:** Henry (to build it), AI agents (to implement features)

---

## 1. Product Overview + JTBD Traceability

### What Business Decisions V1 Is

An automation platform that turns one podcast recording into distributed content across 13 social media accounts — automatically. Phase 1 is the content pipeline + analytics engine. It's the MVP of the one-person unicorn thesis: "I create once, the system distributes everywhere."

**Architecture: Agent-First, Not SaaS**
- Users interact via Claude Code (commands and skills), not a web dashboard
- The pipeline runs as Bun/TypeScript services (file watchers, API integrations, schedulers)
- Analytics are surfaced through Claude skills ("What's working?"), not dashboards
- The platform is infrastructure, not an application

**Core job served (JTBD Section 3):**
> "When I'm running a business solo and manual work is the bottleneck — I've already tried hiring, tools, and courses — I want an automation platform that turns my decisions into running systems, so I can scale revenue without scaling my time."

**Big Hire (acquisition):** "Build a profitable AI-native infobusiness that runs itself." → JTBD Section 3
**Little Hire (retention):** "The automation keeps running and improving — I'd lose my distribution if I left." → JTBD Section 3

### Phase 1 MVP Scope (JTBD Section 6 + Section 7)

| In V1 (Phase 1) | JTBD trace | Opportunity score |
|---|---|---|
| Content pipeline: recording → clips → metadata → distribution | Outcome #1 (score 18): minimize time from raw recording to distributed content | 18 |
| Platform-specific metadata generation | Outcome #3 (score 16): minimize effort of generating descriptions/hashtags/CTAs per platform | 16 |
| Cross-platform analytics with actionable insights | Outcome #4 (score 15): minimize time to identify best-performing content | 15 |
| Deduplication engine (no same clip on same platform twice) | Outcome #2 (score 13): minimize likelihood of duplicate posts | 13 |
| Pipeline monitoring + failure alerting | Outcome #5 (score 12): minimize likelihood of posting failure going unnoticed >24h | 12 |
| Retry + recovery mechanism for failed posts | Outcome #6 (score 13): minimize effort of recovering from failed pipeline steps | 13 |

**Deferred to Phase 2+:**

| Deferred | Phase | Why deferred | Promotion signal |
|---|---|---|---|
| AI agents for DMs/messages | Phase 2 | Requires trust + guardrails. Build after pipeline proves itself. | Pipeline runs >4 weeks reliably, Henry needs to handle DM volume |
| Lead capture + email nurturing | Phase 2 | Depends on audience growth from Phase 1 content | Content generates measurable inbound leads |
| AI credit system | Phase 3 | Multi-tenant concern. Henry uses his own API keys in Phase 1. | First external customer onboards |
| BD course content | Phase 3 | Course is packaging, not product. Build proof first. | Henry's results are publishable as case study |
| Multi-client / multi-tenancy | Phase 3 | No customers yet. Premature complexity. | ≥3 beta users ready to onboard |
| Stripe Connect / transaction layer | Phase 4 | Requires 50+ active clients to justify. Speculative. | Phase 3 validates market |
| Traditional SaaS dashboard | Never | Contradicts JTBD emotional job ("playing, not working") | Never — unless agent-first is invalidated |
| Done-for-you services | Never | Contradicts JTBD social job (freedom + autonomy) | Never |
| Community/forum | Never | ICP is solo operator who values independence | Never |
| Manual content creation tools | Never | BD automates distribution, not creation | Never |
| Gamification/engagement mechanics | Never | Infrastructure, not consumer app | Never |

**Confidence:** 🟡 hypothesis (scope inherits JTBD confidence)

---

## 2. User Persona + Entry Point

### The One User: Henry (Dogfooding)

Phase 1 has exactly one user: Henry. The platform is built for him first. External users arrive in Phase 3.

**Segment:** "The Manual Operator" (JTBD Section 2, Segment 1)
**Struggling moment:** Already creates content (podcasts). Already has social media accounts (13 across 5 platforms). Everything is manual. Posts by hand. Writes descriptions by hand. Checks analytics by hand. The business works but it's eating his life.
**What progress looks like:** Record a podcast. Walk away. Come back to find clips distributed, metadata written, posts scheduled. Check analytics by asking Claude "What's working?" and getting ONE actionable insight, not a wall of numbers.

**Entry point:**
1. Henry records a podcast (30-60 min, MP4)
2. Drops the file into `content-pipeline/input/`
3. The pipeline takes over: clip → score → metadata → schedule → post → archive
4. Henry asks Claude "What performed this week?" and gets a clear answer

**Success criteria for Phase 1:**
- Time from recording to all posts distributed: <2 hours (currently 4-8 hours)
- Pipeline success rate: >95% of scheduled posts published
- Content output: 30 clips/day distributed across accounts (2 episodes × 15 clips)
- First automated post within 1 hour of pipeline setup

---

## 3. User Flows

### Flow 0: Pipeline Setup (one-time)

**Trigger:** Henry decides to automate content distribution
**Steps:**
1. Configure API credentials (OpusClip, ElevenLabs, Buffer, social platform APIs) in `platform/env.ts`
2. Set up folder structure: `content-pipeline/{input,processing,output,posted,failed}/`
3. Configure platform accounts in `content-pipeline/config.json` (13 accounts across 5 platforms)
4. Configure posting schedule per platform/account (from doc #7 templates)
5. Run validation: drop test video → verify one clip flows through to one platform
6. Done: pipeline is operational

**Data created:** config.json (accounts, schedules, API keys reference), folder structure
**Error cases:** Missing API credentials → clear error message naming the missing service. API rate limit → backoff and retry with notification.
**JTBD trace:** Outcome #1 — the pipeline MUST be usable within 1 hour of setup

### Flow 1: Content Pipeline (daily operation)

**Trigger:** New video file appears in `content-pipeline/input/`
**Steps:**
1. File watcher detects new file in `input/`
2. Validate file (format, size, naming convention: `YYYY-MM-DD-NN-category.mp4`)
3. Upload to OpusClip → receive clips with virality scores
4. Filter clips: auto-approve above threshold (60/100), flag borderline for review
5. For each approved clip: generate platform-specific metadata (descriptions, hashtags, CTAs)
6. Deduplication check: ensure no clip goes to same platform/account combo twice
7. Route clips + metadata to `output/{platform}/{account}/`
8. Auto-poster picks up from output/ → posts to each platform via API/Buffer
9. On success: move to `posted/{date}/`, update manifest.json
10. On failure: move to `failed/{date}/`, send notification, log error

**Data created:** clips (mp4), metadata (json per clip per platform), manifest.json entries, post records
**Error cases:**
- OpusClip fails → move to `failed/`, notify, try fallback (Descript)
- Metadata generation fails → skip metadata, post with minimal description, flag for manual review
- Posting fails → retry 3x with exponential backoff, then move to `failed/`, notify
- Duplicate detected → skip, log, no error (expected behavior)

**JTBD trace:** Outcome #1 (score 18), Outcome #2 (score 13), Outcome #3 (score 16)

### Flow 2: Analytics Query (on-demand)

**Trigger:** Henry asks Claude "What's working?" or runs an analytics skill
**Steps:**
1. Analytics skill collects data from platform APIs (views, likes, shares, comments, saves)
2. Aggregate by: clip, platform, account, time period, category
3. Surface ONE actionable insight: "Your career clips on TikTok/therightdecision get 3x the engagement of relationship clips. Double down on career content."
4. Include supporting data: top 5 clips this week, worst 5, platform comparison
5. Store insight in `content-pipeline/insights/{date}.md`

**Data created:** analytics snapshots, insight files
**Error cases:** Platform API rate-limited → use cached data, note staleness. Platform API down → skip platform, note missing data.
**JTBD trace:** Outcome #4 (score 15) — must surface actionable insights, not a dashboard

### Flow 3: Pipeline Monitoring + Recovery

**Trigger:** Automated health check (runs every hour) or manual "pipeline status" query
**Steps:**
1. Check manifest.json for stuck items (in `processing/` for >2 hours)
2. Check `failed/` for unresolved failures
3. Check posting schedule compliance (were all scheduled posts made?)
4. Generate status: green (all good), yellow (minor issues), red (pipeline broken)
5. On yellow/red: notify Henry with specific issue + suggested fix
6. Recovery: Henry can re-trigger failed items with one command

**Data created:** health check logs, failure reports
**Error cases:** Health check itself fails → escalate immediately (meta-failure)
**JTBD trace:** Outcome #5 (score 12), Outcome #6 (score 13)

---

## 4. Feature Requirements (Prioritized)

### P0 — Must Ship (the pipeline works)

#### F1: File Watcher + Pipeline Orchestrator
**Description:** Watches `content-pipeline/input/` for new video files. Triggers the full pipeline: clip → metadata → route → post → archive. Manages state via manifest.json.
**JTBD trace:** Outcome #1 (score 18) — the core automation
**Acceptance criteria:**
- Detects new files within 30 seconds of being dropped
- Processes one episode end-to-end without manual intervention
- Updates manifest.json at each pipeline stage
- Handles concurrent episodes (queue, don't drop)
**Complexity:** L

#### F2: OpusClip Integration
**Description:** Uploads video to OpusClip, retrieves clips with virality scores, filters by threshold, stores approved clips in `processing/clips/`.
**JTBD trace:** Outcome #1 (score 18) — the raw material for distribution
**Acceptance criteria:**
- Uploads video via API (or browser automation if API not available)
- Downloads clips with metadata (score, timestamp range, duration)
- Filters: auto-approve ≥60/100, flag 40-59/100 for review, reject <40/100
- Fallback: if OpusClip is down, pause and notify (don't lose the video)
**Complexity:** M

#### F3: AI Metadata Generator
**Description:** For each clip × platform combination, generates platform-specific descriptions, hashtags, and CTAs using Claude. Follows doc #7 templates and platform character limits.
**JTBD trace:** Outcome #3 (score 16) — eliminate manual description writing
**Acceptance criteria:**
- Generates metadata per platform rules (TikTok: 300 chars, Instagram: 2200, etc.)
- Includes relevant hashtags per platform strategy
- Includes appropriate CTA per account type (brand vs personal)
- Uses clip transcript/context for relevant descriptions (not generic)
- Follows brand voice (decisions/voice.md) for brand accounts
**Complexity:** M

#### F4: Deduplication Engine
**Description:** Ensures no clip is posted to the same platform/account combination twice. Tracks all posted content in a lookup table.
**JTBD trace:** Outcome #2 (score 13) — prevent embarrassing duplicate posts
**Acceptance criteria:**
- Maintains a content fingerprint database (clip hash + platform + account)
- Blocks duplicate posts before they reach the auto-poster
- Logs duplicates for visibility (not silently dropped)
- Handles near-duplicates (same clip, different metadata = allowed)
**Complexity:** S

#### F5: Auto-Poster (Multi-Platform)
**Description:** Takes clips + metadata from `output/{platform}/{account}/` and posts them via platform APIs or Buffer. Respects posting schedules from config.
**JTBD trace:** Outcome #1 (score 18) — the final step of the automation chain
**Acceptance criteria:**
- Posts to all 5 platforms: TikTok, Instagram, Facebook, X, YouTube
- Posts to all 13 accounts according to schedule
- Respects platform rate limits and best posting times
- Returns post URL/ID for tracking
- Retries on transient failure (3x exponential backoff)
- Moves to `failed/` on permanent failure with clear error message
**Complexity:** L

#### F6: Manifest + State Tracking
**Description:** manifest.json tracks every file through the pipeline: input → processing → posted/failed. Single source of truth for pipeline state.
**JTBD trace:** Outcome #5 (score 12) — know what happened to every file
**Acceptance criteria:**
- Every pipeline stage updates the manifest atomically
- Manifest queryable: "show me all stuck items," "show me today's posts," "show me failures"
- Manifest survives process restart (filesystem-based, not in-memory)
- Includes timestamps at every stage for latency tracking
**Complexity:** S

#### F7: Pipeline Health Monitor
**Description:** Hourly automated check of pipeline health. Detects stuck items, failed posts, schedule misses. Notifies Henry when action needed.
**JTBD trace:** Outcome #5 (score 12) — failures don't go unnoticed for >24h
**Acceptance criteria:**
- Runs every hour (cron or Bun scheduled task)
- Detects: stuck items (>2h in processing), unresolved failures, missed schedule posts
- Classifies: green (all good), yellow (minor issues), red (pipeline broken)
- Notifies via: macOS notification + optional email/Telegram
- Stores health history for trend analysis
**Complexity:** S

### P1 — Should Ship (the pipeline is smart)

#### F8: Cross-Platform Analytics Engine
**Description:** Collects engagement data from all platforms, aggregates across clips/platforms/accounts, identifies top and bottom performers. Data stored locally for Claude skill queries.
**JTBD trace:** Outcome #4 (score 15) — know what's working without checking each platform
**Acceptance criteria:**
- Pulls: views, likes, shares, comments, saves from each platform API
- Aggregates by: clip, platform, account, category, time period
- Stores snapshots in `content-pipeline/analytics/{date}.json`
- Updates daily (automated)
**Complexity:** L

#### F9: Actionable Insight Generator (Claude Skill)
**Description:** A Claude skill that reads analytics data and surfaces ONE clear, actionable recommendation. Not a report — a decision.
**JTBD trace:** Outcome #4 (score 15) — "analytics must surface ONE actionable insight, not a dashboard"
**Acceptance criteria:**
- Reads latest analytics snapshot
- Compares against historical data (trend detection)
- Outputs: "Do more of X, stop doing Y, try Z next week"
- Includes supporting data (top 5, bottom 5, platform comparison)
- Saves insight to `content-pipeline/insights/{date}.md`
**Complexity:** M

#### F10: AI Content Generator (Pipeline B)
**Description:** Generates original short-form content from methodology concepts (not podcast clips). Uses ElevenLabs voice clones + text-on-screen templates.
**JTBD trace:** JTBD Section 6, Phase 1 job — content pipeline includes AI-generated content alongside podcast clips
**Acceptance criteria:**
- Generates from concept bank (manifesto angles, sins, hooks)
- Produces: voice-clone videos, faceless voiceovers, text-on-screen graphics
- Integrates into same pipeline (metadata → route → post → archive)
- Quality gate: first 10 AI videos manually reviewed before auto-approve kicks in
**Complexity:** L

#### F11: Posting Schedule Optimizer
**Description:** Analyzes engagement data by posting time and suggests optimal posting windows per platform/account.
**JTBD trace:** Outcome #4 (score 15) — knowing what works includes WHEN to post
**Acceptance criteria:**
- Tracks engagement vs posting time for each platform
- After 2 weeks of data: suggests top 3 posting windows per platform
- Optional: auto-adjusts schedule based on performance (with manual override)
**Complexity:** M

### P2 — Nice to Have (polish)

#### F12: Dark Channel Support
**Description:** Support for separate "dark" channels (100% AI content, no brand association) using the same pipeline infrastructure.
**JTBD trace:** Doc #8 Section 4 — dark channel concept for testing virality without brand risk
**Acceptance criteria:**
- Separate config for dark channel accounts
- Different voice/visual identity from brand accounts
- Same pipeline, different routing rules
**Complexity:** S

#### F13: Content Repurposing (Long → Short → Text)
**Description:** From one podcast, generate not just clips but also blog posts, tweet threads, email newsletter content.
**JTBD trace:** Outcome #1 (score 18) — maximize output from one input
**Acceptance criteria:**
- Transcript → blog post (AI-generated, voice.md compliant)
- Transcript → tweet thread (5-7 tweets per episode)
- Transcript → email newsletter segment
**Complexity:** M

#### F14: A/B Metadata Testing
**Description:** Generate 2 versions of metadata for the same clip, post to different accounts, compare performance.
**JTBD trace:** Outcome #3 (score 16) — improve metadata quality over time
**Acceptance criteria:**
- Generates variant A and variant B descriptions
- Routes variants to comparable accounts
- Tracks performance difference
- Feeds winner patterns back into metadata generator
**Complexity:** M

---

## 5. Data Model

### Entity-Relationship Overview

Phase 1 is filesystem-first, database-second. The pipeline runs on folders + manifest.json. The database enters for analytics storage and the future web API layer.

```
PipelineRun (1) ──→ (many) Clip
Clip (1) ──→ (many) ClipMetadata (one per platform)
Clip (1) ──→ (many) Post
Post (1) ──→ (many) PostAnalytics (snapshots over time)
Account (1) ──→ (many) Post
Platform (1) ──→ (many) Account
```

### Filesystem Entities (Phase 1 primary)

**manifest.json** — State tracking for the pipeline
```json
{
  "runs": {
    "2026-04-06-01-general": {
      "inputFile": "2026-04-06-01-general.mp4",
      "status": "completed|processing|failed",
      "startedAt": "ISO timestamp",
      "completedAt": "ISO timestamp",
      "clips": [
        {
          "id": "clip-001",
          "viralityScore": 78,
          "approved": true,
          "duration": 45,
          "timestampStart": 120,
          "timestampEnd": 165,
          "platforms": {
            "tiktok/therightdecision": { "status": "posted", "postId": "...", "postedAt": "..." },
            "instagram/indykaz": { "status": "failed", "error": "rate_limit", "retries": 3 }
          }
        }
      ],
      "stats": {
        "clipsGenerated": 12,
        "clipsApproved": 10,
        "clipsPosted": 10,
        "clipsFailed": 0
      }
    }
  }
}
```

**config.json** — Platform + account configuration
```json
{
  "platforms": {
    "tiktok": {
      "accounts": [
        { "id": "therightdecision", "type": "brand", "schedule": "09:00,14:00,19:00" },
        { "id": "indykaz", "type": "personal", "schedule": "10:00,15:00" },
        { "id": "henrykaz", "type": "personal", "schedule": "11:00,16:00" }
      ],
      "charLimit": 300,
      "hashtagLimit": 5
    }
  },
  "opusclip": { "scoreThreshold": 60 },
  "retry": { "maxAttempts": 3, "backoffMs": 5000 }
}
```

### Database Entities (Phase 1 analytics + future API)

These tables extend the existing `platform/db/schema.ts`. They coexist with the Life Decisions tables.

**JTBD justification per entity:**

| Entity | Why it exists | JTBD trace |
|---|---|---|
| pipelineRuns | Track each episode through the pipeline | Outcome #1: end-to-end automation tracking |
| clips | Individual clips with metadata and scoring | Outcome #3: metadata per clip |
| posts | Every post to every platform/account | Outcome #2: deduplication + Outcome #5: failure tracking |
| postAnalytics | Engagement data snapshots over time | Outcome #4: identify best-performing content |
| platformAccounts | Account configuration and credentials | Outcome #1: multi-platform distribution |

```
pipelineRuns
├── id: uuid (PK)
├── inputFile: text (original filename)
├── category: text (general, career, relationships, etc.)
├── status: enum (queued, clipping, generating_metadata, posting, completed, failed)
├── clipsGenerated: integer
├── clipsApproved: integer
├── clipsPosted: integer
├── clipsFailed: integer
├── startedAt: timestamp
├── completedAt: timestamp
├── createdAt: timestamp
└── updatedAt: timestamp

clips
├── id: uuid (PK)
├── pipelineRunId: uuid (FK → pipelineRuns)
├── sourceTimestampStart: integer (seconds)
├── sourceTimestampEnd: integer (seconds)
├── duration: integer (seconds)
├── viralityScore: integer (0-100)
├── approved: boolean
├── contentHash: text (for deduplication)
├── transcriptSnippet: text (for metadata generation context)
├── createdAt: timestamp
└── updatedAt: timestamp

posts
├── id: uuid (PK)
├── clipId: uuid (FK → clips)
├── platformAccountId: uuid (FK → platformAccounts)
├── platformPostId: text (returned by platform API)
├── description: text (platform-specific)
├── hashtags: text[] (array)
├── cta: text
├── status: enum (scheduled, posted, failed, retrying)
├── scheduledAt: timestamp
├── postedAt: timestamp
├── failureReason: text
├── retryCount: integer (default 0)
├── createdAt: timestamp
└── updatedAt: timestamp

postAnalytics
├── id: uuid (PK)
├── postId: uuid (FK → posts)
├── snapshotAt: timestamp (when data was collected)
├── views: integer
├── likes: integer
├── comments: integer
├── shares: integer
├── saves: integer
├── createdAt: timestamp
└── (no updatedAt — snapshots are immutable)

platformAccounts
├── id: uuid (PK)
├── platform: enum (tiktok, instagram, facebook, x, youtube)
├── accountHandle: text
├── accountType: enum (brand, personal)
├── postingSchedule: jsonb (times per day)
├── isActive: boolean (default true)
├── createdAt: timestamp
└── updatedAt: timestamp
```

### Migration Plan

These are NEW tables — no migration from existing schema needed. They coexist with the Life Decisions tables (users, sessions, accounts, verifications, purchases, subscriptions, courseProgress, etc.).

The `pipelineRuns` and `clips` tables do NOT reference `users` — Phase 1 is single-user (Henry). User association is deferred to Phase 3 (multi-tenancy).

---

## 6. Integration Specs

### External Services

| Service | Purpose | API type | Phase 1 usage |
|---|---|---|---|
| **OpusClip** | Clip generation from video | REST API (if available) or browser automation | Upload video → receive clips with scores |
| **ElevenLabs** | Voice cloning for AI content | REST API | Generate voiceovers for Pipeline B content |
| **Buffer** | Social media posting (fallback) | REST API | Post to platforms where direct API is unavailable |
| **TikTok** | Direct posting | TikTok Content Posting API | Post clips to TikTok accounts |
| **Instagram/Facebook** | Direct posting | Meta Graph API | Post clips to Instagram Reels + Facebook Reels |
| **X (Twitter)** | Direct posting | X API v2 | Post clips to X accounts |
| **YouTube** | Direct posting | YouTube Data API v3 | Upload Shorts to YouTube |
| **Claude** | Metadata generation, analytics insights | Anthropic API | Generate descriptions, analyze performance |

### Internal Integration (Claude Skills)

Each skill is a single file following the existing skill pattern in `.claude/skills/`.

| Skill | Trigger | What it does |
|---|---|---|
| `pipeline-status` | "pipeline status", "how's the pipeline" | Reads manifest.json, reports green/yellow/red |
| `pipeline-run` | "process this episode", "run the pipeline" | Triggers pipeline for a specific input file |
| `analytics-query` | "what's working", "analytics", "performance" | Reads analytics data, generates insight |
| `retry-failed` | "retry failures", "fix failed posts" | Re-triggers failed items from `failed/` |
| `schedule-override` | "post this now", "skip schedule" | Manual posting outside normal schedule |

### Provider Architecture

Following the existing pattern (ONE file per capability, named by what it does):

| Provider | File | Wraps |
|---|---|---|
| `providers/clipping.ts` | OpusClip API | Upload video, receive clips |
| `providers/voice.ts` | ElevenLabs API | Generate voice audio |
| `providers/social-posting.ts` | Platform APIs + Buffer | Post content to social platforms |
| `providers/social-analytics.ts` | Platform APIs | Fetch engagement metrics |
| `providers/metadata-ai.ts` | Claude/Anthropic API | Generate descriptions, insights |

---

## 7. Non-Functional Requirements

### Performance

| Metric | Target | Why |
|---|---|---|
| Pipeline: recording → all posts distributed | <2 hours | JTBD Outcome #1: 75% reduction from manual 4-8 hours |
| File watcher detection latency | <30 seconds | Pipeline should feel responsive |
| Metadata generation per clip | <10 seconds | 15 clips × 5 platforms = 75 metadata items; <15 min total |
| Posting per platform | <5 seconds per post | Bounded by platform API latency |
| Analytics collection | <5 minutes for all platforms | Daily batch is fine; doesn't need real-time |
| Health check execution | <10 seconds | Must complete before next check |

### Reliability

| Metric | Target | Why |
|---|---|---|
| Pipeline success rate | >95% of scheduled posts published | JTBD Section 8: below 85% = pipeline is unreliable |
| Failure notification latency | <1 hour | JTBD Outcome #5: failures not unnoticed >24h |
| Data durability | Zero lost clips or metadata | Manifest tracks everything; filesystem is source of truth |
| Graceful degradation | Pipeline pauses on service outage, resumes on recovery | Never lose input; never post garbage |

### Security

| Requirement | Implementation |
|---|---|
| API credentials | Stored in `platform/env.ts` via `@t3-oss/env-core`. Never in code, config files, or git. |
| Voice clone model IDs | Treated as sensitive assets. Stored in env vars, not config. |
| Social media tokens | OAuth tokens stored encrypted. Refresh tokens rotated. |
| File access | Pipeline folders restricted to the Bun process user |
| No user data in Phase 1 | Single-user (Henry). No PII concerns beyond Henry's own accounts. |

### Monitoring + Observability

| What | How |
|---|---|
| Pipeline runs | manifest.json (filesystem) + pipelineRuns table (database) |
| Failures | `failed/` folder + pipeline health monitor |
| Analytics | `content-pipeline/analytics/` snapshots |
| System health | Hourly health check with macOS notifications |
| Costs | Monthly: OpusClip subscription, ElevenLabs credits, platform API costs |

---

## 8. Success Metrics + Validation Plan

### Phase 1 Success Metrics (JTBD Section 8)

| Metric | Target | JTBD trace | Measurement |
|---|---|---|---|
| Time: recording → all posts distributed | <2 hours | Outcome #1 (score 18) | manifest.json: completedAt - startedAt |
| Pipeline success rate | >95% posts published | Section 8 | posts.status = 'posted' / total posts |
| Content output | 30 clips/day across accounts | Section 8 | Daily clip count from manifest |
| Analytics insight delivery | 1 actionable insight/day | Section 8 | insights/ folder file count |
| Time to first automated post | <1 hour from setup | Section 8 | Measured during setup |
| Manual time saved | >20 hours/week | Section 4: Push "manual work doesn't scale" | Henry tracks hours pre/post automation |

### Validation Plan (JTBD Section 8)

| # | Hypothesis | Test | Timeline | Success signal | Failure action |
|---|---|---|---|---|---|
| 1 | Content pipeline reduces distribution time by 75% | Run pipeline with one podcast episode | Week 1 | <2 hours end-to-end | Fix bottleneck; if fundamentally slow, reconsider architecture |
| 2 | Automated metadata is as good as manual | A/B test: manual vs AI-generated descriptions | Weeks 2-4 | Engagement within 80% of manual | Improve prompts; add human-in-the-loop review |
| 3 | Analytics surface actionable insights | Use pipeline for 4 weeks, review what analytics tell you | Month 1 | ≥2 content decisions changed based on data | Simplify analytics to just "top clip, worst clip" |
| 4 | The pipeline is reliable enough to trust | Run pipeline for 2 weeks without manual intervention | Weeks 2-4 | >95% success rate, <1 unnoticed failure | Add monitoring; if systemic, redesign failure-prone stage |
| 5 | 30 clips/day is sustainable volume | Scale to 2 episodes/day for 1 week | Month 1 | All clips distributed without backlog | Reduce volume or add parallel processing |

### Churn Warning Signals (mapped from JTBD Firing Triggers)

| Firing trigger (JTBD Section 4) | Leading indicator | Response |
|---|---|---|
| "Automation keeps breaking" | Pipeline success rate drops below 90% for 3 consecutive days | Immediate investigation; fix or simplify the breaking stage |
| "Only using the content pipeline" | Henry stops using analytics insights | Make insights more actionable; reassess Phase 2 timeline |
| "AI moved and the platform didn't" | Claude/OpusClip ships major update, pipeline doesn't adapt within 2 weeks | Prioritize platform update; this is existential |
| "Outgrew it" | Daily clip volume exceeds 150 files and pipeline can't keep up | Migrate state tracking to SQLite; add queue system |

### Kill Criteria

| Signal | What it means | Action |
|---|---|---|
| Pipeline takes >4 hours consistently | Automation is not meaningfully faster than manual | Rethink architecture; maybe folder-based approach is wrong |
| <60% of clips meet quality bar | OpusClip output is garbage | Evaluate alternatives (Descript, manual selection with AI assist) |
| Engagement on automated posts is <50% of manual | Automation quality degrades content value | Add human review step; accept slower pipeline for better quality |
| Henry stops using the pipeline after 2 weeks | Product doesn't solve the actual problem | Fundamental rethink: is content distribution the right MVP? |

---

## 9. Build Sequence

### Architectural Prerequisites

Before Week 1:
1. **Folder structure created** — `content-pipeline/` with all subdirectories
2. **API credentials secured** — OpusClip, ElevenLabs, Buffer, platform APIs configured in `platform/env.ts`
3. **Social media accounts ready** — All 13 accounts set up per doc #7
4. **Content pipeline provider skeleton** — Empty provider files following the pattern

### Dependency Graph

```
F6 (Manifest) ──→ F1 (File Watcher) ──→ F2 (OpusClip) ──→ F3 (Metadata) ──→ F4 (Dedup) ──→ F5 (Auto-Poster)
                                                                                                      │
F7 (Health Monitor) ← ─── ─── ─── ─── ─── ─── ─── ─── ─── ─── ─── ─── ─── ─── ─── ─── ─── ─── ─── ─┘
                                                                                                      │
F8 (Analytics Engine) ← ─── ─── ─── ─── ─── ─── ─── ─── ─── ─── ─── ─── ─── ─── ─── ─── ─── ─── ── ┘
       │
F9 (Insight Skill) ← ─── ┘
```

### Week-by-Week Build Sequence

**Week 1: Pipeline Core (F6 → F1 → F2)**
- Day 1-2: Manifest system (F6) — state tracking, file operations, tests
- Day 3-4: File watcher + orchestrator (F1) — detect input, trigger pipeline stages, tests
- Day 5: OpusClip integration (F2) — upload, retrieve clips, filter by score, tests
- **Checkpoint:** Drop a video → get clips in `processing/clips/`. Manual from there.

**Week 2: Metadata + Posting (F3 → F4 → F5)**
- Day 1-2: Metadata generator (F3) — Claude-powered, per-platform templates, tests
- Day 3: Deduplication engine (F4) — content hash, lookup table, tests
- Day 4-5: Auto-poster for 2 platforms (F5, partial) — TikTok + Instagram first, tests
- **Checkpoint:** Drop a video → clips auto-posted to TikTok + Instagram with AI metadata.

**Week 3: Full Platform Coverage + Monitoring (F5 complete → F7)**
- Day 1-2: Auto-poster for remaining 3 platforms (Facebook, X, YouTube)
- Day 3: Health monitor (F7) — hourly checks, notifications
- Day 4-5: Integration testing — full pipeline, 2 episodes, all 13 accounts
- **Checkpoint:** Full pipeline runs end-to-end. Failures detected within 1 hour.

**Week 4: Analytics + Insights (F8 → F9)**
- Day 1-3: Analytics engine (F8) — collect from all platforms, aggregate, store
- Day 4-5: Insight skill (F9) — Claude reads data, surfaces actionable recommendation
- **Checkpoint:** "What's working?" returns a clear, useful answer.

**Week 5: Pipeline B + Polish (F10 → buffer)**
- Day 1-3: AI content generator (F10) — ElevenLabs voice, concept bank, same pipeline
- Day 4-5: Schedule optimizer (F11), edge case fixes, reliability improvements
- **Checkpoint:** Both pipelines (podcast clips + AI content) running in parallel.

**Week 6: Validation + Hardening**
- Run at scale (2 episodes/day) for full week
- Measure all success metrics against targets
- Fix reliability issues discovered during scale testing
- **Gate:** If success metrics pass → Phase 1 is validated. If not → iterate.

### P1 Features as Buffer

If timeline is tight, cut in this order (last cut first):
1. F11 (Schedule Optimizer) — manual schedule is fine for now
2. F10 (AI Content Generator) — Pipeline A (podcast clips) is the core value
3. F9 (Insight Skill) — raw analytics data is useful even without AI insights
4. F8 (Analytics Engine) — manual platform checks work until analytics is built

P0 features (F1-F7) are non-negotiable. Without them, there's no pipeline.

---

## 10. Decision Audit Trail

| # | Decision | Rationale | JTBD reference |
|---|---|---|---|
| 1 | Phase 1 ONLY — no AI agents, multi-client, or payments | JTBD Section 6: "Phase 1 is the ONLY phase that matters for V1" | Section 6, Section 9 |
| 2 | Filesystem-first architecture (folders + manifest.json) | Content pipeline doc #8 design. Simplest reliable pattern for file-based workflows. Database for analytics only. | Doc #8 Section 2 |
| 3 | Agent-first, no web dashboard | JTBD Section 9 "don't build" list. Emotional job: "playing, not working." | Section 3, Section 9 |
| 4 | Single-user (Henry) — no auth, no multi-tenancy | Phase 1 is dogfooding. Adding user management is premature complexity. | Section 6: Phase 1 |
| 5 | OpusClip as primary clipping tool | Doc #8 selected this. Has fallback to Descript. Will be evaluated during validation. | Doc #08 Section 3 |
| 6 | Buffer as posting fallback, direct APIs preferred | Direct APIs give more control. Buffer fills gaps where platform APIs are restrictive. | Doc #08 |
| 7 | Analytics stored locally, not in SaaS | Agent-first means querying locally. No third-party analytics dashboard. | Section 3: emotional job |
| 8 | 6-week build timeline | Solo developer + AI agents. Phase 1 is infrastructure, not UI. Realistic for the scope. | Section 8: assumption #8 |
| 9 | No database tables reference users | Phase 1 is Henry-only. User FK added in Phase 3 when multi-tenancy ships. | Section 6: Phase 3 |
| 10 | P0 is the pipeline, P1 is intelligence (analytics + insights) | Pipeline must work before analytics matter. Can't analyze content that was never posted. | Outcome scoring: #1 (18) > #4 (15) |

---

## Don't Build List (inherited from JTBD Section 9)

| # | Don't build | Why it contradicts the job | JTBD reference |
|---|---|---|---|
| 1 | Traditional SaaS dashboard | Emotional job: "playing, not working." Agent-first architecture = talk to Claude, not click through menus. | JTBD Section 9 |
| 2 | Done-for-you services | Social job: freedom + autonomy. DFY creates dependency. | JTBD Section 9 |
| 3 | Generic "start any business" course | Functional job: systematize MY business, not learn theory. | JTBD Section 9 |
| 4 | Community/forum | ICP is solo operator. Results over discussion. | JTBD Section 9 |
| 5 | Manual content creation tools | BD automates distribution, not creation. Don't compete with CapCut/Canva. | JTBD Section 9 |
| 6 | Real-time collaboration | One-person unicorn = one person. Phase 4 concern at earliest. | JTBD Section 9 |
| 7 | Gamification / engagement mechanics | Infrastructure, not consumer app. Revenue IS the engagement. | JTBD Section 9 |
| 8 | Web UI for pipeline management | Same as #1. "Pipeline status" is a Claude skill, not a page. | Section 3 + Section 9 |
| 9 | Multi-user onboarding flows | Phase 3. Only Henry uses it in Phase 1. | Section 6 |
| 10 | Cost tracking dashboard | Track costs in a spreadsheet. Don't build a dashboard for one user. | Section 9 |

---

## Assumptions Registry (inherited from JTBD + PRD-specific)

| # | Assumption | Confidence | Signal that proves it wrong |
|---|---|---|---|
| 1 | Content pipeline is the right MVP | 🟡 hypothesis | Pipeline doesn't reduce Henry's manual work by 75% |
| 2 | Folder-based architecture handles the volume | 🟡 hypothesis | >150 files/day causes filesystem or manifest bottleneck |
| 3 | OpusClip produces quality clips | 🔴 guess | <60% of clips meet quality bar after score filtering |
| 4 | AI-generated metadata performs close to manual | 🔴 guess | Engagement on AI metadata posts is <50% of manual |
| 5 | Agent-first (no dashboard) works for Henry | 🟢 validated | Henry is a developer; he uses Claude Code daily |
| 6 | 6-week build timeline is realistic | 🔴 guess | Unforeseen complexity in platform API integrations |
| 7 | 5 platforms + 13 accounts is the right starting scope | 🟡 hypothesis | API limitations make some platforms impractical |
| 8 | Daily automated analytics collection is sufficient | 🟡 hypothesis | Henry needs real-time data to make content decisions |
| 9 | One podcast → 15 clips is sustainable ratio | 🟡 hypothesis | OpusClip consistently returns <5 usable clips per episode |
| 10 | Pipeline reliability >95% is achievable | 🔴 guess | Platform API instability causes chronic failures |

---

**Next step:** Run `/d-tasks` to transform this PRD into executable beads tasks. Phase 1 features (F1-F14) become individual beads with dependencies matching the build sequence.
