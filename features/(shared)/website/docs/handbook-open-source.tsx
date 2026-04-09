import { Layout } from '../layout'
import { DocsLayout } from './docs-layout'
import type { SidebarSection } from './types'

type OpenSourceProps = {
  sidebar: SidebarSection[]
  stars?: number
}

export function OpenSourcePage({ sidebar, stars }: OpenSourceProps) {
  return (
    <Layout>
      <DocsLayout contentType="handbook" sidebar={sidebar} showOnThisPage={false}>
        <h1 class="font-display text-3xl text-ink mb-sm">Open Source</h1>
        <p class="text-secondary mb-xl max-w-[50ch]">
          Our AI agent harness is open source. Clone it, customize it, run your company the same way
          we run ours.
        </p>

        {/* Star CTA */}
        <a
          href="https://github.com/henriquemeireles7/harness"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-sm bg-ink text-cream px-lg py-sm rounded-md no-underline hover:opacity-90 transition-opacity mb-2xl"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 16 16"
            fill="currentColor"
            role="img"
            aria-label="GitHub"
          >
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
          </svg>
          <span class="font-medium">Star on GitHub</span>
          {stars !== undefined && stars > 0 && (
            <span class="bg-cream/20 text-cream px-xs py-[2px] rounded text-sm">{stars}</span>
          )}
        </a>

        <div class="space-y-xl">
          <section>
            <h2 class="font-display text-xl text-ink mb-sm">What's included</h2>
            <ul class="list-none p-0 m-0 space-y-sm">
              {[
                ['CLAUDE.md templates', 'Root and folder-level AI agent instructions'],
                ['Hook system', 'Pre-tool, post-tool, and stop hooks for automated quality'],
                ['Decision templates', 'Company, architecture, coding, and voice documents'],
                ['Skill definitions', 'Generalized skill patterns you can customize'],
                ['Pipeline examples', 'Document pipeline (d-meta to d-plan) examples'],
              ].map(([title, desc]) => (
                <li key={title} class="flex gap-sm items-start">
                  <span class="text-gold mt-[2px] shrink-0">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="currentColor"
                      role="img"
                      aria-label="Check"
                    >
                      <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z" />
                    </svg>
                  </span>
                  <div>
                    <p class="text-ink font-medium text-sm">{title}</p>
                    <p class="text-secondary text-sm">{desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 class="font-display text-xl text-ink mb-sm">What's not included</h2>
            <p class="text-secondary text-sm">
              Our actual strategy content, course content, product code, customer data, and pricing
              details stay private. The harness gives you the patterns. You bring your own content.
            </p>
          </section>

          <section>
            <h2 class="font-display text-xl text-ink mb-sm">Quick start</h2>
            <div class="bg-ink text-cream p-md rounded-md text-sm font-mono overflow-x-auto">
              <p class="m-0">git clone https://github.com/henriquemeireles7/harness.git</p>
              <p class="m-0 mt-xs">cd harness</p>
              <p class="m-0 mt-xs text-muted"># Read the README, then customize for your company</p>
            </div>
          </section>
        </div>
      </DocsLayout>
    </Layout>
  )
}
