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
  blockId = 'legacy',
  isCustom = false,
  previousContext?: string[],
) {
  const sanitizedResponse = stripHtml(response)

  // Atomic upsert: INSERT or UPDATE within edit window.
  // ON CONFLICT: only update if createdAt is within the 5-min edit window.
  const editCutoff = new Date(Date.now() - EDIT_WINDOW_MS)

  const [result] = await db
    .insert(userDecisions)
    .values({
      userId,
      classId,
      blockId,
      courseSlug,
      decisionType,
      prompt,
      response: sanitizedResponse,
      isCustom,
      previousContext: previousContext ?? null,
    })
    .onConflictDoUpdate({
      target: [userDecisions.userId, userDecisions.classId, userDecisions.blockId],
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

export async function getDecision(userId: string, classId: string, blockId?: string) {
  const conditions = [eq(userDecisions.userId, userId), eq(userDecisions.classId, classId)]
  if (blockId) conditions.push(eq(userDecisions.blockId, blockId))

  return db.query.userDecisions.findFirst({
    where: and(...conditions),
  })
}

/** Get all previous decision answers for a user, ordered by creation time. */
export async function getUserDecisionContext(userId: string): Promise<string[]> {
  const decisions = await db.query.userDecisions.findMany({
    where: eq(userDecisions.userId, userId),
    orderBy: [desc(userDecisions.createdAt)],
    columns: { response: true },
    limit: 10,
  })
  return decisions.map((d) => d.response)
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
