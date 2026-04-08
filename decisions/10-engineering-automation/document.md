# Engineering Automation & Infrastructure Strategy

> Written: 2026-04-07
> Status: Ready for implementation
> Next step: `/d-tasks` to extract beads

## 1. Current State Audit

### What We Have
| Area | Status | Details |
|------|--------|---------|
| Unit tests | 7 tests | 5 providers (social-analytics, content, transcription, social-posting, storage), 2 platform (env, health) |
| Feature tests | **Zero** | Business logic in features/ entirely untested |
| E2E tests | **Zero** | No browser-based testing |
| CI pipeline | Working | GitHub Actions: biome → tsc → harden-check → bun test |
| Deploy | Working | Railway auto-deploy from main, Dockerfile, health check rollback |
| Health checks | Working | /health (liveness), /health/ready (readiness: DB + Stripe + Resend + R2) |
| Monitoring | **Nothing** | No PostHog, no Sentry, no error tracking |
| Analytics | **Nothing** | No production observability |
| Scheduled automation | **Nothing** | Claude Code cron + remote triggers available, unused |
| Production observability | **Nothing** | Can't see what users do or when things break |

### Gap Severity
| Gap | Severity | Why |
|-----|----------|-----|
| No feature-level tests | **Blocking** | Business logic changes can break without anyone knowing |
| No E2E tests | **Blocking** | User flows (signup → payment → course) untested |
| No error tracking | **Blocking** | Production errors are invisible until a user reports them |
| No analytics | **Painful** | Can't measure what users do, can't prioritize features |
| No scheduled automation | **Nice-to-have** | Manual work that could be automated, but not blocking |
| No visual regression | **Nice-to-have** | UI breakage caught in QA, not critical yet |

### Priority Order (founder decision)
1. **Testing** — get test coverage solid
2. **Monitoring** — PostHog full setup (events, funnels, flags, session replay, errors)
3. **Automation** — scheduled agents, autonomous loops

---

## 2. Test Strategy

### Test Pyramid for Solo Dev + AI Agents

```
         /\
        /  \     E2E Tests (gstack /qa)
       /    \    ~10 critical user flows
      /------\
     /        \   Integration Tests
    /          \  DB, Stripe, auth — real services in test mode
   /------------\
  /              \  Unit Tests
 /                \ Every feature service, every provider, every utility
/==================\
```

**Key principle:** AI agents write most of the code. Tests are how we verify the agents didn't break anything. The test suite is our safety net, not a bureaucratic checkbox.

### 2a. Unit Tests — Coverage Targets

**Current:** 7 tests across providers/ and platform/.
**Target:** Every file with business logic has a colocated .test.ts.

| Layer | Current Coverage | Target | Priority |
|-------|-----------------|--------|----------|
| features/ (business logic) | 0% | 90%+ | **P0 — do first** |
| platform/ (infra) | ~20% | 80%+ | P1 |
| providers/ (integrations) | ~60% | 80%+ | P2 (most are covered) |
| pages/ (wiring) | 0% | Skip | Pages are max 20 lines, just wiring — don't test |

**What to test in features/:**
- Service functions (the core business logic)
- Input validation (Zod schemas reject bad data)
- Error paths (throwError() called with correct error codes)
- Edge cases (empty inputs, boundary values, null states)

**What NOT to test:**
- Route wiring (tested implicitly by E2E)
- Drizzle query syntax (trust the ORM)
- Third-party SDK calls (mock at provider boundary)

### 2b. Integration Tests — Real Services in Test Mode

Integration tests hit real services but in test/sandbox mode. No mocks for the database.

| Service | Test Mode | How |
|---------|-----------|-----|
| PostgreSQL | Test database | Separate Railway DB or in-memory pg for CI |
| Stripe | Test mode keys | `STRIPE_SECRET_KEY=sk_test_...` — Stripe provides test clocks, test cards |
| Better Auth | Test sessions | Create test users, exercise auth flows |
| Resend | Sandbox mode | Resend sandbox catches emails without delivering |
| R2/S3 | Test bucket | Separate R2 bucket or local MinIO |

