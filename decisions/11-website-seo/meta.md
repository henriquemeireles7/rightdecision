# META-DOC: Website & SEO/GEO Strategy
**Version:** 1.0
**Date:** 2026-04-07
**Status:** Final
**Author:** Henry + Claude
**Pipeline:** d-meta (here) → d-input → d-plan → d-tasks

## Document purpose
**This document IS:** The strategy for transforming rightdecisions.io from a single landing page into a full company website with blog, technical SEO, GEO optimization, interactive tools, and a mass content production pipeline.
**This document is NOT:** A design mockup. Not a code spec. Not a content calendar. Not the landing page strategy (that's doc 05). Not the social media strategy (docs 07-08).
**Primary reader:** Henry (builds everything), AI agents (implement SEO, generate content, build tools)
**Depends on:** Business Model (doc 01), Manifesto (doc 02), Landing Page (LD doc 05), Design System (DESIGN.md), Voice (voice.md)
**Feeds into:** Blog posts (content/ folder), d-blog skill, interactive tools, future SEO content pipeline

---

## Section 1: Website Architecture, URL Topology & Navigation

### What this section covers
The full site map and domain topology as one unified decision. Main site (rightdecisions.io) as company/manifesto site. Subdomain vs subdirectory decision for Life Decisions LP and Business Decisions. Where blog, tools, and glossary live. Header, footer, navigation. Pages: home, about us, legal, privacy, terms. The URL structure that becomes the SEO backbone. DNS and routing decisions. English-only scope for V1 (subdirectory approach /pt/, /es/ if multi-language added later).

### Done-when criteria
- [ ] Domain topology decided with SEO authority analysis (subdomains vs subdirectories, evidence-based)
- [ ] Complete site map with every URL documented
- [ ] Navigation structure defined (header + footer)
- [ ] Redirect strategy for current LP → new location
- [ ] URL slug conventions established for blog, tools, glossary
- [ ] Mobile navigation pattern specified
- [ ] Information hierarchy matches SEO keyword clusters
- [ ] Each domain/path has a clear owner and purpose

### Failure modes
- URLs change after content is published (breaks backlinks, kills SEO)
- Subdomain splits domain authority (Google may treat subdomains as separate sites)
- Too many pages at launch → nothing gets built
- Navigation hides the CTA paths (Life Decisions, Business Decisions)
- URL structure doesn't support programmatic/content scaling
- Blog on subdomain loses link equity from main domain

### Sources
- Current landing page spec (lifedecisions/05-landing-page)
- Design system (design.md)
- Architecture patterns (architecture.md)
- SEO best practices (subdomain vs subdirectory debate)

---

## Section 2: Technical SEO Foundation

### What this section covers
Server-side rendering for public pages, JSON-LD structured data schemas, sitemap.xml generation, robots.txt, canonical URLs, Open Graph/Twitter cards, programmatic OG image generation, Core Web Vitals targets, font optimization, mobile-first indexing. The technical checklist that makes everything else work.

### Done-when criteria
- [ ] SSR strategy for blog/public pages documented
- [ ] JSON-LD schemas listed for each page type (Article, FAQPage, HowTo, Organization, Person, BreadcrumbList)
- [ ] Sitemap generation approach specified
- [ ] robots.txt rules defined
- [ ] OG image generation approach chosen
- [ ] Core Web Vitals targets set (LCP < 2.5s, INP < 200ms, CLS < 0.1)
- [ ] Accessibility baseline defined (WCAG 2.1 AA targets, alt text policy, semantic HTML — reference design.md)
- [ ] Google Search Console + Bing Webmaster setup noted

### Failure modes
- Building content without SSR → Google can't index it
- Missing structured data → invisible to AI engines (GEO failure)
- Poor Core Web Vitals → ranking penalty
- No sitemap → slow/incomplete indexing

### Sources
- Current app architecture (Bun/Hono/Preact)
- Design system page speed targets
- architecture.md

---

## Section 3: GEO (Generative Engine Optimization) Strategy

### What this section covers
How to optimize for AI citation engines: ChatGPT, Claude, Gemini, Perplexity. Content structures that get cited. Entity-based SEO. Proprietary concept pages. FAQ schema. Glossary strategy. The goal: when someone asks an AI "how to make better life decisions", Right Decision gets cited.

### Done-when criteria
- [ ] List of proprietary concepts to define on dedicated pages ("The One Decision", "Decision Debt", "The Eight Sins", "The Overthinking Tax", etc.)
- [ ] 3+ structural patterns for AI-citable content defined with examples (definition-first paragraphs, FAQ pairs, stat+source format)
- [ ] Schema markup strategy for GEO (FAQ, HowTo, definitions)
- [ ] Glossary page strategy with internal linking
- [ ] Author authority pages designed (Henry, Indy) with E-E-A-T signals
- [ ] GEO measurement: at least 2 methods documented (manual spot-checks + tool-based monitoring) with frequency
- [ ] Clear distinction between proven vs experimental GEO techniques

### Failure modes
- Generic content that AI has no reason to cite specifically
- No structured data → AI can't parse your authority
- Proprietary terms not clearly defined → AI can't attribute them
- No author pages → no E-E-A-T signal

### Sources
- Manifesto (doc 02) — all proprietary concepts are here
- Voice guide (voice.md) — brand vocabulary
- GEO research (latest practices)

---

## Section 4: Competitor Landscape & Keyword Strategy

### What this section covers
Top 5 competitor analysis (James Clear, Mark Manson, Ramit Sethi, BetterUp, 16Personalities) — domain authority, top-ranking content, keyword gaps, content format patterns. The keyword landscape for decision-making, feeling stuck, and anti-self-help — segmented by product (LD personal keywords vs BD business keywords, no cannibalization). Content cluster architecture (pillar pages + supporting articles). Priority clusters ranked by ICP alignment, competition, and volume. Keyword research methodology.

### Done-when criteria
- [ ] Top 5 competitors analyzed: domain authority, top content, keyword gaps, format patterns
- [ ] Keyword research methodology documented (tools, scoring criteria, ICP-alignment filter)
- [ ] 4-6 content clusters defined with pillar pages
- [ ] Target keywords mapped to content pieces (minimum viable set for V1, expanding to 50+)
- [ ] Keyword clusters segmented by product (LD vs BD) with no cannibalization
- [ ] Competition analysis for each cluster (low/medium/high)
- [ ] Priority ranking: which clusters to build first
- [ ] Internal linking strategy between clusters
- [ ] Content frequency target (articles/week)

### Failure modes
- Targeting high-competition keywords first → months with no results
- Content clusters overlap → cannibalization
- No internal linking → isolated pages with no authority flow
- Wrong keywords → traffic that doesn't convert

### Sources
- Manifesto VoC section (what she types into Google at midnight)
- Keyword research data
- Competitor analysis (James Clear, Mark Manson, etc.)

---

## Section 5: Blog System Architecture

### What this section covers
The blog CMS using markdown files in content/blog/. How .md files become rendered blog posts. Frontmatter schema (title, slug, date, author, tags, description, keywords). Category/tag taxonomy. Blog index page. Pagination. RSS feed. No CTA on blog posts for now (pure value, build trust).

### Done-when criteria
- [ ] Frontmatter schema defined for blog posts
- [ ] File system → URL mapping documented (content/blog/slug.md → /blog/slug)
- [ ] Category/tag taxonomy aligned with content clusters
- [ ] Blog index, pagination, and archive page specs
- [ ] RSS feed + email notification for new posts (integration with email capture system)
- [ ] First article scope defined ("About Us" / founding story)
- [ ] Future d-blog skill requirements outlined
- [ ] Blog post CTA policy: no CTA for trust-building phase, criteria for when CTAs get added

### Failure modes
- CMS is too complex → friction kills publishing cadence
- No frontmatter standard → inconsistent metadata
- Tags don't align with SEO clusters → wasted taxonomy
- Blog posts with aggressive CTAs → readers bounce (trust violation)

### Sources
- Architecture data storage rule (files are the CMS)
- Knowledge base strategy (doc 09)
- Voice guide (for blog tone)

---

## Section 6: Engineer-as-Channel (Interactive Tools & Assessments)

### What this section covers
Concept-level scoping of interactive tools that drive organic traffic: Decision Style Assessment, life decision calculators, "Are You Stuck?" diagnostic, "Overthinking Score" test. Target keywords per tool. Rough mechanics and result type concepts. How tools feed into the $197/year product. Detailed tool specs go in separate beads epics, not this document.

### Done-when criteria
- [ ] 3-5 tool concepts defined with target keywords and rough mechanics
- [ ] Decision Style Assessment concept scoped (result type concepts, target keywords, rough question categories)
- [ ] Lead capture strategy per tool (what happens after the result)
- [ ] Each tool's SEO keyword target documented
- [ ] Each tool has a separate beads epic for detailed spec (this doc is concept-level only)

### Failure modes
- Tools are generic ("personality quiz") instead of branded ("Decision Style Assessment")
- Results pages aren't SEO-optimized (no unique URL per result type)
- No email capture → traffic without conversion
- Tools don't connect to the product → traffic without revenue

### Sources
- 16Personalities model (quiz → type pages → organic traffic)
- HubSpot/Ahrefs model (free tools → brand awareness → product)
- Manifesto personas and sins (content for quiz questions)

---

## Section 7: Mass Content Production Pipeline

### What this section covers
The future d-blog skill and content machine. V1 bootstrapping: strategy-doc-to-blog and manifesto-to-blog extraction (works without podcasts). V2: podcast-to-blog pipeline (record → transcribe → extract → publish). AI-assisted article generation. Content repurposing (blog → social → email). Quality gates (Indy test, SEO checklist). The goal: 2-3 SEO-optimized articles per week.

### Done-when criteria
- [ ] d-blog skill requirements specified (input → output → quality checks)
- [ ] V1 pipeline: strategy-doc-to-blog extraction (works without podcast content)
- [ ] V2 pipeline: podcast-to-blog (designed, but not blocking V1)
- [ ] Content repurposing map (one input → multiple formats)
- [ ] Quality gate checklist (voice.md compliance, SEO checklist, fact check)
- [ ] Publishing cadence with realistic capacity
- [ ] Content update/refresh strategy for older articles

### Failure modes
- AI-generated content that sounds like AI → brand damage
- Publishing volume over quality → Google quality update penalty
- No podcast content yet → pipeline has nothing to process
- Content doesn't follow voice.md → fails the Indy test

### Sources
- Voice guide (voice.md) — quality gate
- Knowledge base strategy (doc 09) — podcast ingestion
- Short-video strategy (doc 08) — content pipeline patterns

---

## Section 8: Email Capture & Lead Funnel Integration

### What this section covers
How the website integrates with email list, lead magnets, and the free course funnel. Email capture strategy per page type (blog, tools, about, homepage). What lead magnets exist (quiz results, free mini-course, newsletter). When and how blog posts transition from no-CTA to CTA-enabled. Integration with the $197/year conversion path.

### Done-when criteria
- [ ] Email capture placement map per page type
- [ ] Lead magnet concepts defined (quiz results, newsletter, free resources)
- [ ] Free course funnel integration points documented
- [ ] Blog CTA graduation criteria (when trust phase ends, CTAs begin)
- [ ] Email → product conversion path documented
- [ ] Newsletter/email content strategy (auto-send new posts, nurture sequence)

### Failure modes
- No email capture anywhere → traffic without conversion
- Aggressive email popups → brand damage, trust violation
- No nurture sequence → emails collected but never converted
- Lead magnets don't connect to product → list of unqualified leads

### Sources
- Business model flywheel (company.md)
- Free course funnel plan (future doc 06)
- Landing page spec (lifedecisions/05-landing-page)

---

## Section 9: Page Templates & Content Patterns

### What this section covers
Standard templates for each page type: blog post, glossary entry, tool/quiz page, pillar page, about page, legal pages. Each template has a consistent structure that satisfies both SEO and GEO requirements. Header/footer/nav shared across all pages.

### Done-when criteria
- [ ] Blog post template (structure, word count range, CTA placement)
- [ ] Pillar page template (structure, internal linking, word count)
- [ ] Glossary entry template (definition, related concepts, schema)
- [ ] Tool/quiz page template (intro, tool, results, CTA)
- [ ] About page template (founder stories, company info, E-E-A-T)
- [ ] Legal page template (privacy, terms, cookie policy)
- [ ] Templates reference design.md components, no duplication of visual specs

### Failure modes
- No consistent template → every page reinvents the wheel
- Templates too rigid → content feels formulaic
- Missing SEO elements in templates → inconsistent optimization

### Sources
- Design system (design.md) — visual patterns
- Voice guide (voice.md) — tone per context
- Landing page spec (LD doc 05) — existing component patterns

---

## Section 10: Measurement & Growth Roadmap



### What this section covers
KPIs and targets: organic traffic, keyword rankings, AI citations, email signups, tool usage. Google Search Console setup. Analytics integration. Monthly/quarterly review cadence. Growth milestones (Month 3, 6, 12 targets). The path from launch to meaningful organic traffic (specific targets set in the document, not here).

### Done-when criteria
- [ ] KPIs defined with specific targets (organic visits, ranking positions, email signups)
- [ ] Measurement tools identified (Search Console, PostHog, Ahrefs/alternatives)
- [ ] Monthly review checklist (what to check, what to update)
- [ ] Growth milestones: Month 1-3, 4-6, 7-12 targets
- [ ] Content ROI framework (which articles drive signups/revenue)
- [ ] GEO tracking approach (monitor AI mentions/citations)

### Failure modes
- No measurement → flying blind
- Vanity metrics (page views) instead of conversion metrics (signups)
- No review cadence → stale content strategy
- Unrealistic growth targets → team demotivation

### Sources
- PostHog analytics (already in stack)
- Google Search Console
- Business model revenue targets

---

## Section 11: Launch Scope (V1 vs Future)


### What this section covers
What ships in V1 (minimum viable website) vs what comes later. The hard line between "build now" and "plan for later." V1 should be launchable in 1-2 weeks, not 3 months.

### Done-when criteria
- [ ] V1 page list (exact pages that ship)
- [ ] V1 blog: first article + blog system
- [ ] V1 technical SEO: minimum viable checklist
- [ ] V2 roadmap: tools, expanded content, advanced GEO
- [ ] V3 roadmap: mass content pipeline, d-blog skill, programmatic pages

### Failure modes
- V1 scope creep → never launches
- Shipping without basic technical SEO → hard to retrofit
- Deferring everything to "later" → no website at all

### Sources
- Current codebase state
- Roadmap priorities

---

## Quality Checklist (for the final document)

- [ ] A developer can build V1 of the website from this document alone
- [ ] Every URL on the site is documented with its purpose
- [ ] Domain topology decision is evidence-based with SEO authority analysis
- [ ] Technical SEO checklist is specific to Bun/Hono/Preact stack
- [ ] GEO strategy defines specific proprietary concepts to publish
- [ ] Keyword clusters segmented by product (LD vs BD) with no cannibalization
- [ ] Competitor analysis identifies specific gaps to exploit
- [ ] Blog system is simple enough to actually use (files as CMS)
- [ ] Email capture and lead funnel integration documented per page type
- [ ] Interactive tools are concept-scoped (detailed specs in separate epics)
- [ ] Mass content pipeline works without podcasts (V1 bootstrapping)
- [ ] V1 scope is achievable in 1-2 weeks
- [ ] Growth targets are specific and measurable

---

## Adversarial Review

### Potential blind spots (with mitigations)
1. **Subdomain vs subdirectory is a real SEO decision** — Section 1 must resolve this with evidence-based analysis, not opinion.
2. **Voice consistency at scale** — Section 7 quality gate must be specific and enforceable (Indy test + structural checklist).
3. **GEO is still emerging** — Section 3 must distinguish proven vs experimental techniques.
4. **Blog with no CTA is unusual** — Section 8 defines the trust-building rationale AND graduation criteria for when CTAs begin.
5. **Interactive tools are engineering-heavy** — Section 6 is concept-level only; detailed specs go to separate beads epics.
6. **Podcast-to-blog depends on having podcasts** — Section 7 V1 pipeline bootstraps from existing strategy docs, not podcasts.
7. **Two products need different keyword strategies** — Section 4 explicitly segments LD vs BD keywords to prevent cannibalization.
8. **Email capture is the core conversion mechanism** — Section 8 covers email/lead funnel integration across all page types.

### What could make this document fail
- Over-planning without shipping. The meta-doc itself can become procrastination.
- Trying to compete on keyword volume instead of ICP precision.
- Building a "content machine" before having a voice that works.
- Technical SEO overkill for a site with < 50 pages.
