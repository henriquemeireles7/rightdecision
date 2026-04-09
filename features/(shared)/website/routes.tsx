import { join } from 'node:path'
import { Hono } from 'hono'
import { landingRoutes } from '@/features/(life)/landing/routes'
import { env } from '@/platform/env'
import { renderPage } from '@/platform/server/render'
import { getContentFile } from '@/providers/markdown'
import { AboutPage } from './about'
import { blogRoutes } from './blog-routes'
import { conceptRoutes } from './concept-routes'
import { getHomepageProps, Homepage } from './homepage'
import { legalRoutes } from './legal-routes'
import { generateOgImage } from './og-image'
import {
  buildBreadcrumbSchema,
  buildOrganizationSchema,
  buildPersonSchema,
  buildWebSiteSchema,
  renderJsonLd,
} from './seo'
import { sitemapRoutes } from './sitemap'

const BLOG_DIR = join(process.cwd(), 'content/blog')
const CONCEPTS_DIR = join(process.cwd(), 'content/concepts')

export const websiteRoutes = new Hono()

// ─── www → naked domain redirect ─────────────────────────────────────────────
websiteRoutes.use('*', async (c, next) => {
  const host = c.req.header('host')
  if (host?.startsWith('www.')) {
    const url = new URL(c.req.url)
    url.host = url.host.replace(/^www\./, '')
    return c.redirect(url.toString(), 301)
  }
  await next()
})

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
      ogImage: `${baseUrl}/og/why-we-built-the-right-decision.png`,
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
      ogImage: `${baseUrl}/og/why-we-built-the-right-decision.png`,
      canonical: `${baseUrl}/about`,
    }).replace('</head>', `${jsonLd}\n</head>`),
  )
})

// ─── Blog ────────────────────────────────────────────────────────────────────
websiteRoutes.route('/blog', blogRoutes)

// ─── Concepts ─────────────────────────────────────────────────────────────────
websiteRoutes.route('/concepts', conceptRoutes)

// ─── OG Image Generation ──────────────────────────────────────────────────────
const ogImageCache = new Map<string, ArrayBuffer>()

websiteRoutes.get('/og/:filename', async (c) => {
  const filename = c.req.param('filename')
  if (!filename?.endsWith('.png')) return c.notFound()
  const slug = filename.replace(/\.png$/, '')

  const cached = ogImageCache.get(slug)
  if (cached) {
    c.header('Content-Type', 'image/png')
    c.header('Cache-Control', 'public, max-age=31536000, immutable')
    return c.body(cached)
  }

  // Try blog first, then concepts
  const post = (await getContentFile(BLOG_DIR, slug)) ?? (await getContentFile(CONCEPTS_DIR, slug))
  if (!post) return c.notFound()

  const png = await generateOgImage(post.frontmatter.title as string)
  const ab = new ArrayBuffer(png.byteLength)
  new Uint8Array(ab).set(png)
  ogImageCache.set(slug, ab)

  c.header('Content-Type', 'image/png')
  c.header('Cache-Control', 'public, max-age=31536000, immutable')
  return c.body(ab)
})

// ─── Legal pages ─────────────────────────────────────────────────────────────
websiteRoutes.route('/', legalRoutes)
