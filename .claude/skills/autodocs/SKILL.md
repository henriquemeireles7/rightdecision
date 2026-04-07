---
name: autodocs
description: "End-to-end document pipeline: Meta → Input → Docs → Write. Triggers: 'autodocs', 'full document pipeline', 'write the whole document'."
---

# autodocs — End-to-End Document Pipeline

## What this does
Chains the full document workflow. Takes a document name, creates the template,
captures founder thinking, writes the document, then writes deliverables to content/.

## Pipeline
```
d-meta → d-input → d-docs → d-write
```

## Usage
```
/autodocs "VSL script"
/autodocs "social media strategy"
/autodocs "course module 3 content"
/autodocs "Business Decisions methodology"
```

## How it works

### Phase 1: Meta (template design)
Invoke `/d-meta` with the document name.
Creates the document template: what sections, what questions to answer, what the output looks like.
Output: `decisions/<folder>/meta.md`

### Phase 2: Input (founder brain dump)
Invoke `/d-input` to capture founder thinking.
Asks 3-4 specific questions per section (with answer options, not open-ended).
**STOPS HERE** — waits for founder answers.
Output: `decisions/<folder>/input.md` + `raw.md`

### Phase 3: Docs (document writing)
Invoke `/d-plan` (d-docs) to write the actual document.
Combines meta template + founder input into a complete strategy document.
Output: `decisions/<folder>/document.md`

### Phase 4: Write (content delivery — optional)
Invoke `/d-write` IF the document produces deliverables for the content/ folder.
Examples: course content → `content/course/en/`, blog posts → `content/blog/en/`
Handles: frontmatter generation, locale placement, voice.md compliance.

**Skip Phase 4** if the document is strategy-only (JTBD, business model, methodology)
with no content/ deliverables.

## Rules
- Each phase must complete before the next begins
- Phase 2 (Input) is always interactive — founder answers questions
- Phase 4 (Write) is optional — only for documents that produce content/ deliverables
- All documents live in decisions/ — content/ only gets the deliverables
- Read decisions/voice.md before Phase 4 (content must match brand voice)
