# website

## Purpose
Company website infrastructure: routing, shared layout (header/footer), SEO utilities, blog system, concept pages. All public-facing pages except the Life Decisions LP (which has its own layout in features/(life)/landing/).

## Critical Rules
- NEVER add client-side JavaScript to content pages — blog/concepts are 100% SSR
- ALWAYS use renderPage() from platform/server/render.tsx for the HTML shell
- ALWAYS use the shared Layout component for all pages EXCEPT /life (LP has its own layout)
- ALWAYS include JSON-LD structured data on every page (using seo.ts helpers)
- NEVER hardcode URLs — use env.PUBLIC_APP_URL for absolute URLs
- Blog/concept content comes from providers/markdown.ts — NEVER inline content in TSX

## Imports (use from other modules)
```ts
import { renderPage } from '@/platform/server/render'
import { env } from '@/platform/env'
import { listContentFiles, getContentFile } from '@/providers/markdown'
```

## Recipe: New Page Route
```tsx
// In routes.ts, add to the websiteRoutes Hono instance:
websiteRoutes.get('/my-page', (c) => {
  return c.html(renderPage(
    <Layout><MyPage /></Layout>,
    { title: 'Page Title', description: '...' }
  ))
})
```

---
<!-- AUTO-GENERATED BELOW — do not edit manually -->

## Files
| File | Exports |
|------|---------|
| about.tsx | AboutPage |
| blog-index.tsx | BlogIndex |
| blog-post.tsx | BlogPost |
| blog-routes.tsx | blogRoutes |
| concept-index.tsx | ConceptIndex |
| concept-page.tsx | ConceptPage |
| concept-routes.tsx | conceptRoutes |
| homepage.tsx | Homepage, getHomepageProps |
| layout.tsx | Layout |
| legal-routes.tsx | legalRoutes |
| og-image.ts | generateOgImage |
| routes.tsx | websiteRoutes |
| seo.ts | SeoConfig, renderMetaTags, renderJsonLd, buildArticleSchema, buildFaqSchema, buildOrganizationSchema, buildWebSiteSchema, buildPersonSchema, buildProductSchema, buildBreadcrumbSchema |
| sitemap.ts | sitemapRoutes |

## Internal Dependencies
- features/(life)
- platform/env
- platform/server
- providers/markdown

<!-- Generated: 2026-04-09T04:30:40.967Z -->
