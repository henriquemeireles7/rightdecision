# website/docs

## Purpose
The generic content-collection renderer behind the public docs-style surfaces (blog, handbook,
concept/SEO pages). One config-driven engine (`content-routes.tsx` + `configs.tsx` + `types.ts`)
turns a content type into an index page (paginated, sidebar) and per-item pages (docs layout,
prev/next, metadata, optional "view source"). Content comes from markdown via providers/markdown —
never inlined here.

## Critical Rules
- NEVER add client-side JavaScript beyond the small SSR-injected scripts in `docs-scripts.ts` —
  these pages are server-rendered.
- NEVER inline article content in TSX — load it through `getContentFile`/`listContentFiles`
  (providers/markdown); this folder only lays it out.
- ALWAYS render through `renderPage()` and the shared `Layout`; ALWAYS emit JSON-LD
  (article/breadcrumb schema from ../seo) on content pages.
- A new content surface is a CONFIG (`ContentTypeConfig` in configs.tsx), not a new bespoke route —
  add the config + wire it into content-routes; don't fork the renderer.
- NEVER hardcode URLs — build absolute links from `env.PUBLIC_APP_URL`.
- Pagination is fixed (`PER_PAGE`); sidebar sections/sort come from the type config.

## Imports (use from other modules)
```ts
import { contentRoutes } from '@/features/(shared)/website/docs/content-routes'
import type { ContentTypeConfig, SidebarSection } from '@/features/(shared)/website/docs/types'
```

## Recipe: New content collection
```ts
// 1. Add a ContentTypeConfig (slug, content dir, sidebar/sort strategy) in configs.tsx.
// 2. Register it with content-routes.tsx so index + item routes are generated.
// 3. Drop the markdown under the configured content dir — providers/markdown loads it.
```

## Verify
```sh
bun test "features/(shared)/website" && bunx tsc --noEmit
```
