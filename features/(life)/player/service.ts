import { and, eq, sql } from 'drizzle-orm'
import { canAccessLesson } from '@/features/(shared)/enrollment/service'
import { db } from '@/platform/db/client'
import { lessonProgress, lessons, modules, programCourses } from '@/platform/db/schema'
import { record } from '@/platform/events'
import { signPlaybackToken } from '@/providers/video'

type ProgressRow = typeof lessonProgress.$inferSelect
type LessonRow = typeof lessons.$inferSelect

/** Options injection for TESTS ONLY (forcing event failure proves rollback). */
type EventDeps = { record?: typeof record }

/** Every program containing the lesson's course — the requireEnrollment resolver. */
export async function programIdsForLesson(lessonId: string): Promise<string[]> {
  const rows = await db
    .select({ programId: programCourses.programId })
    .from(lessons)
    .innerJoin(modules, eq(modules.id, lessons.moduleId))
    .innerJoin(programCourses, eq(programCourses.courseId, modules.courseId))
    .where(eq(lessons.id, lessonId))
  return rows.map((row) => row.programId)
}

/** A lesson is playable only when IT and ITS MODULE are published. */
async function findPublishedLesson(lessonId: string): Promise<LessonRow | null> {
  const [row] = await db
    .select({ lesson: lessons })
    .from(lessons)
    .innerJoin(modules, and(eq(modules.id, lessons.moduleId), eq(modules.status, 'published')))
    .where(and(eq(lessons.id, lessonId), eq(lessons.status, 'published')))
    .limit(1)
  return row?.lesson ?? null
}

/**
 * Monotonic lesson_progress upsert (the read model, eng-schema table 20):
 * secondsWatched and lastWatchedAt NEVER decrease — out-of-order writes can't
 * rewind the resume position. Shared by saveProgress and watch-events folding.
 */
export async function upsertLessonProgress(
  userId: string,
  lessonId: string,
  opts: { secondsWatched: number; durationSeconds: number | null; watchedAt?: Date },
): Promise<ProgressRow> {
  const watchedAt = opts.watchedAt ?? new Date()
  const [row] = await db
    .insert(lessonProgress)
    .values({
      userId,
      lessonId,
      secondsWatched: opts.secondsWatched,
      durationSeconds: opts.durationSeconds,
      lastWatchedAt: watchedAt,
    })
    .onConflictDoUpdate({
      target: [lessonProgress.userId, lessonProgress.lessonId],
      set: {
        secondsWatched: sql`GREATEST(${lessonProgress.secondsWatched}, EXCLUDED.seconds_watched)`,
        lastWatchedAt: sql`GREATEST(${lessonProgress.lastWatchedAt}, EXCLUDED.last_watched_at)`,
        durationSeconds: sql`COALESCE(EXCLUDED.duration_seconds, ${lessonProgress.durationSeconds})`,
        updatedAt: new Date(),
      },
    })
    .returning()
  // Insert ... returning always yields exactly one row
  return row as ProgressRow
}

/**
 * Lesson fetch for the player: metadata + SIGNED playback token (TD-6) + decision
 * prompt + the user's existing answer/progress. Records 'lesson_started' exactly
 * once — idempotent via lesson_progress existence (only the insert that CREATES
 * the row records the event, inside one transaction).
 */
