# Changelog

All notable changes to this project will be documented in this file.

## [0.2.0.1] - 2026-04-08

### Fixed
- OG image font loading crash on Railway deploy — `import.meta.dir` resolved incorrectly after bundling to `dist/`, causing ENOENT for `InstrumentSerif-Regular.ttf`. Switched to `process.cwd()` which resolves correctly in both dev and production.

## [0.2.0.0] - 2026-04-08

### Added
- Editorial reading room: course content renders as formatted markdown with pull quotes (`[!quote]`), insight callouts (`[!insight]`), and drop caps via `renderCourseMarkdown()`
- Micro-decisions: in-class decision prompts where reading becomes active practice. 5-minute edit window, then locked forever. Atomic upsert prevents race conditions.
- Your Journey page: vertical timeline of all decisions made throughout the course. Retention hook where the screenshot IS the marketing.
- Reading analytics: time spent, scroll depth, completion tracking. Fire-and-forget client tracker (<1KB) with sendBeacon.
- Share card generation: server-side satori + resvg branded decision cards (1200x630). SVG fallback for Bun compatibility.
- Multi-course architecture: `courses.json` registry, content moved to `content/courses/life-decisions/`. Future-proof for 10+ courses.
- Mobile bottom navigation: prev/next/bookmark/menu with 44px touch targets, safe area insets, full-screen menu overlay
- Session memory: localStorage scroll position save/restore with 7-day expiry
- Module landing page: class list with completion status per module
- Course listing page: card-based course browser at `/courses`
- SSR page routes: `/courses`, `/courses/:slug`, `/courses/:slug/module/:num`, `/courses/:slug/class/:classId`, `/journey`
- Editorial CSS: `.prose-editorial` (65ch max-width, Instrument Serif/Sans, 1.6 line-height), View Transitions API
- DB migration 0004: `user_decisions` + `reading_analytics` tables with unique indexes
- Decision prompts in 9 practice `.mdx` files with `decision_prompt` frontmatter

### Changed
- Dashboard redesigned as book-style table of contents with individual class titles
- Navigation updated with Journey link for paid users, `/courses/life-decisions` URLs
- Content directory moved from `content/course/` to `content/courses/life-decisions/`

### Fixed
- Route collision: journey page mounting at root intercepted homepage
- Slash-in-param routing: `/:classId` changed to `/:classId{.+}` for `module-XX/class-YY` format
- Race condition in decision saves: replaced TOCTOU with atomic INSERT ON CONFLICT
- N+1 query in dashboard: module progress computed from pre-fetched data
- Unbounded queries: added LIMIT to getUserDecisions (200) and getReadingStats (500)
- Share card cache: LRU eviction at 500 entries, fetch timeouts on font loading

## [0.1.5.0] - 2026-04-08

### Added
- Complete SEO/GEO foundation from Doc 11 strategy (25 beads implemented)
- JSON-LD structured data on all page types: Organization, WebSite, Article, FAQPage, DefinedTerm, Product, Person, BreadcrumbList
- Programmatic OG image generation at /og/:slug.png (satori + resvg, cream bg, gold footer, Instrument Serif)
- IndexNow provider for instant search engine notification + post-deploy submission script
- Google Search Console API provider with JWT auth for indexing status and analytics
- Self-hosted Instrument Serif + Sans fonts (removed Google Fonts CDN dependency)
- Content freshness tracker (bun run freshness), quality validator (bun run content:check), SEO health dashboard (bun run seo-health)
- New concept page: "What Is a Life Coach?" (~1,800 words, 5 FAQ pairs, internal links)
- /life CTA added to all 7 existing concept pages

### Changed
- Replaced hardcoded BASE_URL with env.PUBLIC_APP_URL across 5 route files + seo.ts schema builders
- Moved JSON-LD from hidden body divs to `<head>` injection on homepage and about page
- Blog/concept pages now render og:type=article, keywords meta tag, and og:image pointing to /og/:slug.png
- Added ogType + twitter:image + twitter:card support to render.tsx
- Organization schema now includes logo field
- Person schema includes description + sameAs (ready for LinkedIn/Crunchbase)

