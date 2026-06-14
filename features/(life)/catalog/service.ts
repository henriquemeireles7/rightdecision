import { and, asc, desc, eq, inArray, isNull } from 'drizzle-orm'
import { activeEnrollmentClause } from '@/features/(shared)/enrollment/service'
import { db } from '@/platform/db/client'
import {
  cohorts,
  courses,
  enrollments,
  lessonProgress,
  lessons,
  modules,
  programCourses,
  programs,
} from '@/platform/db/schema'

/** Continue-watching rail size — most recent N incomplete lessons. */
export const CONTINUE_WATCHING_LIMIT = 10

type LessonRow = typeof lessons.$inferSelect
type ProgressRow = typeof lessonProgress.$inferSelect

function toProgressView(progress: ProgressRow | undefined) {
  if (!progress) return null
  return {
    secondsWatched: progress.secondsWatched,
    completedAt: progress.completedAt,
    lastWatchedAt: progress.lastWatchedAt,
  }
}

/** Unlocked lessons carry full metadata + the user's progress. */
function toUnlockedLesson(lesson: LessonRow, progress: ProgressRow | undefined) {
  return {
    id: lesson.id,
    title: lesson.title,
    description: lesson.description,
    durationSeconds: lesson.durationSeconds,
    thumbnailKey: lesson.thumbnailKey,
    videoStatus: lesson.videoStatus, // 'processing' cards until Stream is ready
    progress: toProgressView(progress),
  }
}

/** Locked previews expose ONLY id + title — never lesson content (Lock-State UX). */
function toLockedLesson(lesson: LessonRow) {
  return { id: lesson.id, title: lesson.title }
}

/**
 * Explicit union — a bare ternary infers the best common SUPERTYPE ({ id, title }),
 * erasing the unlocked shape from AppRoutes RPC types the members SPA consumes.
 */
type CatalogLessonView = ReturnType<typeof toUnlockedLesson> | ReturnType<typeof toLockedLesson>

