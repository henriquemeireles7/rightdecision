# workflow

## Purpose
Thin orchestrator for the BD podcast distribution pipeline. Owns the state machine, precondition validators, config schema, and step sequencing. All business logic lives in individual step features — this is WIRING only.

## Critical Rules
- NEVER put step-specific business logic here — each step has its own feature folder
- ALWAYS validate transitions via assertTransition() before changing pipelineRun.status
- ALWAYS check preconditions (status + data) before executing a step
- Stop on any step failure — user retries individual steps via their APIs
- WorkflowConfig must be validated via Zod schema before use

## Imports (use from other modules)
```ts
import { assertTransition, type PipelineStatus } from '@/features/(business)/workflow/state-machine'
import { validateClipSelectReady, validateClipCutReady } from '@/features/(business)/workflow/preconditions'
import { workflowConfigSchema, type WorkflowConfig } from '@/features/(business)/workflow/config'
```

## Verify
```sh
bun test features/\(business\)/workflow/
```
