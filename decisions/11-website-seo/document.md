# Website & SEO/GEO Strategy — The Right Decision
**Version:** 1.0
**Date:** 2026-04-07
**Status:** Draft
**Author:** Henry + Claude
**Meta-doc:** decisions/11-website-seo/meta.md
**Input:** decisions/11-website-seo/input.md + raw.md
**Pipeline:** d-meta → d-input → d-plan (here) → d-tasks

## Document scope
**This document IS:** The complete strategy for transforming rightdecisions.io from a landing page into a company website with blog, concept pages, technical SEO, and GEO optimization — plus the content production pipeline to scale organic traffic.
**This document is NOT:** A design mockup. Not a code spec (that comes from d-tasks). Not the landing page strategy (lifedecisions/05-landing-page). Not the social media strategy (docs 07-08).
**Primary reader:** Henry (builds everything), AI agents (implement SEO, generate content)
**Depends on:** Business Model (doc 01), Manifesto (doc 02), Landing Page (LD doc 05), Design System (design.md), Voice (voice.md)
**Feeds into:** Blog posts (content/blog/), d-blog skill, concept pages, future interactive tools

---

## 1. Website Architecture, URL Topology & Navigation

### The decision: subdirectories, not subdomains

Everything lives under `rightdecisions.io`. No subdomains.

**Why:** Google may treat subdomains as separate sites. For a new domain with zero authority, every backlink and every internal link must compound into one domain's authority score. Subdirectories guarantee this. The blog, concept pages, tools, and the LP all build authority for the same domain.

**The rule:** Nothing public gets a subdomain. Everything is a path under rightdecisions.io.

### Complete site map

```
rightdecisions.io/
├── /                           ← Company manifesto homepage
├── /life                       ← Life Decisions landing page (current LP)
├── /about                      ← Founders, mission, E-E-A-T authority page
├── /blog                       ← Blog index (paginated)
│   └── /blog/[slug]            ← Individual articles
├── /concepts                   ← Concept index page
│   └── /concepts/[slug]        ← SEO-keyword-targeted concept pages
├── /tools                      ← Tools index (V2, placeholder for now)
│   └── /tools/[slug]           ← Individual tools (V2)
├── /privacy                    ← Privacy policy
├── /terms                      ← Terms of service
├── /sitemap.xml                ← Dynamic sitemap
├── /robots.txt                 ← Crawler directives
├── /rss.xml                    ← Blog RSS feed
└── /og/[slug].png              ← Programmatic OG images (dynamic route)
```

### URL slug conventions

| Content type | Pattern | Example |
|---|---|---|
| Blog posts | `/blog/[kebab-case-title]` | `/blog/why-self-help-makes-you-worse` |
| Concepts | `/concepts/[keyword-slug]` | `/concepts/analysis-paralysis` |
| Tools (V2) | `/tools/[tool-name]` | `/tools/decision-style-assessment` |
| Legal | `/[page-name]` | `/privacy`, `/terms` |

**Rules:**
- Slugs are permanent. Once published, a URL never changes. If a title changes, the slug stays.
- Slugs use the target SEO keyword, not the article title. "Why The Self-Help Industry Is Making You Worse" → `/blog/why-self-help-doesnt-work` (targets the keyword).
- No dates in URLs. `/blog/2026/04/slug` adds nothing and becomes misleading when content is updated.
- No trailing slashes. Hono should redirect `/blog/` to `/blog`.

### Navigation structure

**Header (all pages):**
```
[Logo: The Right Decision]     [About]  [Blog]  [Concepts]     [Life Decisions →]
```

- Logo links to `/`
- "Life Decisions →" is the primary CTA button (gold, accent color)
- "Business Decisions" does NOT appear in header — it's on the homepage only (coming soon)
- Mobile: hamburger menu, CTA button always visible

**Footer (all pages):**
```
The Right Decision                     Resources              Legal
Solving decision-making with AI.       Blog                   Privacy Policy
                                       Concepts               Terms of Service
© 2026 The Right Decision LLC          About
```

- Footer is minimal. No social links until accounts exist (per doc 07 status).
- No newsletter signup in V1.

### Mobile navigation

- Hamburger menu on the left, "Life Decisions →" CTA button on the right (always visible)
- Menu opens full-screen overlay: About, Blog, Concepts, Life Decisions
- No nested menus. Flat navigation.

---

## 2. Technical SEO Foundation

### Server-Side Rendering

Every public page MUST return complete HTML from the server. This is non-negotiable for SEO.

**Implementation approach:**
- Hono handles all routing server-side
- Preact's `renderToString()` generates HTML on the server
- Blog posts and concept pages are rendered from markdown files at request time (or cached)
- The `/life` LP and homepage are Preact components rendered server-side
- Client-side hydration only for interactive elements (future tools, mobile menu toggle)
- No JavaScript required to read any content page

**Critical rule:** If a page's content is invisible without JavaScript executing, it does not exist for SEO.

### JSON-LD Structured Data

Every page type gets specific schema markup in `<head>`:

**Homepage (`/`):**
```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "The Right Decision",
  "description": "Solving decision-making with AI. A methodology + AI platform for personal and business decisions.",
  "url": "https://rightdecisions.io",
  "logo": "https://rightdecisions.io/logo.png",
  "founders": [
    { "@type": "Person", "name": "Henry Meireles" },
    { "@type": "Person", "name": "Indy" }
  ]
}
```

Also include `WebSite` schema with `SearchAction` for potential sitelinks search box.

**Blog posts (`/blog/[slug]`):**
```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "...",
  "author": { "@type": "Person", "name": "Henry Meireles", "url": "https://rightdecisions.io/about" },
  "datePublished": "2026-04-07",
  "dateModified": "2026-04-07",
  "publisher": { "@type": "Organization", "name": "The Right Decision" },
  "description": "...",
  "mainEntityOfPage": "https://rightdecisions.io/blog/slug"
}
```

