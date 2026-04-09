import { join } from 'node:path'
import { Hono } from 'hono'
import { env } from '@/platform/env'
import { renderPage } from '@/platform/server/render'
import { getContentFile, listContentFiles } from '@/providers/markdown'
import { ConceptIndex } from './concept-index'
import { ConceptPage } from './concept-page'
import { buildArticleSchema, buildBreadcrumbSchema, buildFaqSchema, renderJsonLd } from './seo'

const CONCEPTS_DIR = join(process.cwd(), 'content/concepts')

export const conceptRoutes = new Hono()

conceptRoutes.get('/', async (c) => {
  const concepts = await listContentFiles(CONCEPTS_DIR)

  // Sort alphabetically by title (not by date like blog)
  concepts.sort((a, b) =>
    ((a.frontmatter.title as string) || '').localeCompare((b.frontmatter.title as string) || ''),
  )

  const breadcrumb = buildBreadcrumbSchema([
    { name: 'Home', url: `${env.PUBLIC_APP_URL}/` },
    { name: 'Concepts', url: `${env.PUBLIC_APP_URL}/concepts` },
  ])

  return c.html(
    renderPage(<ConceptIndex concepts={concepts} />, {
      title: 'Concepts — The Right Decision',
      description:
        'Key decision-making concepts explained with practical steps. Analysis paralysis, decision fatigue, feeling stuck, and more.',
      canonical: `${env.PUBLIC_APP_URL}/concepts`,
    }).replace('</head>', `${renderJsonLd(breadcrumb)}\n</head>`),
  )
})

conceptRoutes.get('/:slug', async (c) => {
  const slug = c.req.param('slug')
  const concept = await getContentFile(CONCEPTS_DIR, slug)

  if (!concept) {
    return c.notFound()
  }

  const fm = concept.frontmatter
  const faq = (fm.faq as Array<{ question: string; answer: string }>) ?? []
  const relatedConcepts = (fm.relatedConcepts as string[]) ?? []

  // Extract first paragraph for DefinedTerm description
  const firstParagraph = concept.body.split('\n\n')[0]?.trim() ?? ''

  // Build JSON-LD schemas
  const articleSchema = buildArticleSchema({
    title: fm.title as string,
    description: fm.description as string,
    author: 'henry',
    datePublished: (fm.date as string) ?? '2026-04-07',
    url: `${env.PUBLIC_APP_URL}/concepts/${slug}`,
    baseUrl: env.PUBLIC_APP_URL,
  })

  const definedTermSchema = {
    '@type': 'DefinedTerm' as const,
    name: fm.title as string,
    description: firstParagraph,
    url: `${env.PUBLIC_APP_URL}/concepts/${slug}`,
  }

  const breadcrumb = buildBreadcrumbSchema([
    { name: 'Home', url: `${env.PUBLIC_APP_URL}/` },
    { name: 'Concepts', url: `${env.PUBLIC_APP_URL}/concepts` },
    { name: fm.title as string, url: `${env.PUBLIC_APP_URL}/concepts/${slug}` },
  ])

  let jsonLd = renderJsonLd(articleSchema)
  if (faq.length > 0) {
    jsonLd += `\n${renderJsonLd(buildFaqSchema(faq))}`
  }
  jsonLd += `\n${renderJsonLd(definedTermSchema)}`
  jsonLd += `\n${renderJsonLd(breadcrumb)}`

  return c.html(
    renderPage(
      <ConceptPage
        title={fm.title as string}
        html={concept.html}
        faq={faq}
        relatedConcepts={relatedConcepts}
      />,
      {
        title: `${fm.title as string} — The Right Decision`,
        description: fm.description as string,
        keywords: (fm.keywords as string[]) ?? [],
        ogImage: `${env.PUBLIC_APP_URL}/og/${slug}.png`,
        ogType: 'article',
        canonical: `${env.PUBLIC_APP_URL}/concepts/${slug}`,
      },
    ).replace('</head>', `${jsonLd}\n</head>`),
  )
})
