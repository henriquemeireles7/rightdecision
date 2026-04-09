import type { ParsedContentItem } from '@/providers/markdown'

const SECTION_LABELS: Record<string, { number: string; description: string }> = {
  principles: {
    number: '01',
    description: 'The beliefs that shape how we build, decide, and operate.',
  },
  'solo-founder': {
    number: '02',
    description: 'Running a company with AI agents instead of a team.',
  },
  'harness-principles': {
    number: '03',
    description: 'How we design AI agent workflows that actually work.',
  },
  'harness-in-practice': {
    number: '04',
    description: 'Real examples of agents building production software.',
  },
}

export function HandbookIndex({ items }: { items: ParsedContentItem[] }) {
  const sections = new Map<string, ParsedContentItem[]>()
  for (const item of items) {
    const parts = item.slug.split('/')
    const section = parts.length > 1 ? parts[0]! : 'other'
    if (!sections.has(section)) sections.set(section, [])
    sections.get(section)!.push(item)
  }

  return (
    <div>
      <h1 class="font-display text-3xl text-ink mb-sm">Handbook</h1>
      <p class="text-secondary mb-2xl max-w-[50ch]">
        How we run The Right Decision as a company operating system. Open for the world to read.
      </p>

      <div class="space-y-lg">
        {Array.from(sections.entries()).map(([sectionKey, sectionItems]) => {
          const meta = SECTION_LABELS[sectionKey]
          return (
            <a
              key={sectionKey}
              href={`/handbook/${sectionItems[0]?.slug}`}
              class="block no-underline group border border-linen rounded-md p-lg hover:border-gold transition-colors"
            >
              <div class="flex items-start gap-md">
                <span class="font-display text-2xl text-gold shrink-0">{meta?.number || '—'}</span>
                <div>
                  <h2 class="font-display text-xl text-ink group-hover:text-gold transition-colors mb-xs">
                    {sectionKey.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                  </h2>
                  <p class="text-sm text-secondary mb-sm">{meta?.description || ''}</p>
                  <p class="text-xs text-muted">
                    {sectionItems.length} {sectionItems.length === 1 ? 'page' : 'pages'}
                  </p>
                </div>
              </div>
            </a>
          )
        })}
      </div>
    </div>
  )
}
