# Playbook (Project 5)

> Initiative: 01-platform-v2
> Domain: product
> Created: 2026-06-12
> Status: ready

## Context

Platform V2 has students fill a structured **Life Playbook** (paid) / **Starter Notebook**
(free) — pre-made fill-in documents, NOT a free-form editor (ADR 16 naming: action-
oriented, anti-self-help) — and journal daily. Every answer is a structured row
(document_answers IS ADR 9's "structured typed rows") feeding the per-user context store
that powers the AI layer (Project 6) and the Decision Graph (playbook saves and journal
entries count toward "Decisions Made"). Constraint: solo founder + AI agents;
dependency-ordered waves; Wave 3 (playbook+journal) lands after the members area ships.

This is the most sensitive data the company holds — the privacy policy must be updated to
cover the playbook/journal data class.

## Scope

In scope:
- Template chapters/pages (instructions + structured fields) for Life Playbook + Starter
  Notebook; template content authored as seed data, editable in admin.
- Fill-in UX per ADR 20: one page = one scrollable section in the 640px reading column,
  serif chapter heads + contents spine; autosave on blur with quiet "Saved" indicator;
  NO skeuomorphic page-flip.
- Progress per document.
- PDF export (satori — WHITE background, ink text, gold only for rules/accents; cream
  wastes ink printed).
- Journaling: morning/evening prompts; cumulative count "47 mornings journaled" — NO
  flame icons, NO broken-streak shame states (streak-guilt is hustle-culture, the brand's
  enemy).
- Empty pages are invitations: instruction prose (Indy register) + one example answer,
  never a bare form.
- Privacy reassurance line in the playbook shell ("Only you and your AI see this").
- Events for every save (Decision Graph rows).
- Privacy policy update covering playbook/journal data class.

Out of scope: AI interview mode (Project 6 — sequential after this, interviews write
document_answers); free-form editing; streak mechanics of any kind.

## Deliverables

### 1. CLAUDE.md scaffolding (before code)
- **Files:**
  - CREATE features/(life)/playbook/CLAUDE.md
  - CREATE features/(life)/journal/CLAUDE.md
- **Acceptance criteria:**
  - [ ] Each folder's CLAUDE.md exists before its code

### 2. Template system (TemplateSchema — codes against eng-schema.md vocabulary)
- **What:** document_templates per program (Playbook→paid, Starter Notebook→free), schema
  jsonb Zod-validated on every admin write, STABLE STRING FIELD IDS immutable once
  published (admin adds/deprecates, never renames); documents pin templateVersion at
  instantiation. P5 codes against the TemplateSchema field-type vocabulary v1 from
  eng-schema.md (DX SF2):
  ```ts
  type TemplateField = {
    id: string            // stable, immutable once published
    label: string
    kind: 'short_text' | 'long_text' | 'select' | 'multi_select' | 'date' | 'scale_1_10'
    required: boolean
    placeholder?: string
    options?: string[]    // select/multi_select only
    exampleAnswer?: string // empty-page invitation copy
  }
  // chapters → pages → fields; page carries instruction prose (Indy register)
  ```
  Adding a kind later = additive union change + Zod bump; never repurpose an existing
  kind.
- **Files:** CREATE template Zod schema + rendering within features/(life)/playbook/;
  template seed content in the seed path (CREATE seed data; MODIFY platform/scripts/seed.ts
  if templates seed there).
- **Acceptance criteria:**
  - [ ] Invalid template jsonb rejected on admin write (Zod, tested)
  - [ ] Renaming a published field id is rejected; adding/deprecating works
  - [ ] All six field kinds render and persist answers

### 3. Fill-in UX (ADR 20)
- **What:** One page = one scrollable section in the 640px reading column, serif chapter
  heads + contents spine; autosave on blur (upsert against
  uniqueIndex(documentId, fieldId)) with quiet "Saved" indicator; NO page-flip animation
  (banned decorative motion; explicit Save creates loss anxiety on reflective documents).
  Empty pages = instruction prose (Indy register) + one example answer (exampleAnswer
  field), never a bare form. Shell carries "Only you and your AI see this".
- **Files:** CREATE features/(life)/playbook/ (components, routes, tests); MODIFY
  platform/server/routes.ts (mount); /app nav: Playbook item appears now (nav items
  appear only when their wave ships).
- **Acceptance criteria:**
  - [ ] Autosave on blur upserts an answer row; quiet "Saved" indicator appears
  - [ ] ANSWER_FIELD_INVALID 400 for unknown fieldId
  - [ ] Empty page renders instruction prose + example answer
  - [ ] Privacy reassurance line present in the shell
  - [ ] Document status transitions empty → in_progress → complete; progress displays

### 4. Admin template editor
- **What:** Edit templates in the admin panel (extends the features/(admin)/ group;
  Zod-validated on every write; publish flow respects field-id immutability).
- **Files:** CREATE admin template editor module under features/(admin)/ (+ its
  CLAUDE.md); MODIFY pages/admin wiring.
  NOTE: features/(admin)/ is also touched by P2/P7 — this project runs after Wave 2, so
  no parallel conflict, but never run alongside P7 in the same folder.
- **Acceptance criteria:**
  - [ ] Admin edits a draft template; publishing freezes field ids; deprecation works

### 5. PDF export
- **What:** Export endpoint rendering the filled document via satori — WHITE background,
  ink text, gold only for rules/accents (cream wastes ink printed); branded.
- **Files:** CREATE export endpoint within features/(life)/playbook/; tests.
- **Acceptance criteria:**
  - [ ] Export downloads a branded PDF of a filled document (white bg, ink text verified
        in the render fixture)

### 6. Journaling
- **What:** Morning/evening prompts; entryDate = calendar-day computed CLIENT-side in the
  user's zone, sent explicitly (never derived server-side from UTC now);
  uniqueIndex(userId, entryDate, kind) — duplicate = JOURNAL_DUPLICATE 409. Cumulative
  count display ("47 mornings journaled") — NO flame icons, NO broken-streak shame
  states, no streak columns.
- **Files:** CREATE features/(life)/journal/ (components, routes, tests); /app nav:
  Journal item appears now.
- **Acceptance criteria:**
  - [ ] Morning and evening entries save; duplicate (user, date, kind) → JOURNAL_DUPLICATE
  - [ ] Cumulative count renders; zero streak/shame UI anywhere
  - [ ] entryDate comes from the client payload, validated, never computed server-side

### 7. Decision Graph events
- **What:** Every playbook save and journal entry records a decision event via
  platform/events/ record() — playbook saves: isDecision=true, decisionKind='playbook';
  journal entries: isDecision=true, decisionKind='journal' (tagged separately).
- **Files:** within features/(life)/playbook/ and journal/ service code; tests assert
  event rows.
- **Acceptance criteria:**
  - [ ] Every answer save = structured row + decision event in the same transaction
        (record() with tx)
  - [ ] Journal entries produce journal-kind decision events

### 8. Privacy policy update
- **What:** Privacy policy covers the playbook/journal data class — the most sensitive
  data the company holds.
- **Files:** MODIFY the privacy policy page/content (per existing legal page location).
- **Acceptance criteria:**
  - [ ] Policy names the playbook/journal data class, its storage, and access ("only you
        and your AI")

## Acceptance Criteria (project-level, from document.md)

- [ ] Free user fills Starter Notebook pages
- [ ] Paid user fills Playbook chapters
- [ ] Journal streak displays (as cumulative count — no shame states)
- [ ] Export downloads branded PDF
- [ ] Every answer = structured row

## Design Requirements (binding for this project)

- Interaction states are scope, not polish: loading/empty/error/success on every screen;
  empty states are invitations (warm copy + a primary action).
- Gold contrast rule: ink text on gold; white-on-gold banned.
- Reduced motion: no page-flip (banned outright, ADR 20); non-essential transitions
  wrapped in `prefers-reduced-motion: no-preference`.
- /app consumes existing tokens in styles/global.css; new component patterns (e.g.
  contents spine, autosave indicator) documented in design.md in the same PR.
- All instruction prose and prompts written in the Indy register — read decisions/voice.md
  before writing ANY of this copy.

## Dependencies

- **Requires:** Project 1 (document_templates/documents/document_answers/journal_entries
  schema, events taxonomy, api-client, SPA harness); Project 3 (/app shell + nav to mount
  Playbook/Journal items); Project 2 (admin panel shell for the template editor). Wave 3
  per ADR 15.
- **Produces:** the structured rows ADR 9's AI personalization reads — P6 (ai-layer) is
  SEQUENTIAL after this (interviews write document_answers; DX Convention 3). Playbook/
  journal decision events for the Decision Graph.

## DX Conventions (applying to this project)

- One worktree per project session, branch `p5-playbook`.
- CLAUDE.md first; lanes never edit the same folder.
- P5 → P6 sequential (interviews write document_answers).
- Consume features/(shared)/api-client/; SPA harness for component tests.

## Risks

- Template quality is course content: mitigation = founder reviews seed templates before
  launch (explicit human gate — add to decisions/humantasks.md).
- Sensitive-data exposure: mitigation = privacy policy update shipped in this project;
  access limited to the owning user (+ AI context assembly in P6); cascade-delete already
  tested in P1.
- Field-id drift breaking answers: mitigation = ids immutable once published, enforced in
  the admin write path with tests.

## Relevant Decisions

| # | Decision | Choice | Why |
|---|----------|--------|-----|
| 9 | AI personalization | Structured typed rows (playbook answers, journal, decisions, interview distillations); per-request context assembly; no vector DB | A user's playbook fits in a prompt; debuggable |
| 16 | Naming | Paid doc set = "Life Playbook"; free doc set = "Starter Notebook" | Action-oriented (anti-self-help), short, scales to "Business Playbook" |
| 20 | Playbook "book" UX | One page = one scrollable section in the 640px reading column, serif chapter heads + contents spine; autosave on blur with quiet "Saved" indicator; NO skeuomorphic page-flip | Book feeling comes from typography and structure; page-flip is banned decorative motion; explicit Save creates loss anxiety on reflective documents |
| 7 | Course CMS (template editing analog) | Templates edited in admin; jsonb authorship doc + relational answers (TD-4) | Non-technical co-founder authors content |

## Open Questions

- RESOLVED IN P5 IMPLEMENTATION (founder may override): same-day journal re-save UPDATES the
  entry instead of returning JOURNAL_DUPLICATE — editing today's entry is normal journaling
  behavior, and a 409 there is shame UX. The unique index stays as the integrity backstop;
  JOURNAL_DUPLICATE is reserved for the race where two concurrent FIRST saves collide
  (loser gets 409, client retries). The decision event records once per (date, kind).
  See features/(life)/journal/CLAUDE.md.
- RESOLVED IN P5 IMPLEMENTATION: "PDF export" v1 = print-ready HTML (white bg, ink text,
  Instrument Serif heads, gold accents, @media print stylesheet) + browser print-to-PDF.
  satori cannot paginate a multipage document (single SVG frame), and a headless-Chrome PDF
  pipeline is overkill for v1. See features/(life)/playbook/CLAUDE.md.

- Playbook/Notebook naming (ADR 16): founder may override copy before this project ships —
  check before finalizing UI strings.
- "Progress" display granularity (per chapter vs per document) is not specified beyond
  documents.status ('empty','in_progress','complete') — assumed document-level status +
  answered/total field counts; confirm with design review if more is wanted.
- Where the privacy policy lives (file path) — not named in document.md; locate the
  existing legal page before editing.
- Whether the admin template editor belongs to this project or P2 — document.md lists
  "admin template editor" under P5 deliverables; assumed P5 (it ships after P2's admin
  shell exists). Confirm there is no duplicate plan in the P2 session.
