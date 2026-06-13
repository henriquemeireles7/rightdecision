# (business)

## Purpose
The Business Decisions (BD) podcast → social distribution pipeline, as a set of independent step
features orchestrated by `workflow/`. Each step is its own folder (transcribe, clip-select,
clip-cut, metadata-generate, post-distribute, insight-generate, analytics-collect, account-sync,
pipeline-integration) with its own CLAUDE.md; `workflow/` owns only the state machine, precondition
checks, and step sequencing. This top-level file documents the domain contract and the shared test
seam (`test-helpers.ts`, `pipeline-integration.test.ts`).

## Critical Rules
- NEVER put step business logic in `workflow/` — it is WIRING only (state machine + preconditions +
  config). Each step's logic lives in its own feature folder.
- ALWAYS gate a step on validated transitions (`assertTransition`) AND preconditions (status + data)
  before running it; stop the pipeline on any step failure — the user retries the failed step.
- Steps are independent vertical slices — a step NEVER imports another step's internals; they
  coordinate only through `pipelineRun` status and the workflow orchestrator.
- ALWAYS clean up temp files (downloads, ffmpeg output) on BOTH success and failure.
- The integration test mocks env/db/analytics/fs through platform/test/mocks and the shared
  `test-helpers.ts` — NEVER hit real cloud services or AI APIs in CI.
- Standard platform rules apply: Zod-validated input, `throwError()` for errors, `success()` for
  responses, env only via platform/env.

## Imports (use from other modules)
```ts
import { assertTransition } from '@/features/(business)/workflow/state-machine'
// Each step exposes its own entry; the orchestrator sequences them.
```

## Recipe: New pipeline step
```ts
// 1. Create features/(business)/<step>/CLAUDE.md FIRST (purpose + rules for that step).
// 2. Implement the step logic + tests in its own folder (cleanup on success AND failure).
// 3. Register its status transition + preconditions in workflow/ and add it to the sequence.
```

## Verify
```sh
source /tmp/test-env.sh && bun test "features/(business)" && bunx tsc --noEmit
```
