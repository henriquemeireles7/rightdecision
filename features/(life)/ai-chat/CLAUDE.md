# ai-chat

## Purpose
The personalized AI that "talks like it read your playbook" (P6, ADR 9). Per-request context
assembly from STRUCTURED TYPED ROWS (playbook answers + journal + decisions + interview
distillations) — NO vector DB, NO embeddings. Owns persist-on-completion (the SSE seam), usage
metering + plan budgets (ADR 10), and the SAFETY system (crisis policy + "not therapy" disclosure).
This is the paid product's core promise and its biggest human-risk surface.

## Critical Rules
- NEVER persist a partial assistant message: the pure `runChatTurn` accumulates provider chunks and
  writes the assistant row ONLY on completion (eng-schema S3). A dropped stream leaves NOTHING — the
  client treats a drop as retriable and refetches the conversation.
- NEVER embed answer/journal/chat text in event properties — `chat_message_sent { conversationId }`
  only (PII rule). Message bodies live in conversation_messages.
- NEVER assemble context with a vector DB or embeddings — query the user's structured rows directly
  (ADR 9). A user's playbook fits in a prompt.
- NEVER let crisis input get advice. `classifyCrisis()` runs FIRST; on a hit the turn returns the
  CRISIS_RESPONSE (resource referral + boundary), records `ai_budget`-free, and NEVER calls the LLM.
- NEVER invent specific hotline numbers — `CRISIS_RESOURCES` is a FOUNDER-INPUT placeholder (988 +
  emergency services generic) with a TODO + a decisions/humantasks.md P0 entry.
- ALWAYS meter every LLM call: one ai_usage row per assistant message (kind, model, input/output
  tokens). The enforcement middleware sums the CURRENT MONTH's tokens (sum() over (userId,
  createdAt) — NO materialized counter) against AI_MONTHLY_TOKEN_BUDGET_PAID/_FREE and 429s with
  AI_BUDGET_EXCEEDED → a warm message, never a raw error. Paid vs free enforced separately.
- ALWAYS 404 CONVERSATION_NOT_FOUND for a conversation that is missing OR owned by another user.
- The Hono route is thin streamSSE piping ONLY — assembly + persistence live in service.ts (pure).
- Model tiering (ADR 10): LARGE model for chat advice, SMALL for interview/suggestion/distill —
  selection by `kind` in providers/ai.ts, never here.

## SSE seam (DX Convention 4 — declared, follow EXACTLY)
- providers/ai.ts `chat(...)` returns `AsyncIterable<ChatChunk>`; `distill(...)` is a single call.
- `runChatTurn(deps)` is PURE persist-on-completion: assemble context → iterate the injected
  provider → accumulate text + usage → on completion persist the assistant message + ai_usage row
  + record the event; on drop (iterator throws/aborts) persist NOTHING and rethrow.
- The route pipes `runChatTurn` chunks through Hono `streamSSE`. ALL tests iterate a FIXTURE provider
  (an injected AsyncIterable) — never a live socket. No network in CI.

## Safety (TESTED deliverable, not polish)
- `SAFETY_SYSTEM_PROMPT` (voice.md-compliant) + `classifyCrisis()` keyword/intent matcher.
- Crisis treatment is CALM, not alarm-red: the UI banner uses `bg-sand`/`border-gold`/`text-ink`,
  never `text-error`/red. Tests assert no alarm/red token in the crisis component.
- "Not therapy" disclosure is a PERSISTENT quiet line UNDER the chat input (not a dismissable modal)
  AND in onboarding. Provider no-training posture is documented in content/legal/privacy.md.

## Imports (use from other modules)
```ts
import { runChatTurn, assembleContext, getConversation, listConversations } from '@/features/(life)/ai-chat/service'
import { enforceAiBudget, monthlyTokenUsage } from '@/features/(life)/ai-chat/budget'
import { classifyCrisis, CRISIS_RESPONSE, CRISIS_RESOURCES, SAFETY_SYSTEM_PROMPT, NOT_THERAPY_LINE } from '@/features/(life)/ai-chat/safety'
import { aiChatRoutes } from '@/features/(life)/ai-chat/routes'
```

## Recipe: A chat turn (pure persist-on-completion)
```ts
const result = await runChatTurn({
  userId, conversationId, userMessage,
  provider: chat,        // AsyncIterable provider (fixture in tests)
  onChunk: (text) => stream.writeSSE({ event: 'token', data: text }),
})
// result.dropped === true → nothing persisted; client refetches the conversation
```

## Design patterns introduced (I-sync to design.md)
- chat-bubble: user bubble ink-on-gold (right), assistant ink-on-sand (left), 44px tap targets.
- crisis-callout: CALM sand/gold callout (never alarm-red) with resources + boundary.
- not-therapy line: muted single line under the chat input (persistent, non-dismissable).

## Verify
```sh
source /tmp/test-env.sh && DATABASE_URL=postgresql://test:test@localhost:5432/test_b6 bun test "features/(life)/ai-chat"
```

---
<!-- AUTO-GENERATED BELOW — do not edit manually -->

## Files
| File | Exports |
|------|---------|
| budget.ts | Plan, userPlan, budgetForPlan, monthlyTokenUsage, WriteUsageInput, writeUsage, isOverBudget, enforceAiBudget |
| routes.ts | createAiChatRoutes, aiChatRoutes |
| safety.ts | CRISIS_RESOURCES, CRISIS_RESPONSE, NOT_THERAPY_LINE, SAFETY_SYSTEM_PROMPT, classifyCrisis |
| service.ts | ChatProvider, assembleContext, RunChatTurnInput, RunChatTurnResult, runChatTurn, getConversation, listConversations |

## Internal Dependencies
- platform/auth
- platform/db
- platform/env
- platform/errors
- platform/events
- platform/programs
- platform/server
- platform/templates
- platform/types
- providers/ai

<!-- Generated: 2026-06-13T02:53:44.064Z -->