**Concept pages (`/concepts/[slug]`):**
- `Article` schema (same as blog) PLUS
- `FAQPage` schema for the FAQ section at the bottom of each concept page
- `DefinedTerm` schema for the primary concept definition

**About page (`/about`):**
- `Person` schema for Henry and Indy (name, jobTitle, description, sameAs for social profiles)
- Links to these Person entities from Article author fields establish E-E-A-T

**Landing page (`/life`):**
- `Product` schema with offers (name, description, price, priceCurrency, availability)

### Sitemap

Dynamic `sitemap.xml` generated by a Hono route:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://rightdecisions.io/</loc><priority>1.0</priority></url>
  <url><loc>https://rightdecisions.io/about</loc><priority>0.8</priority></url>
  <url><loc>https://rightdecisions.io/life</loc><priority>0.9</priority></url>
  <url><loc>https://rightdecisions.io/blog</loc><priority>0.8</priority></url>
  <!-- Dynamic: all blog posts from content/blog/ -->
  <!-- Dynamic: all concept pages from content/concepts/ -->
</urlset>
```

- Reads markdown files from content/blog/ and content/concepts/ to generate entries
- Includes `<lastmod>` from file modification dates
- Submit to Google Search Console and Bing Webmaster Tools after launch

### robots.txt

```
User-agent: *
Allow: /
Disallow: /api/
Disallow: /app/
Disallow: /admin/
Disallow: /purchase/

# AI crawlers — explicitly allowed
User-agent: GPTBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: Google-Extended
Allow: /

Sitemap: https://rightdecisions.io/sitemap.xml
```

Block API routes and authenticated app routes. Explicitly allow AI crawlers — we WANT to be cited.

### Canonical URLs

Every page includes `<link rel="canonical" href="https://rightdecisions.io/[path]">`.

Hono middleware injects this automatically based on the request path. Handles:
- Trailing slash normalization (redirect to non-trailing)
- Query parameter stripping for canonical (UTM params don't create duplicates)
- www vs non-www (redirect www → naked domain)

### Open Graph & Twitter Cards

Every public page includes in `<head>`:

```html
<meta property="og:title" content="[Page title]">
<meta property="og:description" content="[Page description]">
<meta property="og:image" content="https://rightdecisions.io/og/[slug].png">
<meta property="og:url" content="https://rightdecisions.io/[path]">
<meta property="og:type" content="article"> <!-- or "website" for homepage -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="[Page title]">
<meta name="twitter:description" content="[Page description]">
<meta name="twitter:image" content="https://rightdecisions.io/og/[slug].png">
```

### Programmatic OG Images

Route: `/og/[slug].png`

Generate branded OG images dynamically using `satori` (or `@resvg/resvg-js` for Bun):
- Background: warm cream (#FAF8F5)
- Title: Instrument Serif in warm near-black (#1A1714)
- Footer: "The Right Decision" + logo mark
- Accent: gold underline or border (#C4956A)

Cache generated images aggressively (immutable content, long TTL).

### Core Web Vitals Targets

| Metric | Target | How |
|---|---|---|
| LCP (Largest Contentful Paint) | < 1.5s | No hero images, text-first design, preload fonts |
| INP (Interaction to Next Paint) | < 100ms | Minimal JS, Preact is ~3KB, no heavy client-side rendering |
| CLS (Cumulative Layout Shift) | < 0.05 | Explicit font dimensions, no layout-shifting content |

**Font optimization:**
- Self-host Instrument Serif + Sans (no Google Fonts round-trip)
- Preload critical font weights: `<link rel="preload" href="/fonts/InstrumentSerif-Regular.woff2" as="font" type="font/woff2" crossorigin>`
- Use `font-display: swap` on all `@font-face`
- Subset fonts to Latin characters only (smaller file size)

**Image optimization:**
- Blog: lazy-load all images below the fold
- Use `<picture>` with WebP/AVIF sources and fallback
- Always set `width` and `height` attributes to prevent CLS

### Accessibility Baseline

Per design.md, WCAG 2.1 AA compliance:
- All text meets 4.5:1 contrast ratio (check `--text-muted` on every background)
- All interactive elements have 44x44px minimum touch targets
- Proper heading hierarchy (single H1 per page, sequential H2/H3)
- Alt text on all images (descriptive, not decorative: "Henry and Indy, founders of The Right Decision" not "photo")
- Semantic HTML: `<nav>`, `<main>`, `<article>`, `<footer>`
- Skip-to-content link for keyboard navigation
- Focus-visible indicators (gold box-shadow per design.md)

### Search Console & Indexing Setup

Post-launch checklist:
1. Verify domain in Google Search Console (DNS TXT record)
2. Submit sitemap.xml
3. Verify in Bing Webmaster Tools
4. Request indexing for homepage, /about, /life, /blog, each concept page
5. Monitor "Coverage" report weekly for first month — fix any indexing errors immediately

---

## 3. GEO (Generative Engine Optimization) Strategy

### The goal

When someone asks an AI assistant "how to make better life decisions" or "why does self-help not work" or "what is analysis paralysis", The Right Decision should be among the cited sources.

### How AI engines cite content

AI systems extract and cite content based on:

1. **Clear definitions in the first 1-2 sentences.** AI systems pull the opening paragraph of pages that define concepts. The definition must be self-contained and quotable.

2. **Structured data.** FAQ schema, Article schema with author info, and DefinedTerm schema help AI systems parse authority and content type.

3. **Entity clarity.** Content that defines entities ("Analysis Paralysis", "Decision Fatigue") and their relationships gets cited more than content that discusses topics vaguely.

4. **Statistics and citations.** Specific numbers, study references, and data points make content more citable: "Adults make approximately 35,000 decisions per day (Sahakian & Labuzetta, 2013)" is more citable than "we make lots of decisions."

5. **FAQ format.** Question-answer pairs with FAQ schema are directly extractable.

6. **Original frameworks.** If you coin and clearly define a term or framework, AI will cite your page as the authoritative source.

### Three structural patterns for AI-citable content

**Pattern 1: Definition-first paragraph**
```
[Concept name] is [clear, one-sentence definition]. [Second sentence expanding with
a specific example or statistic]. [Third sentence connecting to broader context.]
```
Example: "Analysis paralysis is the state of overthinking a decision to the point where no decision is made at all. Research suggests that having more than 5-7 options dramatically reduces the likelihood of choosing any of them (Iyengar & Lepper, 2000). For people stuck in life transitions, analysis paralysis often disguises itself as productive research."

**Pattern 2: FAQ pairs**
```
### What is [concept]?
[Direct answer in 1-2 sentences. No hedging. No "it depends."]

