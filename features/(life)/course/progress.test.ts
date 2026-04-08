import { describe, expect, test } from 'bun:test'
import { getModule } from '@/providers/content'

// getCurrentClass is pure (only uses content provider, no DB)
// But it lives in progress.ts which imports db at module level
// So we test the logic directly here

describe('progress tracking logic', () => {
  test('module 1 has classes', () => {
    const mod = getModule(1)
    expect(mod).toBeDefined()
    expect(mod?.classes.length).toBeGreaterThan(0)
  })

  test('getCurrentClass logic: first class when none completed', () => {
    const mod = getModule(1)!
    const completedSet = new Set<string>()
    const first = mod.classes.find((c) => !completedSet.has(c.id))
    expect(first).toBeDefined()
    expect(first?.id).toContain('module-01')
  })

  test('getCurrentClass logic: next uncompleted after first', () => {
    const mod = getModule(1)!
    const completedSet = new Set([mod.classes[0]?.id])
    const next = mod.classes.find((c) => !completedSet.has(c.id))
    expect(next).toBeDefined()
    expect(next?.id).not.toBe(mod.classes[0]?.id)
  })

  test('getCurrentClass logic: null when all completed', () => {
    const mod = getModule(1)!
    const allIds = new Set(mod.classes.map((c) => c.id))
    const next = mod.classes.find((c) => !allIds.has(c.id))
    expect(next).toBeUndefined()
  })
})