export async function getLesson(userId: string, lessonId: string, deps: EventDeps = {}) {
  const recordEvent = deps.record ?? record

  const lesson = await findPublishedLesson(lessonId)
  if (!lesson) return { error: 'LESSON_NOT_FOUND' as const }
  if (!(await canAccessLesson(userId, lessonId))) return { error: 'ENROLLMENT_REQUIRED' as const }
  if (lesson.videoStatus !== 'ready' || !lesson.streamVideoId) {
    return { error: 'VIDEO_NOT_READY' as const }
  }

  // Sign BEFORE touching progress — a failed signature must not record lesson_started
  const playbackToken = await signPlaybackToken(lesson.streamVideoId)

  let progress = await db.transaction(async (tx) => {
    const [created] = await tx
      .insert(lessonProgress)
      .values({
        userId,
        lessonId,
        durationSeconds: lesson.durationSeconds,
        lastWatchedAt: new Date(),
      })
      .onConflictDoNothing({ target: [lessonProgress.userId, lessonProgress.lessonId] })
      .returning()
    if (created) {
      // First fetch ever → the start event commits with the progress row
      await recordEvent({ name: 'lesson_started', properties: { lessonId }, userId }, tx)
    }
    return created ?? null
  })
  if (!progress) {
    const [existing] = await db
      .select()
      .from(lessonProgress)
      .where(and(eq(lessonProgress.userId, userId), eq(lessonProgress.lessonId, lessonId)))
      .limit(1)
    progress = existing ?? null
  }

  return {
    data: {
      lesson: {
        id: lesson.id,
        title: lesson.title,
        description: lesson.description,
        durationSeconds: lesson.durationSeconds,
        thumbnailKey: lesson.thumbnailKey,
        captionsReady: lesson.captionsReady,
        decisionPrompt: lesson.decisionPrompt,
      },
      streamVideoId: lesson.streamVideoId,
      playbackToken,
      progress: progress
        ? {
            secondsWatched: progress.secondsWatched,
            completedAt: progress.completedAt,
            lastWatchedAt: progress.lastWatchedAt,
          }
        : null,
      promptAnswer: progress?.promptAnswer ?? null,
    },
  }
}

/** Explicit player progress save — monotonic upsert against the read model. */
export async function saveProgress(userId: string, lessonId: string, secondsWatched: number) {
  const lesson = await findPublishedLesson(lessonId)
  if (!lesson) return { error: 'LESSON_NOT_FOUND' as const }
  if (!(await canAccessLesson(userId, lessonId))) return { error: 'ENROLLMENT_REQUIRED' as const }

  const progress = await upsertLessonProgress(userId, lessonId, {
    secondsWatched,
    durationSeconds: lesson.durationSeconds,
  })
  return {
    data: {
      secondsWatched: progress.secondsWatched,
      completedAt: progress.completedAt,
      lastWatchedAt: progress.lastWatchedAt,
    },
  }
}

/**
 * ADR 1: answering the decision prompt completes the lesson. The answer text,
 * completedAt, and record('decision_prompt_answered') commit in ONE transaction —
 * or not at all. The decision event fires only on FIRST completion (re-answering
 * updates the text without double-counting "Decisions Made"). Answer text never
 * reaches the events spine (PII) — it lives in lesson_progress.promptAnswer.
 */
export async function answerDecisionPrompt(
  userId: string,
  lessonId: string,
  answer: string,
  deps: EventDeps = {},
) {
  const recordEvent = deps.record ?? record

  const lesson = await findPublishedLesson(lessonId)
  if (!lesson?.decisionPrompt) return { error: 'LESSON_NOT_FOUND' as const }
  if (!(await canAccessLesson(userId, lessonId))) return { error: 'ENROLLMENT_REQUIRED' as const }

  const now = new Date()
  const row = await db.transaction(async (tx) => {
    const [existing] = await tx
      .select({ completedAt: lessonProgress.completedAt })
      .from(lessonProgress)
      .where(and(eq(lessonProgress.userId, userId), eq(lessonProgress.lessonId, lessonId)))
      .limit(1)
    const alreadyCompleted = Boolean(existing?.completedAt)

    const [updated] = await tx
      .insert(lessonProgress)
      .values({
        userId,
        lessonId,
        promptAnswer: answer,
        completedAt: now,
        durationSeconds: lesson.durationSeconds,
        lastWatchedAt: now,
      })
      .onConflictDoUpdate({
        target: [lessonProgress.userId, lessonProgress.lessonId],
        set: {
          promptAnswer: answer,
          completedAt: sql`COALESCE(${lessonProgress.completedAt}, EXCLUDED.completed_at)`,
          lastWatchedAt: sql`GREATEST(${lessonProgress.lastWatchedAt}, EXCLUDED.last_watched_at)`,
          updatedAt: now,
        },
      })
      .returning()

    if (!alreadyCompleted) {
      // The decision commits with the completion or not at all (ADR 1)
      await recordEvent({ name: 'decision_prompt_answered', properties: { lessonId }, userId }, tx)
    }
    return updated as ProgressRow
  })

  return { data: { completedAt: row.completedAt, promptAnswer: row.promptAnswer } }
}
