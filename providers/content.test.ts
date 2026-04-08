import { describe, expect, test } from 'bun:test'
import {
  getAllCourses,
  getAllModules,
  getClass,
  getClassesByCourse,
  getCourse,
  getModule,
  getTotalClasses,
  searchClasses,
} from './content'

describe('content provider', () => {
  test('loads all modules', () => {
    const modules = getAllModules()
    expect(modules.length).toBeGreaterThan(0)
    // Should have module 0 (onboarding) through module 9
    expect(modules[0]!.id).toBe(0)
  })

  test('modules are sorted by id', () => {
    const modules = getAllModules()
    for (let i = 1; i < modules.length; i++) {
      expect(modules[i]!.id).toBeGreaterThan(modules[i - 1]!.id)
    }
  })

  test('each module has classes', () => {
    const modules = getAllModules()
    for (const mod of modules) {
      expect(mod.classes.length).toBeGreaterThan(0)
    }
  })

  test('getClass returns a class by id', () => {
    const cls = getClass('module-01/class-01')
    expect(cls).toBeDefined()
    expect(cls!.module).toBe(1)
    expect(cls!.lesson).toBe(1)
    expect(cls!.title.length).toBeGreaterThan(0)
  })

  test('getClass returns undefined for nonexistent id', () => {
    expect(getClass('module-99/class-99')).toBeUndefined()
  })

  test('getModule returns module with classes', () => {
    const mod = getModule(2)
    expect(mod).toBeDefined()
    expect(mod!.classes.length).toBeGreaterThan(0)
    expect(mod!.id).toBe(2)
  })

  test('getModule returns undefined for nonexistent module', () => {
    expect(getModule(99)).toBeUndefined()
  })

  test('module 0 is free-course, others are full-course', () => {
    const free = getClassesByCourse('free-course')
    const paid = getClassesByCourse('full-course')
    expect(free.length).toBeGreaterThan(0)
    expect(paid.length).toBeGreaterThan(0)
    for (const c of free) {
      expect(c.module).toBe(0)
    }
    for (const c of paid) {
      expect(c.module).toBeGreaterThan(0)
    }
  })

  test('classes have required fields', () => {
    const cls = getClass('module-02/class-01')
    expect(cls).toBeDefined()
    expect(cls!.id).toBe('module-02/class-01')
    expect(cls!.courseId).toBe('full-course')
    expect(cls!.title).toBeTruthy()
    expect(cls!.slug).toBeTruthy()
    expect(cls!.durationMinutes).toBeGreaterThan(0)
    expect(cls!.content.length).toBeGreaterThan(0)
    expect(['theory', 'practical']).toContain(cls!.type)
  })

  test('practical classes are detected from slug', () => {
    // Module 2 has a practice class (04-practice-write-your-state-map)
    const mod = getModule(2)
    const practice = mod!.classes.find((c) => c.type === 'practical')
    expect(practice).toBeDefined()
    expect(practice!.slug).toContain('practice')
  })

  test('searchClasses finds by title', () => {
    const results = searchClasses('trap')
    expect(results.length).toBeGreaterThan(0)
  })

  test('searchClasses returns empty for no match', () => {
    const results = searchClasses('xyznonexistent123')
    expect(results.length).toBe(0)
  })

  test('getTotalClasses returns positive number', () => {
    expect(getTotalClasses()).toBeGreaterThan(0)
  })

  test('classes have courseSlug field', () => {
    const cls = getClass('module-01/class-01')
    expect(cls).toBeDefined()
    expect(cls!.courseSlug).toBe('life-decisions')
  })

  test('getCourse returns life-decisions course', () => {
    const course = getCourse('life-decisions')
    expect(course).toBeDefined()
    expect(course!.title).toBe('Life Decisions')
    expect(course!.modules.length).toBeGreaterThan(0)
  })

  test('getCourse returns undefined for nonexistent course', () => {
    expect(getCourse('nonexistent')).toBeUndefined()
  })

  test('getAllCourses returns published courses', () => {
    const courses = getAllCourses()
    expect(courses.length).toBeGreaterThan(0)
    expect(courses[0]!.slug).toBe('life-decisions')
  })
})
