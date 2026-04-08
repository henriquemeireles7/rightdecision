import type { ParsedContentItem } from '@/providers/markdown'
import { Layout } from './layout'

type ConceptIndexProps = {
  concepts: ParsedContentItem[]
}

export function ConceptIndex({ concepts }: ConceptIndexProps) {
  return (
    <Layout>
      <section class="py-2xl">
        <div class="max-w-[800px] mx-auto px-md">
          <h1 class="font-display text-4xl text-ink mb-sm">Concepts</h1>
          <p class="text-secondary mb-xl">
            Key ideas behind the Right Decision methodology. Each concept is explained with
            practical steps and answers to common questions.
          </p>

          {concepts.length === 0 ? (
            <p class="text-muted">No concepts yet.</p>
          ) : (
            <div class="space-y-lg">
              {concepts.map((concept) => (
                <a
                  key={concept.slug}
                  href={`/concepts/${concept.slug}`}
                  class="block p-lg border border-linen rounded-md hover:border-gold transition-colors no-underline group"
                >
                  <h2 class="font-display text-xl text-ink group-hover:text-gold transition-colors mb-xs">
                    {concept.frontmatter.title as string}
                  </h2>
                  <p class="text-secondary text-sm leading-relaxed">
                    {concept.frontmatter.description as string}
                  </p>
                </a>
              ))}
            </div>
          )}
        </div>
      </section>
    </Layout>
  )
}
