# INPUT: Website & SEO/GEO Strategy

## 1. Website Architecture Decision
**Model:** Subdirectory — all content lives under rightdecisions.io for maximum SEO authority consolidation.

| Path | Purpose |
|------|---------|
| `/` | Company manifesto homepage |
| `/life` | Life Decisions landing page (current LP moves here) |
| `/about` | Founders, story, E-E-A-T authority |
| `/blog` | Blog index |
| `/blog/[slug]` | Individual articles |
| `/concepts/[slug]` | SEO-keyword-targeted concept pages (GEO citation targets) |
| `/tools/[slug]` | Interactive tools (V2) |
| `/privacy` | Privacy policy |
| `/terms` | Terms of service |

Blog, concepts, and tools all live on the main domain. No subdomains. One Hono app serves everything.

## 2. Homepage Vision
Manifesto-first. The homepage sells the COMPANY and the IDEA, not the product.

Structure:
1. **Hero:** Core thesis — "The decision is the primitive" / "We're solving decision-making with AI"
2. **What we do:** Two product cards — Life Decisions (active, links to /life) and Business Decisions (coming soon, grayed out)
3. **About us teaser:** Brief founder story with link to /about
4. **Blog highlights:** Latest 3 articles
5. **Footer:** Legal links (/privacy, /terms), social links

Reference: Basecamp's homepage aesthetic — opinionated, manifesto-driven, clear about what you're getting.

## 3. Content Strategy
Three content clusters, published simultaneously from day one (1 article per cluster per week = 3 articles/week):

**Cluster 1: "Feeling Stuck"**
- ICP-aligned, moderate competition
- Keywords: "feeling stuck in life", "stuck in a rut", "what to do when you feel stuck", "feeling stuck at 35/40"

**Cluster 2: "Anti-Self-Help"**
- Brand differentiator, very low competition
- Keywords: "why self-help doesn't work", "self-help addiction", "toxic positivity", "personal development burnout"

**Cluster 3: "Decision Making"**
- Higher volume, medium competition
- Keywords: "how to make big life decisions", "analysis paralysis", "decision fatigue", "how to stop overthinking"

## 4. Concept Pages (SEO-First Naming)
**Critical rule:** Concept page URLs, H1s, and meta titles target SEARCH KEYWORDS, not internal terminology. The proprietary Right Decision name gets introduced inside the content as "what we call this."

Example mapping:
| Search keyword (URL/H1) | Internal concept | Page purpose |
|--------------------------|-----------------|--------------|
| analysis-paralysis | Sin #3 (disguising indecision as research) | Define the problem, introduce our framework as the solution |
| decision-fatigue | General concept | Define, connect to our methodology |
| feeling-stuck-in-life | The Dependency Industry | Why people stay stuck, our positioning |
| how-to-make-big-decisions | The Decision Cycle | Our methodology as the answer |
| overthinking | Sin #8 (not deciding) | Diagnostic content |
| what-is-a-dominant-constraint | Dominant Constraint | This one CAN use our term — it's specific enough to own |

Each concept page has: clear definition in first paragraph (GEO-citable), FAQ schema, internal links to related blog posts and other concepts, structured data.

## 5. Interactive Tools (V2, Not V1)
Deferred until we have traffic data showing which keywords drive visitors. Concept ideas for future:
- Decision Style Assessment (personality quiz)
- "Are You Stuck?" diagnostic
- "Overthinking Score" test
- Life Decision Calculator

Build tools based on data, not guesses.

## 6. Email Capture (V2, Not V1)
No email capture in V1. Focus purely on SEO authority and content quality. Add email capture once there's meaningful organic traffic to convert. Don't optimize for conversion before you have traffic.

## 7. Blog System
Markdown files in content/blog/ as the CMS. No external CMS, no database for blog content. Files are the CMS (per architecture.md data storage rule).

First article: About us / founding story — establishes E-E-A-T, introduces Henry and Indy, explains the thesis.

Blog posts have no CTA in the trust-building phase. Pure value. CTA graduation criteria TBD based on traffic milestones.

## 8. Mass Content Pipeline
**V1 (no podcasts needed):** Extract blog content from existing strategy documents. The manifesto, methodology, and course outline are rich with publishable ideas. AI-assisted extraction → human voice check (Indy test) → publish.

**V2 (when podcasts exist):** Record → transcribe → extract → publish. Podcast-to-blog pipeline.

**Quality gate:** Every article passes the Indy test (voice.md). "Would Indy say this to a friend at the kitchen table?" If it sounds like AI, rewrite.

## 9. V1 Launch Scope
**Ships:**
- Homepage (manifesto)
- /life (LP, moved from root)
- /about (founder story)
- /privacy, /terms (legal)
- /blog (index + first article)
- /concepts/ (6-8 SEO-keyword-targeted pages)
- sitemap.xml, robots.txt
- JSON-LD structured data on all pages
- OG images, meta tags

**Does NOT ship:**
- Interactive tools
- Email capture
- Business Decisions pages (beyond "coming soon" card on homepage)
- Free course funnel
- Newsletter

**Post-launch cadence:** 3 articles/week (1 per cluster)
