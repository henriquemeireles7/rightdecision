import { Layout } from './layout'

type FaqItem = {
  question: string
  answer: string
}

type ConceptPageProps = {
  title: string
  html: string
  faq: FaqItem[]
  relatedConcepts: string[]
}

export function ConceptPage({ title, html, faq, relatedConcepts }: ConceptPageProps) {
  return (
    <Layout>
      <article class="py-2xl">
        <div class="max-w-[800px] mx-auto px-md">
          <h1 class="font-display text-hero text-ink mb-xl">{title}</h1>

          <div
            class="prose prose-warm max-w-none mb-2xl"
            dangerouslySetInnerHTML={{ __html: html }}
          />

          {/* FAQ Section */}
          {faq.length > 0 && (
            <section class="mt-2xl pt-xl border-t border-linen">
              <h2 class="font-display text-2xl text-ink mb-lg">Frequently Asked Questions</h2>
              <div class="space-y-lg">
                {faq.map((item, i) => (
                  <div key={i} class="bg-sand rounded-md p-lg">
                    <h3 class="text-ink font-semibold mb-xs">{item.question}</h3>
                    <p class="text-secondary leading-relaxed">{item.answer}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Related Concepts */}
          {relatedConcepts.length > 0 && (
            <section class="mt-xl pt-lg border-t border-linen">
              <h2 class="text-lg font-semibold text-ink mb-sm">Related Concepts</h2>
              <div class="flex flex-wrap gap-sm">
                {relatedConcepts.map((slug) => (
                  <a
                    key={slug}
                    href={`/concepts/${slug}`}
                    class="px-sm py-xs border border-linen rounded-sm text-sm text-secondary no-underline hover:border-gold hover:text-ink transition-colors"
                  >
                    {slug.replace(/-/g, ' ')}
                  </a>
                ))}
              </div>
            </section>
          )}
        </div>
      </article>
    </Layout>
  )
}
