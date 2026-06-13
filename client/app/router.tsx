/// <reference lib="dom" />
/**
 * Hand-rolled history router for the /app SPA — no dependency, ~1KB.
 * The app-shell SSR route serves the same shell for every /app/* path, so the
 * client owns path → page resolution (deep links land here directly).
 */
import type { ComponentChildren, JSX } from 'preact'
import { useEffect, useState } from 'preact/hooks'

export type Route =
  | { name: 'home' }
  | { name: 'lesson'; lessonId: string }
  | { name: 'lives' }
  | { name: 'live'; liveId: string }
  | { name: 'materials' }
  | { name: 'not-found' }

export const APP_BASE = '/app'

export function parseRoute(pathname: string): Route {
  const path = pathname.startsWith(APP_BASE) ? pathname.slice(APP_BASE.length) : pathname
  const segments = path.split('/').filter(Boolean)
  const [head, second] = segments
  if (segments.length === 0) return { name: 'home' }
  if (head === 'lessons' && second && segments.length === 2)
    return { name: 'lesson', lessonId: second }
  if (head === 'lives' && segments.length === 1) return { name: 'lives' }
  if (head === 'lives' && second && segments.length === 2) return { name: 'live', liveId: second }
  if (head === 'materials' && segments.length === 1) return { name: 'materials' }
  return { name: 'not-found' }
}

const listeners = new Set<() => void>()

export function navigate(to: string) {
  history.pushState(null, '', to)
  for (const listener of listeners) listener()
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseRoute(location.pathname))
  useEffect(() => {
    const update = () => setRoute(parseRoute(location.pathname))
    listeners.add(update)
    window.addEventListener('popstate', update)
    return () => {
      listeners.delete(update)
      window.removeEventListener('popstate', update)
    }
  }, [])
  return route
}

type LinkProps = Omit<JSX.HTMLAttributes<HTMLAnchorElement>, 'href'> & {
  href: string
  children: ComponentChildren
}

/** In-app anchor: real href (open-in-new-tab works), client-side pushState on plain clicks. */
export function Link({ href, onClick, children, ...rest }: LinkProps) {
  return (
    <a
      href={href}
      onClick={(event) => {
        if (typeof onClick === 'function') onClick(event)
        if (event.defaultPrevented) return
        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
          return
        event.preventDefault()
        navigate(href)
      }}
      {...rest}
    >
      {children}
    </a>
  )
}
