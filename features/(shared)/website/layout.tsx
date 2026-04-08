import type { ComponentChildren } from 'preact'

type LayoutProps = {
  children: ComponentChildren
}

function Header() {
  return (
    <header class="border-b border-linen">
      <nav aria-label="Main navigation" class="max-w-[1200px] mx-auto px-md py-sm flex items-center justify-between">
        <a href="/" class="font-display text-xl text-ink no-underline hover:opacity-80">
          The Right Decision
        </a>

        {/* Desktop nav */}
        <div class="hidden md:flex items-center gap-lg">
          <a href="/about" class="text-secondary no-underline hover:text-ink text-sm font-medium">
            About
          </a>
          <a href="/blog" class="text-secondary no-underline hover:text-ink text-sm font-medium">
            Blog
          </a>
          <a
            href="/concepts"
            class="text-secondary no-underline hover:text-ink text-sm font-medium"
          >
            Concepts
          </a>
          <a
            href="/life"
            class="bg-gold hover:bg-gold-hover text-white px-md py-xs rounded-sm text-sm font-semibold no-underline transition-colors"
          >
            Life Decisions →
          </a>
        </div>

        {/* Mobile hamburger */}
        <div class="flex md:hidden items-center gap-sm">
          <a
            href="/life"
            class="bg-gold hover:bg-gold-hover text-white px-sm py-xs rounded-sm text-sm font-semibold no-underline transition-colors"
          >
            Life Decisions →
          </a>
          <details class="relative">
            <summary class="list-none cursor-pointer p-xs" aria-label="Menu">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                role="img"
                aria-label="Menu"
              >
                <path d="M3 12h18M3 6h18M3 18h18" />
              </svg>
            </summary>
            <div class="absolute right-0 top-full mt-xs bg-white border border-linen rounded-md shadow-lg py-xs min-w-[180px] z-dropdown">
              <a
                href="/about"
                class="block px-md py-xs text-secondary hover:text-ink hover:bg-cream no-underline text-sm"
              >
                About
              </a>
              <a
                href="/blog"
                class="block px-md py-xs text-secondary hover:text-ink hover:bg-cream no-underline text-sm"
              >
                Blog
              </a>
              <a
                href="/concepts"
                class="block px-md py-xs text-secondary hover:text-ink hover:bg-cream no-underline text-sm"
              >
                Concepts
              </a>
              <a
                href="/life"
                class="block px-md py-xs text-gold hover:bg-cream no-underline text-sm font-semibold"
              >
                Life Decisions →
              </a>
            </div>
          </details>
        </div>
      </nav>
    </header>
  )
}

function Footer() {
  return (
    <footer class="border-t border-linen mt-3xl">
      <div class="max-w-[1200px] mx-auto px-md py-2xl">
        <div class="flex flex-col md:flex-row justify-between gap-xl">
          <div>
            <p class="font-display text-lg text-ink">The Right Decision</p>
            <p class="text-muted text-sm mt-xs">Solving decision-making with AI.</p>
          </div>

          <div class="flex gap-2xl">
            <div>
              <p class="text-sm font-semibold text-ink mb-sm">Resources</p>
              <ul class="list-none p-0 m-0 space-y-xs">
                <li>
                  <a href="/blog" class="text-sm text-secondary no-underline hover:text-ink">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="/concepts" class="text-sm text-secondary no-underline hover:text-ink">
                    Concepts
                  </a>
                </li>
                <li>
                  <a href="/about" class="text-sm text-secondary no-underline hover:text-ink">
                    About
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <p class="text-sm font-semibold text-ink mb-sm">Legal</p>
              <ul class="list-none p-0 m-0 space-y-xs">
                <li>
                  <a href="/privacy" class="text-sm text-secondary no-underline hover:text-ink">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="/terms" class="text-sm text-secondary no-underline hover:text-ink">
                    Terms of Service
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div class="mt-xl pt-lg border-t border-linen">
          <p class="text-muted text-xs">&copy; 2026 The Right Decision LLC. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

export function Layout({ children }: LayoutProps) {
  return (
    <div class="min-h-screen flex flex-col">
      <Header />
      <div class="flex-1">{children}</div>
      <Footer />
    </div>
  )
}
