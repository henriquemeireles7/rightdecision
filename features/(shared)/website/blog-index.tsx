import type { ParsedContentItem } from '@/providers/markdown'
import { Layout } from './layout'

const CLUSTER_LABELS: Record<string, string> = {
  'feeling-stuck': 'Feeling Stuck',
  'anti-self-help': 'Anti-Self-Help',
  'decision-making': 'Decision Making',
  'life-transitions': 'Life Transitions',
}

const CLUSTERS = Object.keys(CLUSTER_LABELS)

type BlogIndexProps = {
  posts: ParsedContentItem[]
  currentCluster: string | null
  currentPage: number
  totalPages: number
}

function formatDate(dateStr: string): string {
  // Append T12:00:00Z to avoid timezone shift for date-only strings
  const d = new Date(dateStr.includes('T') ? dateStr : `${dateStr}T12:00:00Z`)
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

export function BlogIndex({ posts, currentCluster, currentPage, totalPages }: BlogIndexProps) {
  return (
    <Layout>
      <section class="py-2xl">
        <div class="max-w-[800px] mx-auto px-md">
          <h1 class="font-display text-4xl text-ink mb-lg">Blog</h1>

          {/* Cluster filters */}
          <div class="flex flex-wrap gap-xs mb-xl">
            <a
              href="/blog"
              class={`px-sm py-xs rounded-full text-sm no-underline border transition-colors ${
                !currentCluster
                  ? 'bg-gold text-white border-gold'
                  : 'bg-transparent text-secondary border-linen hover:border-gold hover:text-ink'
              }`}
            >
              All
            </a>
            {CLUSTERS.map((cluster) => (
              <a
                key={cluster}
                href={`/blog?cluster=${cluster}`}
                class={`px-sm py-xs rounded-full text-sm no-underline border transition-colors ${
                  currentCluster === cluster
                    ? 'bg-gold text-white border-gold'
                    : 'bg-transparent text-secondary border-linen hover:border-gold hover:text-ink'
                }`}
              >
                {CLUSTER_LABELS[cluster]}
              </a>
            ))}
          </div>

          {/* Posts */}
          {posts.length === 0 ? (
            <p class="text-muted">No articles yet.</p>
          ) : (
            <div class="space-y-xl">
              {posts.map((post) => (
                <article key={post.slug} class="border-b border-linen pb-xl">
                  <a href={`/blog/${post.slug}`} class="no-underline group">
                    <h2 class="font-display text-2xl text-ink group-hover:text-gold transition-colors mb-xs">
                      {post.frontmatter.title as string}
                    </h2>
                  </a>
                  <div class="flex items-center gap-sm text-sm text-muted mb-sm">
                    <time>{formatDate(post.frontmatter.date as string)}</time>
                    <span>·</span>
                    <span class="text-xs px-xs py-[2px] rounded border border-linen">
                      {CLUSTER_LABELS[post.frontmatter.cluster as string] ??
                        String(post.frontmatter.cluster)}
                    </span>
                  </div>
                  <p class="text-secondary leading-relaxed">
                    {post.frontmatter.description as string}
                  </p>
                </article>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div class="flex justify-between mt-xl pt-lg border-t border-linen">
              {currentPage > 1 ? (
                <a
                  href={`/blog?page=${currentPage - 1}${currentCluster ? `&cluster=${currentCluster}` : ''}`}
                  class="text-gold no-underline hover:underline"
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
                  href={`/blog?page=${currentPage + 1}${currentCluster ? `&cluster=${currentCluster}` : ''}`}
                  class="text-gold no-underline hover:underline"
                >
                  Older →
                </a>
              ) : (
                <span />
              )}
            </div>
          )}
        </div>
      </section>
    </Layout>
  )
}
