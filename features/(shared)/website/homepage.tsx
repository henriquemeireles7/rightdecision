import { join } from 'node:path'
import { listContentFiles, type ParsedContentItem } from '@/providers/markdown'
import { Layout } from './layout'
import { renderJsonLd, buildOrganizationSchema } from './seo'

const BLOG_DIR = join(import.meta.dir, '../../../content/blog')
const BASE_URL = 'https://rightdecisions.io'

function formatDate(dateStr: string): string {
  const d = new Date(dateStr.includes('T') ? dateStr : `${dateStr}T12:00:00Z`)
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })
}

type HomepageProps = {
  latestPosts: ParsedContentItem[]
}

export function Homepage({ latestPosts }: HomepageProps) {
  const orgSchema = buildOrganizationSchema()
  const websiteSchema = {
    '@type': 'WebSite' as const,
    name: 'The Right Decision',
    url: BASE_URL,
  }

  return (
    <Layout>
      {/* Hero */}
      <section class="py-3xl">
        <div class="max-w-[800px] mx-auto px-md text-center">
          <h1 class="font-display text-hero text-ink mb-md leading-tight">
            You already know what you need to do.
          </h1>
          <p class="text-secondary text-lg mb-sm max-w-[600px] mx-auto leading-relaxed">
            You've read the books, done the therapy, taken the courses. And you're still stuck. Not
            because you're broken. Because you keep doing everything except the one thing that actually
            changes your life: deciding.
          </p>
          <p class="text-secondary text-lg mb-xl max-w-[600px] mx-auto leading-relaxed">
            We're building AI that helps you make the right decision — and then do the thing.
          </p>
        </div>
      </section>

      {/* Two Products */}
      <section class="py-2xl bg-sand">
        <div class="max-w-[800px] mx-auto px-md">
          <h2 class="font-display text-2xl text-ink mb-lg text-center">Two products, one idea</h2>
          <div class="grid md:grid-cols-2 gap-lg">
            {/* Life Decisions — active */}
            <a
              href="/life"
              class="block p-xl bg-white border border-linen rounded-md hover:border-gold transition-colors no-underline group"
            >
              <h3 class="font-display text-xl text-ink group-hover:text-gold transition-colors mb-xs">
                Life Decisions
              </h3>
              <p class="text-muted text-sm mb-md">$197/year</p>
              <p class="text-secondary text-sm leading-relaxed">
                A course + AI skills for personal life decisions. You learn the methodology, run the
                skills, make the decisions that change your life.
              </p>
              <span class="inline-block mt-md text-gold text-sm font-semibold">
                Learn more →
              </span>
            </a>

            {/* Business Decisions — coming soon */}
            <div class="p-xl bg-white border border-linen rounded-md opacity-50 cursor-default">
              <h3 class="font-display text-xl text-ink mb-xs">Business Decisions</h3>
              <p class="text-muted text-sm mb-md">Coming soon</p>
              <p class="text-secondary text-sm leading-relaxed">
                For non-tech entrepreneurs who want to build AI-native businesses using our exact
                tools and methodology.
              </p>
              <span class="inline-block mt-md text-muted text-sm">Coming soon</span>
            </div>
          </div>
        </div>
      </section>

      {/* About teaser */}
      <section class="py-2xl">
        <div class="max-w-[800px] mx-auto px-md">
          <h2 class="font-display text-2xl text-ink mb-md">Built by people who were stuck too</h2>
          <p class="text-secondary leading-relaxed mb-md">
            Henry had multiple companies and exits. Then he was almost unemployed for a year. He did
            everything — therapy, meditation, books, morning routines. Nothing moved. Until he
            stopped all of it and just did the thing.
          </p>
          <a href="/about" class="text-gold no-underline hover:underline font-medium">
            Read our story →
          </a>
        </div>
      </section>

      {/* Blog highlights */}
      {latestPosts.length > 0 && (
        <section class="py-2xl bg-sand">
          <div class="max-w-[800px] mx-auto px-md">
            <h2 class="font-display text-2xl text-ink mb-lg">From the blog</h2>
            <div class="space-y-lg">
              {latestPosts.map((post) => (
                <a
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  class="block p-lg bg-white border border-linen rounded-md hover:border-gold transition-colors no-underline group"
                >
                  <h3 class="font-display text-lg text-ink group-hover:text-gold transition-colors mb-xs">
                    {post.frontmatter.title as string}
                  </h3>
                  <p class="text-muted text-xs mb-xs">
                    {formatDate(post.frontmatter.date as string)}
                  </p>
                  <p class="text-secondary text-sm leading-relaxed">
                    {post.frontmatter.description as string}
                  </p>
                </a>
              ))}
            </div>
            <a href="/blog" class="inline-block mt-lg text-gold no-underline hover:underline font-medium">
              All articles →
            </a>
          </div>
        </section>
      )}

      {/* JSON-LD */}
      <div
        style="display:none"
        dangerouslySetInnerHTML={{
          __html: [renderJsonLd(orgSchema), renderJsonLd(websiteSchema)].join('\n'),
        }}
      />
    </Layout>
  )
}

export async function getHomepageProps(): Promise<HomepageProps> {
  const posts = await listContentFiles(BLOG_DIR)
  return { latestPosts: posts.slice(0, 3) }
}
