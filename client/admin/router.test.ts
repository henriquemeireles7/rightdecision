import '@/platform/test/dom-preload'

import { describe, expect, test } from 'bun:test'
import { navigate, parseRoute, routePath } from './router'
import { setBrowserPath } from './test-fixtures'

describe('client/admin router: parseRoute', () => {
  test('root and /courses resolve to the courses list', () => {
    expect(parseRoute('/admin')).toEqual({ name: 'courses' })
    expect(parseRoute('/admin/')).toEqual({ name: 'courses' })
    expect(parseRoute('/admin/courses')).toEqual({ name: 'courses' })
  })

  test('course detail', () => {
    expect(parseRoute('/admin/courses/c-1')).toEqual({ name: 'course', courseId: 'c-1' })
  })

  test('module detail', () => {
    expect(parseRoute('/admin/courses/c-1/modules/m-2')).toEqual({
      name: 'module',
      courseId: 'c-1',
      moduleId: 'm-2',
    })
  })

  test('lesson editor', () => {
    expect(parseRoute('/admin/courses/c-1/modules/m-2/lessons/l-3')).toEqual({
      name: 'lesson',
      courseId: 'c-1',
      moduleId: 'm-2',
      lessonId: 'l-3',
    })
  })

  test('programs list and detail', () => {
    expect(parseRoute('/admin/programs')).toEqual({ name: 'programs' })
    expect(parseRoute('/admin/programs/p-1')).toEqual({ name: 'program', programId: 'p-1' })
  })

  test('cohorts, lives, materials', () => {
    expect(parseRoute('/admin/cohorts')).toEqual({ name: 'cohorts' })
    expect(parseRoute('/admin/lives')).toEqual({ name: 'lives' })
    expect(parseRoute('/admin/materials')).toEqual({ name: 'materials' })
  })

  test('templates list and editor', () => {
    expect(parseRoute('/admin/templates')).toEqual({ name: 'templates' })
    expect(parseRoute('/admin/templates/t-1')).toEqual({ name: 'template', templateId: 't-1' })
  })

  test('unknown paths fall back to the courses list (never a dead end)', () => {
    expect(parseRoute('/admin/nope/whatever')).toEqual({ name: 'courses' })
  })
})

describe('client/admin router: routePath', () => {
  test('round-trips every route shape', () => {
    const paths = [
      '/admin/courses',
      '/admin/courses/c-1',
      '/admin/courses/c-1/modules/m-2',
      '/admin/courses/c-1/modules/m-2/lessons/l-3',
      '/admin/programs',
      '/admin/programs/p-1',
      '/admin/cohorts',
      '/admin/lives',
      '/admin/materials',
      '/admin/templates',
      '/admin/templates/t-1',
    ]
    for (const path of paths) {
      expect(routePath(parseRoute(path))).toBe(path)
    }
  })
})

describe('client/admin router: navigate', () => {
  test('pushes history and notifies subscribers', () => {
    setBrowserPath('/admin')
    let notified = 0
    const onNav = () => {
      notified += 1
    }
    window.addEventListener('admin:navigate', onNav)
    navigate({ name: 'lives' })
    expect(window.location.pathname).toBe('/admin/lives')
    expect(notified).toBe(1)
    window.removeEventListener('admin:navigate', onNav)
  })
})
