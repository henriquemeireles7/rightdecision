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
