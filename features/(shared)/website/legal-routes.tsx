import { join } from 'node:path'
import { Hono } from 'hono'
import { renderPage } from '@/platform/server/render'
import { getContentFile } from '@/providers/markdown'
import { Layout } from './layout'

const LEGAL_DIR = join(process.cwd(), 'content/legal')

export const legalRoutes = new Hono()

function LegalPage({ html }: { html: string }) {
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
    renderPage(<LegalPage html={page.html} />, {
      title: `${page.frontmatter.title as string} — The Right Decision`,
      description: page.frontmatter.description as string,
    }),
  )
})

legalRoutes.get('/terms', async (c) => {
  const page = await getContentFile(LEGAL_DIR, 'terms')
  if (!page) return c.notFound()

  return c.html(
    renderPage(<LegalPage html={page.html} />, {
      title: `${page.frontmatter.title as string} — The Right Decision`,
      description: page.frontmatter.description as string,
    }),
  )
})
