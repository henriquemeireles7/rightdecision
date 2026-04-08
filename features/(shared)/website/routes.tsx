import { Hono } from 'hono'
import { renderPage } from '@/platform/server/render'
import { landingRoutes } from '@/features/(life)/landing/routes'
import { blogRoutes } from './blog-routes'
import { conceptRoutes } from './concept-routes'
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

// ─── Life Decisions LP at /life ──────────────────────────────────────────────
websiteRoutes.route('/life', landingRoutes)

// ─── Homepage (placeholder — replaced by homepage bead lyon-3tt.7) ───────────
websiteRoutes.get('/', (c) => {
  return c.html(
    renderPage(
      <Layout>
        <section class="py-3xl">
          <div class="max-w-[800px] mx-auto px-md text-center">
            <h1 class="font-display text-hero text-ink mb-md">The Right Decision</h1>
            <p class="text-secondary text-lg mb-xl">Solving decision-making with AI.</p>
            <div class="flex flex-col sm:flex-row gap-md justify-center">
              <a
                href="/life"
                class="bg-gold hover:bg-gold-hover text-white px-xl py-sm rounded-sm text-base font-semibold no-underline transition-colors inline-block"
              >
                Life Decisions →
              </a>
            </div>
          </div>
        </section>
      </Layout>,
      {
        title: 'The Right Decision — Solving Decision-Making with AI',
        description:
          'A methodology + AI platform for personal and business decisions. Life transformation through action, not introspection.',
      },
    ),
  )
})

// ─── About (placeholder — replaced by about bead lyon-3tt.8) ────────────────
websiteRoutes.get('/about', (c) => {
  return c.html(
    renderPage(
      <Layout>
        <section class="py-3xl">
          <div class="max-w-[800px] mx-auto px-md">
            <h1 class="font-display text-4xl text-ink mb-lg">About</h1>
            <p class="text-secondary">Coming soon.</p>
          </div>
        </section>
      </Layout>,
      { title: 'About — The Right Decision' },
    ),
  )
})

// ─── Blog ────────────────────────────────────────────────────────────────────
websiteRoutes.route('/blog', blogRoutes)

// ─── Concepts ─────────────────────────────────────────────────────────────────
websiteRoutes.route('/concepts', conceptRoutes)

// ─── Privacy (placeholder — replaced by legal bead lyon-3tt.9) ──────────────
websiteRoutes.get('/privacy', (c) => {
  return c.html(
    renderPage(
      <Layout>
        <section class="py-3xl">
          <div class="max-w-[800px] mx-auto px-md">
            <h1 class="font-display text-4xl text-ink mb-lg">Privacy Policy</h1>
            <p class="text-secondary">Coming soon.</p>
          </div>
        </section>
      </Layout>,
      { title: 'Privacy Policy — The Right Decision' },
    ),
  )
})

// ─── Terms (placeholder — replaced by legal bead lyon-3tt.9) ────────────────
websiteRoutes.get('/terms', (c) => {
  return c.html(
    renderPage(
      <Layout>
        <section class="py-3xl">
          <div class="max-w-[800px] mx-auto px-md">
            <h1 class="font-display text-4xl text-ink mb-lg">Terms of Service</h1>
            <p class="text-secondary">Coming soon.</p>
          </div>
        </section>
      </Layout>,
      { title: 'Terms of Service — The Right Decision' },
    ),
  )
})
