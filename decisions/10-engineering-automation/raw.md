# Raw Input — Engineering Automation & Infrastructure Strategy

## Source: Founder brain dump (2026-04-07)

### Trigger
Saw Cognition/Devin thread about coding agents handling the entire SDLC. Realized we need to automate more of our engineering workflow.

### Key ideas from the thread that resonated:
1. **Scheduled daily E2E smoke tests** — automation signs up, goes through onboarding, exercises core flows, pass/fail report
2. **Auto-triaging production errors** — webhook new errors, root-cause, fix, ship with regression test
3. **Weekly dependency updates** — check outdated packages, run tests, open upgrade PRs
4. **Morning health digests** — query monitoring for error spikes, latency regressions, post summary before standup
5. **Auto-fix on every PR** — review agents catch bugs/security/style, push fixes to branch
6. **Parallel migrations** — split large refactors into conflict-free packages, run 8+ sessions
7. **Feature flag cleanup** — scheduled session after launch removes dead code
8. **Weekly changelogs** — group merged PRs by category, post digest
9. **Reproduce customer bugs** — paste issue, agent reproduces in browser, files bug with steps
10. **Design system enforcement** — scan for hardcoded colors, missing tokens, style violations
11. **Auto-generate API docs** — create docs from code changes
12. **Docs in sync with code** — daily scan of merged PRs vs documentation
13. **Racing competing solutions** — parallel sessions trying different optimization strategies
14. **Visual regression tests** — screenshot every affected page at multiple viewports

### Founder's priorities:
- **Test suite depth** — "I want us to go deeper into testing/infra here right now so that everything just works going forward"
- **E2E testing** — "we should have an e2e testing working like we should have a skill that I can run and claude just tests everything"
- **Scheduled testing** — "this test should run like scheduled"
- **Autonomous work while away** — "could we optimize our workflow to somehow do stuff while Im gone?"
- **Feature improvement loops** — "constant feature improvement loop to get stuff that its obvious but we dont have yet"
- **Competitor analysis** — "unique small features that competitors have that increases a LOT of DX/CX/UX"
- **PostHog monitoring** — "we should set up posthog also"

### What we have today:
- 7 unit tests (5 providers, 2 platform)
- Zero E2E tests
- Zero feature-level tests (business logic untested)
- Bun test runner (built-in, no config needed)
- GitHub Actions CI: biome → tsc → harden-check → bun test
- Railway auto-deploy from main
- Health check endpoints (/health, /health/ready)
- No monitoring (no PostHog, no Sentry)
- No scheduled automation
- No production observability
- gstack browse/QA skills available but not wired into automation
- Claude Code cron triggers available but unused
- PostHog MCP tools available but not connected
