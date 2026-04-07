import { and, count, eq } from 'drizzle-orm'
import { db } from '@/platform/db/client'
import { courseProgress } from '@/platform/db/schema'
import { getAllModules, getModule } from '@/providers/content'

export async function markClassComplete(userId: string, classId: string, courseId: string) {
  await db
    .insert(courseProgress)
    .values({ userId, classId, courseId })
    .onConflictDoNothing()
}

export async function getUserProgress(userId: string) {
  return db.query.courseProgress.findMany({
    where: eq(courseProgress.userId, userId),
    orderBy: (cp, { asc }) => [asc(cp.completedAt)],
  })
}

export async function getModuleProgress(userId: string, moduleNum: number) {
  const mod = getModule(moduleNum)
  if (!mod) return { total: 0, completed: 0, percent: 0 }

  const total = mod.classes.length
  const completed = await db
    .select({ count: count() })
    .from(courseProgress)
    .where(
      and(
        eq(courseProgress.userId, userId),
        eq(courseProgress.courseId, moduleNum === 0 ? 'free-course' : 'full-course'),
      ),
    )

  const completedCount = completed[0]?.count ?? 0
  // Filter to only classes in this module
  const userProgress = await getUserProgress(userId)
  const moduleClassIds = mod.classes.map((c) => c.id)
  const moduleCompleted = userProgress.filter((p) => moduleClassIds.includes(p.classId)).length

  return {
    total,
    completed: moduleCompleted,
    percent: total > 0 ? Math.round((moduleCompleted / total) * 100) : 0,
  }
}

export async function getOverallProgress(userId: string) {
  const modules = getAllModules()
  const totalClasses = modules.reduce((sum, m) => sum + m.classes.length, 0)

  const [completedResult] = await db
    .select({ count: count() })
    .from(courseProgress)
    .where(eq(courseProgress.userId, userId))

  const completedCount = completedResult?.count ?? 0

  return {
    totalClasses,
    completedClasses: completedCount,
    percent: totalClasses > 0 ? Math.round((completedCount / totalClasses) * 100) : 0,
  }
}

export function getCurrentClass(
  completedClassIds: string[],
  moduleNum: number,
): string | null {
  const mod = getModule(moduleNum)
  if (!mod) return null

  const completedSet = new Set(completedClassIds)
  for (const cls of mod.classes) {
    if (!completedSet.has(cls.id)) return cls.id
  }
  return null // all completed
}