**Integration test targets:**
- User signup → session creation → auth middleware
- Stripe checkout → webhook → subscription activation
- Content upload → R2 storage → retrieval
- Database migrations run cleanly on empty DB

### 2c. E2E Tests — gstack /qa as the Engine

**Decision:** Build on gstack /qa (already works as headless browser). Wire it into schedules and CI.

**How it works:**
1. `/qa` skill launches headless browser, navigates user flows, checks for errors
2. Takes screenshots at each step as evidence
3. Reports pass/fail with detailed failure info
4. Can auto-fix issues it finds (optional)

**Core user flows to E2E test:**
1. **Landing page loads** — no console errors, all sections render, responsive
2. **Signup flow** — form submission → account creation → redirect to app
3. **Login flow** — email/password → session → dashboard access
4. **Course access** — authenticated user → course page → module loads
5. **Payment flow** — pricing page → Stripe checkout → subscription → access granted
6. **Content pipeline** (BD) — upload → process → distribute
7. **Health endpoints** — /health returns 200, /health/ready checks all services
8. **404/error pages** — bad URLs show error page, not white screen
9. **Auth protection** — unauthenticated access to protected routes redirects to login
10. **Logout** — session destroyed, can't access protected routes

**E2E environment strategy:**
- Run against staging URL (same Railway app, different env)
- Or run against local dev server (bun run dev) for pre-push testing
- Test Stripe uses test mode keys — no real charges
- Test auth creates disposable test accounts

### 2d. Test Data Strategy

**Approach:** Factories, not fixtures. Generate test data programmatically.

```
platform/test/
├── factories.ts     — createTestUser(), createTestSubscription(), etc.
├── setup.ts         — beforeAll/afterAll hooks (DB cleanup, test env)
└── helpers.ts       — common assertions, API call wrappers
```

**Rules:**
- Each test creates its own data, cleans up after
- Never depend on seed data existing
- Factory functions use Zod schemas to ensure valid data
- Test DB is wiped between test suites (not between individual tests — too slow)

### 2e. Test Runner & Tooling

**Runner:** Bun test (built-in). No additional framework needed.

**Config additions to package.json:**
```json
{
  "scripts": {
    "test": "bun test",
    "test:unit": "bun test --grep 'unit'",
    "test:integration": "bun test --grep 'integration'",
    "test:watch": "bun test --watch",
    "test:coverage": "bun test --coverage"
  }
}
```

**CI integration (updated GitHub Actions):**
```
biome ci → tsc --noEmit → harden-check → bun test → [E2E smoke on staging]
```

The E2E step runs post-deploy on staging, not in CI (too slow for every push).

---

## 3. E2E Testing System

### 3a. Architecture: gstack /qa as Core Engine

```
┌─────────────────────────────────────────┐
│           Trigger Layer                  │
├─────────┬───────────┬───────────────────┤
│ Manual  │ Scheduled │ Post-deploy       │
│ /qa     │ Cron      │ /canary           │
└────┬────┴─────┬─────┴────────┬──────────┘
     │          │              │
     ▼          ▼              ▼
┌─────────────────────────────────────────┐
│         gstack /browse Engine            │
│  Headless Chromium, ~100ms/command       │
│  Screenshots, state verification         │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│         Report / Action                  │
│  Pass → log + continue                   │
│  Fail → screenshot + alert + (auto-fix)  │
└─────────────────────────────────────────┘
```

### 3b. Three Trigger Modes

**1. Manual — `/qa`**
Run anytime. "Test everything, fix what you find."
- Quick tier: critical + high only (~2 min)
- Standard tier: + medium (~5 min)
- Exhaustive tier: + cosmetic (~10 min)

