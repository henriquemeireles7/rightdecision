import type { CourseModule } from '@/providers/content'
import type { AccessTier } from './access'

type MenuOverlayProps = {
  accessTier: AccessTier
  modules: CourseModule[]
}

export function MenuOverlay({ accessTier, modules }: MenuOverlayProps) {
  return (
    <div id="menu-overlay" class="hidden fixed inset-0 z-50 bg-cream overflow-y-auto">
      <div class="max-w-[65ch] mx-auto px-6 py-8">
        {/* Close button */}
        <div class="flex justify-end mb-8">
          <button
            type="button"
            class="w-11 h-11 flex items-center justify-center text-muted hover:text-ink transition-colors focus-visible:outline-2 focus-visible:outline-gold focus-visible:outline-offset-2 rounded-md"
            aria-label="Close menu"
            data-action="close-menu"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M5 5L15 15M15 5L5 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
            </svg>
          </button>
        </div>

        {/* Navigation links */}
        <nav class="space-y-6 mb-10">
          <a href="/courses/life-decisions" class="block font-display text-xl text-ink hover:text-gold transition-colors">
            Course
          </a>
          <a href="/journey" class="block font-display text-xl text-ink hover:text-gold transition-colors">
            Journey
          </a>
          <a href="/bookmarks" class="block font-display text-xl text-ink hover:text-gold transition-colors">
            Bookmarks
          </a>
          <a href="/account" class="block font-display text-xl text-ink hover:text-gold transition-colors">
            Account
          </a>
        </nav>

        {/* Table of contents */}
        <div class="border-t border-linen pt-8">
          <h2 class="font-display text-lg text-muted mb-4">Table of Contents</h2>
          <div class="space-y-4">
            {modules.map((mod) => {
              const isLocked = mod.id > 1 && accessTier !== 'paid'
              if (isLocked) return null
              return (
                <div key={mod.id}>
                  <div class="text-sm text-muted mb-1">Module {mod.id}</div>
                  <div class="font-display text-ink mb-2">{mod.name}</div>
                  <div class="pl-4 space-y-1">
                    {mod.classes.map((cls) => (
                      <a
                        key={cls.id}
                        href={`/class/${cls.id}`}
                        class="block text-sm text-body hover:text-gold transition-colors py-0.5"
                      >
                        {cls.title}
                      </a>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
