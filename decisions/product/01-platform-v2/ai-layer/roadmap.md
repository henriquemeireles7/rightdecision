# AI Layer (Project 6)

> Initiative: 01-platform-v2
> Domain: product
> Created: 2026-06-12
> Status: ready

## Context

Platform V2's differentiator: an AI that "talks like it read your playbook." Everything a
student does — playbook answers, journal entries, decisions, interview distillations —
lands as structured typed rows; this project assembles them per-request into prompts (no
vector DB, ADR 9), persists conversations, runs the text-chat interview mode (ADR 11:
distill into document fields for user confirmation; voice = phone dictation; realtime
voice = v2), and meters usage against plan budgets (ADR 10: COGS target ≤$2/user/mo on a
$197/yr price). Constraint: solo founder + AI agents; Wave 4, strictly after Project 5
(interviews write document_answers).

SAFETY IS SCOPE: the ICP will include people in crisis — crisis/self-harm response policy,
refusal boundaries, and "not therapy" disclosure are brand, legal, and human risk in one.

## Scope

In scope:
- AI chat: context assembly from structured rows, conversation persistence, SSE streaming.
- Interview mode: page-scoped Q&A → distilled fields → user confirmation.
- Usage metering + plan budgets (ai_usage), model tiering (small for interviews/
  suggestions, large for advice), graceful ceiling.
- Safety: crisis/self-harm response policy (resource referral + boundary message, never
  advice), refusal boundaries, "not therapy" disclosure in onboarding and chat UI, AI
  data-handling disclosure (provider no-training posture documented).

Out of scope: realtime voice (v2, ADR 11); embeddings/RAG (rejected, ADR 9); unmetered
usage (rejected, ADR 10); any new tables (conversations, conversation_messages,
interviews, ai_usage all shipped in P1).

## Deliverables

### 1. CLAUDE.md scaffolding (before code)
- **Files:**
  - CREATE features/(life)/ai-chat/CLAUDE.md
  - CREATE features/(life)/interview/CLAUDE.md
- **Acceptance criteria:**
  - [ ] Each folder's CLAUDE.md exists before its code

### 2. providers/ai.ts v2 (chat + distillation, SSE seam)
- **What:** Chat + distillation capabilities. SSE seam per DX Convention 4 (declared in
  the initiative): providers/ai.ts exposes chat as AsyncIterable<chunk>; the feature
  layer owns persist-on-completion as a pure function; the Hono streamSSE route is thin
  piping. Tests iterate a fixture provider — no live socket needed for coverage. Model
  tiering: small model for interviews/suggestions, large for advice (ADR 10).
- **Files:** MODIFY providers/ai.ts (+ test); MODIFY providers/CLAUDE.md if the recipe
  changes.
- **Acceptance criteria:**
  - [ ] chat returns AsyncIterable<chunk>; fixture provider drives all stream tests
  - [ ] Distillation call shape covered by tests
  - [ ] Tier selection per kind (interview/suggestion vs advice) tested

### 3. AI chat (context assembly + persistence + streaming)
- **What:** Per-request context assembly from structured rows (playbook answers, journal,
  decisions, interview distillations — ADR 9); conversation persistence (conversations +
  append-only conversation_messages); Hono streamSSE on Bun. ~2-min Railway deploys sever
  SSE — assistant message persisted ONLY on completion; client treats stream drop as
  retriable and refetches the conversation (eng-schema S3).
- **Files:** CREATE features/(life)/ai-chat/ (context assembly, persist-on-completion
  pure function, streamSSE route, chat UI, tests); MODIFY platform/server/routes.ts
  (mount); /app nav: Chat item appears now.
- **Acceptance criteria:**
  - [ ] Chat answer references the user's actual playbook data (fixture user + assertion
        on assembled context)
  - [ ] Assistant message persisted only on completion; dropped stream leaves no partial
        message; client refetch recovers (tested via fixture provider)
  - [ ] CONVERSATION_NOT_FOUND 404 for foreign/missing conversations
  - [ ] aria-live="polite" streaming; no animated typing indicator under reduced motion

### 4. Interview mode (ADR 11 trust moment)
- **What:** Page-scoped text-chat Q&A → distilled fields → user confirmation. Interview
  states: active → distilling → awaiting_confirmation → confirmed / abandoned
  (INTERVIEW_INVALID_STATE 409 on bad transitions). Confirmation writes document_answers
  with source='interview' and sets confirmedAt — answers unconfirmed until accepted. UI
  renders proposed-vs-confirmed states: sand-tinted "suggested" fields the user explicitly
  accepts — the trust-critical moment of ADR 11. Voice = phone keyboard dictation (no
  product work needed).
- **Files:** CREATE features/(life)/interview/ (flow, distillation, confirm UI, tests).
- **Acceptance criteria:**
  - [ ] Interview fills a page's fields AFTER confirmation (never before)
  - [ ] Unconfirmed distilled fields render sand-tinted "suggested"; accepted ones flip
        to confirmed (confirmedAt set, source='interview')
  - [ ] Invalid state transitions rejected with INTERVIEW_INVALID_STATE (tested)

### 5. Usage metering + budgets
- **What:** ai_usage rows per message/call (kind, model, input/output tokens); enforcement
  middleware checks the monthly sum against AI_MONTHLY_TOKEN_BUDGET_PAID/_FREE (declared
  in P1 env.ts); graceful ceiling — AI_BUDGET_EXCEEDED 429 surfaces as a graceful message,
  never a raw error. Budget check = sum() over (userId, createdAt) for the current month;
  NO materialized counter until measurably slow.
