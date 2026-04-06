---
name: d-meta
description: "Use this skill whenever the user needs to create a meta-document — a blueprint that defines what a strategy document should look like BEFORE writing the actual document. Triggers: 'd-meta', 'meta-doc', 'document template', 'document blueprint', 'how should this document look?', 'what sections does this doc need?', or when the user is about to write ANY strategy document without a template. This is always Step 1 in the document pipeline: d-meta → d-plan → d-tasks. If the user jumps to writing without a meta-doc, suggest running d-meta first. Also trigger when the user mentions 'decisions folder', 'document workflow', or references any document type from the operating plan (business model, manifesto, methodology, course outline, landing page, VSL, social media strategy, content strategy, PRD, launch strategy, pitch deck, etc.)."
---

# d-meta — Meta-Document Creator

## What this does

Creates a blueprint for a strategy document BEFORE anyone writes it. The meta-doc defines sections, completion criteria, and quality gates. It's the architectural plan before the house gets built.

This is Step 1 of a three-step pipeline:
1. **d-meta** — design the document (you are here)
2. **d-plan** — write the document with full context
3. **d-tasks** — extract implementable tasks from the document

## Step 0: Load workspace context

Before doing anything else, orient yourself in the project.

```
1. Read this entire SKILL.md
2. List all files in /decisions/ (or wherever the project docs live)
3. Read any files that seem relevant to the document you're about to design
```

This matters because most documents depend on previous documents. A landing page doc needs the manifesto. A PRD needs the JTBD. A course outline needs the methodology. By reading what already exists, you avoid designing in a vacuum and you can reference prior decisions instead of re-asking questions the user already answered.

If the /decisions/ folder doesn't exist, ask the user where their documents live. If nowhere yet, note that this is the first document and proceed.

## Step 1: Name and scope

Ask the user or infer from context:

- **Document name** — what is this called?
- **One-sentence purpose** — why does this document exist? What decision or action does it unblock?
- **Primary reader** — who executes from this document? (implementer? investor? customer?)
- **What this document is NOT** — what's explicitly out of scope? Name 2-3 things people might expect to find here that belong in a different document. This prevents scope creep during writing.

**Input inventory** — based on the workspace scan from Step 0, list:
- Documents that already exist and inform this one (reference them by name)
- Information that's needed but doesn't exist yet (flag as gaps)
- Decisions from prior documents that constrain this one

If critical inputs are missing, tell the user: "Before we can design this document properly, you need [X]. Want to create that first, or proceed with assumptions?"

## Step 2: Expert council

Before researching anything, identify the 3-5 people or frameworks that represent different schools of thought on this document type. Name them specifically.

Example for a business model doc: Osterwalder (Business Model Canvas), Ash Maurya (Lean Canvas), YC's model (one-liner + traction focus), Rumelt (Good Strategy Bad Strategy).

Example for a VSL: Gary Halbert (direct response), Eugene Schwartz (Breakthrough Advertising), Alex Hormozi ($100M Offers), Russell Brunson (DotCom Secrets).

Example for a PRD: Marty Cagan (Inspired), Teresa Torres (Continuous Discovery), Shape Up (Basecamp).

This list becomes the research agenda — you're not Googling randomly, you're consulting specific intellectual traditions.

## Step 3: Generic research — build context

