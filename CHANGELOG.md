# Changelog

All notable changes to this project will be documented in this file.

## [0.1.3.0] - 2026-04-08

### Added
- Company website with manifesto homepage, about page, legal pages (privacy + terms)
- Blog system: markdown CMS (files as content), cluster filters (4 categories), pagination, Article JSON-LD
- 7 SEO concept pages targeting search keywords: analysis paralysis, decision fatigue, feeling stuck, big life decisions, overthinking, stop overthinking, self-help critique
- Concept pages with FAQ schema, DefinedTerm schema, and GEO optimization for AI citations
- First blog post: "Why We Built The Right Decision" (founding story)
- SEO infrastructure: meta tags, OG tags, JSON-LD schemas (Organization, Article, FAQ, Person, Breadcrumb)
- Dynamic sitemap.xml, robots.txt (AI crawlers allowed), RSS feed
- Shared website layout with header navigation and footer
- Website & SEO/GEO strategy document (decisions/11-website-seo/)

### Fixed
- Path traversal protection in markdown content provider
- JSON-LD XSS prevention (escape `<` in script tags)
- Timezone-safe date formatting across all pages
- Trailing slash redirect changed from permanent 301 to 308

## [0.1.2.1] - 2026-04-07

### Changed
- Design system enriched with CSS implementation techniques: fluid typography (clamp), OKLCH color space, 60-30-10 distribution, interaction states checklist, semantic z-index scale, accessibility rules, responsive patterns, and AI slop test
- Frontend implementation rules added to coding guide: gap-based spacing, auto-fit grids, native dialog/popover, focus-visible, container queries, motion performance, and touch target minimums

## [0.1.2.0] - 2026-04-08

### Added
- Two-tier health endpoint: `/health` (liveness for Railway deploys) + `/health/ready` (readiness checking DB, Stripe, Resend, R2)
- Railway config-as-code (`railway.toml`): Dockerfile builder, healthcheck, restart policy, replicas
- Config-as-Code documentation in `decisions/deploy.md`

### Fixed
- Health check error messages sanitized to prevent leaking internal connection details

## [0.1.1.1] - 2026-04-08

### Added
- Footer with "Already a student? Log in" link on the landing page

### Removed
- Duplicate legacy feature folders (account, admin, course, email, onboarding, paywall, wins) that existed outside parenthesized groups

## [0.1.1.0] - 2026-04-08

### Added
- Life Decisions landing page: 11-section sales page at therightdecision.com
- SSR infrastructure: renderPage() function wraps any Preact component in full HTML document
- Tailwind CSS v4 pipeline with design tokens from design.md (cream, gold, sand palette)
- Static file serving via Hono serveStatic middleware
- 4 A/B headline variants with server-side cookie persistence
- GET /api/checkout/redirect endpoint for zero-JS CTA buttons (303 to Stripe)
- 12 new components: CTAButton, Hero, Problem, Mechanism, Transformation, Curriculum, Founder, SocialProof, Offer, Disqualification, FAQ, FinalCTA
- Mobile section reordering via CSS flexbox order (Offer moves to position 3)
- Skip-to-content accessibility link, OG meta tags, XSS-safe meta escaping
- 31 new tests (12 renderPage unit + 19 landing page integration)

### Fixed
- Dockerfile: copy public/ to runtime stage (CSS was missing in production)
- Checkout redirect: null-check session.url, redirect to landing page on error
- Cookie security: added secure flag to A/B variant cookie

## [0.1.0.0] - 2026-04-08

### Added
- BD Podcast Distribution Pipeline: 7-step automated pipeline from video to social posts
- Skill-driven AI architecture: zero API keys, all AI runs in user's Claude Code subscription
- 4 providers: storage (R2), transcription (Whisper), social-posting (Upload-Post), social-analytics
- 7 feature endpoints: transcribe, clip-select, clip-cut, metadata-generate, post-distribute, analytics-collect, insight-generate
- 5 Claude Code skills: /process-episode, /select-clips, /generate-metadata, /whats-working, /collect-analytics
- Seed script for 13 platform accounts across TikTok, Instagram, Facebook, X, YouTube
- Auth middleware on all BD pipeline routes
- Atomic CAS on all pipeline state transitions (race condition prevention)
- Transaction wrapping for clip-select and metadata-generate operations
- Retry with backoff on Upload-Post API calls (429/503 handling)
- Subprocess safety: concurrent stdout/stderr reads prevent pipe deadlock
- ffmpeg timeout (5 min per clip) prevents hung processes
- S3 NoSuchKey properly maps to 404 for video-not-found detection
- Path traversal prevention on R2 object keys

### Changed
- Removed ANTHROPIC_API_KEY from env.ts (skill-driven architecture, no AI API calls from server)
- Replaced AI_FAILED error codes with VALIDATION_FAILED (server receives results, doesn't call AI)
