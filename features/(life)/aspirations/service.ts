import { and, asc, eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/platform/db/client'
import { aspirations, lifeAreas } from '@/platform/db/schema'
import type { ErrorCode } from '@/platform/errors'
import { record } from '@/platform/events'

type ServiceError = { error: ErrorCode }
type Aspiration = typeof aspirations.$inferSelect

/** The Dream Board input contract. Owned here; routes import it for zValidator. */
export const createAspirationSchema = z.object({
  lifeArea: z.enum(lifeAreas),
  title: z.string().min(1).max(200),
  dream: z.string().max(2000).optional(),
  current: z.string().max(2000).optional(),
  nextStep: z.string().max(2000).optional(),
  imageUrl: z.string().url().max(2000).optional(),
  link: z.string().url().max(2000).optional(),
  sortOrder: z.number().int().min(0).optional(),
})
export const updateAspirationSchema = createAspirationSchema.partial()

export type CreateAspirationInput = z.infer<typeof createAspirationSchema>
export type UpdateAspirationInput = z.infer<typeof updateAspirationSchema>

/** All of a member's aspirations, board order (sortOrder, then oldest first). */
export function listAspirations(userId: string): Promise<Aspiration[]> {
  return db
    .select()
    .from(aspirations)
    .where(eq(aspirations.userId, userId))
    .orderBy(asc(aspirations.sortOrder), asc(aspirations.createdAt))
}

/** Create an aspiration + its (non-decision) event in one transaction. */
export async function createAspiration(
  userId: string,
  input: CreateAspirationInput,
): Promise<{ aspiration: Aspiration }> {
  const aspiration = await db.transaction(async (tx) => {
    const [row] = await tx
      .insert(aspirations)
      .values({ userId, ...input })
      .returning()
    // aspirationId + lifeArea ONLY — title/dream are PII and stay in the table.
    await record(
      {
        name: 'aspiration_created',
        properties: { aspirationId: row!.id, lifeArea: row!.lifeArea },
        userId,
      },
      tx,
    )
    return row!
  })
  return { aspiration }
}

/** Patch a member's own aspiration. Wrong owner / missing id → ASPIRATION_NOT_FOUND. */
export async function updateAspiration(
  userId: string,
  id: string,
  patch: UpdateAspirationInput,
): Promise<{ aspiration: Aspiration } | ServiceError> {
  const [row] = await db
    .update(aspirations)
    .set({ ...patch, updatedAt: new Date() })
    .where(and(eq(aspirations.id, id), eq(aspirations.userId, userId)))
    .returning()
  if (!row) return { error: 'ASPIRATION_NOT_FOUND' }
  return { aspiration: row }
}

/** Delete a member's own aspiration. Wrong owner / missing id → ASPIRATION_NOT_FOUND. */
export async function deleteAspiration(
  userId: string,
  id: string,
): Promise<{ id: string } | ServiceError> {
  const [row] = await db
    .delete(aspirations)
    .where(and(eq(aspirations.id, id), eq(aspirations.userId, userId)))
    .returning({ id: aspirations.id })
  if (!row) return { error: 'ASPIRATION_NOT_FOUND' }
  return { id: row.id }
}
