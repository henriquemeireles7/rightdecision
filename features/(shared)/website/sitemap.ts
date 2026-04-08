import { statSync } from 'node:fs'
import { join } from 'node:path'
import { Hono } from 'hono'
import { getContentFile, listContentFiles } from '@/providers/markdown'

const BLOG_DIR = join(import.meta.dir, '../../../content/blog')
const CONCEPTS_DIR = join(import.meta.dir, '../../../content/concepts')
const BASE_URL = 'https://rightdecisions.io'

export const sitemapRoutes = new Hono()

sitemapRoutes.get('/sitemap.xml', async (c) => {
  const staticPages = [
    { loc: '/', priority: '1.0' },
    { loc: '/about', priority: '0.8' },
    { loc: '/life', priority: '0.9' },
    { loc: '/blog', priority: '0.8' },
    { loc: '/concepts', priority: '0.8' },
    { loc: '/privacy', priority: '0.3' },
    { loc: '/terms', priority: '0.3' },
  ]

  const blogPosts = await listContentFiles(BLOG_DIR)
  const concepts = await listContentFiles(CONCEPTS_DIR)

  const urls = [
    ...staticPages.map(
      (p) => `  <url>
    <loc>${BASE_URL}${p.loc}</loc>
    <priority>${p.priority}</priority>
  </url>`,
    ),
    ...blogPosts.map((post) => {
      let lastmod = ''
      try {
        const filePath = join(BLOG_DIR, `${post.slug}.md`)
        lastmod = `\n    <lastmod>${statSync(filePath).mtime.toISOString().split('T')[0]}</lastmod>`
      } catch {}
      return `  <url>
    <loc>${BASE_URL}/blog/${post.slug}</loc>${lastmod}
    <priority>0.7</priority>
  </url>`
    }),
    ...concepts.map((concept) => {
      let lastmod = ''
      try {
        const filePath = join(CONCEPTS_DIR, `${concept.slug}.md`)
        lastmod = `\n    <lastmod>${statSync(filePath).mtime.toISOString().split('T')[0]}</lastmod>`
      } catch {}
      return `  <url>
    <loc>${BASE_URL}/concepts/${concept.slug}</loc>${lastmod}
    <priority>0.8</priority>
  </url>`
    }),
  ]

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`

  c.header('Content-Type', 'application/xml')
  return c.body(xml)
})

sitemapRoutes.get('/robots.txt', (c) => {
  const robots = `User-agent: *
Allow: /
Disallow: /api/
Disallow: /app/
Disallow: /admin/
Disallow: /purchase/

User-agent: GPTBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: Google-Extended
Allow: /

Sitemap: ${BASE_URL}/sitemap.xml`

  c.header('Content-Type', 'text/plain')
  return c.body(robots)
})

sitemapRoutes.get('/rss.xml', async (c) => {
  const posts = await listContentFiles(BLOG_DIR)
  const latest = posts.slice(0, 20)

  const items = await Promise.all(
    latest.map(async (post) => {
      const full = await getContentFile(BLOG_DIR, post.slug)
      const pubDate = new Date(post.frontmatter.date as string).toUTCString()
      const description = full ? full.html : (post.frontmatter.description as string)

      return `    <item>
      <title>${escapeXml(post.frontmatter.title as string)}</title>
      <link>${BASE_URL}/blog/${post.slug}</link>
      <description><![CDATA[${description}]]></description>
      <pubDate>${pubDate}</pubDate>
      <guid>${BASE_URL}/blog/${post.slug}</guid>
    </item>`
    }),
  )

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>The Right Decision Blog</title>
    <link>${BASE_URL}/blog</link>
    <description>Essays on decision-making, getting unstuck, and why self-help keeps you stuck.</description>
    <language>en</language>
${items.join('\n')}
  </channel>
</rss>`

  c.header('Content-Type', 'application/rss+xml')
  return c.body(rss)
})

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
