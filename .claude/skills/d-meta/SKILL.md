---
name: d-meta
description: "Design a document template BEFORE writing it. Triggers: 'd-meta', 'meta-doc', 'document template'. Step 1: d-meta → d-input → d-plan → d-tasks."
---

# d-meta — Document Structure Designer

## What this does
Designs the STRUCTURE of a strategy document. What sections? What does each answer? When is it done?

Pipeline: **d-meta** (structure) → **d-input** (founder brain dump) → **d-plan** (merge structure + content) → **d-tasks** (extract actions)

## Steps

1. Read `decisions/` folder for context
2. Ask user what document to design (one question at a time, with options + recommended tag)
3. Research world-class examples of this document type
4. Design sections: name, what it answers, done when, failure modes, confidence tag
5. Adversarial review via Agent subagent
6. Save to `decisions/{nn}-{slug}/meta.md` using Write tool

## Rules
- ONE question per AskUserQuestion. Always include (recommended) on best option.
- Meta defines STRUCTURE only. Content comes from d-input.
- After saving, suggest: "Run /d-input to capture your thinking for this document"
- After saving, auto-commit and push all changed files. These are non-code docs — they can't break anything.
