# Health — Living Maturity Scorecard

> Last verified: 2026-04-09
> See: decisions/maturity.md for level definitions, decisions/{domain}/context.md for category details

## Company Maturity Score: 9/99 (L1 — Manual)

```
Product:  4/99 (L1)  ████░░░░░░░░░░░░░░░░
Growth:   3/99 (L1)  ███░░░░░░░░░░░░░░░░░
Harness: 20/99 (L2)  ████████████████████░
```

## Maturity Scorecard

### Product (Generate Value) — Average: 4/99 (L1)

| Category | Score | Level | Blocking Next Level |
|----------|-------|-------|-------------------|
| Engagement | 8 | L1 | Course content not written. 3 free classes exist, 0 paid. |
| Data | 3 | L1 | No Decision Graph schema. Decisions in localStorage, not DB. |
| Network | 0 | L1 | No cross-user features exist. |
| Intelligence | 5 | L1 | Using generic Claude with custom skills. No decision-specific tuning. |

### Growth (Capture Value as Money) — Average: 3/99 (L1)

| Category | Score | Level | Blocking Next Level |
|----------|-------|-------|-------------------|
| Distribution | 5 | L1 | No content cadence. 1 blog post, 10 SEO pages. No Substack/social. |
| Conversion | 3 | L1 | Free funnel designed (doc 13) but not built in code. |
| Expansion | 0 | L1 | Single product, single price. No upsell path. |

### Harness (Self-Evolving AI System) — Average: 20/99 (L2)

| Category | Score | Level | Blocking Next Level |
|----------|-------|-------|-------------------|
| Self-Learning | 25 | L2 | d-harness works but runs manually. No auto-trigger from production errors. |
| Self-Growth | 8 | L1 | d-content exists but no publishing workflow. Manual every time. |
| Self-Product | 28 | L2 | d-strategy→d-code pipeline works. Not automated/scheduled. |

## Top 3 Bottlenecks

1. **Product/Engagement (score 8):** Course content is the prerequisite for everything. No content = no engagement = no data = no flywheel. P0.
2. **Growth/Distribution (score 5):** No content cadence means no leads. d-content exists but no publish workflow. P1.
3. **Growth/Conversion (score 3):** Free funnel not built. Traffic has nowhere to convert. P1.

## Quality Thresholds

### Security Baseline
- Auth: Better Auth with 30-day session expiry, CSRF enabled, secure/httpOnly/sameSite cookies
- Payments: Stripe Checkout (no custom payment forms), webhook signature verification
- DB: Drizzle ORM (prevents raw SQL injection by design), PostgreSQL on Railway
- Deploy: Railway Dockerfile, multi-stage build, non-root container user
- Headers: CSP, CORS configured, rate limiting on auth endpoints
- Input: Zod validation on all API inputs, DOMPurify on rendered content

### Code Quality
- Test coverage: 100% (enforced by CI)
- Type coverage: strict, no `any`
- Lint: Biome (zero errors required)
- Bundle: target <50KB client JS
- API p95: target <500ms

### Dependency Policy
- Monthly audit with `bun audit`
- Exact version pinning (no ^ or ~)
- New dep criteria: <50KB, actively maintained, typed, MIT/Apache

## Incident Log

| Date | Error | Category | Prevention Artifact | Status |
|------|-------|----------|-------------------|--------|
| — | No incidents recorded yet | — | — | — |

## Audit History

| Date | Mode | Score | Found | Fixed |
|------|------|-------|-------|-------|
| — | No audit run yet | — | — | — |
