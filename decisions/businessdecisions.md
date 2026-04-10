# Business Decisions — Product Reference

> Last verified: 2026-04-06
> Deep dive: decisions/product/00-legacy/businessdecisions/ (product-specific docs)
> Automation pipeline: decisions/ops/00-legacy/08-short-video-viral-strategy/document.md

## What it is
Business Decisions is The Right Decision's B2B product ($1,997/year). A course + AI skills + automation APIs that teach non-tech creators how to build and run an AI-native infobusiness — plus the platform to do it.

## One-liner
A high-ticket platform that teaches you to build a profitable AI-native infobusiness using our exact methodology, tools, and automation — vibe coding for non-tech creators.

## ICP

### Persona 3 — "The Drowning Builder"
Non-tech entrepreneur, 28-45. Has an idea or early-stage business. Drowns in planning instead of executing. Wants to build something but doesn't know how to systematize. Needs the methodology AND the platform.

## Product Architecture
- **Course:** Business-specific methodology (same decision cycle, applied to business building)
- **Skills:** One Claude skill per business exercise (business model, manifesto, methodology, course design, distribution, etc.)
- **APIs:** Automation endpoints for content pipeline, social media posting, analytics
- **Delivery:** Skills run in Claude Code or Claude Code. APIs handle the automation.
- **Bonus course:** "Vibe Coding for Non-Tech Creators/Founders" (Claude Code course)
- **Free course funnel:** Simplified business methodology as lead generation

## What the Client Gets
Users only touch `decisions/` and `content/` folders. Everything else is abstracted:
- Course + distribution platform (hosted, ready to use)
- Content automation pipeline (podcast → clips → multi-platform posting)
- Their own decisions/ folder structure (modeled after ours)
- Our strategy documents as example/template content

## Agent-First Design
This product is NOT a traditional SaaS:
- APIs + Claude skills compose the platform
- Users interact via Claude Code (non-tech) or Claude Code (tech)
- We don't compete with Claude — we provide methodology + skills + APIs that work WITH Claude
- No web dashboard required for core workflow

## The Flywheel
We teach Business Decisions clients to build the SAME funnel we use:
```
Their free course (lead gen) → Their full course → Their audience pays
```
Our platform powers their distribution. Our methodology structures their business.

## Current Status
- Content pipeline designed (doc 08)
- APIs not yet built
- Henry and Indy are first B2B customers (dogfooding)
- Build in parallel with Life Decisions platform

## Open Questions
1. **Storage:** Video files are large. Cloud storage (S3/R2)? Local DB (DuckDB)? How does Claude access it?
2. **Multi-tenancy:** How does a non-tech customer run the platform? Hosted by us? Their own deployment?
3. **Skill distribution:** How do users install our Claude skills? npm? Git? MCP server?
4. **Cost to serve:** At $1,997/year, what's infrastructure cost per customer?

## What This Product is NOT
- Not a no-code website builder (we handle the platform)
- Not a marketing agency (we teach the methodology, not do-it-for-you)
- Not just a course — includes live automation APIs and tools
- Not for tech people who want to code from scratch (they can, but it's designed for non-tech)
