# Input — Engineering Automation & Infrastructure Strategy

## Source
Founder brain dump (2026-04-07) + targeted Q&A

## Decisions Made
1. **Priority order:** Testing first → monitoring → automation
2. **E2E approach:** Build on gstack /qa (already works), wire into schedules and CI
3. **Agent autonomy:** Medium — auto-merge small fixes (typos, dep updates, lint), PR anything with logic changes
4. **PostHog scope:** Full setup — events, funnels, feature flags, session replay, error tracking

## Current State (verified from codebase scan)
- **7 unit tests:** 5 providers (social-analytics, content, transcription, social-posting, storage), 2 platform (env, health)
- **Zero E2E tests, zero feature-level tests** (business logic in features/ entirely untested)
- **Test runner:** Bun test (built-in, zero config)
- **CI:** GitHub Actions → biome ci → tsc --noEmit → harden-check → bun test
- **Deploy:** Railway auto-deploy from main, Dockerfile, health check at /health with rollback
- **Health endpoints:** /health (liveness), /health/ready (readiness — checks DB, Stripe, Resend, R2)
- **No monitoring:** No PostHog, no Sentry, no error tracking, no production observability
- **No scheduled automation:** Claude Code cron triggers available but unused
- **No production analytics:** social-analytics.ts exists but it's business feature (UploadPost metrics), not app observability
- **Tools available but unused:** gstack /qa, /browse, /canary, PostHog MCP tools, Claude Code scheduling

## Founder's Raw Thinking
"I want us to go deeper into testing/infra here right now so that everything just works going forward"
"we should have an e2e testing working like we should have a skill that I can run and claude just tests everything to see if everything is working"
"this test should run like scheduled you know?"
"could we optimize our workflow to somehow do stuff while Im gone?"
"Like any autowrite or autocode workflows that would work so that I would just check if everything is ok?"
"constant feature improvement loop to get stuff that its obvious but we dont have yet"
"unique small features that competitors have that increases a LOT of DX/CX/UX"
"we should set up posthog also"

## Inspired By (Cognition/Devin SDLC automation thread)
- Scheduled daily E2E smoke tests
- Auto-triaging production errors
- Weekly dependency updates with test suite validation
- Morning health digests
- Auto-fix on every PR
- Parallel migrations (8+ sessions)
- Feature flag cleanup after launches
- Weekly changelogs
- Reproduce customer bugs from support tickets
- Design system enforcement
- Docs in sync with code changes
- Racing competing solutions
- Visual regression tests before PRs
