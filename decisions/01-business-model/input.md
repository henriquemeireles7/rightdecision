# INPUT: Business Model v3
Captured: 2026-04-06
For meta-doc: decisions/01-business-model/meta.md

## From existing documents

### Business Model v2 (decisions/01-business-model/legacy/document.md)
- One product: The Right Decision, $197/year
- ICP: Woman 30-50, stuck at a higher level
- Course: 9 modules, 3 acts, ~23 hours, 3 months
- AI Decision Engine for personalized decision decomposition
- Distribution: Indy's content → landing page → Stripe → Better Auth → Course + AI
- Revenue: 508 customers = $100K. 50 sales/month = $9,850/month
- Annual only billing (commitment IS the thesis)
- 7-day money-back guarantee

### Manifesto (decisions/02-manifesto/document.md)
- Core thesis: the decision is the primitive
- Enemy: the dependency industry (self-help that profits from understanding without action)
- Anti-self-help positioning
- Seven angles on decisions (content pillars)
- Eight sins of indecision

### Course Outline (decisions/04-course-outline/document.md)
- 3 acts: See Clearly, Decide, Move
- 9 modules, 37 classes, ~23 hours
- Manual-first, AI-second exercise design
- Docx questionnaire + AI prompt per module
- Throughline decision chosen in onboarding

### Viral Strategy (decisions/08-short-video-viral-strategy/document.md)
- Folder-based automation pipeline (Bun/TypeScript, no workflow tools)
- Podcast → OpusClip → clips → auto-post to 13 accounts
- AI content generation: ElevenLabs voice clone + HeyGen talking head
- $500/month tool budget
- Custom pipeline code, not n8n/Make.com

## From founder

### One-Liner (expanded)
The Right Decision is two products under one brand. Life Decisions ($197/year) teaches you the methodology to make the one decision that matters and execute it daily — delivered as a course with AI-powered Claude skills that guide each exercise. Business Decisions ($1,997/year) teaches non-tech creators how to build and run an AI-native infobusiness using the same methodology — plus automation APIs that handle distribution, content pipeline, and growth without writing code.

### Three Personas

**Persona 1 — "The Stuck Achiever" (Life Decisions)**
Woman, 30-50. Has done the work: therapy, courses, books, meditation. Objectively ahead of her peers. Stuck at a higher level where problems are harder to name. Disguises indecision as research. Spends on understanding, not action.
*"You already know what to do. You just haven't decided."*

**Persona 2 — "The Overthinker" (Life Decisions)**
Man, 25-40. Overthinks career and business moves. Consumes business content obsessively but never starts. Has ideas, plans, frameworks — but no decisions. Analysis paralysis disguised as preparation.
*"You don't have an information problem. You have a decision problem."*

**Persona 3 — "The Drowning Builder" (Business Decisions)**
Non-tech entrepreneur, 28-45. Has an idea or early-stage business but drowns in planning instead of executing. Wants to build something but doesn't know how to systematize. Needs the methodology AND the platform to run it.
*"Stop preparing. Start deciding. We give you the tools to execute."*

### Two Products, One Methodology

The core methodology (decision cycle: state map → target → constraint → decide → decompose → execute → review → resolve) is the same for both products. The APPLICATION differs:

- **Life Decisions:** Apply the methodology to personal life decisions. Course teaches the framework. Skills guide each exercise. Output: a personal decision archive on the user's computer.
- **Business Decisions:** Apply the methodology to building a business. Course teaches the framework PLUS "vibe coding for non-tech founders." Skills guide each exercise AND automation APIs handle distribution, posting, content pipeline. Output: a running business with automated distribution.

### Skills ARE the Product

Each methodology step has its own Claude skill (modeled after gstack skills). The user installs our skills in Claude Code or Claude Cowork.

The skill flow per exercise:
1. Skill asks deep questions (like d-input)
2. User answers in their own words
3. Skill saves raw answers to `raw.md`
4. Skill generates structured output to `document.md`
5. Output lives in user's personal folder

This is the SAME meta → input → document pattern we use in our own decisions/ folder.

Life Decisions: skills only (no API needed)
Business Decisions: skills + APIs (for automation)

