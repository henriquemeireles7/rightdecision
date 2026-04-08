type BottomNavProps = {
  prevClassId: string | null
  nextClassId: string | null
  classId: string
  isBookmarked: boolean
}

export function BottomNav({ prevClassId, nextClassId, classId, isBookmarked }: BottomNavProps) {
  return (
    <nav
      class="fixed bottom-0 left-0 right-0 bg-surface-white border-t border-linen md:hidden z-40"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        height: 'calc(56px + env(safe-area-inset-bottom, 0px))',
      }}
    >
      <div class="flex items-center justify-around h-[44px] px-4">
        {/* Back */}
        {prevClassId ? (
          <a
            href={`/class/${prevClassId}`}
            class="flex items-center justify-center w-11 h-11 text-muted hover:text-gold transition-colors focus-visible:outline-2 focus-visible:outline-gold focus-visible:outline-offset-2 rounded-md"
          >
            <span class="sr-only">Previous class</span>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path
                d="M12.5 15L7.5 10L12.5 5"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </a>
        ) : (
          <div class="w-11 h-11" />
        )}

        {/* Next */}
        {nextClassId ? (
          <a
            href={`/class/${nextClassId}`}
            class="flex items-center justify-center w-11 h-11 text-muted hover:text-gold transition-colors focus-visible:outline-2 focus-visible:outline-gold focus-visible:outline-offset-2 rounded-md"
          >
            <span class="sr-only">Next class</span>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path
                d="M7.5 5L12.5 10L7.5 15"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </a>
        ) : (
          <div class="w-11 h-11" />
        )}

        {/* Bookmark */}
        <button
          type="button"
          class={`flex items-center justify-center w-11 h-11 transition-colors focus-visible:outline-2 focus-visible:outline-gold focus-visible:outline-offset-2 rounded-md ${isBookmarked ? 'text-gold' : 'text-muted hover:text-gold'}`}
          hx-post="/api/bookmarks"
          hx-vals={JSON.stringify({ classId })}
          hx-swap="outerHTML"
          aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark this class'}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill={isBookmarked ? 'currentColor' : 'none'}
            aria-hidden="true"
          >
            <path
              d="M10 3.22l-.61-.6a5.5 5.5 0 00-7.78 7.77L10 18.78l8.39-8.4a5.5 5.5 0 00-7.78-7.77l-.61.61z"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>

        {/* Menu */}
        <button
          type="button"
          class="flex items-center justify-center w-11 h-11 text-muted hover:text-gold transition-colors focus-visible:outline-2 focus-visible:outline-gold focus-visible:outline-offset-2 rounded-md"
          aria-label="Open menu"
          data-action="open-menu"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path
              d="M3 5H17M3 10H17M3 15H17"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
            />
          </svg>
        </button>
      </div>
    </nav>
  )
}