Search for broad context on this document type using the expert council as guides. Focus on three knowledge layers (borrowed from gstack's ETHOS):

- **Layer 1 — Tried and true:** What are the established, battle-tested frameworks? What has worked for thousands of companies?
- **Layer 2 — Trending and new:** What's changed recently? Are there new approaches that leverage AI, new market conditions, or new tools?
- **Layer 3 — First principles:** What would you design if no frameworks existed? What does this document actually need to accomplish at the most fundamental level?

Synthesize into a brief "what we learned" summary (3-5 paragraphs max).

## Step 4: First question round — ask the user

Based on the workspace context and generic research, ask the user 3-7 questions about the MOST IMPORTANT decisions that will shape this document's structure. These should be questions where:

- The answer significantly changes what sections the document needs
- You genuinely can't infer the answer from existing documents
- Getting it wrong would waste significant time downstream

Do NOT ask questions you can answer from workspace context. Do NOT ask obvious questions. Ask the questions that matter.

Wait for answers before proceeding.

## Step 5: Specific research — go deep

Now that you have the user's answers, do targeted research on the specific version of this document that fits their situation. This is where you look at world-class examples that match their context — not generic templates, but specific implementations for their market, price point, audience, and stage.

Search for:
- Best-in-class examples in their specific niche
- Anti-patterns and failure modes for this document type
- **Adjacent wisdom** — what 2-3 fields OUTSIDE the obvious domain have solved similar structural problems? (Game design for course outlines. Movie marketing for launch strategies. Behavioral economics for pricing docs. Auction theory for marketplace strategies.)

## Step 6: Second question round — resolve remaining ambiguity

Based on the specific research, ask 2-5 more questions. These should be sharper and more specific than the first round — they're about resolving the remaining tensions or tradeoffs you discovered during deep research.

Wait for answers before proceeding.

## Step 7: Design the sections

For each section in the meta-doc, specify:

- **Section name** — clear, descriptive
- **What it answers** — the specific question(s) this section resolves
- **Done when** — concrete, testable criteria. Format: "Done when [specific condition a stranger could verify]."
- **Failure modes** — what people get wrong in this section (2-3 bullets)
- **Max length** — size guideline to prevent bloat
- **Confidence tag** — validated (we have data or prior docs), hypothesis (we believe but haven't tested), guess (we're making this up and need to validate)

Also include document-level metadata:

- **Failure modes for the entire document** — the top 5 ways this document type fails as a whole (different from per-section mistakes). Example: "Too abstract — no specific numbers anywhere." "Built for investors instead of operators." "Assumes a customer segment without validating it."
- **Reader journey** — what does the reader do AFTER this document? What's the next action or next document? The last section should bridge explicitly to that next step.
- **Assumptions registry template** — things we think we know but might be wrong about. Each assumption gets: the claim, confidence level (certain / hypothesis / guess), and what signal would prove it wrong.

## Step 8: Quality checklist

5-10 binary (yes/no) criteria that determine whether the final document is done. These must be testable by someone who didn't write the document.

Good: "A stranger can read the one-liner and understand what we sell without a follow-up question."
Bad: "The document is complete."

## Step 9: Adversarial review

After designing the meta-doc, run an adversarial review. The goal is to stress-test the template before anyone spends time filling it out.

**How to do this on Claude.ai:**

Use the Anthropic API to get an independent second opinion. Make a call with this prompt:

```
You are an adversarial reviewer. Your job is to find weaknesses, gaps, missing perspectives, and structural problems in this meta-document template. Think like a skeptical consultant who's seen hundreds of strategy documents fail.

Here is the meta-document template:
[INSERT THE FULL META-DOC]

Review it across these dimensions:
1. COMPLETENESS — what critical sections are missing?
2. REDUNDANCY — what overlaps or repeats?
3. PRACTICALITY — can a real person actually fill this out in a reasonable time?
4. ASSUMPTIONS — what does this template assume that might not be true?
5. FAILURE MODES — what kind of bad document could still pass the quality checklist?

Be specific. No compliments. Just the problems.
```

After receiving the adversarial review, present the findings to the user as:

```
ADVERSARIAL REVIEW FINDINGS:
[List each finding]

CROSS-TENSION POINTS:
[Where the adversarial review disagrees with the original design]
[Present both perspectives neutrally]

USER DECISION NEEDED:
[For each tension, ask the user which direction to go]
```

**User sovereignty rule:** Never auto-incorporate adversarial findings. Present each tension to the user. The user decides. Agreement between the original design and the adversarial review is a strong signal — but it is NOT permission to act without the user.

## Step 10: Finalize and hand off

After resolving all adversarial tensions with the user:

1. Write the final meta-doc
2. Save it to the /decisions/ workspace
3. Present the document to the user
4. Suggest the next step:

```
Meta-doc complete. Ready for the next step?
-> Run d-plan to write the actual [document name] using this template.
```

## Output format

```markdown
# META-DOC: [DOCUMENT NAME]

## Purpose
[One sentence: why this document exists and what it unblocks]

## Scope
**This document IS:** [what's included]
**This document is NOT:** [what's excluded — name specific things]

## Primary reader
[Who uses this and how]

## Input documents
[List of prior documents this depends on, with key decisions referenced]

## Expert council
[3-5 named experts/frameworks consulted and what each contributed]

## Research summary
[Synthesis across Layer 1 (established), Layer 2 (trending), Layer 3 (first principles)]
[Include adjacent wisdom from non-obvious fields]

## Document-level failure modes
1. [How this entire doc type typically fails]
2. ...
3. ...

## Sections

### SECTION 1: [Name]
**Answers:** [What question(s) this resolves]
**Done when:** [Testable completion criteria]
**Failure modes:** [What people get wrong — 2-3 bullets]
**Max length:** [Size guideline]
**Confidence:** [validated/hypothesis/guess]

### SECTION 2: [Name]
...

## Quality checklist
- [ ] [Criterion 1]
- [ ] [Criterion 2]
...

## Assumptions registry
| Assumption | Confidence | Signal that proves it wrong |
|---|---|---|
| [What we think we know] | [certain/hypothesis/guess] | [What would change our mind] |

## Adversarial review summary
[Key findings from the adversarial review and how they were resolved]

## Reader journey
**After this document:** [Next action or document]
**Last section should bridge to:** [Specific next step]

## Decision log
[Date] — [Decision] — [Why] — [What we watch to know if this was right]
```

## Principles

**Workspace-first.** Always check what already exists before asking the user questions they've already answered in another document.

**Expert council before Google.** Know whose thinking you're drawing from. Random search results produce generic templates. Named experts produce informed ones.

**Two question rounds, not zero or ten.** Ask before research (to scope), ask after research (to resolve). Don't front-load all questions. Don't skip questions and guess.

**Adversarial review is mandatory.** Every meta-doc gets stress-tested before anyone writes from it. A bad template wastes more time than a bad first draft.

**User sovereignty always.** Present findings and tensions. Never auto-incorporate. The human decides.

**The /decisions/ folder is the source of truth.** Every document lives there. Every skill reads from there. This is the shared context that makes the whole pipeline coherent.

**Confidence tags are honest.** Don't mark guesses as hypotheses. Don't mark hypotheses as validated. The confidence layer tells the implementer where to be careful.

**Full size documents.** AI writes and reads the docs. No minimum viable shortcuts. Go comprehensive — the constraint is quality, not length.

**Always suggest the next skill.** d-meta ends by suggesting d-plan. d-plan ends by suggesting d-tasks. The pipeline flows forward.
