---
name: d-plan
description: "Write a strategy document by combining meta (structure) + input (founder thinking). Triggers: 'd-plan', 'write the document'. Step 3: d-meta → d-input → d-plan → d-tasks."
---

# d-plan — Document Writer

## What this does
Combines the meta-doc (structure) with the input doc (founder's raw thinking) to produce the final document. The meta says WHAT sections to write. The input says WHAT TO PUT IN THEM.

Pipeline: d-meta (structure) → d-input (founder brain) → **d-plan** (merge both) → d-tasks (extract actions)

## Steps

1. Read `decisions/{nn}-{slug}/meta.md` (the structure)
2. Read `decisions/{nn}-{slug}/input.md` (the founder's thinking — PRIMARY source)
3. Read other relevant documents in `decisions/`
4. Research to VALIDATE input (not to replace it). Input is primary. Research is secondary.
5. Ask 2-5 refinement questions (one at a time, with options + recommended)
6. Write each section following meta structure, using input as content source
7. Fill assumptions registry, decision log
8. Quality checklist verification
9. Save to `decisions/{nn}-{slug}/document.md`

## Critical rule: Input > Research
The founder's raw thinking in input.md is the PRIMARY source material. Research validates, challenges, and adds depth to the founder's ideas. It does NOT replace them. If the input says "the decision is the primitive" — that IS the thesis. Research confirms or challenges it, but the founder's voice is the document's voice.

## Override rule
When input.md contains information that contradicts earlier documents (previous meta.md, older documents in decisions/), the INPUT wins. After writing the document, list which earlier files may need updating and warn the user.

## Rules
- ONE question per AskUserQuestion. Always include (recommended) on best option.
- If no input.md exists, tell user: "Run /d-input first to capture your thinking"
- The document must pass every "done when" criterion from the meta
- Write for the implementer: if they'd need to ask "what did you mean?", it's not specific enough
- After saving, list any earlier documents that may need updating based on new decisions
- Suggest: "Run /d-tasks to extract implementable tasks" (only if the document contains buildable work)
- After saving, auto-commit and push all changed files. These are non-code docs — they can't break anything.