function groupBy<T>(rows: T[], key: (row: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>()
  for (const row of rows) {
    const k = key(row)
    const bucket = map.get(k)
    if (bucket) bucket.push(row)
    else map.set(k, [row])
  }
  return map
}

/**
 * The program-aware members catalog (ADR 4: one platform, free users see the full
 * catalog with locks). Visible programs = status='active'; unlocked = the user holds
 * an ACTIVE enrollment in the program; everything else renders locked. Draft content
 * never leaks — published-only filtering applies to locked previews too (Gate B).
 */
export async function getCatalog(userId: string) {
  const now = new Date()

  // The user's active enrollments + their cohort start (pre-start welcome state)
  const userEnrollments = await db
    .select({ programId: enrollments.programId, cohortStartsAt: cohorts.startsAt })
    .from(enrollments)
    .leftJoin(cohorts, eq(cohorts.id, enrollments.cohortId))
    .where(and(eq(enrollments.userId, userId), activeEnrollmentClause()))

  const enrolledPrograms = new Map(userEnrollments.map((e) => [e.programId, e.cohortStartsAt]))

  // The one-platform rule: every ACTIVE program is visible (locked or not)
  const visiblePrograms = await db
    .select()
    .from(programs)
    .where(eq(programs.status, 'active'))
    .orderBy(asc(programs.createdAt))

  const programIds = visiblePrograms.map((p) => p.id)
  const courseRows =
    programIds.length > 0
      ? await db
          .select({ programId: programCourses.programId, course: courses })
          .from(programCourses)
          .innerJoin(
            courses,
            and(eq(courses.id, programCourses.courseId), eq(courses.status, 'published')),
          )
          .where(inArray(programCourses.programId, programIds))
          .orderBy(asc(programCourses.sortOrder), asc(programCourses.createdAt))
      : []

  const courseIds = [...new Set(courseRows.map((row) => row.course.id))]
  const moduleRows =
    courseIds.length > 0
      ? await db
          .select()
          .from(modules)
          .where(and(inArray(modules.courseId, courseIds), eq(modules.status, 'published')))
          .orderBy(asc(modules.sortOrder), asc(modules.createdAt))
      : []

  const moduleIds = moduleRows.map((m) => m.id)
  const lessonRows =
    moduleIds.length > 0
      ? await db
          .select()
          .from(lessons)
          .where(and(inArray(lessons.moduleId, moduleIds), eq(lessons.status, 'published')))
          .orderBy(asc(lessons.sortOrder), asc(lessons.createdAt))
      : []

  // Per-lesson progress join — one query for the whole catalog
  const lessonIds = lessonRows.map((l) => l.id)
  const progressRows =
    lessonIds.length > 0
      ? await db
          .select()
          .from(lessonProgress)
          .where(
            and(eq(lessonProgress.userId, userId), inArray(lessonProgress.lessonId, lessonIds)),
          )
      : []
  const progressByLesson = new Map(progressRows.map((p) => [p.lessonId, p]))

  const coursesByProgram = groupBy(courseRows, (row) => row.programId)
  const modulesByCourse = groupBy(moduleRows, (m) => m.courseId)
  const lessonsByModule = groupBy(lessonRows, (l) => l.moduleId)

  const programEntries = visiblePrograms.map((program) => {
    const unlocked = enrolledPrograms.has(program.id)
    const enrolledCohortStart = enrolledPrograms.get(program.id) ?? null
    const cohortStartsAt =
      enrolledCohortStart && enrolledCohortStart > now ? enrolledCohortStart : null
    return {
      id: program.id,
      slug: program.slug,
      name: program.name,
      description: program.description,
      tier: program.tier,
      coverImageKey: program.coverImageKey,
      unlocked,
      cohortStartsAt, // set → the UI renders the pre-start welcome state
      courses: (coursesByProgram.get(program.id) ?? []).map(({ course }) => ({
        id: course.id,
        slug: course.slug,
        title: course.title,
        description: course.description,
        coverImageKey: course.coverImageKey,
        modules: (modulesByCourse.get(course.id) ?? []).map((courseModule) => ({
          id: courseModule.id,
          title: courseModule.title,
          description: courseModule.description,
          coverImageKey: courseModule.coverImageKey,
          lessons: (lessonsByModule.get(courseModule.id) ?? []).map(
            (lesson): CatalogLessonView =>
              unlocked
                ? toUnlockedLesson(lesson, progressByLesson.get(lesson.id))
                : toLockedLesson(lesson),
          ),
        })),
      })),
    }
  })
  // Unlocked content FIRST (Lock-State UX); stable order otherwise
  programEntries.sort((a, b) => Number(b.unlocked) - Number(a.unlocked))

  // Continue-watching: ONE query on index(userId, lastWatchedAt); a lesson mapped to
  // two enrolled programs joins twice, so over-fetch then dedupe by lesson id.
  const continueWatchingRows = await db
    .select({ progress: lessonProgress, lesson: lessons, moduleId: modules.id })
    .from(lessonProgress)
    .innerJoin(
      lessons,
      and(eq(lessons.id, lessonProgress.lessonId), eq(lessons.status, 'published')),
    )
    .innerJoin(modules, and(eq(modules.id, lessons.moduleId), eq(modules.status, 'published')))
    .innerJoin(programCourses, eq(programCourses.courseId, modules.courseId))
    .innerJoin(
      enrollments,
      and(
        eq(enrollments.programId, programCourses.programId),
        eq(enrollments.userId, userId),
        activeEnrollmentClause(),
      ),
    )
    .where(and(eq(lessonProgress.userId, userId), isNull(lessonProgress.completedAt)))
    .orderBy(desc(lessonProgress.lastWatchedAt))
    .limit(CONTINUE_WATCHING_LIMIT * 2)

  const seenLessons = new Set<string>()
  const continueWatching: Array<{
    lessonId: string
    moduleId: string
    title: string
    thumbnailKey: string | null
    secondsWatched: number
    durationSeconds: number | null
    lastWatchedAt: Date
  }> = []
  for (const row of continueWatchingRows) {
    if (seenLessons.has(row.lesson.id)) continue
    seenLessons.add(row.lesson.id)
    continueWatching.push({
      lessonId: row.lesson.id,
      moduleId: row.moduleId,
      title: row.lesson.title,
      thumbnailKey: row.lesson.thumbnailKey,
      secondsWatched: row.progress.secondsWatched,
      durationSeconds: row.progress.durationSeconds ?? row.lesson.durationSeconds,
      lastWatchedAt: row.progress.lastWatchedAt,
    })
    if (continueWatching.length >= CONTINUE_WATCHING_LIMIT) break
  }

  // Pre-start: earliest FUTURE cohort start among the user's enrollments
  const futureStarts = userEnrollments
    .map((e) => e.cohortStartsAt)
    .filter((date): date is Date => date !== null && date > now)
  const cohortStartsAt =
    futureStarts.length > 0
      ? new Date(Math.min(...futureStarts.map((date) => date.getTime())))
      : null

  return { programs: programEntries, continueWatching, cohortStartsAt }
}
