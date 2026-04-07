---
name: d-write
description: "Write content deliverables from strategy documents into content/ folder. Triggers: 'd-write', 'write content', 'create course content', 'write the content files'."
---

# d-write — Write Content Deliverables

## What this does
Takes a finished strategy document from decisions/ and writes deliverables into content/.
Handles frontmatter generation, locale placement, and voice.md compliance.
This is NOT coding — it's content creation.

## Pipeline
d-meta → d-input → d-docs → **d-write**

## When to use
- After d-docs completes a document that has content/ deliverables
- Course content (classes, modules) → `content/course/en/`
- Blog posts → `content/blog/en/` (future)
- Marketing copy → `content/marketing/en/` (future)

## Before Starting
1. Read the source document from decisions/
2. Read `decisions/voice.md` — CRITICAL for all user-facing content
3. Read `decisions/design.md` — understand the aesthetic
4. Check existing content structure: `find content -type d | sort`

## Process

### Step 1: Identify Deliverables
Read the source document and list what needs to be written:
- Course classes (theory + practical per module)
- Blog posts
- Email templates
- Landing page copy
- Marketing materials

### Step 2: Generate Frontmatter
Each content file needs correct frontmatter per `decisions/coding.md` Content Layer:
```yaml
---
title: "Human-readable title"
slug: "url-slug"
type: "course"
status: "draft"
module: 1
lesson: 1
duration_minutes: 30
locale: "en"
video_url: ""            # filled when video is recorded
order: 1
class_type: "theory"     # or "practical"
skill: ""                # only for practical classes
time_nudge: ""           # only for last class in module
---
```

### Step 3: Write Content
For each deliverable:
- Write in the voice defined by `decisions/voice.md`
- Use the Indy Test: would a real human write this way?
- Include: key takeaways, summary, engagement hooks
- Practical classes: instruction card (what skill does, what it asks, what you get back)

### Step 4: Place in Locale Folder
All content goes to `content/<type>/en/` (English is source of truth).
Future: `pt-BR/` mirrors `en/` exactly — same filenames, culturally adapted.

### Step 5: Voice Check
Before finishing, reread all content against voice.md:
- No AI-sounding language
- Questions that stop
- Pattern interrupts
- Specificity over generality
- The 12 writing rules

## Rules
- NEVER write code in this skill — content only
- ALWAYS read voice.md before writing any user-facing content
- ALWAYS use the frontmatter schema from coding.md
- ALWAYS place content in the `en/` locale folder
- Status is always "draft" — human reviews before "published"
- Content is MDX format (.mdx extension)
- Practical classes must reference the specific AI skill by name
