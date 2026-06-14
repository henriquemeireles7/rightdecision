/// <reference lib="dom" />
/**
 * Tiny history router for the /admin SPA. The SSR shell serves the same HTML for every
 * /admin sub-path; this module owns which screen renders. No dependency — pushState +
 * a custom event ('admin:navigate') so programmatic navigation re-renders like popstate.
 */
import { useEffect, useState } from 'preact/hooks'

export type Route =
  | { name: 'courses' }
  | { name: 'course'; courseId: string }
  | { name: 'module'; courseId: string; moduleId: string }
  | { name: 'lesson'; courseId: string; moduleId: string; lessonId: string }
  | { name: 'programs' }
  | { name: 'program'; programId: string }
  | { name: 'cohorts' }
  | { name: 'lives' }
  | { name: 'materials' }
  | { name: 'templates' }
  | { name: 'template'; templateId: string }
  | { name: 'distribution' }
  | { name: 'distribution-run'; runId: string }

const NAVIGATE_EVENT = 'admin:navigate'

/** Unknown paths fall back to the courses list — the panel never dead-ends. */
export function parseRoute(pathname: string): Route {
  const segments = pathname
    .replace(/^\/admin\/?/, '')
    .split('/')
    .filter(Boolean)
  const [head, a, b, c, d, e] = segments

  if (head === 'courses' && a && b === 'modules' && c && d === 'lessons' && e) {
    return { name: 'lesson', courseId: a, moduleId: c, lessonId: e }
  }
  if (head === 'courses' && a && b === 'modules' && c) {
    return { name: 'module', courseId: a, moduleId: c }
  }
  if (head === 'courses' && a) return { name: 'course', courseId: a }
  if (head === 'programs' && a) return { name: 'program', programId: a }
  if (head === 'programs') return { name: 'programs' }
  if (head === 'cohorts') return { name: 'cohorts' }
  if (head === 'lives') return { name: 'lives' }
  if (head === 'materials') return { name: 'materials' }
  if (head === 'templates' && a) return { name: 'template', templateId: a }
  if (head === 'templates') return { name: 'templates' }
  if (head === 'distribution' && a) return { name: 'distribution-run', runId: a }
  if (head === 'distribution') return { name: 'distribution' }
  return { name: 'courses' }
}

export function routePath(route: Route): string {
  switch (route.name) {
    case 'courses':
      return '/admin/courses'
    case 'course':
      return `/admin/courses/${route.courseId}`
    case 'module':
      return `/admin/courses/${route.courseId}/modules/${route.moduleId}`
    case 'lesson':
      return `/admin/courses/${route.courseId}/modules/${route.moduleId}/lessons/${route.lessonId}`
    case 'programs':
      return '/admin/programs'
    case 'program':
      return `/admin/programs/${route.programId}`
    case 'cohorts':
      return '/admin/cohorts'
    case 'lives':
      return '/admin/lives'
    case 'materials':
      return '/admin/materials'
    case 'templates':
      return '/admin/templates'
    case 'template':
      return `/admin/templates/${route.templateId}`
    case 'distribution':
      return '/admin/distribution'
    case 'distribution-run':
      return `/admin/distribution/${route.runId}`
  }
}

export function navigate(route: Route): void {
  window.history.pushState({}, '', routePath(route))
  window.dispatchEvent(new Event(NAVIGATE_EVENT))
}

/** Current route, re-rendering on back/forward and programmatic navigate(). */
export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseRoute(window.location.pathname))
  useEffect(() => {
    const sync = () => setRoute(parseRoute(window.location.pathname))
    window.addEventListener('popstate', sync)
    window.addEventListener(NAVIGATE_EVENT, sync)
    return () => {
      window.removeEventListener('popstate', sync)
      window.removeEventListener(NAVIGATE_EVENT, sync)
    }
  }, [])
  return route
}
