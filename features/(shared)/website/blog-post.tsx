import { Layout } from './layout'

type BlogPostProps = {
  title: string
  author: string
  date: string
  cluster: string
  readTime: number
  html: string
}

const AUTHOR_NAMES: Record<string, string> = {
  henry: 'Henry Meireles',
  indy: 'Indy',
  'henry-and-indy': 'Henry & Indy',
}

const CLUSTER_LABELS: Record<string, string> = {
  'feeling-stuck': 'Feeling Stuck',
  'anti-self-help': 'Anti-Self-Help',
  'decision-making': 'Decision Making',
  'life-transitions': 'Life Transitions',
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

export function BlogPost({ title, author, date, cluster, readTime, html }: BlogPostProps) {
  return (
    <Layout>
      <article class="py-2xl">
        <div class="max-w-[800px] mx-auto px-md">
          <header class="mb-xl">
            <h1 class="font-display text-hero text-ink mb-sm">{title}</h1>
            <div class="flex items-center gap-sm text-sm text-muted">
              <span>{AUTHOR_NAMES[author] ?? author}</span>
              <span>·</span>
              <time>{formatDate(date)}</time>
              <span>·</span>
              <span>{readTime} min read</span>
              <span>·</span>
              <span class="text-xs px-xs py-[2px] rounded border border-linen">
                {CLUSTER_LABELS[cluster] ?? cluster}
              </span>
            </div>
          </header>

          <div
            class="prose prose-warm max-w-none"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      </article>
    </Layout>
  )
}
