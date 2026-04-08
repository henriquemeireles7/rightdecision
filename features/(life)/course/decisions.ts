import { and, desc, eq, sql } from 'drizzle-orm'
import { db } from '@/platform/db/client'
import { userDecisions } from '@/platform/db/schema'

const EDIT_WINDOW_MS = 5 * 60 * 1000

function stripHtml(text: string): string {
  return text.replace(/<[^>]*>/g, '').trim()
}

export function isDecisionEditable(createdAt: Date): boolean {
  return Date.now() - createdAt.getTime() < EDIT_WINDOW_MS
}

export async function saveDecision(
  userId: string,
  classId: string,
  courseSlug: string,
  decisionType: 'text' | 'choice',
  prompt: string,
  response: string,
) {
  const sanitizedResponse = stripHtml(response)

  // Atomic upsert: INSERT or UPDATE within edit window.
  // ON CONFLICT: only update if createdAt is within the 5-min edit window.
  // If the row exists but is outside the edit window, the UPDATE sets 0 rows
  // (the WHERE clause excludes it), so we detect locked state by checking rowcount.
  const editCutoff = new Date(Date.now() - EDIT_WINDOW_MS)

  const [result] = await db
    .insert(userDecisions)
    .values({ userId, classId, courseSlug, decisionType, prompt, response: sanitizedResponse })
    .onConflictDoUpdate({
      target: [userDecisions.userId, userDecisions.classId],
      set: {
        response: sanitizedResponse,
        updatedAt: new Date(),
      },
      setWhere: sql`${userDecisions.createdAt} > ${editCutoff}`,
    })
    .returning()

  // If no row returned: conflict existed but edit window expired (locked)
  if (!result) {
    return { locked: true as const }
  }

  return { locked: false as const, decision: result }
}

export async function getDecision(userId: string, classId: string) {
  return db.query.userDecisions.findFirst({
    where: and(eq(userDecisions.userId, userId), eq(userDecisions.classId, classId)),
  })
}

export async function getUserDecisions(userId: string, courseSlug?: string) {
  const conditions = [eq(userDecisions.userId, userId)]
  if (courseSlug) conditions.push(eq(userDecisions.courseSlug, courseSlug))

  return db.query.userDecisions.findMany({
    where: and(...conditions),
    orderBy: [desc(userDecisions.createdAt)],
    limit: 200,
  })
}
