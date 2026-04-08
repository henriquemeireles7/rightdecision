import { eq, lt } from 'drizzle-orm'
import { db } from '@/platform/db/client'
import { onboardingProfiles, onboardingSessions } from '@/platform/db/schema'
import { env } from '@/platform/env'

// ─── Types ────────────────────────────────────────────────────────────────────

export type SessionData = {
  throughlineQ1?: string
  throughlineQ2?: string
  throughlineQ3?: string
  throughlineNamed?: string
  email?: string
}

export type OnboardingSession = {
  id: string
  sessionData: SessionData | null
  currentStep: number
  createdAt: Date
  expiresAt: Date
}

// ─── Session Operations ──────────────────────────────────────────────────────

export async function createSession(): Promise<OnboardingSession> {
  const expiresAt = new Date(Date.now() + env.ONBOARDING_SESSION_TTL_HOURS * 60 * 60 * 1000)

  const [session] = await db
    .insert(onboardingSessions)
    .values({
      currentStep: 1,
      expiresAt,
    })
    .returning()

  return session as OnboardingSession
}

export async function getSession(sessionId: string): Promise<OnboardingSession | null> {
  const session = await db.query.onboardingSessions.findFirst({
    where: eq(onboardingSessions.id, sessionId),
  })

  if (!session) return null
  if (session.expiresAt < new Date()) return null

  return session as OnboardingSession
}

export async function updateSession(
  sessionId: string,
  step: number,
  data: Partial<SessionData>,
): Promise<OnboardingSession | null> {
  const existing = await getSession(sessionId)
  if (!existing) return null

  const mergedData = { ...(existing.sessionData ?? {}), ...data }

  const [updated] = await db
    .update(onboardingSessions)
    .set({
      currentStep: step,
      sessionData: mergedData,
    })
    .where(eq(onboardingSessions.id, sessionId))
    .returning()

  return updated as OnboardingSession
}

export async function consumeSession(
  sessionId: string,
  userId: string,
): Promise<{ profileId: string } | null> {
  const session = await getSession(sessionId)
  if (!session?.sessionData) return null

  const data = session.sessionData

  const [profile] = await db
    .insert(onboardingProfiles)
    .values({
      userId,
      throughlineQ1: data.throughlineQ1,
      throughlineQ2: data.throughlineQ2,
      throughlineQ3: data.throughlineQ3,
      throughlineNamed: data.throughlineNamed,
    })
    .returning()

  await db.delete(onboardingSessions).where(eq(onboardingSessions.id, sessionId))

  return { profileId: profile?.id }
}

export async function expireSessions(): Promise<number> {
  const result = await db
    .delete(onboardingSessions)
    .where(lt(onboardingSessions.expiresAt, new Date()))
    .returning()

  return result.length
}
