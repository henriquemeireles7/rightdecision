import { and, desc, eq } from 'drizzle-orm'
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

  const existing = await db.query.userDecisions.findFirst({
    where: and(eq(userDecisions.userId, userId), eq(userDecisions.classId, classId)),
  })

  if (existing) {
    if (!isDecisionEditable(existing.createdAt)) {
      return { locked: true as const }
    }
    const [updated] = await db
      .update(userDecisions)
      .set({ response: sanitizedResponse, updatedAt: new Date() })
      .where(eq(userDecisions.id, existing.id))
      .returning()
    return { locked: false as const, decision: updated! }
  }

  const [inserted] = await db
    .insert(userDecisions)
    .values({ userId, classId, courseSlug, decisionType, prompt, response: sanitizedResponse })
    .returning()
  return { locked: false as const, decision: inserted! }
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
