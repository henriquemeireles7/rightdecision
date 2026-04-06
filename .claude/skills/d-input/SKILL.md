---
name: d-input
description: "Extract the founder's raw thinking for a strategy document. Triggers: 'd-input', 'brain dump', 'capture my thinking'. Step 2: d-meta → d-input → d-plan → d-tasks."
---

# d-input — Founder Brain Dump

## What this does
Extracts what's already in the founder's head. Not research. Not frameworks. The raw beliefs, stories, experiences, and domain expertise that make this THEIR document, not a generic AI document.

Pipeline: d-meta (structure) → **d-input** (you are here) → d-plan (merge both) → d-tasks (extract actions)

## Steps

1. Read the meta-doc at `decisions/{nn}-{slug}/meta.md` to know what sections need content
2. Read ALL existing documents in `decisions/` for context already captured
3. Check if an input.md already exists (from pasted files, prior conversations)
4. Ask 5-10 deep questions ONE AT A TIME about the founder's actual thinking
5. Save everything to `decisions/{nn}-{slug}/input.md`

## Question design rules

Questions must be about CONTENT, not structure or preferences:
- "Tell me about a specific moment when..." (stories)
- "What do you actually say when..." (real words)
- "What makes you angry about..." (raw emotion)
- "What's the thing nobody else is saying about..." (unique insight)
- "Describe this person as if you're talking to a friend..." (natural language)

NEVER ask:
- "What format do you want?" (that's d-meta's job)
- "Should we include X section?" (that's d-meta's job)
- "What's your target audience?" (pull from existing docs)

## Rules
- ONE question per AskUserQuestion. Always include (recommended) on the best option.
- Pull everything possible from existing documents FIRST. Never re-ask what's already answered.
- If a pasted file or prior input already covers a question, SKIP IT and note what you're using.
- Founder's exact words matter. Don't clean up, don't rephrase, don't make it sound smart. Capture raw.
- Input.md is the PRIMARY source for d-plan. This file IS the document's soul.
- After saving, suggest: "Run /d-plan to write the [document name] using this input"

## Input.md format

```markdown
# INPUT: [Document Name]
Captured: [date]
For meta-doc: decisions/{nn}-{slug}/meta.md

## From existing documents
[Key decisions and content pulled from prior docs — cite which doc]

## From founder
### [Topic/Question 1]
[Raw founder response — their exact words]

### [Topic/Question 2]
[Raw founder response]

...

## Gaps
[Things the meta-doc needs that the founder couldn't answer yet]
```
