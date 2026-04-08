import { Hono } from 'hono'
import { renderPage } from '@/platform/server/render'
import { landingRoutes } from '@/features/(life)/landing/routes'
import { blogRoutes } from './blog-routes'
import { conceptRoutes } from './concept-routes'
import { sitemapRoutes } from './sitemap'
import { legalRoutes } from './legal-routes'
import { AboutPage } from './about'
import { Homepage, getHomepageProps } from './homepage'
import { Layout } from './layout'

export const websiteRoutes = new Hono()

// ─── Trailing slash redirect ─────────────────────────────────────────────────
websiteRoutes.use('*', async (c, next) => {
  const url = new URL(c.req.url)
  if (url.pathname !== '/' && url.pathname.endsWith('/')) {
    url.pathname = url.pathname.replace(/\/+$/, '')
    return c.redirect(url.toString(), 301)
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
  return c.html(
    renderPage(<Homepage {...props} />, {
      title: 'The Right Decision — Solving Decision-Making with AI',
      description:
        'A methodology + AI platform for personal and business decisions. Life transformation through action, not introspection.',
    }),
  )
})

// ─── About ───────────────────────────────────────────────────────────────────
websiteRoutes.get('/about', (c) => {
  return c.html(
    renderPage(<AboutPage />, {
      title: 'About The Right Decision — Henry & Indy',
      description:
        'The story behind The Right Decision. Built by Henry and Indy to help you stop understanding and start deciding.',
    }),
  )
})

// ─── Blog ────────────────────────────────────────────────────────────────────
websiteRoutes.route('/blog', blogRoutes)

// ─── Concepts ─────────────────────────────────────────────────────────────────
websiteRoutes.route('/concepts', conceptRoutes)

// ─── Legal pages ─────────────────────────────────────────────────────────────
websiteRoutes.route('/', legalRoutes)
