/// <reference lib="dom" />
/**
 * Netflix-layout rail: a semantic <section> under a real h2, CSS scroll-snap with a
 * partial next-card peek, desktop arrow buttons. NO auto-scroll, NO hover-zoom —
 * card hover is a gold border + subtle shadow (owned by the cards).
 */
import type { ComponentChildren } from 'preact'
import { useId, useRef } from 'preact/hooks'

type RailProps = {
  heading: string
  children: ComponentChildren
}

const prefersReducedMotion = () =>
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches

export function Rail({ heading, children }: RailProps) {
  const headingId = useId()
  const scroller = useRef<HTMLUListElement>(null)

  const scrollByPage = (direction: 1 | -1) => {
    const el = scroller.current
    if (!el) return
    el.scrollBy({
      left: direction * Math.round(el.clientWidth * 0.8),
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    })
  }

  return (
    <section aria-labelledby={headingId} class="group/rail relative">
      <div class="mb-3 flex items-center justify-between">
        <h2 id={headingId} class="font-display text-xl text-ink md:text-2xl">
          {heading}
        </h2>
        <div class="hidden gap-2 md:flex">
          <button
            type="button"
            aria-label={`Scroll ${heading} back`}
            onClick={() => scrollByPage(-1)}
            class="min-h-11 min-w-11 rounded-full border border-linen bg-cream text-ink motion-safe:transition-colors hover:border-gold"
          >
            ←
          </button>
          <button
            type="button"
            aria-label={`Scroll ${heading} forward`}
            onClick={() => scrollByPage(1)}
            class="min-h-11 min-w-11 rounded-full border border-linen bg-cream text-ink motion-safe:transition-colors hover:border-gold"
          >
            →
          </button>
        </div>
      </div>
      {/* pr-12 leaves the partial next-card peek visible at the right edge */}
      <ul
        ref={scroller}
        class="-mx-1 flex snap-x snap-mandatory gap-4 overflow-x-auto px-1 pb-2 pr-12"
      >
        {children}
      </ul>
    </section>
  )
}

/** A rail item — snap target, no shrink (cards own their width). */
export function RailItem({ children }: { children: ComponentChildren }) {
  return <li class="shrink-0 snap-start">{children}</li>
}
