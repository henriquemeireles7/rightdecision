/// <reference lib="dom" />
/**
 * App shell IA: Instrument Serif logo, desktop top nav / mobile bottom tab bar
 * (44px targets, safe-area inset), active item in gold, account menu (log out,
 * manage billing). Nav shows ONLY shipped waves: Home, Lives, Materials —
 * Playbook/Journal/Chat appear when their waves ship, never as coming-soon.
 */
import type { ComponentChildren } from 'preact'
import { useState } from 'preact/hooks'
import { fetchBillingPortalUrl, signOut } from '../lib/data'
import { Link, type Route } from '../router'

/**
 * Shipped waves only — P5 shipped Playbook + Journal; P6 (Chat) adds its entry when it ships.
 * Five tabs fit the mobile bar without an overflow menu: flex-1 keeps every target
 * ≥64px wide at a 320px viewport (44px minimum met with room), min-h-11 keeps 44px
 * height; the tab label drops to text-xs so "Materials" never wraps.
 */
export const NAV_ITEMS: ReadonlyArray<{ label: string; href: string; routes: Route['name'][] }> = [
  { label: 'Home', href: '/app', routes: ['home', 'lesson'] },
  { label: 'Playbook', href: '/app/playbook', routes: ['playbook', 'playbook-page'] },
  { label: 'Journal', href: '/app/journal', routes: ['journal'] },
  { label: 'Lives', href: '/app/lives', routes: ['lives', 'live'] },
  { label: 'Materials', href: '/app/materials', routes: ['materials'] },
]

function navClass(active: boolean, base: string) {
  return `${base} ${active ? 'text-gold' : 'text-body hover:text-ink'} motion-safe:transition-colors`
}

function AccountMenu() {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  const handleSignOut = async () => {
    setBusy(true)
    try {
      await signOut()
    } finally {
      location.assign('/login')
    }
  }

  const handleBilling = async () => {
    setBusy(true)
    try {
      location.assign(await fetchBillingPortalUrl())
    } catch {
      setBusy(false) // portal unavailable — stay put, the button stays usable
    }
  }

  return (
    <div class="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        class="min-h-11 rounded-sm px-3 py-2 text-body motion-safe:transition-colors hover:text-ink"
      >
        Account
      </button>
      {open ? (
        <div
          role="menu"
          aria-label="Account"
          class="absolute right-0 top-full z-10 mt-1 w-48 rounded-md border border-linen bg-surface-white py-1 shadow-md"
        >
          <button
            type="button"
            role="menuitem"
            disabled={busy}
            onClick={handleBilling}
            class="block w-full min-h-11 px-4 py-2 text-left text-ink hover:bg-sand disabled:cursor-not-allowed disabled:opacity-60"
          >
            Manage billing
          </button>
          <button
            type="button"
            role="menuitem"
            disabled={busy}
            onClick={handleSignOut}
            class="block w-full min-h-11 px-4 py-2 text-left text-ink hover:bg-sand disabled:cursor-not-allowed disabled:opacity-60"
          >
            Log out
          </button>
        </div>
      ) : null}
    </div>
  )
}

export function Shell({ route, children }: { route: Route; children: ComponentChildren }) {
  const isActive = (item: (typeof NAV_ITEMS)[number]) => item.routes.includes(route.name)

  return (
    <div class="min-h-screen bg-cream text-ink">
      <header class="border-b border-linen bg-cream">
        <div class="mx-auto flex max-w-[1200px] items-center justify-between gap-4 px-4 py-3">
          <Link href="/app" class="font-display text-xl text-ink">
            Right Decision
          </Link>
          <nav aria-label="Main" class="hidden items-center gap-6 md:flex">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive(item) ? 'page' : undefined}
                class={navClass(isActive(item), 'min-h-11 py-2 font-medium')}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <AccountMenu />
        </div>
      </header>

      <main id="main-content" class="pb-24 md:pb-12">
        {children}
      </main>

      <nav
        aria-label="Tab bar"
        class="fixed inset-x-0 bottom-0 z-10 border-t border-linen bg-cream pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        <div class="flex">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item) ? 'page' : undefined}
              class={navClass(
                isActive(item),
                'flex min-h-11 flex-1 items-center justify-center py-3 text-xs font-medium',
              )}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  )
}
