import { Hono } from 'hono'
import { join } from 'node:path'
import { renderPage } from '@/platform/server/render'
import { listContentFiles, getContentFile } from '@/providers/markdown'
import { renderJsonLd, buildArticleSchema, buildBreadcrumbSchema } from './seo'
import { BlogIndex } from './blog-index'
import { BlogPost } from './blog-post'

const BLOG_DIR = join(import.meta.dir, '../../../content/blog')
const PER_PAGE = 10
const BASE_URL = 'https://rightdecisions.io'

export const blogRoutes = new Hono()

blogRoutes.get('/', async (c) => {
  const cluster = c.req.query('cluster') || null
  const page = Math.max(1, Number.parseInt(c.req.query('page') || '1', 10))

  let posts = await listContentFiles(BLOG_DIR)

  if (cluster) {
    posts = posts.filter((p) => p.frontmatter.cluster === cluster)
  }

  const totalPages = Math.max(1, Math.ceil(posts.length / PER_PAGE))
  const currentPage = Math.min(page, totalPages)
  const paginated = posts.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE)

  const breadcrumb = buildBreadcrumbSchema([
    { name: 'Home', url: `${BASE_URL}/` },
    { name: 'Blog', url: `${BASE_URL}/blog` },
  ])

  return c.html(
    renderPage(
      <BlogIndex
        posts={paginated}
        currentCluster={cluster}
        currentPage={currentPage}
        totalPages={totalPages}
      />,
      {
        title: 'Blog — The Right Decision',
        description: 'Essays on decision-making, getting unstuck, and why self-help keeps you stuck.',
        canonical: `${BASE_URL}/blog${cluster ? `?cluster=${cluster}` : ''}${page > 1 ? `${cluster ? '&' : '?'}page=${page}` : ''}`,
      },
    ).replace('</head>', `${renderJsonLd(breadcrumb)}\n</head>`),
  )
})

blogRoutes.get('/:slug', async (c) => {
  const slug = c.req.param('slug')
  const post = await getContentFile(BLOG_DIR, slug)

  if (!post) {
    return c.notFound()
  }

  const fm = post.frontmatter
  const articleSchema = buildArticleSchema({
    title: fm.title as string,
    description: fm.description as string,
    author: fm.author as string,
    datePublished: fm.date as string,
    dateModified: (fm.updated as string) ?? (fm.date as string),
    url: `${BASE_URL}/blog/${slug}`,
  })

  const breadcrumb = buildBreadcrumbSchema([
    { name: 'Home', url: `${BASE_URL}/` },
    { name: 'Blog', url: `${BASE_URL}/blog` },
    { name: fm.title as string, url: `${BASE_URL}/blog/${slug}` },
  ])

  return c.html(
    renderPage(
      <BlogPost
        title={fm.title as string}
        author={fm.author as string}
        date={fm.date as string}
        cluster={fm.cluster as string}
        readTime={post.readTime}
        html={post.html}
      />,
      {
        title: `${fm.title as string} — The Right Decision`,
        description: fm.description as string,
        // ogImage: deferred until lyon-3tt.12 (OG image generation)
        canonical: `${BASE_URL}/blog/${slug}`,
      },
    ).replace('</head>', `${renderJsonLd(articleSchema)}\n${renderJsonLd(breadcrumb)}\n</head>`),
  )
})