**2. Scheduled — Claude Code cron or remote trigger**
Daily smoke test at 8am. Results posted or saved to `.context/qa-reports/`.
```
Schedule: "57 7 * * *" (daily at 7:57am local)
Prompt: "Run /qa-only on https://therightdecision.com — Quick tier.
         Save report to .context/qa-reports/YYYY-MM-DD.md.
         If any critical failures, flag for review."
```

**3. Post-deploy — `/canary`**
Triggered after every deploy. Checks health, takes screenshots, compares to pre-deploy baseline.

### 3c. Scheduled E2E Smoke Test (the "morning report")

**What it does:**
1. Navigates to production URL
2. Checks: landing page loads, login works, course page accessible, Stripe checkout reachable, health endpoints respond
3. Takes screenshots of each page
4. Compares to previous day's screenshots (visual regression)
5. Saves report with pass/fail + evidence

**Where reports go:**
- `.context/qa-reports/YYYY-MM-DD.md` — full report with screenshots
- Summary posted via notification (macOS) or saved for review

### 3d. Pre-Deploy Gate

Add E2E as final CI step (runs on staging after deploy, blocks promotion to production):
```
Push → CI (lint/type/test) → Deploy to staging → E2E smoke on staging → Promote to production
```

This requires a staging environment on Railway (same app, different env vars). Until then, E2E runs post-deploy on production with `/canary`.

---

## 4. Monitoring & Observability

### 4a. PostHog Setup — Full Integration

**PostHog project:** Use existing PostHog MCP tools (already authenticated).

**Client-side integration (Preact):**
```ts
// providers/analytics.ts — already exists, expand it
// Add PostHog JS SDK to client bundle
// Initialize with project API key from env
```

**Server-side integration (Hono):**
```ts
// PostHog Node SDK for server-side events
// Middleware that captures: page views, API calls, errors
```

**Event Taxonomy:**

| Category | Event | Properties |
|----------|-------|------------|
| **Auth** | `user_signed_up` | method, referrer |
| **Auth** | `user_logged_in` | method |
| **Auth** | `user_logged_out` | session_duration |
| **Course** | `course_module_started` | module_id, module_name |
| **Course** | `course_module_completed` | module_id, time_spent |
| **Course** | `exercise_started` | exercise_id, exercise_type |
| **Course** | `exercise_completed` | exercise_id, time_spent |
| **Payment** | `checkout_started` | plan, price |
| **Payment** | `checkout_completed` | plan, price, payment_method |
| **Payment** | `subscription_cancelled` | plan, reason, lifetime_value |
| **Content** | `content_uploaded` | type, size |
| **Content** | `content_processed` | type, duration |
| **Content** | `content_distributed` | platform, status |
| **Error** | `error_occurred` | error_code, path, stack |
| **Navigation** | `page_viewed` | path, referrer, device |

**Naming convention:** `noun_verb_past_tense` (e.g., `user_signed_up`, not `signup` or `userSignup`).

### 4b. Key Funnels

**Funnel 1: Acquisition → Activation**
```
Landing page viewed → Signup started → Signup completed → First module started
```

**Funnel 2: Activation → Revenue**
```
Free course started → Free course completed → Pricing page viewed → Checkout started → Payment completed
```

**Funnel 3: Revenue → Retention**
```
Subscription active → Module completed (week 1) → Module completed (week 2) → Module completed (week 4)
```

### 4c. Feature Flags

**Strategy:** Use PostHog feature flags for:
- Gradual rollouts (new features to % of users)
- A/B testing (different landing page copy, pricing)
- Kill switches (disable broken features without deploy)

**Flag naming:** `feature_name` lowercase with underscores.

**Cleanup rule:** Feature flags removed 2 weeks after 100% rollout. Scheduled agent handles cleanup (see Section 6).

### 4d. Session Replay

**What to record:** All sessions (low traffic initially, scale down as user count grows).
**Privacy:** Mask input fields by default. No recording of payment forms (Stripe handles those).
**When to review:** After error reports, after new feature launches, weekly sample of 5 sessions.

