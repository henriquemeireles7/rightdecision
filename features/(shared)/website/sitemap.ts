import { statSync } from 'node:fs'
import { join } from 'node:path'
import { Hono } from 'hono'
import { env } from '@/platform/env'
import { getContentFile, listContentFiles } from '@/providers/markdown'

// Lazy directory resolution (avoids import.meta.dir pitfall in bundled builds)
function contentDir(subdir: string): string {
  return join(process.cwd(), 'content', subdir)
}

type ContentSection = {
  dir: string
  urlPrefix: string
  priority: string
  recursive?: boolean
}

export const sitemapRoutes = new Hono()

// IndexNow key verification (only if key is configured)
if (env.INDEXNOW_KEY) {
  sitemapRoutes.get(`/${env.INDEXNOW_KEY}.txt`, (c) => {
    c.header('Content-Type', 'text/plain')
    return c.body(env.INDEXNOW_KEY!)
  })
}

sitemapRoutes.get('/sitemap.xml', async (c) => {
  const staticPages = [
    { loc: '/', priority: '1.0' },
    { loc: '/about', priority: '0.8' },
    { loc: '/life', priority: '0.9' },
    { loc: '/handbook', priority: '0.9' },
    { loc: '/blog', priority: '0.8' },
    { loc: '/method', priority: '0.8' },
    { loc: '/guides', priority: '0.7' },
    { loc: '/help', priority: '0.6' },
    { loc: '/changelog', priority: '0.5' },
    { loc: '/privacy', priority: '0.3' },
    { loc: '/terms', priority: '0.3' },
  ]

  const contentSections: ContentSection[] = [
    { dir: 'handbook', urlPrefix: '/handbook', priority: '0.8', recursive: true },
    { dir: 'blog', urlPrefix: '/blog', priority: '0.7' },
    { dir: 'method', urlPrefix: '/method', priority: '0.8' },
    { dir: 'guides', urlPrefix: '/guides', priority: '0.7' },
    { dir: 'help', urlPrefix: '/help', priority: '0.6', recursive: true },
    { dir: 'changelog', urlPrefix: '/changelog', priority: '0.5' },
  ]

  const staticUrls = staticPages.map(
    (p) => `  <url>
    <loc>${env.PUBLIC_APP_URL}${p.loc}</loc>
    <priority>${p.priority}</priority>
  </url>`,
  )

  const contentUrls: string[] = []
  for (const section of contentSections) {
    const dir = contentDir(section.dir)
    const items = await listContentFiles(dir, { recursive: section.recursive })
    for (const item of items) {
      let lastmod = ''
      try {
        const filePath = join(dir, `${item.slug}.md`)
        lastmod = `\n    <lastmod>${statSync(filePath).mtime.toISOString().split('T')[0]}</lastmod>`
      } catch {}
      contentUrls.push(`  <url>
    <loc>${env.PUBLIC_APP_URL}${section.urlPrefix}/${item.slug}</loc>${lastmod}
    <priority>${section.priority}</priority>
  </url>`)
    }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...staticUrls, ...contentUrls].join('\n')}
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

Sitemap: ${env.PUBLIC_APP_URL}/sitemap.xml`

  c.header('Content-Type', 'text/plain')
  return c.body(robots)
})

sitemapRoutes.get('/rss.xml', async (c) => {
  const posts = await listContentFiles(contentDir('blog'))
  const latest = posts.slice(0, 20)

  const items = await Promise.all(
    latest.map(async (post) => {
      const full = await getContentFile(contentDir('blog'), post.slug)
      const pubDate = new Date(post.frontmatter.date as string).toUTCString()
      const description = full ? full.html : (post.frontmatter.description as string)

      return `    <item>
      <title>${escapeXml(post.frontmatter.title as string)}</title>
      <link>${env.PUBLIC_APP_URL}/blog/${post.slug}</link>
      <description><![CDATA[${description}]]></description>
      <pubDate>${pubDate}</pubDate>
      <guid>${env.PUBLIC_APP_URL}/blog/${post.slug}</guid>
    </item>`
    }),
  )

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>The Right Decision Blog</title>
    <link>${env.PUBLIC_APP_URL}/blog</link>
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
