# Engineering Automation & Infrastructure Strategy — Meta

## Document Type
Strategy document — defines how we automate testing, monitoring, CI/CD, and autonomous agent workflows to make the solo-dev + AI setup run like a full engineering org.

## Why This Document
We have 7 unit tests, zero E2E tests, no monitoring, no scheduled automation, and no production observability. The codebase is growing (two products, content pipeline, BD platform). Without infrastructure that catches problems automatically, every bug requires a human to notice it. This doc defines the system that runs while the founder sleeps.

## Audience
Henrique (solo dev) + AI agents (Claude Code, Conductor workspaces)

## Sections

### 1. Current State Audit
**What it covers:** Honest snapshot of what exists today vs. what's needed.
**Done when:** Every gap is named with severity (blocking, painful, nice-to-have).
**Failure mode:** Listing gaps without prioritizing them → everything feels urgent.
**Inputs:** Codebase scan (test files, CI config, monitoring setup, package.json scripts).

### 2. Test Strategy
**What it covers:** Unit tests, integration tests, E2E tests, and how they fit together. Test pyramid for a solo dev with AI agents.
**Done when:** Clear rules for what gets unit-tested vs. integration-tested vs. E2E-tested, with specific coverage targets per layer.
**Failure mode:** Over-testing (mocking everything) or under-testing (only happy paths). Testing infrastructure instead of business logic.
**Sub-sections:**
- 2a. Unit Tests — what's covered, what's missing, coverage targets
- 2b. Integration Tests — database, Stripe, auth flows
- 2c. E2E Tests — full user flows via headless browser
- 2d. Test Data Strategy — seeds, fixtures, factories
- 2e. Test Runner & Tooling — Bun test config, CI integration

### 3. E2E Testing System
**What it covers:** Headless browser testing that exercises real user flows (signup → onboarding → core features → payment).
**Done when:** A single command runs all E2E tests, and a skill (`/e2e` or `/qa`) can be triggered manually or scheduled.
**Failure mode:** Flaky tests that cry wolf. Tests that break on every UI change. Tests that don't test what users actually do.
**Sub-sections:**
- 3a. Framework Choice — Playwright vs. gstack browse vs. custom
- 3b. Core User Flows to Test
- 3c. Environment Strategy — test DB, test Stripe, test auth
- 3d. Scheduled Runs — daily smoke tests, pre-deploy gates

### 4. Monitoring & Observability
**What it covers:** Production monitoring, error tracking, analytics, performance metrics.
**Done when:** We know within 5 minutes when something breaks in prod, and within 1 hour what users are doing.
**Failure mode:** Setting up monitoring but never looking at it. Alert fatigue. Monitoring vanity metrics.
**Sub-sections:**
- 4a. PostHog Setup — events, funnels, feature flags
- 4b. Error Tracking — Sentry or PostHog errors
- 4c. Health Monitoring — uptime, latency, Railway metrics
- 4d. Alerting — what triggers alerts, where they go (Slack/email)

### 5. CI/CD Hardening
**What it covers:** Making the deploy pipeline bulletproof. Pre-deploy gates, post-deploy verification, rollback strategy.
**Done when:** A bad deploy is caught automatically and rolled back before users notice.
**Failure mode:** CI that's so slow it gets bypassed. Gates that block deploys for non-critical issues.
**Sub-sections:**
- 5a. Current Pipeline Gaps
- 5b. Pre-Deploy Gates — tests, type-check, lint, security scan, E2E
- 5c. Post-Deploy Verification — health checks, canary, smoke tests
- 5d. Rollback Strategy — automatic vs. manual, when to trigger
- 5e. Database Migration Safety — pre-deploy migrations, backward compatibility

### 6. Scheduled Automation (Agent Workflows)
**What it covers:** Tasks that run on a schedule without human intervention. Claude Code cron triggers, Conductor scheduled workspaces.
**Done when:** A list of automations with triggers, schedules, and failure handling.
**Failure mode:** Automations that silently fail. Automations that do unnecessary work. Over-automating things that change too fast.
**Sub-sections:**
- 6a. Daily Automations — smoke tests, health digests, error triage
- 6b. Weekly Automations — dependency updates, changelog, code quality report
- 6c. Per-PR Automations — E2E tests, visual regression, security scan
- 6d. Autonomous Coding Loops — feature improvement, competitor analysis, DX/UX gaps
- 6e. Claude Code Scheduling — cron triggers, remote agents, Conductor patterns

### 7. Autonomous Feature Improvement Loop
**What it covers:** How AI agents can identify and implement obvious missing features (competitor analysis, DX improvements, UX gaps) while the founder is away.
**Done when:** A clear workflow for: discover gap → validate it matters → implement → test → PR for review.
**Failure mode:** AI building features nobody wants. Scope creep. Breaking existing features while "improving."
**Sub-sections:**
- 7a. Discovery Sources — competitor analysis, user feedback, PostHog data
- 7b. Validation Gate — how to decide if a feature is worth building
- 7c. Implementation Guardrails — scope limits, test requirements, review gates
- 7d. Human Checkpoint — what requires approval vs. what can auto-merge

### 8. PostHog Integration Plan
**What it covers:** Full analytics setup — events, properties, funnels, feature flags, session replays.
**Done when:** We can answer "what are users doing?" and "is this feature working?" from PostHog.
**Failure mode:** Tracking everything (noise). Not tracking conversions (blind). Feature flags without cleanup.
**Sub-sections:**
- 8a. Event Taxonomy — what to track, naming conventions
- 8b. Key Funnels — signup → onboarding → engagement → payment
- 8c. Feature Flags — rollout strategy, A/B testing
- 8d. Session Replay — when to use, privacy considerations

### 9. Implementation Roadmap
**What it covers:** Sequenced plan for implementing all of the above, respecting the solo-dev constraint.
**Done when:** Each item has a priority, estimated effort, and dependencies.
**Failure mode:** Trying to do everything at once. Building infra that's never used because the product isn't ready.

### 10. Success Metrics
**What it covers:** How we know this strategy is working.
**Done when:** 3-5 measurable metrics with targets and timelines.
**Failure mode:** Metrics that measure activity (tests written) instead of outcomes (bugs caught before production).

## Quality Checklist
- [ ] Every recommendation is specific to our stack (Bun, Hono, Railway, Preact)
- [ ] Test strategy accounts for AI agents writing most code
- [ ] Monitoring setup uses tools we already have access to (PostHog MCP, Railway CLI)
- [ ] Scheduled automations use Claude Code cron triggers (not external schedulers)
- [ ] Autonomous workflows have clear human checkpoints
- [ ] Implementation roadmap respects that this is a solo dev + AI operation
- [ ] No recommendations for tools/services we don't already use unless strongly justified