### How do you overcome [concept]?
[Actionable steps, ideally numbered. Reference our methodology where relevant.]
```
Every concept page ends with 4-6 FAQ pairs, all marked up with FAQPage schema.

**Pattern 3: Stat + source format**
```
[Bold claim]. According to [source], [specific statistic]. [Connect to our framework.]
```
Example: "**Most people are not stuck because they lack information.** According to a study published in the Journal of Personality and Social Psychology, increased self-reflection without action is associated with higher anxiety, not lower (Trapnell & Campbell, 1999). This is what we call the understanding trap — the belief that more self-awareness leads to change."

### Proprietary concepts → search keyword mapping

**Critical rule:** Concept page URLs, H1s, and meta titles target SEARCH KEYWORDS. The proprietary Right Decision name is introduced inside the content as "what we call this" or "in the Right Decision methodology, this is called X."

| Target keyword (URL slug) | Monthly search volume (est.) | Our concept | Page angle |
|---|---|---|---|
| `analysis-paralysis` | 10K-15K | Sin #3 (disguising indecision as research) | Define the problem → introduce our framework as the solution |
| `decision-fatigue` | 8K-12K | General (connects to Decision Cycle) | Explain the science → show how a system prevents it |
| `feeling-stuck-in-life` | 5K-8K | The Dependency Industry | Why traditional self-help keeps you stuck → our alternative |
| `how-to-make-big-life-decisions` | 1K-3K | The Decision Cycle | Step-by-step methodology with our framework |
| `overthinking-decisions` | 3K-5K | Sin #8 (not deciding) | Why overthinking IS a decision (the worst one) → how to break it |
| `what-is-a-life-coach` | 5K-8K | Positioning (vs therapy, vs us) | Compare options honestly → position Right Decision as the alternative |
| `self-help-doesnt-work` | 1K-2K | The Dependency Industry | Why the industry model is broken → what to do instead |
| `how-to-stop-overthinking` | 15K-25K | The Decision Cycle (Step 4: Decide) | Practical framework, not platitudes → link to our methodology |

### Concept page template

Every concept page follows this structure:

```
H1: [Target keyword as natural heading]
   "Analysis Paralysis: Why You Can't Decide (And How to Break Free)"

Opening paragraph: Definition-first (Pattern 1). Clear, quotable, AI-citable.

Section 1: The problem (2-3 paragraphs)
   What this looks like in real life. Use VoC language from manifesto.
   Specific examples. "You've been researching apartments for 6 months..."

Section 2: Why it happens (2-3 paragraphs)
   The science or psychology behind it. Cite studies where possible.
   Connect to our framework: "In the Right Decision methodology, we call this..."

Section 3: How to overcome it (numbered steps)
   Actionable framework. Reference our methodology.
   Each step is specific and doable.
   "Step 1: Stop gathering information. Set a decision deadline for 48 hours from now."

Section 4: FAQ (4-6 pairs)
   Marked up with FAQPage schema.
   Target related long-tail keywords.

Internal links:
   Link to 2-3 related concept pages
   Link to 2-3 related blog posts
   Link to /life (natural, not forced — "If you're ready to stop analyzing and start deciding")
