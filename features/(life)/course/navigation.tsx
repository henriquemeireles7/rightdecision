import type { AccessTier } from './access'

type NavProps = {
  accessTier: AccessTier
  isLoggedIn: boolean
  isAdmin?: boolean
  userName?: string
}

type NavItem = { label: string; href: string }

export function getNavItems({ accessTier, isLoggedIn, isAdmin }: NavProps): NavItem[] {
  const items: NavItem[] = []

  if (!isLoggedIn) {
    // Anonymous
    items.push({ label: 'Wins Board', href: '/wins' })
    items.push({ label: 'Login', href: '/login' })
    items.push({ label: 'Get Started', href: '/onboarding' })
  } else if (accessTier === 'free' || accessTier === 'expired') {
    // Free / expired
    items.push({ label: 'Course', href: '/course' })
    items.push({ label: 'Wins Board', href: '/wins' })
    items.push({ label: 'Upgrade', href: '/pricing' })
    items.push({ label: 'Account', href: '/account' })
  } else {
    // Paid
    items.push({ label: 'Course', href: '/course' })
    items.push({ label: 'Wins Board', href: '/wins' })
    items.push({ label: 'My Wins', href: '/wins/mine' })
    items.push({ label: 'Bookmarks', href: '/bookmarks' })
    items.push({ label: 'Account', href: '/account' })
  }

  if (isAdmin) {
    items.push({ label: 'Admin', href: '/admin' })
  }

  return items
}

export function Navigation(props: NavProps) {
  const items = getNavItems(props)

  return (
    <nav class="flex items-center justify-between px-6 py-4 border-b border-neutral-200 bg-white">
      <a href="/" class="text-xl font-serif text-neutral-900">
        Right Decision
      </a>
      <div class="flex items-center gap-6">
        {items.map((item) => (
          <a
            key={item.href}
            href={item.href}
            class="text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
          >
            {item.label}
          </a>
        ))}
        {props.userName && <span class="text-sm text-neutral-400">{props.userName}</span>}
      </div>
    </nav>
  )
}
