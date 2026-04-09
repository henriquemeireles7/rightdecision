import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { Hono } from 'hono'
import { env } from '@/platform/env'
import { renderPage } from '@/platform/server/render'
import type { ParsedContentItem } from '@/providers/markdown'
import { getContentFile, listContentFiles } from '@/providers/markdown'
import { Layout } from '../layout'
import { buildArticleSchema, buildBreadcrumbSchema, renderJsonLd } from '../seo'
import { DocsLayout } from './docs-layout'
import { DocsContent } from './docs-page'
import { getDocsScripts } from './docs-scripts'
import type { ContentTypeConfig, SidebarItem, SidebarSection, SortStrategy } from './types'

const PER_PAGE = 20

// ─── Lazy content directory resolution ──────────────────────────────────────
let _baseDir: string | null = null
function getBaseDir(): string {
  if (!_baseDir) _baseDir = process.cwd()
  return _baseDir
}

// ─── Timestamps from build script ───────────────────────────────────────────
let _timestamps: Record<string, string> | null = null
function getTimestamps(): Record<string, string> {
  if (!_timestamps) {
    try {
      const raw = readFileSync(join(getBaseDir(), 'public/content-timestamps.json'), 'utf-8')
      _timestamps = JSON.parse(raw) as Record<string, string>
    } catch {
      _timestamps = {}
    }
  }
  return _timestamps
}

