import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

// ─── Types ────────────────────────────────────────────────────────────────────

export type ClassType = 'theory' | 'practical'

export type CourseClass = {
  id: string
  courseId: string
  courseSlug: string
  title: string
  slug: string
  module: number
  lesson: number
  durationMinutes: number
  type: ClassType
  content: string
  decisionPrompt: string | null
}

export type CourseModule = {
  id: number
  name: string
  slug: string
  classes: CourseClass[]
}

export type Course = {
  slug: string
  title: string
  subtitle: string
  status: string
  modules: CourseModule[]
}

// ─── Frontmatter Parser ──────────────────────────────────────────────────────

function parseFrontmatter(raw: string): { meta: Record<string, string>; content: string } {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  if (!match) return { meta: {}, content: raw }

  const meta: Record<string, string> = {}
  for (const line of (match[1] ?? '').split('\n')) {
    const sep = line.indexOf(':')
    if (sep === -1) continue
    const key = line.slice(0, sep).trim()
    const val = line
      .slice(sep + 1)
      .trim()
      .replace(/^["']|["']$/g, '')
    meta[key] = val
  }

  return { meta, content: (match[2] ?? '').trim() }
}

// ─── Content Loading ─────────────────────────────────────────────────────────

const COURSES_JSON_PATH = join(process.cwd(), 'content/courses.json')
const REDIRECTS_PATH = join(process.cwd(), 'content/redirects.json')

let redirects: Record<string, string> = {}
const classMap = new Map<string, CourseClass>()
const moduleMap = new Map<string, CourseModule>() // key: `${courseSlug}/${moduleId}`
const courseMap = new Map<string, Course>()
let loaded = false

function inferClassType(slug: string): ClassType {
  return slug.startsWith('practice') || slug.includes('practice-') ? 'practical' : 'theory'
}

function buildClassId(moduleNum: number, lessonNum: number): string {
  const mod = String(moduleNum).padStart(2, '0')
  const les = String(lessonNum).padStart(2, '0')
  return `module-${mod}/class-${les}`
}

type CourseConfig = {
  slug: string
  title: string
  subtitle: string
  contentDir: string
  status: string
}

function loadCourseContent(config: CourseConfig) {
  const contentDir = join(process.cwd(), config.contentDir)
  const courseModules: CourseModule[] = []

  try {
    const moduleDirs = readdirSync(contentDir, { withFileTypes: true })
      .filter((d) => d.isDirectory() && d.name.startsWith('module-'))
      .sort((a, b) => a.name.localeCompare(b.name))

    for (const moduleDir of moduleDirs) {
      const moduleMatch = moduleDir.name.match(/^module-(\d+)-(.+)$/)
      if (!moduleMatch) continue

      const moduleNum = Number.parseInt(moduleMatch[1] ?? '0', 10)
      const moduleSlug = moduleDir.name
      const moduleName = moduleMatch[2]?.replace(/-/g, ' ') ?? ''

      const modulePath = join(contentDir, moduleDir.name)
      const files = readdirSync(modulePath)
        .filter((f) => f.endsWith('.mdx'))
        .sort()

      const classes: CourseClass[] = []

      for (const file of files) {
        const raw = readFileSync(join(modulePath, file), 'utf-8')
        const { meta, content } = parseFrontmatter(raw)

        const lesson = Number.parseInt(meta.lesson ?? '0', 10)
        const classId = buildClassId(moduleNum, lesson)
        const courseId = moduleNum === 0 ? 'free-course' : 'full-course'

        const courseClass: CourseClass = {
          id: classId,
          courseId,
          courseSlug: config.slug,
          title: meta.title ?? file.replace('.mdx', ''),
          slug: meta.slug ?? file.replace('.mdx', ''),
          module: moduleNum,
          lesson,
          durationMinutes: Number.parseInt(meta.duration_minutes ?? '0', 10),
          type: inferClassType(meta.slug ?? file),
          content,
          decisionPrompt: meta.decision_prompt || null,
        }

        classes.push(courseClass)
        classMap.set(classId, courseClass)
      }

      const courseModule: CourseModule = {
        id: moduleNum,
        name: moduleName,
        slug: moduleSlug,
        classes,
      }

      courseModules.push(courseModule)
      moduleMap.set(`${config.slug}/${moduleNum}`, courseModule)
    }
  } catch {
    // Content dir may not exist in test environments
  }

  return courseModules
}

function loadContent() {
  if (loaded) return

  // Load redirects map
  try {
    const raw = readFileSync(REDIRECTS_PATH, 'utf-8')
    redirects = JSON.parse(raw) as Record<string, string>
  } catch {
    redirects = {}
  }

  // Load courses from registry
  try {
    const raw = readFileSync(COURSES_JSON_PATH, 'utf-8')
    const registry = JSON.parse(raw) as { courses: CourseConfig[] }

    for (const config of registry.courses) {
      if (config.status !== 'published') continue
      const modules = loadCourseContent(config)
      courseMap.set(config.slug, {
        slug: config.slug,
        title: config.title,
        subtitle: config.subtitle,
        status: config.status,
        modules,
      })
    }
  } catch {
    // courses.json may not exist in test environments
  }

  loaded = true
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Resolve a classId through the redirects map (for renamed classes).
 * Returns the current classId, following redirect chains.
 */
export function resolveClassId(classId: string): string {
  loadContent()
  let resolved = classId
  let depth = 0
  while (redirects[resolved] && depth < 10) {
    resolved = redirects[resolved] as string
    depth++
  }
  return resolved
}

export function getClass(classId: string): CourseClass | undefined {
  loadContent()
  return classMap.get(resolveClassId(classId))
}

export function getModule(moduleNum: number): CourseModule | undefined {
  loadContent()
  // Default to life-decisions for backwards compatibility
  return moduleMap.get(`life-decisions/${moduleNum}`)
}

export function getAllModules(): CourseModule[] {
  loadContent()
  // Default to life-decisions for backwards compatibility
  const course = courseMap.get('life-decisions')
  if (!course) return []
  return course.modules.sort((a, b) => a.id - b.id)
}

export function getClassesByCourse(courseId: string): CourseClass[] {
  loadContent()
  return Array.from(classMap.values()).filter((c) => c.courseId === courseId)
}

export function searchClasses(query: string): CourseClass[] {
  loadContent()
  const q = query.toLowerCase()
  return Array.from(classMap.values()).filter(
    (c) => c.title.toLowerCase().includes(q) || c.content.toLowerCase().includes(q),
  )
}

export function getTotalClasses(): number {
  loadContent()
  return classMap.size
}

// ─── Multi-Course API ────────────────────────────────────────────────────────

export function getCourse(slug: string): Course | undefined {
  loadContent()
  return courseMap.get(slug)
}

export function getAllCourses(): Course[] {
  loadContent()
  return Array.from(courseMap.values())
}