### 4e. Error Tracking

**PostHog error tracking** (not Sentry — one fewer tool):
- Client-side: catch unhandled errors, report to PostHog
- Server-side: Hono error middleware reports to PostHog
- Group errors by type, path, frequency
- Alert on new error types or spike in existing errors

**Alert rules:**
| Condition | Action |
|-----------|--------|
| New error type (never seen before) | Immediate notification |
| Error spike (>5x normal rate in 15min) | Immediate notification |
| Health check failure | Immediate notification |
| Error rate >1% of requests | Daily digest |

### 4f. Health Monitoring

**What exists:** /health and /health/ready endpoints.
**What to add:**
- Railway metrics (CPU, memory, response time) — already available in Railway dashboard
- PostHog tracks response times via server middleware
- Scheduled agent pings /health/ready every hour, alerts on failure

---

## 5. CI/CD Hardening

### 5a. Current Pipeline Gaps

| Gap | Risk | Fix |
|-----|------|-----|
| No E2E in CI | Features break without test failure | Add post-deploy E2E step |
| No security scanning | Vulnerable deps ship to prod | Add `bun audit` or Snyk to CI |
| No database migration safety | Bad migration = data loss | Pre-deploy migration check |
| No post-deploy verification | Silent deploy failures | Add canary check after deploy |
| No rollback automation | Manual rollback under pressure | Automated rollback on health check failure |

### 5b. Enhanced CI Pipeline

```
Current:  biome ci → tsc --noEmit → harden-check → bun test
                                                        │
Enhanced: biome ci → tsc --noEmit → harden-check → bun test → security scan
                                                                     │
                                                              Deploy to Railway
                                                                     │
                                                              Post-deploy canary
                                                                     │
                                                              ✅ or 🔴 rollback
```

**New CI steps:**
1. **Security scan:** `bun audit` for known vulnerabilities in dependencies
2. **Post-deploy canary:** Hit /health/ready, run 3 critical E2E flows
3. **Auto-rollback:** If canary fails, Railway redeploys previous version

### 5c. Database Migration Safety

**Current:** Manual `bun run db:migrate`.
**Target:** Pre-deploy migration in Railway pipeline.

**Rules:**
- Every migration must be backward-compatible (old code works with new schema)
- Destructive migrations (DROP COLUMN, DROP TABLE) require manual approval
- Migration runs before new code deploys (`preDeployCommand` in railway.toml)
- Failed migration = deploy aborted

**Add to railway.toml:**
```toml
[deploy]
preDeployCommand = "bun run db:migrate"
```

### 5d. Rollback Strategy

| Scenario | Action | How |
|----------|--------|-----|
| Health check fails after deploy | Auto-rollback | Railway automatic (already configured: ON_FAILURE, 5 retries) |
| E2E canary fails | Manual rollback | `railway redeploy` to previous version |
| Data migration failure | Block deploy | preDeployCommand failure stops deploy |
| Critical bug in production | Hotfix + deploy | Fix on branch, fast-track CI, deploy |

---

## 6. Scheduled Automation (Agent Workflows)

### Architecture

```
┌─────────────────────────────────────────────────┐
│              Scheduling Layer                     │
├─────────────┬────────────────┬──────────────────┤
│ CronCreate  │ RemoteTrigger  │ Conductor        │
│ (session)   │ (persistent)   │ (workspaces)     │
│ 7-day TTL   │ Survives       │ Parallel agents  │
│             │ restarts       │                  │
└──────┬──────┴───────┬────────┴────────┬─────────┘
       │              │                 │
       ▼              ▼                 ▼
┌─────────────────────────────────────────────────┐
│              Execution Layer                     │
│  Claude Code agent runs the prompt               │
│  Has full tool access (browse, edit, git, etc.)  │
└──────────────────────┬──────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│              Output Layer                        │
│  Reports → .context/reports/                     │
│  PRs → GitHub                                    │
│  Alerts → macOS notification / Slack             │
└─────────────────────────────────────────────────┘
```