```

Word count: 1,500-2,500 words per concept page.

### Author authority pages

The `/about` page serves double duty: company story AND E-E-A-T authority.

**Henry's section:**
- Full name, role (Technical Founder)
- Background: multiple companies, exits, personal experience with the methodology
- Credentials that establish authority on decision-making
- Link to any published writing, interviews, or public appearances

**Indy's section:**
- Full name, role (Content & Brand)
- Background: personal story of transformation through decision-making
- The Indy Test explained (this IS a credential — it shows methodology rigor)

Both link from `Person` schema `sameAs` to social profiles (when they exist).

### GEO measurement

**Proven methods:**
1. **Manual spot-checks (weekly):** Ask ChatGPT, Claude, Gemini, and Perplexity questions in our keyword space. Record whether Right Decision is cited, what content is cited, and what competitors are cited instead. Track in a simple spreadsheet.
2. **Referral traffic from AI sources:** Monitor PostHog for referral traffic from chat.openai.com, claude.ai, gemini.google.com, perplexity.ai. These show up in referrer data.

**Experimental methods:**
3. **Brand mention monitoring:** Set up Google Alerts for "The Right Decision" + "decision making" to catch indirect mentions.
4. **Search Console query analysis:** Look for queries that suggest AI-influenced searches (longer, more conversational queries trending up over time).

**Frequency:** Weekly spot-checks for months 1-3. Monthly after that unless trends change.

### Proven vs experimental GEO techniques

| Technique | Status | Evidence |
|---|---|---|
| Clear definitions in opening paragraph | Proven | AI systems consistently extract first-paragraph definitions |
| FAQ schema markup | Proven | Directly parseable by AI and featured snippets |
| Structured data (JSON-LD) | Proven | Helps AI systems understand page structure and authority |
| Author pages with credentials | Proven | E-E-A-T signals that both Google and AI systems use |
| Original terminology on dedicated pages | Proven | AI cites the source when a term is clearly defined in one place |
| Allowing AI crawlers in robots.txt | Proven | Required for AI systems that use web crawling (GPTBot, ClaudeBot) |
| Statistics and study citations | Proven | Increases citeability and perceived authority |
| Conversational FAQ format | Experimental | Matches how users ask AI questions, but unclear if it directly improves citation |
| Entity-relationship mapping across pages | Experimental | Theoretically helps AI build knowledge graphs, limited direct evidence |

---

## 4. Competitor Landscape & Keyword Strategy

### Competitor Analysis

**Top 5 competitors in our keyword space:**

| Competitor | Domain Authority (est.) | Strategy | Keyword gaps we can exploit |
|---|---|---|---|
| **James Clear** (jamesclear.com) | Very high | Long-form evergreen articles on habits/productivity. Massive backlink profile from Atomic Habits. | He doesn't cover decision-making specifically. "How to decide" is not his territory. |
| **Mark Manson** (markmanson.net) | High | Provocative anti-self-help articles. Similar contrarian positioning. | He's moved away from active blogging. His content is aging. We can own the "anti-self-help + AI" intersection. |
| **BetterUp** (betterup.com) | High | Corporate wellness content. B2B focus. | They don't speak to the individual woman stuck at 35. Their tone is corporate, not kitchen-table. |
| **Verywell Mind** (verywellmind.com) | Very high | Medical/psychological definitions of concepts. Very clinical. | No personality, no methodology, no opinion. We can be the human voice that explains the same concepts with a point of view. |
| **Psychology Today** (psychologytoday.com) | Very high | Therapist directory + articles. | Same as Verywell: clinical, impersonal. They define "analysis paralysis" but don't help you do anything about it. |

**Key gaps:**
1. Nobody owns "anti-self-help" as a content category with SEO intent
2. Decision-making concepts (analysis paralysis, decision fatigue) are dominated by clinical/academic sites with no actionable methodology
3. "Feeling stuck" content is scattered across lifestyle blogs with no depth
4. NO competitor combines decision-making + AI positioning
5. No competitor speaks directly to "women 30-50 who have done the work" with specific language

### Keyword Research Methodology

**Tools:** Google Search Console (free, for our own data), Google Keyword Planner (free with Ads account), Ubersuggest (free tier), AnswerThePublic (free tier for question-based keywords).

**Scoring criteria for keyword prioritization:**

| Factor | Weight | Scoring |
|---|---|---|
| ICP alignment | 40% | Does the searcher match our persona? (Stuck achiever, overthinker, builder) |
| Competition | 30% | Low > Medium > High. Target KD < 30 for months 1-6. |
| Search volume | 20% | Higher is better, but low-volume + high-ICP beats high-volume + low-ICP |
| Content fit | 10% | Can we write something genuinely better than what ranks? (Indy test + methodology) |

### Content Clusters

**Cluster 1: "Feeling Stuck" (PRIMARY — highest ICP alignment)**

Pillar page: `/blog/what-to-do-when-you-feel-stuck-in-life`

| Target keyword | Est. volume | Competition | Article idea |
|---|---|---|---|
| what to do when you feel stuck | 2K-4K | Low | Pillar: comprehensive guide, our methodology |
| feeling stuck in life at 35 | 1K-3K | Low | Age-specific, speaks directly to ICP |
| feeling stuck in life at 40 | 1K-3K | Low | Age-specific variant |
| why do i feel stuck even though my life is fine | 500-1K | Very low | Speaks to the "stuck achiever" specifically |
| signs you are stuck in a rut | 2K-4K | Low-Med | Diagnostic content, links to concept pages |
| how to get unstuck without blowing up your life | 500-1K | Very low | Practical, acknowledges she has things she doesn't want to lose |
| stuck in a rut in my career | 1K-3K | Low | Career-specific angle |
| feeling lost in life | 5K-8K | Medium | Broader, connect to our framework |
| how to start over in life | 3K-5K | Low-Med | Transition-focused |

**Cluster 2: "Anti-Self-Help" (DIFFERENTIATOR — lowest competition)**

Pillar page: `/blog/why-self-help-doesnt-work`

| Target keyword | Est. volume | Competition | Article idea |
|---|---|---|---|
| why self-help doesn't work | 1K-2K | Low | Pillar: our manifesto argument, backed by evidence |
| self-help addiction | 500-1K | Very low | When personal development becomes procrastination |
| toxic positivity | 10K-15K | Medium | Higher competition but massive volume — worth competing |
| personal development burnout | 200-500 | Very low | Speaks directly to ICP's exhaustion |
| self-improvement fatigue | 200-500 | Very low | Variant of above |
| does therapy help with feeling stuck | 500-1K | Low | Honest comparison: therapy vs action-based approach |
| self-help industry problems | 500-1K | Low | Our positioning as the alternative |
| too many self-help books | 200-500 | Very low | "You've consumed 47 books. How many decisions?" |
| understanding vs action | 200-500 | Very low | Core thesis as content |

**Cluster 3: "Decision Making" (VOLUME — medium competition)**

Pillar page: `/blog/how-to-make-big-life-decisions`

| Target keyword | Est. volume | Competition | Article idea |
|---|---|---|---|
| how to make big life decisions | 1K-3K | Low-Med | Pillar: our Decision Cycle as the framework |
| analysis paralysis how to overcome | 3K-5K | Medium | Links to /concepts/analysis-paralysis |
| decision fatigue | 8K-12K | Medium | Links to /concepts/decision-fatigue |
| how to stop overthinking decisions | 5K-8K | Medium | Practical steps from our methodology |
| fear of making the wrong decision | 2K-4K | Low | Angle 4 (risk acceptance) content |
| should I quit my job | 8K-12K | Medium-High | Specific decision type — high volume |
| how to decide between two options | 2K-4K | Low-Med | Framework content |
| decision making frameworks | 3K-5K | Medium | Our methodology positioned as the framework |
| intuition vs logic in decisions | 1K-2K | Low | Connect to our "honest state map" concept |

**Cluster 4: "Life Transitions" (SUPPORTING — feeds into other clusters)**

No dedicated pillar. Supporting articles that interlink with clusters 1-3.

| Target keyword | Est. volume | Competition | Article idea |
|---|---|---|---|
| career change at 40 | 5K-8K | Medium | Specific decision, links to methodology |
| starting over at 35 | 1K-3K | Low | ICP age-specific |
| how to know when its time for a change | 1K-3K | Low | Diagnostic, links to concept pages |
| second act in life | 1K-2K | Low | Positive framing of starting over |
| how to reinvent yourself | 3K-5K | Medium | Action-focused, not woo |

**Product-specific keyword segmentation:**

| Cluster | Primary product | Why |
|---|---|---|
| Feeling Stuck | Life Decisions (LD) | Personal transformation, ICP Persona 1+2 |
| Anti-Self-Help | Life Decisions (LD) | Brand positioning, ICP Persona 1 |
| Decision Making | Both (LD + BD) | Universal topic, different angles per product |
| Life Transitions | Life Decisions (LD) | Personal life changes |
| Future: "Building with AI" | Business Decisions (BD) | When BD launches, target "vibe coding", "AI for non-tech founders" |

No keyword cannibalization: LD content targets personal/emotional keywords. Future BD content targets business/tech/founder keywords. Decision Making cluster serves both but with different articles per audience.

### Internal Linking Strategy

```
Homepage (/)
├── links to → /blog (latest 3 posts)
├── links to → /concepts (featured concepts)
├── links to → /life (CTA)
└── links to → /about