function getLastUpdated(contentDir: string, slug: string): string | undefined {
  const key = `${contentDir}/${slug}.md`
  const ts = getTimestamps()[key]
  if (!ts) return undefined
  const date = new Date(ts)
  const now = new Date()
  const days = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
  if (days === 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 30) return `${days}d ago`
  if (days < 365) return `${Math.floor(days / 30)}mo ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function getContentDir(config: ContentTypeConfig): string {
  return join(getBaseDir(), config.contentDir)
}

// ─── Sorting ────────────────────────────────────────────────────────────────

function sortItems(items: ParsedContentItem[], strategy: SortStrategy): ParsedContentItem[] {
  const sorted = [...items]
  switch (strategy) {
    case 'date':
      sorted.sort((a, b) => {
        const da = (a.frontmatter.date as string) || ''
        const db = (b.frontmatter.date as string) || ''
        return db.localeCompare(da)
      })
      break
    case 'order':
      sorted.sort((a, b) => {
        const oa = (a.frontmatter.order as number) ?? 999
        const ob = (b.frontmatter.order as number) ?? 999
        return oa - ob
      })
      break
    case 'alpha':
      sorted.sort((a, b) => {
        const ta = (a.frontmatter.title as string) || ''
        const tb = (b.frontmatter.title as string) || ''
        return ta.localeCompare(tb)
      })
      break
  }
  return sorted
}

// ─── Sidebar building ───────────────────────────────────────────────────────

export function buildSidebarForConfig(
  items: ParsedContentItem[],
  config: ContentTypeConfig,
  activeSlug: string | null,
): SidebarSection[] {
  return buildSidebar(items, config, activeSlug)
}

function buildSidebar(
  items: ParsedContentItem[],
  config: ContentTypeConfig,
  activeSlug: string | null,
): SidebarSection[] {
  if (!config.nested) {
    return [
      {
        title: '',
        items: items.map((item) => {
          let subtitle: string | undefined
          if (config.sortBy === 'date' && item.frontmatter.date) {
            const d = new Date(`${item.frontmatter.date as string}T12:00:00Z`)
            subtitle = d.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              timeZone: 'UTC',
            })
          }
          return {
            title: (item.frontmatter.title as string) || item.slug,
            slug: item.slug,
            href: `/${config.contentType}/${item.slug}`,
            active: item.slug === activeSlug,
            subtitle,
          }
        }),
      },
    ]
  }

  // Group by section (first path segment)
  const sections = new Map<string, SidebarItem[]>()
  for (const item of items) {
    const parts = item.slug.split('/')
    const section = parts.length > 1 ? parts[0]! : ''
    if (!sections.has(section)) sections.set(section, [])
    sections.get(section)!.push({
      title: (item.frontmatter.title as string) || item.slug,
      slug: item.slug,
      href: `/${config.contentType}/${item.slug}`,
      active: item.slug === activeSlug,
    })
  }

  return Array.from(sections.entries()).map(([title, items]) => ({
    title: title.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    items,
  }))
}

// ─── Prev/Next navigation ───────────────────────────────────────────────────

function findPrevNext(
  items: ParsedContentItem[],
  activeSlug: string,
  contentType: string,
): { prev?: { title: string; href: string }; next?: { title: string; href: string } } {
  const idx = items.findIndex((i) => i.slug === activeSlug)
  if (idx === -1) return {}

  const prev =
    idx > 0
      ? {
          title: (items[idx - 1]!.frontmatter.title as string) || items[idx - 1]!.slug,
          href: `/${contentType}/${items[idx - 1]!.slug}`,
        }
      : undefined

  const next =
    idx < items.length - 1
      ? {
          title: (items[idx + 1]!.frontmatter.title as string) || items[idx + 1]!.slug,
          href: `/${contentType}/${items[idx + 1]!.slug}`,
        }
      : undefined

  return { prev, next }
}

// ─── Route Factory ──────────────────────────────────────────────────────────

export function createContentRoutes(config: ContentTypeConfig) {
  const routes = new Hono()

  // Index page
  routes.get('/', async (c) => {
    const dir = getContentDir(config)
    const allItems = await listContentFiles(dir, { recursive: config.nested })
    const sorted = sortItems(allItems, config.sortBy)

    const page = Math.max(1, Number.parseInt(c.req.query('page') || '1', 10))
    const totalPages = Math.max(1, Math.ceil(sorted.length / PER_PAGE))
    const currentPage = Math.min(page, totalPages)
    const paginated = sorted.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE)

    const sidebar = buildSidebar(sorted, config, null)

    const breadcrumb = buildBreadcrumbSchema([
      { name: 'Home', url: `${env.PUBLIC_APP_URL}/` },
      { name: config.tabLabel, url: `${env.PUBLIC_APP_URL}/${config.contentType}` },
    ])

    return c.html(
      renderPage(
        <Layout>
          <DocsLayout contentType={config.contentType} sidebar={sidebar} showOnThisPage={false}>
            {config.renderCustomIndex ? (
              config.renderCustomIndex(sorted)
            ) : (
              <>
                <h1 class="font-display text-3xl text-ink mb-lg">{config.tabLabel}</h1>
                {paginated.length === 0 ? (
                  <p class="text-muted">No articles yet.</p>
                ) : (
                  <div class="space-y-lg">
                    {paginated.map((item) => (
                      <a
                        key={item.slug}
                        href={`/${config.contentType}/${item.slug}`}
                        class="block no-underline group"
                      >
                        <h2 class="font-display text-xl text-ink group-hover:text-gold transition-colors mb-xs">
                          {item.frontmatter.title as string}
                        </h2>
                        {item.frontmatter.description && (
                          <p class="text-secondary text-sm">
                            {item.frontmatter.description as string}
                          </p>
                        )}
                      </a>
                    ))}
                  </div>
                )}

                {!config.renderCustomIndex && totalPages > 1 && (
                  <div class="flex justify-between mt-xl pt-lg border-t border-linen">
                    {currentPage > 1 ? (
                      <a
                        href={`/${config.contentType}?page=${currentPage - 1}`}
                        class="text-gold no-underline hover:underline text-sm"
                      >
                        ← Newer
                      </a>
                    ) : (
                      <span />
                    )}
                    <span class="text-muted text-sm">
                      Page {currentPage} of {totalPages}
                    </span>
                    {currentPage < totalPages ? (
                      <a
                        href={`/${config.contentType}?page=${currentPage + 1}`}
                        class="text-gold no-underline hover:underline text-sm"
                      >
                        Older →
                      </a>
                    ) : (
                      <span />
                    )}
                  </div>
                )}
              </>
            )}
          </DocsLayout>
        </Layout>,
        {
          title: `${config.indexTitle} — The Right Decision`,
          description: config.indexDescription,
          canonical: `${env.PUBLIC_APP_URL}/${config.contentType}`,
        },
      )
        .replace('</head>', `${renderJsonLd(breadcrumb)}\n</head>`)
        .replace('</body>', `${getDocsScripts()}\n</body>`),
    )
  })

  // Detail page
  routes.get('/:slug{.+}', async (c) => {
    const slug = c.req.param('slug')
    const dir = getContentDir(config)
    const content = await getContentFile(dir, slug, { allowNested: config.nested })

    if (!content) return c.notFound()

    const fm = content.frontmatter
    const allItems = await listContentFiles(dir, { recursive: config.nested })
    const sorted = sortItems(allItems, config.sortBy)
    const sidebar = buildSidebar(sorted, config, slug)
    const { prev, next } = findPrevNext(sorted, slug, config.contentType)

    const baseUrl = env.PUBLIC_APP_URL
    const pageUrl = `${baseUrl}/${config.contentType}/${slug}`

    const articleSchema = buildArticleSchema({
      title: fm.title as string,
      description: (fm.description as string) || '',
      author: (fm.author as string) || 'henry',
      datePublished: (fm.date as string) || '2026-04-09',
      url: pageUrl,
      baseUrl,
    })

    const breadcrumb = buildBreadcrumbSchema([
      { name: 'Home', url: `${baseUrl}/` },
      { name: config.tabLabel, url: `${baseUrl}/${config.contentType}` },
      { name: fm.title as string, url: pageUrl },
    ])

    const sourceUrl = config.showViewSource
      ? `https://github.com/henriquemeireles7/getzeny/blob/master/${config.contentDir}/${slug}.md`
      : undefined

    return c.html(
      renderPage(
        <Layout>
          <DocsLayout
            contentType={config.contentType}
            sidebar={sidebar}
            headings={content.headings}
            showOnThisPage={config.showOnThisPage}
          >
            <DocsContent
              title={fm.title as string}
              html={content.html}
              readTime={content.readTime}
              lastUpdated={getLastUpdated(config.contentDir, slug)}
              showViewSource={config.showViewSource}
              sourceUrl={sourceUrl}
              prev={prev}
              next={next}
              contentType={config.contentType}
            />
          </DocsLayout>
        </Layout>,
        {
          title: `${fm.title as string} — The Right Decision`,
          description: (fm.description as string) || '',
          keywords: (fm.keywords as string[]) ?? [],
          ogImage: `${baseUrl}/og/${slug.replace(/\//g, '-')}.png`,
          ogType: 'article',
          canonical: pageUrl,
        },
      )
        .replace('</head>', `${renderJsonLd(articleSchema)}\n${renderJsonLd(breadcrumb)}\n</head>`)
        .replace('</body>', `${getDocsScripts()}\n</body>`),
    )
  })

  return routes
}