**Two scheduling mechanisms:**
1. **CronCreate** — session-scoped, 7-day TTL, good for dev-time automation
2. **RemoteTrigger** — persistent, survives restarts, good for production automation

### 6a. Daily Automations

| Automation | Schedule | Mechanism | What It Does |
|------------|----------|-----------|--------------|
| Morning smoke test | 7:57am daily | RemoteTrigger | `/qa-only` on production, save report |
| Health digest | 8:13am daily | RemoteTrigger | Check /health/ready, Railway metrics, PostHog error count, summarize |
| Error triage | 8:27am daily | RemoteTrigger | Check PostHog for new error types, root-cause top 3, create beads |

### 6b. Weekly Automations

| Automation | Schedule | Mechanism | What It Does |
|------------|----------|-----------|--------------|
| Dependency update | Monday 9:03am | RemoteTrigger | Check outdated packages, run test suite, open PRs grouped by severity |
| Changelog | Friday 4:47pm | RemoteTrigger | Group merged PRs by category, update CHANGELOG.md, commit |
| Code quality report | Monday 9:33am | RemoteTrigger | `/health` score, test coverage delta, type errors, lint warnings |
| Feature flag cleanup | Friday 3:17pm | RemoteTrigger | Find flags at 100% rollout for >2 weeks, remove dead code, open PR |

### 6c. Per-PR Automations

These run via GitHub Actions or Conductor workspace on PR creation:

| Automation | Trigger | What It Does |
|------------|---------|--------------|
| `/review` | Every PR | Pre-landing code review (SQL safety, trust boundaries, side effects) |
| E2E smoke | PRs touching features/ or pages/ | Run critical user flows against PR preview |
| Visual regression | PRs touching CSS/components | Screenshot comparison at multiple viewports |

### 6d. Autonomous Coding Loops

**The big idea:** AI agents work while the founder sleeps. Medium autonomy — auto-merge small fixes, PR everything else.

**Loop 1: Bug Fix Agent (daily)**
```
1. Check PostHog error tracking for new errors
2. For each error: root-cause analysis, write fix + regression test
3. If fix is < 20 lines and tests pass: auto-merge
4. If fix is larger or risky: create PR for review
```

**Loop 2: DX/UX Improvement Agent (weekly)**
```
1. Analyze PostHog session replays for friction points
2. Check competitors for obvious missing features
3. For each improvement: create bead with description + acceptance criteria
4. Implement top 3 improvements (TDD, full test suite)
5. Create PR with before/after evidence
6. Never auto-merge — always PR for human review
```

**Loop 3: Documentation Sync Agent (weekly)**
```
1. Scan git log for merged PRs since last run
2. Compare against decisions/*.md for stale references
3. Update docs to match code reality
4. Auto-merge (docs only, no code changes)
```

**Loop 4: Test Coverage Agent (weekly)**
```
1. Find files in features/ without colocated .test.ts
2. Write tests for the 3 most-changed files (by git log)
3. Run full test suite to verify
4. Create PR with coverage delta
5. Auto-merge if all tests pass and coverage increases
```

### 6e. Autonomy Rules