Blog posts ↔ Blog posts (within same cluster: 2-3 cross-links per article)
Blog posts → Concept pages (when referencing a concept, always link)
Concept pages → Blog posts (2-3 related articles per concept)
Concept pages ↔ Concept pages (related concepts: 2-3 cross-links)
Pillar pages → all cluster articles (hub to spokes)
Cluster articles → Pillar page (spokes back to hub)
```

**Rule:** Every new article must link to at least 3 existing pages and at least 1 existing page must be updated to link to the new article.

### Content frequency

**Target:** 3 articles/week (1 per primary cluster: stuck, anti-self-help, decision-making).

**Realistic capacity:** This is AI-assisted content with human voice review. The bottleneck is the Indy test, not the writing. If 3/week is too much, drop to 2/week (alternate clusters). Never publish content that fails the voice check.

---

## 5. Blog System Architecture

### The CMS: files

Blog posts live as markdown files in `content/blog/`. No database. No external CMS. The file IS the CMS.

This aligns with the architecture.md data storage rule: "AI agents author it AND humans review it AND git versioning matters" → filesystem.

### Frontmatter schema

```yaml
---
title: "Why Self-Help Is Making You Worse"
slug: "why-self-help-makes-you-worse"
description: "You've tried therapy, courses, and meditation. Here's why none of it worked — and what actually changes your life."
author: "henry"  # or "indy" or "henry-and-indy"
date: "2026-04-07"
updated: "2026-04-07"  # only if content changes after publication
cluster: "anti-self-help"  # feeling-stuck | anti-self-help | decision-making | life-transitions
tags: ["self-help", "personal-development", "decisions"]
keywords: ["why self-help doesn't work", "self-help addiction", "personal development burnout"]
status: "published"  # draft | published
---
```

**Required fields:** title, slug, description, author, date, cluster, keywords, status
**Optional fields:** updated, tags

### File system → URL mapping

```
content/blog/why-self-help-makes-you-worse.md → /blog/why-self-help-makes-you-worse
content/blog/feeling-stuck-at-35.md           → /blog/feeling-stuck-at-35
```

File name = slug. No transformation needed. Hono route reads the file, parses frontmatter + markdown, renders to HTML.

### Category/tag taxonomy

**Primary taxonomy: clusters** (aligns with SEO content clusters)
- `feeling-stuck`
- `anti-self-help`
- `decision-making`
- `life-transitions`

Each cluster maps to a filterable view on `/blog`: `/blog?cluster=anti-self-help`

**Secondary taxonomy: tags** (for more granular cross-referencing)
Tags are free-form but should be drawn from a controlled vocabulary:
`self-help`, `therapy`, `decisions`, `career`, `relationships`, `finances`, `health`, `overthinking`, `procrastination`, `productivity`, `ai`, `methodology`

### Blog index page

`/blog` shows:
1. Latest articles (reverse chronological, 10 per page)
2. Cluster filter buttons: All | Feeling Stuck | Anti-Self-Help | Decision Making | Life Transitions
3. Each article card shows: title, description, date, cluster badge, estimated read time
4. Pagination: "Older →" / "← Newer" (no infinite scroll — bad for SEO)

### RSS feed

`/rss.xml` — standard RSS 2.0 feed with latest 20 articles. Includes full content (not truncated) to encourage feed reader engagement.

### First article: "Why We Built The Right Decision"

Scope: The founding story article. Not the LP's "about" — this is the blog version. More personal, more detailed, more honest.

Structure:
1. Henry's story (from manifesto Section 10 — expanded)
2. Indy's perspective (even if brief — she can expand later)
3. The thesis: why decisions, not understanding, change your life
4. Why we built a company around this
5. What we're building (two products, AI-first approach)

Target keyword: "the right decision" (branded search — we should own this)
Word count: 1,500-2,000 words
Voice: Warm register. First-person plural ("we"). Passes Indy test.

### Blog CTA policy

**V1: No CTAs.** Blog posts exist to build trust, establish authority, and rank in search engines. No product pitches, no email capture, no "download our guide."

**Graduation criteria for adding CTAs (V2):**
- Blog has 30+ published articles
- Organic traffic exceeds 1,000 monthly visits
- At least 5 articles ranking on page 1 for target keywords

When CTAs are added, they will be subtle and contextual: "If this resonated, we built a course around this methodology" at the end of relevant articles. Never popups. Never interrupting the reading experience.

### Future d-blog skill

Requirements for the d-blog skill (to be built separately):

**Input:** One of:
- A keyword + cluster assignment
- A strategy document section to extract from
- A podcast transcript to adapt

**Output:**
- Markdown file with correct frontmatter
- Saved to content/blog/[slug].md
- SEO-optimized: target keyword in H1, first paragraph, 2-3 subheadings
- Internal links to 3+ existing pages
- Passes automated checks: word count (1,000-2,500), readability, keyword density

**Quality gates:**
1. Automated: keyword in H1, word count range, internal link count, frontmatter completeness
2. Voice check: Indy test (manual or AI-assisted with voice.md rules)
3. SEO check: target keyword appears naturally, meta description < 160 chars, no keyword stuffing

---

## 6. Engineer-as-Channel (Interactive Tools — V2)

### Deferred to V2

Interactive tools are high-effort, high-reward but require traffic data to build the right ones. V1 focuses on content. V2 builds tools based on what keywords actually drive traffic.

### Tool concepts (concept-level only)

**Tool 1: Decision Style Assessment**
- Target keywords: "decision making quiz", "decision style test", "how do I make decisions quiz"
- Rough mechanic: 10-15 questions about decision-making patterns → 4-6 result types based on the Eight Sins
- Result types map to: "The Researcher" (Sin #3), "The Optimizer" (Sin #7), "The Outsourcer" (Sin #2), "The Planner" (Sin #5), "The Avoider" (Sin #8), "The Follower" (Sin #6)
- Each result type gets its own URL: `/tools/decision-style-assessment/the-researcher`
- Lead capture at results page
- Shareable results (social sharing generates backlinks)

**Tool 2: "Are You Stuck?" Diagnostic**
- Target keywords: "am I stuck in life quiz", "stuck in a rut test"
- Rough mechanic: 5-7 questions → score + personalized feedback
- Simpler than the Decision Style Assessment, faster to build

**Tool 3: "Overthinking Score" Test**
- Target keywords: "overthinking test", "do I overthink quiz"
- Rough mechanic: Quick assessment → score → tips from our methodology

**Tool 4: Decision Cost Calculator**
- Target keywords: "cost of indecision", "procrastination cost calculator"
- Rough mechanic: Input your situation → calculate the invisible cost of not deciding

**Each tool gets a separate beads epic for detailed spec when V2 begins.**

---

## 7. Mass Content Production Pipeline

### V1 Pipeline: Strategy-doc-to-blog (no podcasts needed)

The manifesto, methodology, and course outline contain dozens of publishable ideas. The V1 pipeline extracts these into blog posts.

**Source material → article ideas:**

From manifesto (doc 02):
- Seven Angles → 7 pillar/cluster articles
- Eight Sins → 8 diagnostic articles ("Are you committing Sin #3?")
- VoC section → articles targeting her exact search queries
- Objection map → FAQ-style articles

From methodology (lifedecisions/03-methodology):
- Each phase of the Decision Cycle → how-to article
- Each exercise → "How to do X" article

From course outline (lifedecisions/04-course-outline):
- Each module theme → expanded article

**Estimated content bank:** 40-60 article ideas from existing documents alone. At 3/week, that's 3-5 months of content without needing any new source material.

### V1 Pipeline steps

```
1. Select keyword + cluster from content plan
2. Identify source material (which strategy doc section)
3. AI generates draft from source material + keyword target
4. Voice check: apply Indy test (voice.md rules)
5. SEO check: keyword placement, internal links, meta description
6. Save to content/blog/[slug].md
7. Commit + deploy
```

Steps 3-5 are what the future d-blog skill automates.

### V2 Pipeline: Podcast-to-blog (when podcasts exist)

```
1. Record podcast episode
2. Transcribe (Whisper or similar)
3. AI extracts key insights and maps to keyword targets
4. AI generates blog draft maintaining Henry/Indy's actual voice
5. Voice check + SEO check
6. Save + deploy
```

This pipeline activates when podcast episodes exist (currently blocked on recording — see roadmap human tasks).

### Content repurposing map

```
Blog post (primary asset)
├── → Social media caption (extract the hook + one key insight)
├── → Email newsletter edition (when email capture is V2)
├── → Thread (Twitter/X — key points as numbered list)
└── → Concept page update (if the blog post deepens a concept)
```

One input → four outputs. The blog post is always the primary asset.

### Quality gate checklist

Every article must pass ALL checks before publishing:

| Check | Tool | Pass criteria |
|---|---|---|
| Voice (Indy test) | Manual / AI-assisted | "Would Indy say this at the kitchen table?" |
| Anti-patterns | voice.md table | Zero matches against the anti-pattern list |
| Word count | Automated | 1,000-2,500 words |
| Keyword placement | Automated | Target keyword in H1, first paragraph, 1-2 subheadings |
| Internal links | Automated | 3+ links to existing pages |
| Meta description | Automated | Present, < 160 characters, contains keyword |
| Frontmatter | Automated | All required fields present |
| Readability | Manual | Mix of paragraph lengths, questions, bold declarations (per voice.md visual variety rules) |

### Content update strategy

Every 90 days, review top-performing articles:
- Update statistics and examples
- Add internal links to newer content
- Refresh the `updated` frontmatter date
- Check that the content still ranks for its target keyword
- If ranking dropped, analyze why and rewrite as needed

---

## 8. Email Capture & Lead Funnel Integration (V2)

### V1: No email capture

V1 focuses exclusively on building SEO authority and content quality. No email forms, no popups, no lead magnets. The site earns trust by giving without asking.

**Rationale:** Don't optimize for conversion before you have traffic. An email capture form on a site with 50 monthly visitors is premature optimization. Build the traffic machine first.

### V2 triggers (when to add email capture)

Add email capture when ANY of these are true:
- Blog has 30+ published articles
- Organic traffic exceeds 1,000 monthly visits
- At least 5 articles ranking on page 1 for target keywords
- Interactive tools are live (V2)

### V2 email capture plan (for future implementation)

**Placement map:**
| Page type | Capture method | CTA |
|---|---|---|
| Blog posts | End-of-article inline form | "If this resonated, we send one essay a week" |
| Concept pages | Sidebar or bottom form | "Get the full framework — free weekly" |
| Tool result pages | Post-result gate | "Get your complete report via email" |
| Homepage | Footer newsletter signup | "One essay per week on decisions" |
| About page | None | Trust page, no capture |

**Lead magnets (when ready):**
- Decision Style Assessment results (tool V2)
- "The One Decision Worksheet" (PDF)
- Free mini-course (first 3 modules)

**Newsletter strategy:**
- Auto-send new blog posts to subscribers
- Weekly digest option (1 email/week with latest articles)
- No nurture sequence in V2. Build list first, design nurture later.

**Blog CTA graduation:** See Section 5 for specific criteria.

---

## 9. Page Templates & Content Patterns

All templates reference design.md for visual identity. No duplication of visual specs here — only content structure.

### Blog post template

```markdown
# [Target keyword as natural heading]

