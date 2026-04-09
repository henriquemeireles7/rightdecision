import { eq } from 'drizzle-orm'
import { db } from '@/platform/db/client'
import { accounts, freeIntroSessions, sessions, users } from '@/platform/db/schema'

const SESSION_TTL_DAYS = 7

/** Create a new anonymous free intro session. Returns the session ID for the cookie. */
export async function createAnonSession(abVariant?: string): Promise<string> {
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + SESSION_TTL_DAYS)

  const [session] = await db
    .insert(freeIntroSessions)
    .values({ expiresAt, abVariant: abVariant ?? null })
    .returning({ id: freeIntroSessions.id })

  return session!.id
}

/** Save Lesson 1 answer to an anonymous session. */
export async function saveLessonOneAnswer(sessionId: string, answer: string): Promise<void> {
  await db
    .update(freeIntroSessions)
    .set({
      lessonOneAnswer: answer,
      lessonOneCompletedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(freeIntroSessions.id, sessionId))
}

/** Get session data. Returns null if expired or not found. */
export async function getSessionData(sessionId: string) {
  const session = await db.query.freeIntroSessions.findFirst({
    where: eq(freeIntroSessions.id, sessionId),
  })

  if (!session) return null
  if (session.expiresAt < new Date()) return null

  return session
}

/**
 * Merge an anonymous session into a real account.
 *
 * If the email already has an account, returns { existingAccount: true }
 * so the UI can redirect to login.
 *
 * Uses a transaction to prevent race conditions on double-submit.
 */
export async function mergeToAccount(
  sessionId: string,
  email: string,
): Promise<{ userId: string; existingAccount: boolean; sessionToken: string | null }> {
  const normalizedEmail = email.toLowerCase().trim()

  return db.transaction(async (tx) => {
    // Lock the session row to prevent double merge
    const [session] = await tx
      .select()
      .from(freeIntroSessions)
      .where(eq(freeIntroSessions.id, sessionId))
      .for('update')

    if (!session) {
      throw new Error('Session not found')
    }

    // Already merged?
    if (session.mergedToUserId) {
      return { userId: session.mergedToUserId, existingAccount: false, sessionToken: null }
    }

    // Check if email already has an account
    const existingUser = await tx.query.users.findFirst({
      where: eq(users.email, normalizedEmail),
    })

    if (existingUser) {
      // Mark session as merged to this existing user
      await tx
        .update(freeIntroSessions)
        .set({ mergedToUserId: existingUser.id, email: normalizedEmail, updatedAt: new Date() })
        .where(eq(freeIntroSessions.id, sessionId))

      // Existing users need to sign in — no session token provided
      return { userId: existingUser.id, existingAccount: true, sessionToken: null }
    }

    // Create new user (free role, email considered verified since they entered it at the gate)
    const [newUser] = await tx
      .insert(users)
      .values({
        email: normalizedEmail,
        name: normalizedEmail.split('@')[0] ?? 'User',
        emailVerified: true,
        role: 'free',
      })
      .returning({ id: users.id })

    // Create credential account for Better Auth
    await tx.insert(accounts).values({
      userId: newUser!.id,
      accountId: newUser!.id,
      providerId: 'credential',
    })

    // Create Better Auth session so the user is authenticated for L2/L3
    const sessionToken = crypto.randomUUID()
    const sessionExpiresAt = new Date()
    sessionExpiresAt.setDate(sessionExpiresAt.getDate() + 30) // 30-day session

    await tx.insert(sessions).values({
      userId: newUser!.id,
      token: sessionToken,
      expiresAt: sessionExpiresAt,
    })

    // Mark session as merged
    await tx
      .update(freeIntroSessions)
      .set({ mergedToUserId: newUser!.id, email: normalizedEmail, updatedAt: new Date() })
      .where(eq(freeIntroSessions.id, sessionId))

    return { userId: newUser!.id, existingAccount: false, sessionToken }
  })
}
