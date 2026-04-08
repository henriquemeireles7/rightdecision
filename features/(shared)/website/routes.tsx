import { Hono } from 'hono'
import { landingRoutes } from '@/features/(life)/landing/routes'
import { env } from '@/platform/env'
import { renderPage } from '@/platform/server/render'
import { AboutPage } from './about'
import { blogRoutes } from './blog-routes'
import { conceptRoutes } from './concept-routes'
import { getHomepageProps, Homepage } from './homepage'
import { legalRoutes } from './legal-routes'
import {
  buildBreadcrumbSchema,
  buildOrganizationSchema,
  buildPersonSchema,
  buildWebSiteSchema,
  renderJsonLd,
} from './seo'
import { sitemapRoutes } from './sitemap'

export const websiteRoutes = new Hono()

// ─── Trailing slash redirect ─────────────────────────────────────────────────
websiteRoutes.use('*', async (c, next) => {
  const url = new URL(c.req.url)
  if (url.pathname !== '/' && url.pathname.endsWith('/')) {
    url.pathname = url.pathname.replace(/\/+$/, '')
    return c.redirect(url.pathname + url.search, 308)
  }
  await next()
})

// ─── Sitemap, robots.txt, RSS ─────────────────────────────────────────────────
websiteRoutes.route('/', sitemapRoutes)

// ─── Life Decisions LP at /life ──────────────────────────────────────────────
websiteRoutes.route('/life', landingRoutes)

// ─── Homepage ────────────────────────────────────────────────────────────────
websiteRoutes.get('/', async (c) => {
  const props = await getHomepageProps()
  const baseUrl = env.PUBLIC_APP_URL
  const jsonLd = [
    renderJsonLd(buildOrganizationSchema(baseUrl)),
    renderJsonLd(buildWebSiteSchema(baseUrl)),
  ].join('\n')

  return c.html(
    renderPage(<Homepage {...props} />, {
      title: 'The Right Decision — Solving Decision-Making with AI',
      description:
        'A methodology + AI platform for personal and business decisions. Life transformation through action, not introspection.',
      canonical: baseUrl,
    }).replace('</head>', `${jsonLd}\n</head>`),
  )
})

// ─── About ───────────────────────────────────────────────────────────────────
websiteRoutes.get('/about', (c) => {
  const baseUrl = env.PUBLIC_APP_URL
  const jsonLd = [
    renderJsonLd(buildPersonSchema('henry', baseUrl)),
    renderJsonLd(buildPersonSchema('indy', baseUrl)),
    renderJsonLd(
      buildBreadcrumbSchema([
        { name: 'Home', url: `${baseUrl}/` },
        { name: 'About', url: `${baseUrl}/about` },
      ]),
    ),
  ].join('\n')

  return c.html(
    renderPage(<AboutPage />, {
      title: 'About The Right Decision — Henry & Indy',
      description:
        'The story behind The Right Decision. Built by Henry and Indy to help you stop understanding and start deciding.',
      canonical: `${baseUrl}/about`,
    }).replace('</head>', `${jsonLd}\n</head>`),
  )
})

// ─── Blog ────────────────────────────────────────────────────────────────────
websiteRoutes.route('/blog', blogRoutes)

// ─── Concepts ─────────────────────────────────────────────────────────────────
websiteRoutes.route('/concepts', conceptRoutes)

// ─── Legal pages ─────────────────────────────────────────────────────────────
websiteRoutes.route('/', legalRoutes)
