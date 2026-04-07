import { describe, expect, test } from 'bun:test'
// Import only pure functions — not getUserAccessTier (needs DB)
import { canAccessClass, getModuleFromClassId } from './access'

describe('course access gating', () => {
  test('free users can access module 0', () => {
    expect(canAccessClass(0, 'free')).toBe(true)
  })

  test('free users can access module 1', () => {
    expect(canAccessClass(1, 'free')).toBe(true)
  })

  test('free users cannot access module 2', () => {
    expect(canAccessClass(2, 'free')).toBe(false)
  })

  test('free users cannot access module 9', () => {
    expect(canAccessClass(9, 'free')).toBe(false)
  })

  test('paid users can access all modules', () => {
    for (let m = 0; m <= 9; m++) {
      expect(canAccessClass(m, 'paid')).toBe(true)
    }
  })

  test('expired users can access module 0 and 1', () => {
    expect(canAccessClass(0, 'expired')).toBe(true)
    expect(canAccessClass(1, 'expired')).toBe(true)
  })

  test('expired users cannot access modules 2-9', () => {
    for (let m = 2; m <= 9; m++) {
      expect(canAccessClass(m, 'expired')).toBe(false)
    }
  })
})

describe('getModuleFromClassId', () => {
  test('parses module number from classId', () => {
    expect(getModuleFromClassId('module-02/class-01')).toBe(2)
    expect(getModuleFromClassId('module-00/class-03')).toBe(0)
    expect(getModuleFromClassId('module-09/class-04')).toBe(9)
  })

  test('returns -1 for invalid classId', () => {
    expect(getModuleFromClassId('invalid')).toBe(-1)
    expect(getModuleFromClassId('')).toBe(-1)
  })
})
