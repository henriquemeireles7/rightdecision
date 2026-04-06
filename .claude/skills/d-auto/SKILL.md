---
name: d-auto
description: "Full document pipeline in one command. Chains d-meta → d-input → d-plan. Triggers: 'd-auto', 'full document', 'write everything'. Pass the document name as argument."
---

# d-auto — Full Document Pipeline

## What this does
Runs the complete document pipeline in one command: designs the structure, captures the founder's thinking, then writes the document. Three skills chained.

Pipeline: **d-meta** (structure) → **d-input** (founder brain) → **d-plan** (merge + write)

## How to run
`/d-auto [document name]`
Example: `/d-auto methodology` or `/d-auto course outline`

## Steps

### Phase 1: Structure (d-meta)
1. Read `decisions/` folder for context
2. Research world-class examples of this document type
3. Design sections with done-when criteria and failure modes
4. Run adversarial review via Agent subagent
5. Save to `decisions/{nn}-{slug}/meta.md`

### Phase 2: Input (d-input)
1. Read the meta-doc just created
2. Read ALL existing documents in `decisions/` — pull everything possible
3. Check if input already exists (pasted files, prior conversations)
4. Ask 5-10 deep content questions ONE AT A TIME
5. Save raw answers to `decisions/{nn}-{slug}/raw.md`
6. Save structured input to `decisions/{nn}-{slug}/input.md`

### Phase 3: Write (d-plan)
1. Read meta (structure) + input (content) — input is PRIMARY source
2. Research to validate input, not replace it
3. Ask 2-5 refinement questions if needed
4. Write each section following meta structure using input as content
5. Quality checklist verification
6. Save to `decisions/{nn}-{slug}/document.md`
7. List any earlier documents that need updating

## Rules
- ONE question per AskUserQuestion. Always include (recommended) on best option.
- If a meta.md already exists for this document, skip Phase 1 and start at Phase 2.
- If an input.md already exists, skip Phase 2 and start at Phase 3.
- If both exist, go straight to Phase 3.
- Between phases, announce: "Phase 1 complete. Starting Phase 2: capturing your thinking."
- Founder's exact words are sacred. Never clean up, rephrase, or make them sound smarter.
- After completion, suggest `/d-tasks` if the document contains implementable work.