### Fixed
- OG image route param parsing (Hono treats :slug.png as single param)
- Satori font format (woff2 not supported, switched to TTF for OG generation)
- Added AbortSignal.timeout to all fetch calls in indexnow.ts and search-console.ts
- Token cache invalidation on 401 in Search Console provider
- JSON parse safety for corrupted IndexNow submission log
- CSS formatting for @font-face unicode-range (biome compliance)
- Two test files asserting Google Fonts CDN (updated for self-hosted fonts)

## [0.1.4.1] - 2026-04-08

### Fixed
- Railway deploy: renamed auth routes file from `.ts` to `.tsx` so Bun's bundler recognizes JSX syntax during production build

## [0.1.4.0] - 2026-04-08

### Added
- Email template system: branded HTML layout (warm cream + amber CTA) + plain-text fallback with 13 templates (4 auth + 6 payment + 3 migrated reminders)
- Better Auth email verification (24h token, auto sign-in) and password recovery (30min token, session revocation)
- Stripe webhook hardening: INSERT-first idempotency, 3 new event handlers (invoice.payment_succeeded/failed/upcoming), safeSendEmail wrapper
- Access-gating middleware: requireActiveSubscription checks subscription status + period end
- Stripe Customer Portal endpoint for self-service billing
- Post-purchase checkout completion flow with session_id-based subscription linking
- Frontend auth pages: forgot-password, reset-password, verify-email, purchase success
- webhookEvents DB table for idempotency tracking
- getUserForSubscription helper (DRY across webhook handlers)
- escapeHtml utility to prevent XSS in email templates
- Strategy document: decisions/11-email-auth-payments/ (meta, input, document)

### Changed
- sendEmail signature updated to accept { subject, html, text } for plain-text support
- reminders.ts migrated to branded templates with dedup fix (time-window approach)
- Webhook handler: fixed status conflation (canceled/unpaid now correctly mapped to cancelled)
- Subscription.updated handler preserves Stripe's actual status instead of defaulting to past_due

### Fixed
- Race condition in checkout completion: atomic subscription linking with WHERE userId IS NULL
- Email hijack prevention: checkout completion validates email matches Stripe session
- Access-gate period check: handles cancel_at_period_end case (checks currentPeriodEnd date)
- Nested HTML in plain-text link conversion regex

## [0.1.3.0] - 2026-04-08

### Added
- PostHog analytics: server-side provider (track, identify, shutdown), client-side JS SDK (lazy-loaded), 13 event taxonomy, session replay, 3 feature flags, 5 dashboards
- Test infrastructure: platform/test/ with DB setup, 7 factories, 4 helpers, shared mockSchema()
- 120 new tests: 9 service test files + BD pipeline integration test (306 total)
- Error tracking middleware: server onError + client window.onerror/onunhandledrejection
- Nightwatch daily trigger: automated health check, dep patches, doc sync, QA at 2:03am
- New skills: d-autoreview (unified review chain), DRY reuse checklist in d-tasks/d-code
- Universal file sync step in d-plan and /ship workflows
- Local test database documentation in CLAUDE.md

### Changed
- CI pipeline: PostgreSQL service container, test coverage, placeholder env vars, bunx tsc
- Railway: preDeployCommand for automatic DB migrations
- Biome config: fixed invalid 'ignore' key, added gstack/beads exclusions
- Analytics provider: sync track/identify with try/catch (non-critical, never crashes)

### Fixed
- XSS in render.tsx: PostHog key escaped with JSON.stringify + unicode for JS context
- Stack traces removed from PostHog error events (data exposure risk)
- subscription_cancelled event now includes customer distinctId
- GitHub Dependabot enabled for automated dependency vulnerability scanning
- Stop hook: removed git add auto-staging (caused 600+ formatting cascades between agents)
- Conductor setup: .env check uses -s (non-empty) instead of -f (exists), preventing empty .env
- Conductor setup: Agent Mail server + dev server auto-start on workspace creation
- Agent Mail MCP protocol documented in CLAUDE.md with concrete tool names
- Reverted 158 gstack vendor files incorrectly reformatted by old stop hook

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