- **Files:** CREATE ai_usage enforcement middleware (within features/(life)/ai-chat/ or
  platform per its CLAUDE.md recipe); tests (seeded near-ceiling ai_usage row from P1
  seed).
- **Acceptance criteria:**
  - [ ] Per-message usage rows written (chat, interview, distill kinds)
  - [ ] Budget ceiling returns graceful message (429 mapped to warm copy in UI)
  - [ ] Paid vs free budgets enforced separately

### 6. Safety system (scope, not polish)
- **What:** Safety system prompt + crisis-response copy (voice.md compliant); crisis/
  self-harm response = resource referral + boundary message, NEVER advice; refusal
  boundaries; "not therapy" disclosure in onboarding AND as a persistent quiet line under
  the chat input (not a dismissable modal); crisis message gets its own calm visual
  treatment, not alarm-red; AI data-handling disclosure (provider no-training posture
  documented).
- **Files:** CREATE safety prompt + crisis copy within features/(life)/ai-chat/; MODIFY
  onboarding surface for the disclosure; MODIFY privacy/AI data-handling disclosure
  content; tests with fixture crisis inputs.
- **Acceptance criteria:**
  - [ ] Crisis-signal input returns resources and a boundary, never advice (tested with
        fixture inputs)
  - [ ] "Not therapy" line persistent under chat input; present in onboarding
  - [ ] Crisis treatment is calm (not alarm-red); copy passes voice.md

## Acceptance Criteria (project-level, from document.md)

- [ ] Chat answer references user's actual playbook data
- [ ] Interview fills a page's fields after confirmation
- [ ] Budget ceiling returns graceful message
- [ ] Per-message usage rows written
- [ ] Crisis-signal input returns resources and a boundary, never advice (fixture-tested)
- [ ] SSE stream-drop is retriable (assistant message persisted only on completion;
      client refetches conversation)

## Design Requirements (binding for this project)

- Interaction states are scope, not polish: loading/empty/error/success on every screen;
  the budget-ceiling state is a designed state, not an error toast.
- Gold contrast rule: ink on gold; white-on-gold banned.
- Reduced motion: aria-live="polite" streaming; no animated typing indicator under
  reduced motion; non-essential transitions wrapped in
  `prefers-reduced-motion: no-preference`.
- New component patterns (chat bubbles, interview confirm) documented in design.md in the
  same PR (Universal File Sync).
- ALL AI-facing copy (prompts producing user-visible text, crisis copy, disclosures) must
  comply with decisions/voice.md — read it first.

## Dependencies

- **Requires:** Project 5 complete (SEQUENTIAL — interviews write document_answers; DX
  Convention 3); Project 1 (conversations/messages/interviews/ai_usage tables, env
  budgets, errors, events taxonomy, api-client, SPA harness); Project 3 (/app shell +
  Chat nav slot).
- **Produces:** the personalized AI experience (the paid product's core promise);
  interview-sourced document_answers; ai_usage data for the COGS metric (AI ≤$2/user/mo
  within total COGS ≤$3 — miss → tighten AI budgets per kill criteria).

## DX Conventions (applying to this project)

- One worktree per project session, branch `p6-ai-layer`.
- CLAUDE.md first; lanes never edit the same folder.
- SSE seam exactly as declared: AsyncIterable provider / pure persist-on-completion /
  thin streamSSE route; fixture provider for all coverage.
- Consume features/(shared)/api-client/; SPA harness for component tests.

## Risks

- Prompt quality = product quality: mitigation = voice.md compliance on all AI copy;
  fixture-based tests on context assembly; founder review of system prompts.
- The ICP will include people in crisis — safety copy is brand, legal, and human risk in
  one: mitigation = crisis policy is a tested deliverable (fixture inputs), calm visual
  treatment, persistent "not therapy" disclosure.
- Cost blowout against $197/yr: mitigation = metering middleware + plan budgets + model
  tiering + graceful ceiling (ADR 10); seed includes a near-ceiling user so the ceiling
  path is always exercised.
- Deploys severing streams: mitigation = persist-on-completion + client refetch-on-drop
  (eng-schema S3), tested.

## Relevant Decisions

| # | Decision | Choice | Why |
|---|----------|--------|-----|
| 9 | AI personalization | Structured typed rows (playbook answers, journal, decisions, interview distillations); per-request context assembly; no vector DB | A user's playbook fits in a prompt; debuggable |
| 10 | AI cost control | ai_usage table, monthly token budget per plan, model tiering (small for interviews/suggestions, large for advice), graceful ceiling, COGS target ≤$2/user/mo | $197/yr ceiling demands metering |
| 11 | Interview v1 | Text chat interview that distills into document fields for user confirmation; voice via phone keyboard dictation; realtime voice = v2 | 10x cheaper, same data captured |
| 6 | Event spine | Owned events data feeds AI personalization | PostHog is a viewer |

## Open Questions

- Whether chat interactions themselves record events (e.g. a 'chat_message' event) — the
  P1 taxonomy reserves the complete wave 1-4 union upfront, so the answer lives there;
  this project only fills properties schemas. Verify the taxonomy before adding anything.
- Crisis-resource list (which hotlines/regions) — not specified; founder/human input
  needed for the actual resources (add a decisions/humantasks.md entry); the mechanism is
  fully specified.
- "AI data-handling disclosure (provider no-training posture documented)" — surface not
  named (privacy policy vs in-app). Assumed both the privacy policy and an in-app line;
  confirm placement at design review.
