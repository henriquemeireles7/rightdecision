# Knowledge Base Strategy — The Right Decision
**Version:** 1.0
**Date:** 2026-04-06
**Status:** Draft (with open questions)
**Author:** Henry + Indy + Claude
**Meta-doc:** decisions/09-knowledge-base-strategy/meta.md
**Input:** decisions/09-knowledge-base-strategy/input.md + raw.md
**Pipeline:** d-meta → d-input → d-plan (here) → d-tasks

## Document scope
**This document IS:** The information architecture for the decisions/ knowledge base — where knowledge lives, what can change, how podcast transcripts are filed, how the compounding loop works conceptually, and what's deferred to the harness workflow.
**This document is NOT:** The harness/agent workflow design (being built in parallel). Not the content automation pipeline (doc #8). Not a software architecture doc.
**Primary reader:** Henry (system architect), AI agents (operate within these rules), future contributors.
**Depends on:** All existing decision documents (they ARE the seed knowledge base), CLAUDE.md (agent instructions)
**Feeds into:** Short-Video Viral Strategy (doc #8), all future documents, harness workflow design

**Note:** Several sections have open questions marked with `[OPEN]`. These are being resolved in a parallel conversation about the harness workflow (Claude Code agent orchestration). This document defines the information model. The harness workflow defines the automation.

---

## 1. Architecture + Integration

### The knowledge base IS decisions/

The `decisions/` folder is the single knowledge base for all strategic thinking about The Right Decision. It contains strategy documents, the manifesto, methodology, course structure, distribution plans, and (soon) raw podcast transcripts. There is no separate `knowledge-base/` or `strategy/` folder. decisions/ is already it.

### Folder structure

```
decisions/
├── general.md                          ← THE living summary (global context)
├── human.md                            ← Writing rules (immutable reference)
├── 001-architecture.md                 ← Legacy format (pre-folder)
│
├── 01-business-model/                  ← Strategy documents
│   ├── meta.md                         ← Document structure template
│   ├── input.md                        ← Founder's structured thinking (immutable)
│   ├── raw.md                          ← Founder's raw words (immutable)
│   └── document.md                     ← Final document (static)
│
├── 02-manifesto/                       ← Same pattern
├── 03-methodology/
├── 04-course-outline/
├── 05-landing-page/
├── 07-social-media-setup/
├── 08-short-video-viral-strategy/
├── 09-knowledge-base-strategy/         ← This document
│
└── podcasts/                           ← Raw podcast transcripts (NEW)
    ├── general/                        ← Open conversations
    ├── vsl/                            ← VSL-rehearsal episodes
    ├── the3acts/                       ← Course structure practice (Acts I/II/III)
    └── course/                         ← Direct class rehearsal
```

### How it connects to existing systems

**d-meta → d-input → d-plan pipeline:** Strategy documents are created through this pipeline. Each phase produces a file (meta.md → input.md → document.md). The pipeline is human-initiated (`/d-auto`). Podcast transcripts bypass this pipeline — they go directly into `podcasts/` as raw material.

**DSA SPEC.md pattern:** In the codebase, every folder has a SPEC.md that gives AI instant context. In decisions/, `general.md` serves the same role at the root level. Future: CLAUDE.md files inside each doc folder will provide per-folder context for AI agents, same pattern as the code side.

**CLAUDE.md agent instructions:** The root CLAUDE.md already says "Read SPEC.md before ANY code change." The equivalent for decisions/ is: "Read general.md before ANY strategy work."

### The two knowledge ingestion paths

| Path | Input | Process | Quality control | Output |
|---|---|---|---|---|
| **Document pipeline** | Founder thinking | d-meta → d-input → d-plan | Meta.md structure, adversarial review, quality checklist | document.md (static) |
| **Transcript pipeline** | Podcast recording | Record → transcribe → file | `[OPEN]` — TBD with harness workflow | Raw transcript (immutable) |

The document pipeline is structured and quality-gated. The transcript pipeline is raw and fast. Both feed into general.md, but through different mechanisms (manual updates vs. `[OPEN]` future automation).

---

## 2. File Mutation Rules

### Three tiers

| Tier | What | Rule | Who can change | Example |
|---|---|---|---|---|
| **Living** | `general.md` | Updated whenever new material or insights arrive | Henry (now), AI (future, via harness workflow) | Adding a new insight from podcast #47 |
| **Static** | `*/document.md`, `*/meta.md` | Frozen once completed. Only changed if Henry explicitly requests a specific change. | Henry only (must specify what to change) | "Update the pricing in doc #1 to $247" |
| **Immutable** | `*/input.md`, `*/raw.md`, `podcasts/**/*.md` | Never edited after creation. New files added, existing untouched. | Nobody (append-only to folders) | Adding a new transcript file |

### Rules for AI agents

1. **Always read general.md first** before any work in decisions/.
2. **Never edit a document.md** unless Henry explicitly says "change X in doc Y."
3. **Never edit raw material** (input.md, raw.md, transcripts). If you find an error, note it in a separate file or flag it to Henry.
4. **general.md may be updated** when:
   - A new document is completed (add it to the index)
   - A new significant insight emerges from a podcast transcript
   - The current status section needs updating
   - Henry explicitly asks for an update
5. **Creating new files is always allowed** in the appropriate folder (new transcript, new decision doc folder).

### Enforcement

**Current:** Convention-based. The rules are documented here and in CLAUDE.md. AI agents follow instructions.

**`[OPEN]` Future:** Harness workflow will enforce mutation rules programmatically. Potential mechanisms:
- Pre-commit hooks that reject changes to immutable files
- Agent permissions that restrict write access per file type
- Automated review of any general.md changes before commit

### Conflict resolution

When a podcast transcript contradicts an existing document:
1. The document is NOT updated (it's static).
2. The new thinking is captured in general.md's "Evolving Thinking" section (if one exists).
3. If the contradiction is significant enough to warrant a document rewrite, Henry must explicitly initiate a new d-plan cycle for that document.
4. The transcript is immutable regardless — it captures what was said at that moment.

---

## 3. Transcript Taxonomy + Naming Convention

### Four podcast types

| Type | Folder | Purpose | Content pattern |
|---|---|---|---|
| **General** | `podcasts/general/` | Open conversations between Henry and Indy about decisions, life, the methodology | Unstructured. Goes wherever the conversation leads. |
| **VSL** | `podcasts/vsl/` | Rehearsing sales angles, testing hooks, practicing the pitch | Structured around one angle or hook. Selling mode. |
| **The 3 Acts** | `podcasts/the3acts/` | Practicing the course structure: Act I (See Clearly), Act II (Decide), Act III (Move) | Structured around one act or module. Teaching mode. |
| **Course** | `podcasts/course/` | Direct rehearsal of a specific course class | Tightly structured. One module, one class. Practice delivery. |

### Naming convention

```
{YYYY-MM-DD}-{sequence}-{type}-{slug}.md
```

**Examples:**
- `2026-04-06-01-general-why-decisions-matter.md`
- `2026-04-06-02-course-module3-dominant-constraint.md`
- `2026-04-07-01-vsl-angle4-risk-acceptance.md`
- `2026-04-07-02-the3acts-act2-the-decision.md`

**Rules:**
- Date is recording date (ISO 8601)
- Sequence is a daily counter (01, 02) for multiple recordings per day
- Type matches the folder name (general, vsl, the3acts, course)
- Slug is a short description (kebab-case, max 5 words)

### Metadata header

Every transcript starts with:

```markdown
---
date: 2026-04-06
sequence: 01
type: general
speakers: Henry, Indy
duration: 42 min
topics: [dominant constraint, therapy vs decisions, Indy's kitchen table story]
related_docs: [03-methodology, 02-manifesto]
transcription_tool: [Whisper/Deepgram/manual]
---

[Transcript content below]
```

### Multi-category conversations

When a 45-minute conversation spans multiple types (e.g., starts general, becomes course-specific):
- File under the **dominant** type (the one that takes up most of the conversation)
- Tag the secondary types in the `topics` metadata field
- Do NOT split the transcript into multiple files — one recording = one file

### Transcript quality

Raw transcriptions (Whisper, Deepgram, etc.) are filed as-is, including errors. The raw transcript is immutable — it captures what the tool produced. If a manual cleanup is done, it's saved as a separate file:
- Raw: `2026-04-06-01-general-why-decisions-matter.md`
- Cleaned (if done): `2026-04-06-01-general-why-decisions-matter.clean.md`

In practice, raw is probably good enough for AI consumption. Cleanup is optional and only for human readability.

---

## 4. The Compounding Loop + Automation

### The loop (conceptual)

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  RECORD PODCAST                                     │
│  (Henry + Indy, 30-60 min, 2x/day)                │
│       │                                             │
│       ▼                                             │
│  TRANSCRIBE                                         │
│  (Whisper/Deepgram → raw transcript)               │
│       │                                             │
│       ▼                                             │
│  FILE TRANSCRIPT                                    │
│  (decisions/podcasts/{type}/{name}.md)             │
│       │                                             │
│       ▼                                             │
│  EXTRACT INSIGHTS                          [OPEN]   │
│  (AI reads transcript + general.md)                │
│       │                                             │
│       ▼                                             │
│  UPDATE GENERAL.MD                         [OPEN]   │
│  (New insights, updated status, connections)       │
│       │                                             │
│       ▼                                             │
│  BETTER CONTEXT                                     │
│  (AI and humans have richer context for             │
│   next document, next podcast, next content)        │
│       │                                             │
│       └──────────────── loops back to ──────────────┘
```

### What happens at each step

**Record:** Henry and Indy record based on the topic rotation from doc #7 (7 angles cycling weekly). They can check general.md before recording for context on what's been covered and what's missing.

**Transcribe:** Use an automated transcription tool (Whisper is free, Deepgram is faster). Output: raw markdown with metadata header.

**File:** Drop the transcript into the appropriate `decisions/podcasts/{type}/` folder. The naming convention makes it self-filing.

**Extract insights:** `[OPEN — harness workflow concern]`
Current plan: manual. After recording, Henry (or an AI agent under Henry's direction) reads the transcript and identifies:
- New insights not captured in existing documents
- Stories or examples that strengthen existing concepts
- Contradictions or evolutions of prior thinking
- Raw material that could improve course content

**Update general.md:** `[OPEN — harness workflow concern]`
Current plan: manual. Henry updates general.md with significant new insights. Not every transcript produces an update — only when something genuinely new or refined emerges.

Future plan: A harness workflow where an AI agent automatically reads new transcripts, proposes updates to general.md, and Henry approves or rejects. This workflow is being designed in a parallel conversation.

### The compounding effect

The loop is valuable even without automation:

| Iteration | Input | Output |
|---|---|---|
| **Week 1** | 14 transcripts + docs 1-5 | general.md has richer context, podcast topics are sharper |
| **Month 1** | 60 transcripts + docs 1-9 | Patterns emerge: which topics resonate, which explanations land, which stories hit |
| **Month 3** | 180 transcripts + all docs | The knowledge base knows more about the methodology than any single document. AI agents produce better content because they have richer context. |
| **Year 1** | 720 transcripts + all docs | The pattern library is unique and compounds. No competitor has 720 real conversations about decision-making with this specific methodology. |

### Quality gate

Before any insight reaches general.md:
1. **Source must be cited:** "From podcast 2026-04-15-02-course-module5, Henry said..."
2. **Contradiction check:** Does this contradict an existing document? If yes, flag it, don't silently override.
3. **Human approval (current):** Henry reviews and approves. `[OPEN]` Future: automated approval via harness workflow after trust is established (~20 successful updates).

---

## 5. Retrieval + Search Conventions

### The retrieval hierarchy

When an AI agent (or human) needs strategic context, follow this order:

```
1. Read general.md                    ← Global context, living summary
2. Read the relevant doc/document.md  ← Deep detail on that specific topic
3. Read the doc/meta.md               ← Structure and quality criteria
4. Search podcasts/ for related       ← Raw thinking, stories, examples
```

**general.md is always step 1.** It's the table of contents, the status tracker, and the summary of the latest thinking. If general.md is up to date, an agent might not need to read anything else.

### Cross-referencing

**Documents reference documents:** Using the existing pattern: "See doc #3 (methodology)" or "decisions/03-methodology/document.md"

**Transcripts reference documents:** Via the `related_docs` field in the metadata header: `related_docs: [03-methodology, 02-manifesto]`

**general.md references everything:** Each document gets an entry in general.md's index. Significant transcripts may be referenced in general.md's "Recent Insights" section (if one is added).

### Search conventions for agents

- **"What's our pricing strategy?"** → Read general.md (has current status) → Read doc #1 (business model) → Search `podcasts/` for "pricing" if more context needed
- **"How do we explain the dominant constraint?"** → Read doc #3 (methodology) → Read doc #2 (manifesto, customer-facing version) → Search `podcasts/course/` for rehearsal examples
- **"What did we say about therapy last week?"** → Search `podcasts/general/` by date range + keyword "therapy"

### `[OPEN]` Future retrieval enhancements

The harness workflow may introduce:
- Structured index files per podcast type (auto-generated from metadata headers)
- Semantic search over transcripts (embedding-based)
- Per-folder CLAUDE.md files that summarize their contents for AI agents
- A "knowledge graph" view of how documents relate to each other

For now, grep + naming conventions + general.md index is sufficient.

---

## 6. Summarization Protocol + Decay

### The problem

general.md will grow as insights accumulate. Without pruning, it becomes an unreadable 5000-line document that defeats its purpose.

### `[OPEN]` Max length and pruning

This is an open question being resolved with the harness workflow. Current thinking:

**Option A: Hard limit.** general.md stays under 500 lines. When it exceeds this, the oldest or least-relevant content is pruned.

**Option B: Split strategy.** general.md stays as a pure index (under 300 lines). Per-folder CLAUDE.md files hold the detailed context for each domain. general.md links to them.

**Option C: Progressive summarization.** general.md has layers: Layer 1 (full content), Layer 2 (bolded key points), Layer 3 (highlighted essential facts). When pruning, remove Layer 1 content and keep Layer 2/3.

**Current decision:** Start with Option B as the direction — general.md as index, CLAUDE.md files per folder for detail. But don't over-engineer it now. Let the system grow organically for the first month, then assess what's actually needed.

### What happens to pruned content

Pruned content is not deleted. It's preserved in git history. If a formal archive is needed, create a `decisions/archive/` folder for content that was once in general.md but is no longer current.

### Changelog in general.md

Bottom of general.md gets a rolling changelog (last 10 updates):

```markdown
## Recent updates
| Date | What changed | Triggered by |
|---|---|---|
| 2026-04-06 | Added docs 7-9 to index, added KB rules section | Doc creation |
| 2026-04-07 | Added pricing insight from podcast #3 | Podcast transcript review |
```

This makes general.md self-documenting: you can see what changed and why without reading git diffs.

---

## Bootstrap Plan

### What exists now (2026-04-06)
- `decisions/general.md` — living index with document list + KB rules section
- Docs 1-5: complete (business model, manifesto, methodology, course outline, landing page)
- Doc 6: deferred (VSL)
- Docs 7-9: in progress (social media, viral strategy, knowledge base)
- No podcast transcripts yet (recordings haven't started)

### Immediate actions

1. **Create `decisions/podcasts/` folder structure:**
   ```
   mkdir -p decisions/podcasts/{general,vsl,the3acts,course}
   ```

2. **Add a README to podcasts/:**
   Short file explaining the folder structure, naming convention, and metadata header template. So that the first transcript is filed correctly.

3. **Record first podcast** and produce first transcript. File it. Update general.md.

4. **Let the system breathe.** Don't over-engineer the automation. Record, transcribe, file, manually update general.md when insights are significant. After 20-30 transcripts, the patterns will be clear enough to design the harness workflow.

---

## Quality Checklist

- [x] Folder structure follows DSA philosophy (tree explains itself)
- [x] general.md has a pruning direction (Option B: index + per-folder CLAUDE.md)
- [x] Mutation rules are unambiguous (three tiers defined)
- [x] Every podcast transcript type has a template and filing location
- [x] Naming convention scales to 720 transcripts/year
- [x] Compounding loop is diagrammed with each step defined
- [ ] `[OPEN]` Quality gate automation (manual for now)
- [x] Retrieval path is defined (hierarchy: general.md → doc → transcript)
- [x] Cross-reference convention exists (related_docs metadata field)
- [x] Conflict resolution rule defined (transcript doesn't override static docs)
- [ ] `[OPEN]` AI self-learning automation (harness workflow concern)
- [x] Bootstrap actions are listed

**Result: 10/12 criteria met.** 2 items deferred to harness workflow.

---

## Assumptions Registry

| Assumption | Confidence | Signal that proves it wrong |
|---|---|---|
| general.md can stay useful as a single living file (at least for the first few months) | 🟡 hypothesis | It exceeds 500 lines and becomes unreadable within 30 days |
| Raw Whisper transcripts are useful enough for AI consumption without cleanup | 🟡 hypothesis | AI agents can't extract meaningful insights from raw transcripts |
| 720 transcripts/year is navigable with naming conventions + grep | 🔴 guess | Finding a specific insight requires reading 50+ transcripts |
| Manual general.md updates are sustainable at 2 transcripts/day | 🟡 hypothesis | Henry stops updating because it's too tedious |
| The compounding loop adds value even without automation | 🟢 validated | Just having docs for reference during podcast prep is already useful |
| Per-folder CLAUDE.md files will provide sufficient distributed context | 🟡 hypothesis | Agents still need to read 5+ files to get full context |

---

## Decision Log

| Date | Decision | Why | Watch signal |
|---|---|---|---|
| 2026-04-06 | Transcripts go in decisions/podcasts/{type}/ | Keeps everything in one tree. No sibling folders at project root. | If the folder gets too large, consider archiving by quarter |
| 2026-04-06 | Start with manual updates, automate later via harness | Can't automate what we don't yet understand. Need 20-30 transcripts to see patterns. | If manual is abandoned within 2 weeks, accelerate automation |
| 2026-04-06 | general.md direction: index + per-folder CLAUDE.md | Prevents general.md bloat while keeping distributed context | If per-folder CLAUDE.md is redundant with document.md, simplify |
| 2026-04-06 | Raw transcripts filed as-is (errors and all) | Immutability > perfection. AI can handle minor errors. | If transcript errors cause AI misinterpretation, add cleanup step |
| 2026-04-06 | Multi-category transcripts filed under dominant type | Splitting is worse than misfiling. One recording = one file. | If misfiled transcripts are hard to find, add tagging |
| 2026-04-06 | Several sections left [OPEN] | Harness workflow being designed in parallel. Information model should be defined before automation. | If open questions block podcast recording from starting, resolve immediately |

---

## Override Warnings

This document introduces concepts that affect other documents and the project:

1. **`decisions/podcasts/` folder** is new. Create it immediately (bootstrap action #1).
2. **CLAUDE.md files per folder** are referenced but don't exist yet in decisions/. The code side has this pattern. The decisions/ side should adopt it.
3. **Harness workflow dependency** — multiple sections are `[OPEN]` waiting on the parallel conversation about agent orchestration. When that design is complete, this document should be updated with the resolved answers.
4. **Transcript metadata header** defines a `related_docs` field that creates cross-references to strategy documents. This is the first formal linking convention in the knowledge base.

---

**Next step:** Run `/d-auto` for doc #8 (Short-Video Viral Strategy), which references the account registry from doc #7 and the folder structure from this doc.