[Opening paragraph: hook + thesis in 2-3 sentences. Must pass the "stop the scroll" test.]

[Section 1: The problem or story (2-4 paragraphs)]
   - Use VoC language from manifesto
   - Specific examples, numbers, real situations

[Section 2: Why this happens / the insight (2-3 paragraphs)]
   - Connect to research or psychology
   - Introduce our framework naturally if relevant

[Section 3: What to do about it (numbered steps or framework)]
   - Actionable, specific
   - Each step is something she can do this week

[Section 4: The bridge (1-2 paragraphs)]
   - Open loop into related content
   - Or a question that sits in the mind
   - NEVER a summary ("in this article we covered...")

---
Internal links: [3+ links woven naturally throughout the text]
Word count: 1,000-2,500 words
```

### Pillar page template

Same as blog post but:
- Word count: 3,000-5,000 words
- Table of contents at the top (anchor links to sections)
- Links to EVERY article in its cluster
- More comprehensive, meant to be the definitive resource

### Concept page template

See Section 3 (GEO Strategy) for the full concept page template.

### About page structure

```
# About The Right Decision

## The thesis (1 paragraph)
"We believe the decision is the primitive..."

## Henry's story (3-5 paragraphs)
[From manifesto Section 10 — the full version]

## Indy's story (3-5 paragraphs)
[When available — for now, brief description of her role and perspective]

