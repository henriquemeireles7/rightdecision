import { describe, expect, test } from 'bun:test'
import { safeNextPath } from './login'

describe('safeNextPath (post-login ?next open-redirect guard)', () => {
  test('accepts same-origin relative paths', () => {
    expect(safeNextPath('/app')).toBe('/app')
    expect(safeNextPath('/admin/courses')).toBe('/admin/courses')
    expect(safeNextPath('/app/lessons/abc?x=1#frag')).toBe('/app/lessons/abc?x=1#frag')
  })

  test('falls back to /course when next is absent', () => {
    expect(safeNextPath(null)).toBe('/course')
    expect(safeNextPath(undefined)).toBe('/course')
    expect(safeNextPath('')).toBe('/course')
  })

  test('rejects protocol-relative and absolute URLs (open redirect)', () => {
    expect(safeNextPath('//evil.com')).toBe('/course')
    expect(safeNextPath('//evil.com/path')).toBe('/course')
    expect(safeNextPath('https://evil.com')).toBe('/course')
    expect(safeNextPath('http://evil.com')).toBe('/course')
    expect(safeNextPath('javascript:alert(1)')).toBe('/course')
  })

  test('rejects backslash and control-character tricks', () => {
    expect(safeNextPath('/\\evil.com')).toBe('/course')
    expect(safeNextPath('/app\\..\\admin')).toBe('/course')
    expect(safeNextPath('/app\n/admin')).toBe('/course')
  })

  test('rejects paths that do not start with a slash', () => {
    expect(safeNextPath('app')).toBe('/course')
    expect(safeNextPath('evil.com')).toBe('/course')
  })
})
