import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { Hono } from 'hono'
import { freeIntroPageRoutes } from '@/features/(life)/free-intro/routes'
import { landingRoutes } from '@/features/(life)/landing/routes'
import { env } from '@/platform/env'
import { renderPage } from '@/platform/server/render'
import { getContentFile, listContentFiles } from '@/providers/markdown'
import { AboutPage } from './about'
import {
  blogConfig,
  changelogConfig,
  guidesConfig,
  handbookConfig,
  helpConfig,
  methodConfig,
} from './docs/configs'
import { createContentRoutes } from './docs/content-routes'
import { OpenSourcePage } from './docs/handbook-open-source'
import { SystemMapPage } from './docs/handbook-system-map'
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

// Content routes via factory
const handbookRoutes = createContentRoutes(handbookConfig)
const blogRoutes = createContentRoutes(blogConfig)
const methodRoutes = createContentRoutes(methodConfig)
const guidesRoutes = createContentRoutes(guidesConfig)
const helpRoutes = createContentRoutes(helpConfig)
const changelogRoutes = createContentRoutes(changelogConfig)

// Content directories for OG image lookup (resolved lazily)
const CONTENT_DIRS = [
  'content/blog',
  'content/method',
  'content/handbook',
  'content/guides',
  'content/help',
  'content/changelog',
]

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

// ─── Free Intro at /free ─────────────────────────────────────────────────────
websiteRoutes.route('/free', freeIntroPageRoutes)

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
      title: 'The Right Decision — The Future of Decision-Making with AI',
      description:
        'AI that helps you see the one constraint holding you back, make the decision that changes everything, and turn it into daily actions.',
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

// ─── Handbook special pages (static routes before wildcard) ─────────────────
websiteRoutes.get('/handbook/system-map', async (c) => {
  const dir = join(process.cwd(), 'content/handbook')
  const items = await listContentFiles(dir, { recursive: true })
  const { buildSidebarForConfig } = await import('./docs/content-routes')
  const sidebar = buildSidebarForConfig(items, handbookConfig, null)
  const breadcrumb = buildBreadcrumbSchema([
    { name: 'Home', url: `${env.PUBLIC_APP_URL}/` },
    { name: 'Handbook', url: `${env.PUBLIC_APP_URL}/handbook` },
    { name: 'System Map', url: `${env.PUBLIC_APP_URL}/handbook/system-map` },
  ])
  return c.html(
    renderPage(<SystemMapPage sidebar={sidebar} />, {
      title: 'System Map — The Right Decision',
      description: 'How decisions flow through The Right Decision company operating system.',
      canonical: `${env.PUBLIC_APP_URL}/handbook/system-map`,
    }).replace('</head>', `${renderJsonLd(breadcrumb)}\n</head>`),
  )
})

websiteRoutes.get('/handbook/open-source', async (c) => {
  const dir = join(process.cwd(), 'content/handbook')
  const items = await listContentFiles(dir, { recursive: true })
  const { buildSidebarForConfig } = await import('./docs/content-routes')
  const sidebar = buildSidebarForConfig(items, handbookConfig, null)
  let stars: number | undefined
  try {
    const raw = readFileSync(join(process.cwd(), 'public/github-stars.json'), 'utf-8')
    const data = JSON.parse(raw) as { stars?: number }
    stars = data.stars
  } catch {}
  const breadcrumb = buildBreadcrumbSchema([
    { name: 'Home', url: `${env.PUBLIC_APP_URL}/` },
    { name: 'Handbook', url: `${env.PUBLIC_APP_URL}/handbook` },
    { name: 'Open Source', url: `${env.PUBLIC_APP_URL}/handbook/open-source` },
  ])
  return c.html(
    renderPage(<OpenSourcePage sidebar={sidebar} stars={stars} />, {
      title: 'Open Source Harness — The Right Decision',
      description:
        'Our AI agent harness is open source. Clone it, customize it, run your company the same way.',
      canonical: `${env.PUBLIC_APP_URL}/handbook/open-source`,
    }).replace('</head>', `${renderJsonLd(breadcrumb)}\n</head>`),
  )
})

// ─── Content types (unified DocsLayout) ──────────────────────────────────────
websiteRoutes.route('/handbook', handbookRoutes)
websiteRoutes.route('/blog', blogRoutes)
websiteRoutes.route('/method', methodRoutes)
websiteRoutes.route('/guides', guidesRoutes)
websiteRoutes.route('/help', helpRoutes)
websiteRoutes.route('/changelog', changelogRoutes)

// ─── 301 redirects: /concepts → /method ─────────────────────────────────────
websiteRoutes.get('/concepts', (c) => c.redirect('/method', 301))
websiteRoutes.get('/concepts/:slug', (c) => {
  const slug = c.req.param('slug')
  const query = c.req.url.includes('?') ? c.req.url.slice(c.req.url.indexOf('?')) : ''
  return c.redirect(`/method/${slug}${query}`, 301)
})

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

  // Search all content directories
  let post = null
  for (const dir of CONTENT_DIRS) {
    const fullDir = join(process.cwd(), dir)
    post = await getContentFile(fullDir, slug)
    if (!post) {
      // Try with dashes converted back to slashes (for nested content OG URLs)
      const nestedSlug = slug.replace(/-/g, '/')
      post = await getContentFile(fullDir, nestedSlug, { allowNested: true })
    }
    if (post) break
  }
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
