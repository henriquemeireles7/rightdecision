# TODOS

## P2 — Medium Priority

### d-review Evaluation Loop
**What:** Track review findings over time. Log each review's duration, findings count, auto-fix count, false positive rate. Compare against baseline (v1 d-review).
**Why:** Can't improve what you can't measure. Need data to calibrate confidence scores and prove v2 catches more real bugs.
**Effort:** S (CC: ~15 min)
**Depends on:** d-review v2 shipped and used 10+ times.
**Added:** 2026-04-09 via /plan-ceo-review

## P3 — Low Priority

### d-review Auto-Generate Test Stubs
**What:** When Phase 4 (Test Quality) finds a missing edge case test, auto-generate a test stub with the right describe/it structure and a TODO comment. Developer fills in the assertion.
**Why:** Reduces friction from "test gap found" to "test gap partially fixed."
**Effort:** S (CC: ~10 min)
**Depends on:** d-review v2 Phase 4 working and producing useful findings.
**Added:** 2026-04-09 via /plan-ceo-review

### R2 Artifact Lifecycle Policy
**What:** Define cleanup rules for R2 storage (delete raw videos after N days, keep clips forever, archive old analytics).
**Why:** Storage costs accumulate at scale. At 10+ episodes/week for BD customers, R2 free tier won't cover it.
**Effort:** S (CC: ~10 min)
**Depends on:** Phase 3 analytics collection working (need to know what data to keep).
**Added:** 2026-04-08 via /plan-ceo-review

### Handbook Changelog/Feed Page
**What:** A /handbook/changelog page showing recent git commits to handbook files, auto-generated from git log.
**Why:** Reinforces the "living handbook" narrative. Early readers can track what changed week-to-week. Unique differentiator — no other company handbook has this.
**Pros:** Proves liveness beyond per-page timestamps, creates a "what's new" entry point for returning readers.
**Cons:** Adds a build-time step (git log parsing), new component to maintain.
**Effort:** M (human) → S (CC: ~25 min)
**Priority:** P3
**Depends on:** Handbook V1 shipped + active readers justifying the feature.
**Added:** 2026-04-08 via /plan-ceo-review

### Dark Mode Toggle
**What:** Docs-only dark mode toggle. Cream/warm palette flips to dark navy/slate. Persisted in localStorage.
**Why:** Developers expect dark mode in documentation. Some users need lower brightness for accessibility.
**Pros:** Developer preference, accessibility benefit, modern expectation for docs sites.
**Cons:** Doubles visual QA surface. Every component needs dark mode testing. Brand identity risk (Ethereal Warmth = warm cream).
**Effort:** M (human) → S (CC: ~30 min)
**Priority:** P3
**Depends on:** Content platform shipped + user requests justifying it.
**Added:** 2026-04-09 via /plan-ceo-review

### AI-Powered Semantic Search
**What:** Replace Fuse.js fuzzy search with embedding-based semantic search. Users search by intent, not just keywords.
**Why:** Fuse.js is text matching. Semantic search understands meaning ("how do I make better decisions?" → relevant handbook + method + guide pages).
**Pros:** Better results, natural language queries, competitive differentiator. Phase 2 of the content platform search.
**Cons:** Requires embeddings pipeline, API cost per query, more complex build and maintenance.
**Effort:** L (human) → M (CC: ~1-2 hours)
**Priority:** P2
**Depends on:** Content platform shipped + 50+ pages to justify embedding investment. Build-time index is the seam (replace generator, keep component).
**Added:** 2026-04-09 via /plan-ceo-review

### Content Contribution Pipeline
**What:** "Suggest an edit" button on each content page that opens a GitHub PR against the content repository.
**Why:** Community contributions build SEO surface for free. Open-source handbooks thrive on external PRs.
**Pros:** Free content creation, community engagement, social proof, SEO compounding.
**Cons:** Moderation overhead, quality control, merge review time.
**Effort:** M (human) → S (CC: ~20 min)
**Priority:** P3
**Depends on:** Open-source harness repo published + active handbook readers. "View source" link is the precursor.
**Added:** 2026-04-09 via /plan-ceo-review