| Change Type | Auto-merge? | Requires PR? |
|-------------|-------------|--------------|
| Dependency patch update (tests pass) | Yes | No |
| Lint/format fix | Yes | No |
| Typo fix in docs | Yes | No |
| New test (no code changes) | Yes | No |
| Bug fix < 20 lines + regression test | Yes | No |
| Documentation update (decisions/*.md) | Yes | No |
| Bug fix > 20 lines | No | **Yes** |
| New feature | No | **Yes** |
| Schema change | No | **Yes** |
| DX/UX improvement | No | **Yes** |
| Security fix | No | **Yes** (review even if small) |

---

## 7. Autonomous Feature Improvement Loop

### 7a. Discovery Sources

| Source | How | Frequency |
|--------|-----|-----------|
| PostHog session replays | Watch 5 random sessions, note friction | Weekly |
| PostHog funnels | Find biggest drop-off points | Weekly |
| PostHog errors | Group by frequency, find UX-caused errors | Daily |
| Competitor analysis | Browse top 5 competitors, note features we lack | Monthly |
| User feedback | PostHog surveys, support emails | As received |

### 7b. Validation Gate

Before any autonomous agent builds a feature, it must pass this gate:

1. **Is it obvious?** Would 80%+ of users expect this to exist? (e.g., password reset, mobile responsive)
2. **Is it small?** Can it be built and tested in <2 hours of agent time?
3. **Is it safe?** Does it touch auth, payments, or user data? If yes → needs human review.
4. **Is it measurable?** Can we verify it works via PostHog events?

If all four: agent builds it, creates PR with evidence.
If any fail: agent creates a bead describing the opportunity, waits for human prioritization.

### 7c. Implementation Guardrails

- Max scope per autonomous PR: 200 lines changed
- Must include tests (unit + integration if applicable)
- Must pass full `bun run check`
- Must include before/after screenshots for UI changes
- Must include PostHog event for measuring impact
- Never touch: auth logic, payment logic, database schema, env vars

### 7d. Human Checkpoint

**Daily review ritual (5 minutes):**
1. Check `.context/reports/` for overnight agent reports
2. Review any open PRs from agents
3. Merge or provide feedback
4. Check PostHog dashboard for anomalies

---

## 8. PostHog Integration Plan

### 8a. Technical Setup

**Client-side (Preact):**
```ts
// providers/analytics.ts — expand existing file
// Add: posthog-js SDK
// Initialize in app shell with env.POSTHOG_API_KEY
// Auto-capture: page views, clicks, form submissions
// Custom events: see taxonomy in Section 4a
```

**Server-side (Hono):**
```ts
// providers/analytics.ts — add server-side PostHog
// Hono middleware: capture API request/response metrics
// Error middleware: report unhandled errors
// Auth hooks: track signup/login/logout server-side
```

**Environment variables (add to platform/env.ts):**
```
POSTHOG_API_KEY — PostHog project API key
POSTHOG_HOST — PostHog host (default: app.posthog.com)
```

### 8b. Feature Flags Integration

```ts
// In feature routes, check PostHog flags:
import { posthog } from '@/providers/analytics'

const isEnabled = await posthog.isFeatureEnabled('new_onboarding', userId)
```

**Initial flags to create:**
- `new_landing_page` — A/B test landing page variants
- `wins_board` — gradual rollout of Wins Board feature
- `course_v2` — new course player UI

### 8c. Dashboards to Create

1. **Acquisition Dashboard** — traffic sources, landing page conversion, signup rate
2. **Engagement Dashboard** — daily active users, modules completed, session duration
3. **Revenue Dashboard** — trial → paid conversion, MRR, churn rate
4. **Health Dashboard** — error rate, response times, health check status
5. **Content Pipeline Dashboard** — uploads, processing time, distribution success rate

### 8d. Session Replay Config

- Record all sessions (low volume phase)
- Mask: password fields, payment forms, personal info
- Retain: 30 days
- Review triggers: after error spike, after new feature launch, weekly sample

---

## 9. Implementation Roadmap

### Phase 1: Testing Foundation (Week 1-2)

| Task | Effort | Priority |
|------|--------|----------|
| Create platform/test/ helpers (factories, setup, helpers) | 2h | P0 |
| Write feature-level tests for all existing features/ services | 8h | P0 |
| Add integration tests for auth flows (signup, login, session) | 3h | P0 |
| Add integration tests for Stripe flows (checkout, webhook) | 3h | P0 |
| Add `bun test --coverage` to CI and track coverage | 1h | P0 |
| Wire `/qa` as E2E smoke test for critical flows | 2h | P1 |

### Phase 2: Monitoring Setup (Week 2-3)

| Task | Effort | Priority |
|------|--------|----------|
| Add PostHog JS SDK to client (providers/analytics.ts) | 2h | P0 |
| Add PostHog Node SDK for server-side events | 2h | P0 |
| Add POSTHOG_API_KEY + POSTHOG_HOST to env.ts | 30m | P0 |
| Implement event taxonomy (Section 4a events) | 3h | P0 |
| Create error tracking middleware (Hono) | 2h | P0 |
| Set up 5 PostHog dashboards | 3h | P1 |
| Configure session replay | 1h | P1 |
| Create initial feature flags | 1h | P2 |

### Phase 3: CI/CD Hardening (Week 3)

| Task | Effort | Priority |
|------|--------|----------|
| Add `preDeployCommand = "bun run db:migrate"` to railway.toml | 15m | P0 |
| Add security scan (`bun audit`) to CI | 30m | P1 |
| Set up post-deploy canary check | 2h | P1 |
| Document rollback procedure | 30m | P2 |

### Phase 4: Scheduled Automation (Week 3-4)

| Task | Effort | Priority |
|------|--------|----------|
| Create RemoteTrigger for daily smoke test | 1h | P0 |
| Create RemoteTrigger for daily health digest | 1h | P1 |
| Create RemoteTrigger for daily error triage | 2h | P1 |
| Create RemoteTrigger for weekly dependency update | 2h | P2 |
| Create RemoteTrigger for weekly changelog | 1h | P2 |
| Create RemoteTrigger for weekly code quality report | 1h | P2 |

### Phase 5: Autonomous Loops (Week 4+)

| Task | Effort | Priority |
|------|--------|----------|
| Bug fix agent (requires PostHog error tracking first) | 4h | P1 |
| Test coverage agent | 3h | P1 |
| Documentation sync agent | 2h | P2 |
| DX/UX improvement agent (requires PostHog analytics first) | 4h | P2 |
| Competitor analysis agent | 3h | P3 |

### Total Estimated Effort
- **Phase 1 (Testing):** ~19h of agent time
- **Phase 2 (Monitoring):** ~14h of agent time
- **Phase 3 (CI/CD):** ~3.5h of agent time
- **Phase 4 (Scheduling):** ~8h of agent time
- **Phase 5 (Autonomous):** ~16h of agent time
- **Total:** ~60h of agent time over 4 weeks

---

## 10. Success Metrics

| Metric | Current | Target (4 weeks) | Target (12 weeks) |
|--------|---------|-------------------|---------------------|
| Test coverage (features/) | 0% | 80% | 95% |
| E2E user flows tested | 0 | 5 critical flows | 10 flows |
| Mean time to detect prod error | ∞ (invisible) | <5 minutes | <1 minute |
| Mean time to fix prod error | Unknown | <4 hours (agent) | <1 hour (agent auto-fix) |
| Scheduled automations running | 0 | 5 (daily smoke, health, errors, deps, changelog) | 10+ |
| PostHog events tracked | 0 | 15 event types | 25+ event types |
| PRs auto-merged by agents | 0 | 5/week (small fixes) | 15/week |
| Manual QA time per week | All manual | 30 min review | 5 min review |

**The north star:** In 12 weeks, the founder spends 5 minutes per day reviewing agent work. Everything else runs autonomously — tests catch regressions, monitoring catches production issues, agents fix small bugs and improve DX, and everything that needs human judgment gets a PR with evidence.

---

## Documents That Need Updating After Implementation

| Document | What to Update |
|----------|---------------|
| decisions/deploy.md | Add PostHog env vars, migration preDeployCommand, canary step |
| decisions/harness.md | Add scheduled automation section, autonomous agent rules |
| decisions/coding.md | Add test coverage requirements, integration test patterns |
| decisions/hardening.md | Update after first /d-harden run with PostHog + tests in place |
| CLAUDE.md (root) | Add /e2e skill reference, PostHog MCP usage patterns |