### Course Structure

**Main course (both products):** Pure methodology. 3 acts, 9 modules. Manual exercises first, then AI skills for refinement.

**Intro lesson (both products):** One class in the introduction teaching AI setup — installing Claude Cowork, installing our skills, explaining how the AI-guided exercises work. Not technical. Shows the flow: "you'll answer questions, the AI saves your work, here's what the output looks like."

**Bonus courses (standalone, not part of main 3-act structure):**
- Life Decisions: "Claude Cowork for Personal Decisions"
- Business Decisions: "Vibe Coding for Non-Tech Creators/Founders" (Claude Code course)

### Free Course Funnel

Both products have a simplified free course as lead generation:
- Fewer steps, but the methodology works by itself
- User joins the platform (email capture)
- Sees the full product and can upgrade
- Social media focuses entirely on driving to the free course
- "We teach Business Decisions clients to do exactly what we do — that is the whole flywheel"

### The Flywheel

```
Free course (lead gen on social media)
  → User joins platform (email capture)
    → Sees full product + AI skills
      → Upgrades to Life Decisions ($197/yr) or Business Decisions ($1,997/yr)
        → Business Decisions clients build the SAME funnel for their audience
          → They use our platform to run their business
            → Our methodology + tools proven again
```

### Agent-First Architecture (Business Decisions)

The Business Decisions platform is NOT a traditional SaaS dashboard:
- APIs + Claude skills compose the platform
- Users interact via Claude Cowork (non-tech) or Claude Code (tech)
- No competing with Claude — we provide the methodology + skills + APIs that work WITH Claude
- The automation pipeline (podcast → clips → multi-platform posting) runs through our APIs
- Users only touch `decisions/` and `content/` folders — everything else is abstracted

### Docs as Product

The `decisions/` folder IS the company. Sharing strategy documents with B2B customers is intentional:
- Proof the system works
- Example content for the business course
- Zero extra work (docs already exist)
- Radical transparency builds trust

Henry and Indy will also do the Life Decisions exercises themselves as example content for the B2C product (later, not now).

### Content and Marketing Angle

Main message: "Life transformation through action, not introspection"
AI angle: "The main cause behind not making decisions is complexity — AI helps you have clarity"
Business angle: "Business decisions to make money running an AI-native infobusiness"

Free PDF with prompts → free course → full product. Each social media post drives to the free course funnel.

### Pricing

- Life Decisions: $197/year (annual only — commitment IS the thesis)
- Business Decisions: $1,997/year (10x because user also pays for Claude, high-ticket product)
- One LLC, one brand (The Right Decision), two tiers

### Cross-Sell

Both products use the same course platform. Users can see both tiers. Natural cross-sell:
- Life → Business: "Now that you've made your life decision, build something from it"
- Business → Life: "The founder's personal decisions matter too"

## Gaps

1. **[OPEN] Storage for video files:** Local filesystem won't scale for high-quality video. Options: cloud storage (S3/R2), Google Drive, VPS, DuckDB. How does Claude Code access remote storage? Needs research.

2. **[OPEN] Non-tech user deployment:** How does a Business Decisions customer actually run the automation platform? Multi-tenant SaaS on our servers? Managed instance? Their own deployment? This is the hardest unsolved problem.

3. **[OPEN] Free course funnel design:** How many steps in the simplified methodology? What's the "aha" moment that triggers upgrade? What's free vs. paid? Needs its own d-meta → d-input → d-plan cycle.

4. **[OPEN] Skill distribution:** How do users install our Claude skills? npm package? Git repo? MCP server? What's the UX for a non-tech person installing a Claude skill?

5. **[OPEN] Business Decisions course content:** The "vibe coding for non-tech creators" bonus course needs its own outline. What do they learn? How much Claude Code do they need to know?

6. **[OPEN] Revenue model for Business Decisions:** At $1,997/year, what's the cost to serve? Do we host infrastructure per customer? What's the margin?

7. **[OPEN] Methodology for exercises → skills mapping:** Which methodology steps become which skills? What's the exact skill API? This depends on the Life Decisions methodology doc being finalized first.
