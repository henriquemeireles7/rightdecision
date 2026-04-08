import { join } from 'node:path'
import { Hono } from 'hono'
import { renderPage } from '@/platform/server/render'
import { getContentFile } from '@/providers/markdown'
import { Layout } from './layout'

const LEGAL_DIR = join(import.meta.dir, '../../../content/legal')

export const legalRoutes = new Hono()

function LegalPage({ title, date, html }: { title: string; date: string; html: string }) {
  return (
    <Layout>
      <article class="py-2xl">
        <div class="max-w-[800px] mx-auto px-md">
          <div class="prose prose-warm max-w-none" dangerouslySetInnerHTML={{ __html: html }} />
        </div>
      </article>
    </Layout>
  )
}

legalRoutes.get('/privacy', async (c) => {
  const page = await getContentFile(LEGAL_DIR, 'privacy')
  if (!page) return c.notFound()

  return c.html(
    renderPage(
      <LegalPage
        title={page.frontmatter.title as string}
        date={page.frontmatter.date as string}
        html={page.html}
      />,
      {
        title: `${page.frontmatter.title as string} — The Right Decision`,
        description: page.frontmatter.description as string,
      },
    ),
  )
})

legalRoutes.get('/terms', async (c) => {
  const page = await getContentFile(LEGAL_DIR, 'terms')
  if (!page) return c.notFound()

  return c.html(
    renderPage(
      <LegalPage
        title={page.frontmatter.title as string}
        date={page.frontmatter.date as string}
        html={page.html}
      />,
      {
        title: `${page.frontmatter.title as string} — The Right Decision`,
        description: page.frontmatter.description as string,
      },
    ),
  )
})
