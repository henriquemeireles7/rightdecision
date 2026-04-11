# META-DOC: Knowledge Base Strategy

## Purpose
Define the self-compounding knowledge architecture: where knowledge lives, what can be changed, how podcast transcripts feed into better strategy documents, how agents retrieve what they need, and how the system stays useful as it scales from 5 documents to 500 transcripts.

## Scope
**This document IS:** The information architecture for the decisions/ knowledge base — folder structure, mutation rules, transcript taxonomy, the compounding loop, retrieval conventions, and summarization protocol.
**This document is NOT:** The content automation pipeline (doc #8). Not the social media setup (doc #7). Not the course content itself (doc #4). Not a software architecture doc — this is about information, not code.

## Primary reader
Henry (builds the system, defines the rules), AI agents (operate within the system — read, write, retrieve), future contributors.

## Input documents
- `decisions/general.md` — the current living index, first version of the "living summary"
- `decisions/001-architecture.md` — DSA philosophy (SPEC.md per folder, tree-as-documentation)
- All existing `decisions/*/document.md` — they ARE the seed knowledge base
- `CLAUDE.md` — agent instructions, including mutation rules for files
- `decisions/07-social-media-setup/document.md` — podcast format (2/day, 30-60 min, Henry + Indy)

## Expert council
1. **Tiago Forte** (Building a Second Brain) — PARA method, progressive summarization, keeping knowledge actionable
2. **Andy Matuschak** (Evergreen Notes) — atomic, densely-linked knowledge, notes that improve over time
3. **Niklas Luhmann** (Zettelkasten) — self-referencing systems, emergence through cross-reference
4. **Simon Wardley** — evolution stages of knowledge components, what's mature vs. experimental
5. **DSA pattern** (internal) — the existing SPEC.md-per-folder pattern that already works in this codebase

## Research summary
**Layer 1 (Established):** Knowledge management systems have two failure modes: (1) too much structure (nobody maintains it), (2) too little structure (nobody finds anything). The sweet spot is: one living index + atomic documents + clear naming conventions + a retrieval path. Tiago Forte's progressive summarization and Matuschak's evergreen notes both solve the "I have 500 files and can't find the one I need" problem.

**Layer 2 (Trending):** In 2026, AI agents are the primary consumers of knowledge bases, not humans. This changes the design: files should be machine-readable, cross-references should be explicit (not inferred), and the living summary should fit within an AI context window (~200K tokens). The compounding loop (new raw data → AI extracts insights → updates summary) is a known pattern in agent-based systems.

**Layer 3 (First principles):** The DSA pattern already works: one SPEC.md per folder gives any new agent instant context. The knowledge base strategy is SPEC.md applied to business strategy instead of code. The risk is that decisions/ is one folder with a single general.md, not a tree of SPEC.md files. At scale, general.md must either stay small (aggressive summarization) or spawn child summaries.

## Document-level failure modes
1. **general.md becomes a monster.** It starts as a useful 100-line index and grows into an unreadable 5000-line document that no AI can usefully consume. Must have a max-length constraint and pruning protocol.
2. **Transcripts pile up with no retrieval path.** 720 transcripts/year. Without naming conventions, categorization, and search conventions, the knowledge base becomes a dump.
3. **The compounding loop compounds errors.** If AI misinterprets a transcript and updates general.md incorrectly, subsequent decisions are built on wrong data. Needs a quality gate.
4. **Contradictions go unresolved.** Podcast #47 contradicts doc #3's methodology. Without conflict resolution rules, the knowledge base contains two truths.
5. **AI updates general.md without founder oversight.** The "living document" promise conflicts with "human approves changes." At 2 podcasts/day, human review bottlenecks the loop.

## Sections

### SECTION 1: Architecture + Integration
**Answers:** Where does knowledge live? How does the folder structure work? How does it connect to the existing d-meta/d-input/d-plan pipeline, DSA SPEC.md pattern, and CLAUDE.md agent instructions?
**Done when:** A new AI agent can read this section and know: where to look for strategy context, where podcast transcripts live, what general.md is, and how to navigate the knowledge base.
**Failure modes:**
- Folder structure works for 9 docs but breaks at 45 (no grouping convention)
- general.md is positioned as SPEC.md-for-the-whole-business but SPEC.md files are scoped to one folder
- Podcast transcripts bypass the d-meta/d-input/d-plan pipeline (two ingestion paths with different quality controls)
- No convention for where transcripts physically live (in doc folders? in a top-level transcripts/ folder?)
**Max length:** 2-3 pages
**Confidence:** 🟡 hypothesis

### SECTION 2: File Mutation Rules
**Answers:** What can be changed, by whom, under what conditions? The three tiers: general.md (living), document.md (static), raw material (immutable). Plus: enforcement mechanisms (not just policy, but how the policy is enforced).
**Done when:** An AI agent cannot accidentally violate the mutation rules. A human contributor knows exactly which files they can edit.
**Failure modes:**
- Policy without enforcement: nothing prevents an AI from editing a document.md without explicit permission
- "Static unless human explicitly asks" is ambiguous — what counts as "explicit"?
- general.md is "always updated" but CLAUDE.md says documents require human sign-off — which wins?
**Max length:** 1-2 pages
**Confidence:** 🟢 validated (founder has clear opinion on this)

### SECTION 3: Transcript Taxonomy + Naming Convention
**Answers:** The four podcast transcript types (general, VSL-based, the3acts-based, course-based), their folder location, naming convention, metadata header template, and categorization rules for conversations that span multiple types.
**Done when:** A new transcript file can be created and filed correctly by an AI agent or human without ambiguity. At 720 transcripts/year, the naming convention still produces navigable results.
**Failure modes:**
- A 45-minute conversation drifts across categories — no rule for multi-category transcripts
- No quality threshold: are raw Whisper/Deepgram transcripts filed as-is, or cleaned up first?
- Naming convention doesn't include date or sequence number — transcripts become unorderable
**Max length:** 2 pages (includes templates)
**Confidence:** 🟡 hypothesis

### SECTION 4: The Compounding Loop + Automation
**Answers:** How does new raw material become summarized knowledge? The conceptual loop (record → transcribe → extract → update → inform next recording) AND the implementation triggers (what fires when a new transcript is added, what the AI does, how human approval works).
**Done when:** The loop is diagrammable, each arrow has a defined trigger, and the quality gate between "AI proposes update" and "general.md changes" is explicit.
**Failure modes:**
- The loop compounds errors if AI misinterprets transcripts
- No feedback mechanism: if updated general.md produces worse content, nobody detects it
- Labeled "future" but the whole strategy depends on it — if this never gets built, the loop requires 2 manual update sessions/day
- Permission model unclear: can AI freely update general.md, or does every update need human review?
**Max length:** 2-3 pages (includes diagram)
**Confidence:** 🔴 guess (untested, not yet built)

### SECTION 5: Retrieval + Search Conventions
**Answers:** How do agents and humans find what they need? When to read general.md vs. diving into a specific document. Index structure within general.md. Search conventions for transcripts. How cross-references work between documents and transcripts.
**Done when:** An AI agent tasked with "find our thinking on pricing" knows exactly where to look and in what order (general.md → doc #1 → relevant transcripts).
**Failure modes:**
- general.md grows past useful context-window size (>200K tokens) and becomes unreadable
- No linking convention between transcripts and documents they relate to
- Search is "grep the folder" with no structured index
**Max length:** 1-2 pages
**Confidence:** 🟡 hypothesis

### SECTION 6: Summarization Protocol + Decay
**Answers:** When and how general.md gets pruned. What signals that a section is stale. Where pruned content goes (archived? deleted? moved to a changelog?). Max length constraint for general.md. Progressive summarization rules.
**Done when:** general.md has a defined max length (in lines or tokens), a pruning trigger (when it exceeds the max), a pruning process (who does it, what gets cut), and an archive for pruned content.
**Failure modes:**
- general.md only grows, never shrinks, becomes useless by month 6
- Pruning removes context that's still needed, creating knowledge gaps
- No changelog: changes to general.md are invisible (git diff is too noisy for daily updates)
**Max length:** 1-2 pages
**Confidence:** 🔴 guess

## Quality checklist
- [ ] Folder structure follows DSA philosophy (tree explains itself)
- [ ] general.md has a max-length constraint and pruning protocol
- [ ] Mutation rules are unambiguous with enforcement mechanism defined
- [ ] Every podcast transcript type has a template and filing location
- [ ] Naming convention scales to 720 transcripts/year
- [ ] Compounding loop has defined triggers at each step with quality gate
- [ ] Retrieval path is defined: agent knows where to look for any type of knowledge
- [ ] Cross-reference convention exists between documents and transcripts
- [ ] Conflict resolution rule: what happens when a transcript contradicts a document
- [ ] Future AI self-learning is concrete enough to build from, speculative enough to not over-commit
- [ ] Bootstrap actions are listed (what to do immediately to get the system running)

## Assumptions registry
| Assumption | Confidence | Signal that proves it wrong |
|---|---|---|
| general.md can stay useful as a single living file | 🟡 hypothesis | It exceeds 500 lines and AI agents can't usefully consume it |
| AI can meaningfully extract insights from raw transcripts | 🔴 guess | Extracted insights are wrong or trivially obvious |
| Founders will review AI-proposed updates to general.md | 🟡 hypothesis | Review becomes a bottleneck at 2 transcripts/day |
| 720 transcripts/year is navigable with naming conventions alone | 🔴 guess | Finding a specific insight requires reading 50+ transcripts |
| The knowledge base adds value before the AI loop is built | 🟢 validated | Manual reference to docs during podcast prep is already useful |
| Raw transcripts are useful without cleanup | 🟡 hypothesis | Whisper output is too error-prone to be useful as reference |

## Adversarial review summary
Adversarial review (Claude subagent) flagged 5 missing components, 2 overlaps, and 6 blind spots. Key resolutions:
- **Retrieval + search section added** (HIGH — system defines input but not output)
- **Summarization + decay section added** (HIGH — general.md will grow without bounds)
- **Architecture + Integration merged** from 2 sections into 1 (were the same topic split across sections 1 and 6)
- **Compounding Loop + AI Automation merged** (were the "what" and "how" of the same thing)
- **Bootstrap Plan removed as a section** — operational, not structural. Will be addressed in input.md and as a subsection of architecture.
- **Naming convention elevated** from implicit to explicit in Section 3
- **Conflict resolution rule added** to quality checklist
- **Scale math flagged**: 720 transcripts/year, 3600-7200 pages of text. general.md must stay small or spawn child summaries.

## Reader journey
**After this document:** Doc #8 (Short-Video Viral Strategy) uses the folder structure and transcript taxonomy defined here. The compounding loop informs how podcast content feeds back into all strategy documents.
**Last section should bridge to:** "The knowledge base exists. Now automate the content pipeline that feeds it (doc #8)."

## Decision log
| Date | Decision | Why | Watch signal |
|---|---|---|---|
| 2026-04-06 | 6 sections (reduced from 7, after merging overlaps and removing bootstrap as a section) | Adversarial review: architecture+integration were split, loop+automation were split, bootstrap doesn't belong | If 6 is too few, re-add bootstrap as section 7 |
| 2026-04-06 | general.md is the single living file, not multiple summary files | Simplicity. One file to read for full context. Split later if it outgrows its usefulness. | If general.md exceeds 500 lines, consider spawning domain-specific summaries |
| 2026-04-06 | Retrieval section added | Without it, the KB is write-only: knowledge goes in but nobody can find it | If search is "just grep" in practice, simplify this section |
| 2026-04-06 | Summarization/decay section added | general.md must not grow without bounds | If the pruning protocol is too rigid, relax it |