## What we're building (2-3 paragraphs)
Two products: Life Decisions for personal transformation, Business Decisions for non-tech entrepreneurs.

## The methodology in one paragraph
"The Right Decision is built on one idea: you are stuck because you're not making decisions..."
```

E-E-A-T signals: Person schema for both founders, professional backgrounds, methodology credentials.

### Legal page template

```
# [Privacy Policy / Terms of Service]

Last updated: [date]

[Standard legal content organized by clear headings]

## 1. ...
## 2. ...
```

Plain language where possible. Proper legal review recommended before launch. Initial versions can be generated but should be reviewed.

---

## 10. Measurement & Growth Roadmap

### KPIs

| KPI | Measurement tool | Target (Month 6) | Target (Month 12) |
|---|---|---|---|
| Organic monthly visits | Google Search Console + PostHog | 2,000 | 8,000-10,000 |
| Keywords ranking (page 1) | Google Search Console | 10 | 30+ |
| Blog articles published | File count in content/blog/ | 60+ | 120+ |
| Concept pages live | File count in content/concepts/ | 8 | 12-15 |
| Backlinks | Free backlink checkers (Ubersuggest) | 50+ | 200+ |
| AI citation appearances | Manual spot-checks (weekly) | Appearing for 2+ queries | Appearing for 10+ queries |
| Average position (target keywords) | Search Console | Top 20 | Top 10 |

### Monthly review checklist

Every month, check:
1. **Search Console:** New queries appearing? Position changes? Click-through rates?
2. **Top pages:** Which articles drive the most traffic? Why? Can we create more like them?
3. **Content gaps:** What are people searching that we haven't written about?
4. **Technical health:** Any indexing errors? Core Web Vitals changes? Mobile usability issues?
5. **GEO spot-check:** Ask AI assistants our target questions. Are we being cited?
6. **Competitor movement:** Are competitors publishing in our keyword space?

### Growth milestones

**Months 1-3 (Foundation):**
- Launch V1 website with all planned pages
- Publish 3 articles/week consistently
- Technical SEO fully implemented (sitemap, schema, OG images)
- Initial indexing complete — all pages in Google's index
- First organic traffic appearing (likely 100-500 monthly visits)
- Establish baselines for all KPIs

**Months 4-6 (Traction):**
- 60+ articles published
- Topical authority building — new articles index faster
- Some articles reaching page 1 for low-competition keywords
- 1,000-2,000 monthly organic visits
- Review: which clusters perform best? Double down.
- Begin planning V2 (tools, email capture) based on data

**Months 7-12 (Compounding):**
- 120+ articles published
- 30+ keywords on page 1
- 5,000-10,000 monthly organic visits
- Launch V2: first interactive tool (Decision Style Assessment)
- Add email capture based on V2 trigger criteria
- Consider: d-blog skill automation for content production
- GEO presence established — appearing in AI responses for target queries

### Content ROI framework

Track which articles → signups → revenue (when conversion exists in V2+):
```
Article → Visit → Email signup → Product page → Purchase
```

Tag articles by cluster and track conversion rates per cluster. This tells you which content themes produce revenue, not just traffic.

---

## 11. Launch Scope (V1 vs Future)

### V1: Minimum Viable Website (ship in 1-2 weeks)

**Pages that ship:**

| Page | Content source | Priority |
|---|---|---|
| `/` (homepage) | New — manifesto-style | Must have |
| `/life` (LP) | Move current LP here | Must have |
| `/about` | New — founder stories from manifesto | Must have |
| `/privacy` | New — generated, to be reviewed | Must have |
| `/terms` | New — generated, to be reviewed | Must have |
| `/blog` | New — blog index | Must have |
| `/blog/why-we-built-the-right-decision` | New — first article | Must have |
| `/concepts/analysis-paralysis` | New | Must have |
| `/concepts/decision-fatigue` | New | Must have |
| `/concepts/feeling-stuck-in-life` | New | Must have |
| `/concepts/how-to-make-big-life-decisions` | New | Must have |
| `/concepts/overthinking-decisions` | New | Must have |
| `/concepts/self-help-doesnt-work` | New | Must have |
| `/concepts/how-to-stop-overthinking` | New | Should have |
| `/concepts/what-is-a-life-coach` | New | Should have |
| `/sitemap.xml` | Dynamic | Must have |
| `/robots.txt` | Static | Must have |
| `/rss.xml` | Dynamic | Should have |
| `/og/[slug].png` | Dynamic | Should have |

**Technical that ships:**
- SSR for all public pages
- JSON-LD structured data on all page types
- Canonical URLs
- OG meta tags
- Self-hosted fonts with preload
- Mobile-responsive layout
- Semantic HTML with proper heading hierarchy
- Google Search Console + Bing Webmaster verification

**Does NOT ship in V1:**
- Interactive tools/quizzes
- Email capture / newsletter
- Business Decisions pages (beyond "coming soon" card on homepage)
- Free course funnel
- Dark mode
- Search functionality
- Comments on blog posts
- Social sharing buttons (the URL is shareable enough)

### V2: Growth Tools (after Month 6, based on data)

- First interactive tool (Decision Style Assessment or "Are You Stuck?" diagnostic)
- Email capture (footer signup, end-of-article form)
- Newsletter auto-send for new posts
- Expanded concept pages (12-15 total)
- Blog search functionality

### V3: Content Machine (after Month 12)

- d-blog skill for automated content production
- Podcast-to-blog pipeline
- Content repurposing automation (blog → social → email)
- Programmatic SEO pages (if data supports it)
- Business Decisions keyword cluster activation
- Advanced GEO: entity-relationship mapping, knowledge graph optimization

---

## Quality Checklist

- [x] A developer can build V1 of the website from this document alone
- [x] Every URL on the site is documented with its purpose
- [x] Domain topology decision is evidence-based (subdirectories for authority consolidation)
- [x] Technical SEO checklist is specific to Bun/Hono/Preact stack
- [x] GEO strategy defines 8 specific concept pages with keyword mappings
- [x] Keyword clusters segmented by product (LD vs BD) with no cannibalization
- [x] Competitor analysis identifies 5 specific gaps to exploit
- [x] Blog system is simple (markdown files as CMS, matching architecture.md pattern)
- [x] Email capture deferred to V2 with specific trigger criteria
- [x] Interactive tools are concept-scoped (detailed specs in separate epics)
- [x] Mass content pipeline works without podcasts (strategy-doc extraction)
- [x] V1 scope is achievable in 1-2 weeks (18-20 pages total)
- [x] Growth targets are specific and measurable with monthly milestones

---

## Decision Log

| Date | Decision | Why | Watch signal |
|---|---|---|---|
| 2026-04-07 | Subdirectory model, no subdomains | Maximum SEO authority consolidation for a new domain. Blog, concepts, tools all build one domain's authority. | If we need completely separate deploy infrastructure, reconsider. |
| 2026-04-07 | Concept pages target search keywords, not internal terms | "Analysis paralysis" gets 10K-15K searches/month. "Sin #3" gets zero. SEO-first naming drives traffic; proprietary terms are introduced inside the content. | If branded search grows enough, create redirect aliases. |
| 2026-04-07 | No email capture in V1 | Premature conversion optimization. Build traffic first, then capture. Email forms on a 50-visitor site waste effort. | Add capture when V2 triggers hit (30+ articles OR 1K+ monthly visits). |
| 2026-04-07 | No interactive tools in V1 | High engineering effort, unknown keyword ROI. Build tools based on traffic data, not guesses. | V2 priority when traffic data shows tool-keyword opportunities. |
| 2026-04-07 | 3 articles/week across all clusters | Founder wants broad coverage from day one. Slower topical authority build per cluster but wider keyword footprint. | If quality drops or voice check fails, reduce to 2/week. |
| 2026-04-07 | Manifesto-first homepage | The homepage sells the company and the idea, not the product. Products are secondary navigation. Positions Right Decision as a company, not just a course. | If homepage bounce rate > 70%, test problem-first variant. |
| 2026-04-07 | Allow AI crawlers in robots.txt | We want to be cited by ChatGPT, Claude, Gemini, Perplexity. Blocking them defeats the GEO strategy. | If content is being scraped without attribution at scale, reconsider. |
| 2026-04-07 | Blog posts have no CTAs in V1 | Trust-building phase. Pure value. Aggressive CTAs on a new blog with no authority damage trust and increase bounce rate. | Graduate to soft CTAs when V2 trigger criteria are met. |

---

## Documents that need updating

After implementing this strategy:
1. **decisions/roadmap.md** — Add website + SEO track, update Doc 11 status to "COMPLETE"
2. **decisions/deploy.md** — Add routing/subdirectory deployment notes
3. **decisions/architecture.md** — Add website architecture patterns (blog system, concept pages, OG generation)

---

**Next step:** Run `/d-tasks` to extract implementable beads tasks from this document.
