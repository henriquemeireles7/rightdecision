import { join } from 'node:path'
import { listContentFiles, type ParsedContentItem } from '@/providers/markdown'
import { Layout } from './layout'

const BLOG_DIR = join(process.cwd(), 'content/blog')

function formatDate(dateStr: string): string {
  const d = new Date(dateStr.includes('T') ? dateStr : `${dateStr}T12:00:00Z`)
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

type HomepageProps = {
  latestPosts: ParsedContentItem[]
}

export function Homepage({ latestPosts }: HomepageProps) {
  return (
    <Layout>
      {/* Hero — Vision-forward */}
      <section class="py-4xl">
        <div class="max-w-[800px] mx-auto px-md">
          <h1 class="font-display text-hero text-ink mb-lg leading-tight">
            Every meaningful change starts with a decision.
          </h1>
          <p class="text-secondary text-lg mb-md max-w-[640px] leading-relaxed">
            We're building AI that helps you see the one constraint holding you back, make the
            decision that changes everything, and turn it into daily actions. Not therapy. Not
            motivation. Just clarity.
          </p>
          <a
            href="/free"
            class="inline-block px-xl py-md bg-gold text-white font-semibold rounded-sm hover:bg-gold-hover transition-colors no-underline"
          >
            Start Free
          </a>
          <p class="text-muted text-xs mt-sm">3 lessons. No signup. No credit card.</p>
        </div>
      </section>

      {/* How it Works — Decision Block micro-demo */}
      <section class="py-3xl bg-sand">
        <div class="max-w-[800px] mx-auto px-md">
          <h2 class="font-display text-2xl text-ink mb-md">
            This is not a course. It's a decision engine.
          </h2>
          <p class="text-secondary mb-xl max-w-[640px] leading-relaxed">
            You read. Then you decide. Content stays locked until you act. Every decision builds on
            the last. By the end, you know exactly what to do and when.
          </p>

          {/* Static decision block preview */}
          <div class="max-w-[640px] mx-auto">
            <p class="text-secondary text-sm mb-md leading-relaxed">
              "...you've done the therapy, the courses, the journaling. You understand yourself
              better than most people. So why are you still here?"
            </p>

            <div class="border border-linen rounded-md p-lg bg-white">
              <p class="font-display text-xl text-ink mb-lg">
                What's the one thing you've been avoiding?
              </p>
              <div class="space-y-sm">
                <div class="w-full p-md bg-cream border border-linen rounded-sm text-left text-secondary text-sm leading-relaxed">
                  Making the career change I've been thinking about for years
                </div>
                <div class="w-full p-md bg-cream border border-linen rounded-sm text-left text-secondary text-sm leading-relaxed">
                  Having the conversation about money with my partner
                </div>
                <div class="w-full p-md bg-cream border border-linen rounded-sm text-left text-secondary text-sm leading-relaxed">
                  Saying no to something that isn't serving me anymore
                </div>
              </div>
              <div class="mt-md">
                <div class="w-full p-md bg-white border border-linen rounded-sm text-muted text-sm">
                  Or write your own...
                </div>
              </div>
            </div>

            <div class="mt-md h-[80px] bg-gradient-to-b from-sand/50 to-sand rounded-sm flex items-center justify-center">
              <p class="text-muted text-xs italic">Content continues after you decide...</p>
            </div>
          </div>
        </div>
      </section>

      {/* Life Decisions — Primary product */}
      <section class="py-3xl">
        <div class="max-w-[800px] mx-auto px-md">
          <h2 class="font-display text-2xl text-ink mb-sm">Life Decisions</h2>
          <p class="text-secondary mb-lg max-w-[640px] leading-relaxed">
            A 9-module program that identifies the one constraint holding your life back, turns it
            into a clear decision, and decomposes that decision into daily actions. 3 acts: See
            Clearly. Decide. Move.
          </p>
          <div class="flex gap-md items-center flex-wrap">
            <a
              href="/free"
              class="inline-block px-xl py-md bg-gold text-white font-semibold rounded-sm hover:bg-gold-hover transition-colors no-underline"
            >
              Start with 3 Free Lessons
            </a>
            <a href="/life" class="text-gold no-underline hover:underline font-medium text-sm">
              Learn more about the program →
            </a>
          </div>
        </div>
      </section>

      {/* Coming Soon Programs */}
      <section class="py-2xl bg-sand">
        <div class="max-w-[800px] mx-auto px-md">
          <h2 class="font-display text-2xl text-ink mb-md text-center">
            The future of decision-making
          </h2>
          <p class="text-secondary text-center mb-xl max-w-[640px] mx-auto leading-relaxed">
            Life Decisions is just the beginning. We're building decision programs for every area
            that matters.
          </p>
          <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-md">
            <a
              href="/free"
              class="block p-lg bg-white border border-gold rounded-md no-underline group"
            >
              <h3 class="font-display text-lg text-ink group-hover:text-gold transition-colors mb-xs">
                Life Decisions
              </h3>
              <p class="text-gold text-xs font-semibold">Available now</p>
            </a>
            <div class="p-lg bg-white border border-linen rounded-md opacity-50">
              <h3 class="font-display text-lg text-ink mb-xs">Relationship Decisions</h3>
              <p class="text-muted text-xs">Coming soon</p>
            </div>
            <div class="p-lg bg-white border border-linen rounded-md opacity-50">
              <h3 class="font-display text-lg text-ink mb-xs">Health Decisions</h3>
              <p class="text-muted text-xs">Coming soon</p>
            </div>
            <div class="p-lg bg-white border border-linen rounded-md opacity-50">
              <h3 class="font-display text-lg text-ink mb-xs">Business Decisions</h3>
              <p class="text-muted text-xs">Coming soon</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section class="py-3xl">
        <div class="max-w-[800px] mx-auto px-md">
          <h2 class="font-display text-2xl text-ink mb-sm text-center">Simple pricing</h2>
          <p class="text-secondary text-center mb-xl max-w-[500px] mx-auto">
            Start free. Upgrade when you're ready for the full program.
          </p>
          <div class="grid md:grid-cols-2 gap-lg max-w-[600px] mx-auto">
            <div class="p-xl bg-white border border-linen rounded-md">
              <h3 class="font-display text-lg text-ink mb-xs">Monthly</h3>
              <p class="text-ink text-2xl font-semibold mb-xs">
                $19.70<span class="text-muted text-sm font-normal">/month</span>
              </p>
              <p class="text-secondary text-sm mb-lg leading-relaxed">
                Less than a therapy session. Cancel anytime.
              </p>
              <a
                href="/api/checkout/redirect?plan=monthly"
                class="block text-center px-lg py-sm bg-cream text-ink font-medium rounded-sm hover:bg-linen transition-colors no-underline"
              >
                Start Monthly
              </a>
            </div>
            <div class="p-xl bg-white border-2 border-gold rounded-md relative">
              <span class="absolute -top-[12px] left-xl bg-gold text-white text-xs font-semibold px-sm py-[2px] rounded-full">
                Save $40
              </span>
              <h3 class="font-display text-lg text-ink mb-xs">Yearly</h3>
              <p class="text-ink text-2xl font-semibold mb-xs">
                $197<span class="text-muted text-sm font-normal">/year</span>
              </p>
              <p class="text-secondary text-sm mb-lg leading-relaxed">
                The cost of one self-help course that actually works.
              </p>
              <a
                href="/api/checkout/redirect?plan=yearly"
                class="block text-center px-lg py-sm bg-gold text-white font-medium rounded-sm hover:bg-gold-hover transition-colors no-underline"
              >
                Start Yearly
              </a>
            </div>
          </div>
          <p class="text-muted text-xs text-center mt-md">
            7-day money-back guarantee on both plans.
          </p>
        </div>
      </section>

      {/* Founder Story */}
      <section class="py-2xl bg-sand">
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
        <section class="py-2xl">
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
            <a
              href="/blog"
              class="inline-block mt-lg text-gold no-underline hover:underline font-medium"
            >
              All articles →
            </a>
          </div>
        </section>
      )}

      {/* Final CTA */}
      <section class="py-3xl bg-sand">
        <div class="max-w-[600px] mx-auto px-md text-center">
          <h2 class="font-display text-2xl text-ink mb-md">Start your free decision</h2>
          <p class="text-secondary mb-lg leading-relaxed">
            3 lessons. Identify your constraint. Make your first real decision. No signup required.
          </p>
          <a
            href="/free"
            class="inline-block px-xl py-md bg-gold text-white font-semibold rounded-sm hover:bg-gold-hover transition-colors no-underline"
          >
            Start Free
          </a>
        </div>
      </section>
    </Layout>
  )
}

export async function getHomepageProps(): Promise<HomepageProps> {
  const posts = await listContentFiles(BLOG_DIR)
  return { latestPosts: posts.slice(0, 3) }
}
