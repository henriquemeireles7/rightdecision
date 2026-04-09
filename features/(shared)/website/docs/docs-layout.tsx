import type { ComponentChildren } from 'preact'
import type { ContentHeading } from '@/providers/markdown'
import type { ContentType, SidebarSection } from './types'
import { CONTENT_TABS } from './types'

type DocsLayoutProps = {
  contentType: ContentType
  sidebar: SidebarSection[]
  headings?: ContentHeading[]
  showOnThisPage: boolean
  children: ComponentChildren
}

function DocsSearch() {
  return (
    <div data-docs-search-container class="relative">
      <input
        data-docs-search
        type="search"
        placeholder="Search... (Cmd+K)"
        aria-label="Search documentation"
        class="w-full px-sm py-xs text-sm border border-linen rounded bg-cream text-ink placeholder-muted focus:outline-none focus:border-gold"
      />
      <div
        data-docs-search-results
        style="display:none"
        class="absolute top-full left-0 right-0 mt-xs bg-white border border-linen rounded-md shadow-lg z-50 max-h-[400px] overflow-y-auto"
      />
    </div>
  )
}

function DocsTabBar({ active }: { active: ContentType }) {
  return (
    <nav aria-label="Content sections" class="border-b border-linen">
      <div class="max-w-[1200px] mx-auto px-md flex items-center justify-between">
        <div class="flex gap-0 overflow-x-auto -mb-px docs-tab-scroll">
          {CONTENT_TABS.map((tab) => (
            <a
              key={tab.type}
              href={tab.href}
              class={`px-md py-sm text-sm font-medium no-underline whitespace-nowrap transition-colors border-b-2 ${
                active === tab.type
                  ? 'text-gold border-gold'
                  : 'text-secondary border-transparent hover:text-ink hover:border-linen'
              }`}
              aria-current={active === tab.type ? 'page' : undefined}
            >
              {tab.label}
            </a>
          ))}
        </div>
        <div class="hidden md:block w-[220px] -mb-px py-xs">
          <DocsSearch />
        </div>
      </div>
    </nav>
  )
}

function SidebarContent({ sections }: { sections: SidebarSection[] }) {
  return (
    <>
      {sections.map((section) => (
        <div key={section.title} class="mb-lg">
          {section.title && (
            <p class="text-xs font-semibold text-muted uppercase tracking-wider mb-xs">
              {section.title}
            </p>
          )}
          <ul class="list-none p-0 m-0 space-y-[2px]">
            {section.items.map((item) => (
              <li key={item.slug}>
                <a
                  href={item.href}
                  class={`block px-sm py-sm rounded text-sm no-underline transition-colors min-h-[44px] ${
                    item.active
                      ? 'bg-sand text-ink font-medium'
                      : 'text-secondary hover:text-ink hover:bg-cream'
                  }`}
                  aria-current={item.active ? 'page' : undefined}
                >
                  <span class="block">{item.title}</span>
                  {item.subtitle && <span class="block text-xs text-muted">{item.subtitle}</span>}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </>
  )
}

function DocsSidebar({ sections }: { sections: SidebarSection[] }) {
  return (
    <aside class="hidden lg:block w-[240px] shrink-0 border-r border-linen overflow-y-auto sticky top-0 h-screen pt-lg pb-2xl">
      <nav aria-label="Sidebar navigation" class="px-md">
        <SidebarContent sections={sections} />
      </nav>
    </aside>
  )
}

function DocsOnThisPage({ headings }: { headings: ContentHeading[] }) {
  if (headings.length === 0) return null

  return (
    <aside class="hidden lg:block w-[200px] shrink-0 sticky top-0 h-screen pt-lg pb-2xl overflow-y-auto">
      <nav aria-label="On this page">
        <p class="text-xs font-semibold text-muted uppercase tracking-wider mb-sm px-sm">
          On this page
        </p>
        <ul class="list-none p-0 m-0 space-y-[2px]">
          {headings.map((h) => (
            <li key={h.id}>
              <a
                href={`#${h.id}`}
                class={`block text-sm no-underline text-secondary hover:text-ink transition-colors py-xs min-h-[44px] flex items-center ${
                  h.depth === 2 ? 'px-sm' : 'px-md'
                }`}
              >
                {h.text}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}

function DocsOnThisPageCollapsed({ headings }: { headings: ContentHeading[] }) {
  if (headings.length === 0) return null

  return (
    <details class="lg:hidden border-b border-linen">
      <summary class="px-md py-sm text-xs font-semibold text-muted uppercase tracking-wider cursor-pointer list-none flex items-center justify-between">
        On this page
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          class="details-chevron"
          role="img"
          aria-label="Toggle"
        >
          <path d="M4 6l4 4 4-4" />
        </svg>
      </summary>
      <nav aria-label="On this page" class="px-md pb-sm">
        <ul class="list-none p-0 m-0 space-y-[2px]">
          {headings.map((h) => (
            <li key={h.id}>
              <a
                href={`#${h.id}`}
                class={`block text-sm no-underline text-secondary hover:text-ink transition-colors py-xs ${
                  h.depth === 2 ? '' : 'pl-md'
                }`}
              >
                {h.text}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </details>
  )
}

function MobileBottomSheet({ sections }: { sections: SidebarSection[] }) {
  return (
    <div class="lg:hidden">
      {/* Trigger button fixed at bottom */}
      <button
        type="button"
        data-mobile-nav-trigger
        class="fixed bottom-md right-md z-40 bg-gold text-white rounded-full w-[48px] h-[48px] flex items-center justify-center shadow-lg"
        aria-label="Open navigation"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          role="img"
          aria-label="Navigation"
        >
          <path d="M3 5h14M3 10h14M3 15h14" />
        </svg>
      </button>

      {/* Bottom sheet overlay + panel */}
      <div
        data-mobile-nav-sheet
        role="dialog"
        class="fixed inset-0 z-50 hidden"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        {/* Backdrop */}
        <div data-mobile-nav-backdrop class="absolute inset-0 bg-ink/40" />

        {/* Sheet */}
        <div class="absolute bottom-0 left-0 right-0 bg-cream rounded-t-lg max-h-[80vh] overflow-y-auto">
          {/* Handle */}
          <div class="flex justify-center pt-sm pb-xs">
            <div class="w-[40px] h-[4px] rounded-full bg-linen" />
          </div>

          {/* Search (mobile) */}
          <div class="px-md pb-sm">
            <DocsSearch />
          </div>

          {/* Nav content */}
          <nav aria-label="Mobile navigation" class="px-md pb-2xl">
            <SidebarContent sections={sections} />
          </nav>
        </div>
      </div>
    </div>
  )
}

export function DocsLayout({
  contentType,
  sidebar,
  headings,
  showOnThisPage,
  children,
}: DocsLayoutProps) {
  return (
    <div>
      <DocsTabBar active={contentType} />

      {/* On-this-page collapsed (tablet/mobile, above content) */}
      {showOnThisPage && headings && headings.length > 0 && (
        <DocsOnThisPageCollapsed headings={headings} />
      )}

      <div class="max-w-[1200px] mx-auto flex">
        <DocsSidebar sections={sidebar} />
        <div class="flex-1 min-w-0 flex">
          <div class="flex-1 min-w-0 px-md lg:px-lg py-lg">{children}</div>
          {showOnThisPage && headings && headings.length > 0 && (
            <DocsOnThisPage headings={headings} />
          )}
        </div>
      </div>

      {/* Mobile bottom sheet nav */}
      <MobileBottomSheet sections={sidebar} />
    </div>
  )
}
