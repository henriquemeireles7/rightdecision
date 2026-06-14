# interview

## Purpose
Page-scoped text-chat Q&A that DISTILLS into document fields for user CONFIRMATION (P6, ADR 11 —
the trust moment). Voice = phone keyboard dictation; realtime voice = v2. A finished interview
writes document_answers with source='interview' + confirmedAt — but ONLY after the user explicitly
accepts. Answers stay UNCONFIRMED (sand-tinted "suggested") until then.

## Critical Rules
- NEVER write a document_answer before confirmation. Distillation fills `interviews.distilledFields`
  (jsonb) ONLY; confirmation is a separate, explicit user act that upserts document_answers with
  source='interview' + confirmedAt=now (ADR 11). A field is never filled before the user accepts.
- State machine: active → distilling → awaiting_confirmation → confirmed | abandoned. Any other
  transition throws INTERVIEW_INVALID_STATE (409). Tests assert the bad-transition rejections.
- ALWAYS validate distilled fieldIds against the document's PINNED templateVersion (reuse
  platform/templates `fieldIdsForVersion`) — an unknown field is dropped, never written.
- Distillation reuses the providers/ai.ts `distill(...)` call (SMALL model, ADR 10) and meters one
  ai_usage row (kind='distill'). The Q&A turns reuse the chat provider (kind='interview', SMALL).
- Events: `interview_started`, `interview_distilled`, `interview_confirmed` ({ interviewId }) — names
  reserved in taxonomy.ts; fill properties only. NEVER the answer text (PII).
- The interview's conversation is a `conversations` row with kind='interview' (shared with ai-chat
  persistence). Confirmation is ONE transaction: answer upserts + status→confirmed + event.

## Imports (use from other modules)
```ts
import { startInterview, distillInterview, confirmInterview, abandonInterview, getInterview } from '@/features/(life)/interview/service'
import { interviewRoutes } from '@/features/(life)/interview/routes'
```

## Recipe: Confirm distilled fields (the ADR 11 trust write)
```ts
// awaiting_confirmation → confirmed: writes ONLY the fields the user accepted.
const result = await confirmInterview(userId, interviewId, acceptedFieldIds)
if ('error' in result) return throwError(c, result.error, result.details) // INTERVIEW_INVALID_STATE
// each accepted field → document_answers { source: 'interview', confirmedAt: now }
```

## Design patterns introduced (I-sync to design.md)
- interview-confirm: sand-tinted "suggested" field cards the user explicitly accepts → flip to a
  confirmed (gold-check) state. The ADR 11 trust moment — proposed vs confirmed is visually distinct.

## Verify
```sh
source /tmp/test-env.sh && DATABASE_URL=postgresql://test:test@localhost:5432/test_b6 bun test "features/(life)/interview"
```

---
<!-- AUTO-GENERATED BELOW — do not edit manually -->

## Files
| File | Exports |
|------|---------|
| routes.ts | createInterviewRoutes, interviewRoutes |
| service.ts | DistillProvider, StartInterviewInput, startInterview, appendInterviewMessage, DistillDeps, distillInterview, confirmInterview, abandonInterview, getInterview |

## Internal Dependencies
- features/(life)
- platform/auth
- platform/db
- platform/errors
- platform/events
- platform/server
- platform/templates
- platform/types
- providers/ai

<!-- Generated: 2026-06-13T02:53:44.064Z -->
