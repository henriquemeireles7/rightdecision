import type { ParsedContentItem } from '@/providers/markdown'

const CLUSTER_LABELS: Record<string, string> = {
  'feeling-stuck': 'Feeling Stuck',
  'anti-self-help': 'Anti-Self-Help',
  'decision-making': 'Decision Making',
  'life-transitions': 'Life Transitions',
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr.includes('T') ? dateStr : `${dateStr}T12:00:00Z`)
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

export function BlogIndex({ items }: { items: ParsedContentItem[] }) {
  const clusters = [...new Set(items.map((p) => p.frontmatter.cluster as string).filter(Boolean))]

  return (
    <div>
      <h1 class="font-display text-3xl text-ink mb-lg">Blog</h1>

      {/* Cluster filter pills */}
      {clusters.length > 0 && (
        <div class="flex flex-wrap gap-xs mb-xl">
          <a
            href="/blog"
            class="px-sm py-xs rounded-full text-sm no-underline border bg-gold text-white border-gold"
          >
            All
          </a>
          {clusters.map((cluster) => (
            <a
              key={cluster}
              href={`/blog?cluster=${cluster}`}
              class="px-sm py-xs rounded-full text-sm no-underline border bg-transparent text-secondary border-linen hover:border-gold hover:text-ink"
            >
              {CLUSTER_LABELS[cluster] || cluster}
            </a>
          ))}
        </div>
      )}

      {items.length === 0 ? (
        <p class="text-muted">No articles yet.</p>
      ) : (
        <div class="space-y-xl">
          {items.map((post) => (
            <article key={post.slug} class="border-b border-linen pb-xl">
              <a href={`/blog/${post.slug}`} class="no-underline group">
                <h2 class="font-display text-2xl text-ink group-hover:text-gold transition-colors mb-xs">
                  {post.frontmatter.title as string}
                </h2>
              </a>
              <div class="flex items-center gap-sm text-sm text-muted mb-sm">
                {post.frontmatter.date && (
                  <time>{formatDate(post.frontmatter.date as string)}</time>
                )}
                {post.frontmatter.cluster && (
                  <>
                    <span>·</span>
                    <span class="text-xs px-xs py-[2px] rounded border border-linen">
                      {CLUSTER_LABELS[post.frontmatter.cluster as string] ||
                        String(post.frontmatter.cluster)}
                    </span>
                  </>
                )}
              </div>
              {post.frontmatter.description && (
                <p class="text-secondary leading-relaxed">
                  {post.frontmatter.description as string}
                </p>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
