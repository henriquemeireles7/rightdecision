import { Layout } from '../layout'
import { DocsLayout } from './docs-layout'
import type { SidebarSection } from './types'

type SystemMapProps = {
  sidebar: SidebarSection[]
}

export function SystemMapPage({ sidebar }: SystemMapProps) {
  return (
    <Layout>
      <DocsLayout contentType="handbook" sidebar={sidebar} showOnThisPage={false}>
        <h1 class="font-display text-3xl text-ink mb-sm">System Map</h1>
        <p class="text-secondary mb-xl">
          How decisions flow through The Right Decision company operating system.
        </p>

        <div class="border border-linen rounded-md p-lg bg-sand overflow-x-auto">
          <svg
            viewBox="0 0 800 500"
            class="w-full max-w-[800px]"
            role="img"
            aria-label="System map showing how decisions flow through the company"
          >
            <title>Right Decision System Map</title>

            {/* Strategy Layer */}
            <rect
              x="50"
              y="30"
              width="700"
              height="80"
              rx="8"
              fill="#faf8f5"
              stroke="#e8e0d4"
              stroke-width="1.5"
            />
            <text
              x="400"
              y="55"
              text-anchor="middle"
              class="font-display"
              font-size="14"
              fill="#a69d91"
            >
              STRATEGY
            </text>
            <a href="/handbook/principles/decisions-over-tasks">
              <rect x="80" y="65" width="140" height="32" rx="4" fill="#c4956a" opacity="0.15" />
              <text x="150" y="86" text-anchor="middle" font-size="12" fill="#1a1714">
                Decisions
              </text>
            </a>
            <a href="/method/analysis-paralysis">
              <rect x="250" y="65" width="140" height="32" rx="4" fill="#c4956a" opacity="0.15" />
              <text x="320" y="86" text-anchor="middle" font-size="12" fill="#1a1714">
                Method
              </text>
            </a>
            <a href="/handbook/principles/agent-first">
              <rect x="420" y="65" width="140" height="32" rx="4" fill="#c4956a" opacity="0.15" />
              <text x="490" y="86" text-anchor="middle" font-size="12" fill="#1a1714">
                Agent-First
              </text>
            </a>
            <rect x="590" y="65" width="140" height="32" rx="4" fill="#c4956a" opacity="0.15" />
            <text x="660" y="86" text-anchor="middle" font-size="12" fill="#1a1714">
              Roadmap
            </text>

            {/* Arrows */}
            <path
              d="M400 110 L400 150"
              stroke="#e8e0d4"
              stroke-width="1.5"
              fill="none"
              marker-end="url(#arrow)"
            />

            {/* Document Pipeline */}
            <rect
              x="50"
              y="150"
              width="700"
              height="80"
              rx="8"
              fill="#faf8f5"
              stroke="#e8e0d4"
              stroke-width="1.5"
            />
            <text
              x="400"
              y="175"
              text-anchor="middle"
              class="font-display"
              font-size="14"
              fill="#a69d91"
            >
              DOCUMENT PIPELINE
            </text>
            <rect x="80" y="185" width="100" height="32" rx="4" fill="#f2ede6" />
            <text x="130" y="206" text-anchor="middle" font-size="11" fill="#6b6258">
              d-meta
            </text>
            <path
              d="M185 201 L210 201"
              stroke="#c4956a"
              stroke-width="1"
              marker-end="url(#arrow-sm)"
            />
            <rect x="215" y="185" width="100" height="32" rx="4" fill="#f2ede6" />
            <text x="265" y="206" text-anchor="middle" font-size="11" fill="#6b6258">
              d-input
            </text>
            <path
              d="M320 201 L345 201"
              stroke="#c4956a"
              stroke-width="1"
              marker-end="url(#arrow-sm)"
            />
            <rect x="350" y="185" width="100" height="32" rx="4" fill="#f2ede6" />
            <text x="400" y="206" text-anchor="middle" font-size="11" fill="#6b6258">
              d-plan
            </text>
            <path
              d="M455 201 L480 201"
              stroke="#c4956a"
              stroke-width="1"
              marker-end="url(#arrow-sm)"
            />
            <rect x="485" y="185" width="100" height="32" rx="4" fill="#f2ede6" />
            <text x="535" y="206" text-anchor="middle" font-size="11" fill="#6b6258">
              d-tasks
            </text>
            <path
              d="M590 201 L615 201"
              stroke="#c4956a"
              stroke-width="1"
              marker-end="url(#arrow-sm)"
            />
            <rect x="620" y="185" width="100" height="32" rx="4" fill="#c4956a" opacity="0.2" />
            <text x="670" y="206" text-anchor="middle" font-size="11" fill="#1a1714">
              Beads
            </text>

            {/* Arrow down */}
            <path
              d="M400 230 L400 270"
              stroke="#e8e0d4"
              stroke-width="1.5"
              fill="none"
              marker-end="url(#arrow)"
            />

            {/* Code Pipeline */}
            <rect
              x="50"
              y="270"
              width="700"
              height="80"
              rx="8"
              fill="#faf8f5"
              stroke="#e8e0d4"
              stroke-width="1.5"
            />
            <text
              x="400"
              y="295"
              text-anchor="middle"
              class="font-display"
              font-size="14"
              fill="#a69d91"
            >
              CODE PIPELINE
            </text>
            <rect x="80" y="305" width="100" height="32" rx="4" fill="#f2ede6" />
            <text x="130" y="326" text-anchor="middle" font-size="11" fill="#6b6258">
              d-code
            </text>
            <path
              d="M185 321 L210 321"
              stroke="#c4956a"
              stroke-width="1"
              marker-end="url(#arrow-sm)"
            />
            <rect x="215" y="305" width="100" height="32" rx="4" fill="#f2ede6" />
            <text x="265" y="326" text-anchor="middle" font-size="11" fill="#6b6258">
              d-review
            </text>
            <path
              d="M320 321 L345 321"
              stroke="#c4956a"
              stroke-width="1"
              marker-end="url(#arrow-sm)"
            />
            <rect x="350" y="305" width="100" height="32" rx="4" fill="#f2ede6" />
            <text x="400" y="326" text-anchor="middle" font-size="11" fill="#6b6258">
              d-harden
            </text>
            <path
              d="M455 321 L480 321"
              stroke="#c4956a"
              stroke-width="1"
              marker-end="url(#arrow-sm)"
            />
            <rect x="485" y="305" width="100" height="32" rx="4" fill="#c4956a" opacity="0.2" />
            <text x="535" y="326" text-anchor="middle" font-size="11" fill="#1a1714">
              /ship
            </text>

            {/* Arrow down */}
            <path
              d="M400 350 L400 390"
              stroke="#e8e0d4"
              stroke-width="1.5"
              fill="none"
              marker-end="url(#arrow)"
            />

            {/* Production */}
            <rect
              x="150"
              y="390"
              width="500"
              height="70"
              rx="8"
              fill="#c4956a"
              opacity="0.1"
              stroke="#c4956a"
              stroke-width="1.5"
            />
            <text
              x="400"
              y="415"
              text-anchor="middle"
              class="font-display"
              font-size="14"
              fill="#c4956a"
            >
              PRODUCTION
            </text>
            <text x="400" y="440" text-anchor="middle" font-size="12" fill="#6b6258">
              therightdecision.com · Railway · PostgreSQL
            </text>

            {/* Arrow markers */}
            <defs>
              <marker id="arrow" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                <path d="M0,0 L8,3 L0,6" fill="#e8e0d4" />
              </marker>
              <marker
                id="arrow-sm"
                markerWidth="6"
                markerHeight="4"
                refX="6"
                refY="2"
                orient="auto"
              >
                <path d="M0,0 L6,2 L0,4" fill="#c4956a" />
              </marker>
            </defs>
          </svg>
        </div>

        <p class="text-sm text-muted mt-lg">
          Click any box to read about that part of the system. The map shows three layers: strategy
          documents that define what to build, the document pipeline that turns strategy into
          executable tasks, and the code pipeline that turns tasks into shipped software.
        </p>
      </DocsLayout>
    </Layout>
  )
}
