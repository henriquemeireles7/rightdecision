import { desc, eq } from 'drizzle-orm'
import type { Context, MiddlewareHandler } from 'hono'
import { getActiveEnrollment } from '@/features/(shared)/enrollment/service'
import { db } from '@/platform/db/client'
import { subscriptions } from '@/platform/db/schema'
import { env } from '@/platform/env'
import { throwError } from '@/platform/errors'
import type { AppEnv } from '@/platform/types'

// ─── Cutover seam (eng-schema S6) ────────────────────────────────────────────
// V2_ENROLLMENT_CUTOVER flips the access source from legacy subscriptions to
// enrollments. Rollback = flip the flag in Railway + redeploy. Gate sites MUST
// call isV2CutoverEnabled() — never read the env constant directly — so both
// flag states are testable in one process via the override below.

let cutoverOverride: boolean | undefined

/** Test-only seam: force the cutover flag. Pass undefined to fall back to env. */
export function setV2CutoverOverrideForTests(value?: boolean) {
  cutoverOverride = value
}

export function isV2CutoverEnabled(): boolean {
  return cutoverOverride ?? env.V2_ENROLLMENT_CUTOVER
}

// ─── Enrollment middleware (eng-schema S1/S2) ────────────────────────────────

type ProgramResolution = string | readonly string[] | null
type ProgramResolver = (c: Context<AppEnv>) => ProgramResolution | Promise<ProgramResolution>

type RequireEnrollmentDeps = {
  getActiveEnrollment?: typeof getActiveEnrollment
  hasLegacySubscriptionAccess?: typeof hasLegacySubscriptionAccess
}

/**
 * Pre-cutover access source: the legacy subscription (same semantics as
 * features/(shared)/subscription/require-subscription.ts — active/past_due/trialing
 * with a 1-day grace buffer on currentPeriodEnd).
 */
async function hasLegacySubscriptionAccess(userId: string): Promise<boolean> {
  const [subscription] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .orderBy(desc(subscriptions.createdAt))
    .limit(1)
  if (!subscription) return false
  if (!['active', 'past_due', 'trialing'].includes(subscription.status)) return false
  const gracePeriod = 24 * 60 * 60 * 1000
  return subscription.currentPeriodEnd.getTime() + gracePeriod >= Date.now()
}

function getCache(c: Context<AppEnv>): NonNullable<AppEnv['Variables']['enrollmentCache']> {
  let cache = c.get('enrollmentCache')
  if (!cache) {
    cache = { byProgram: new Map() }
    c.set('enrollmentCache', cache)
  }
  return cache
}

/**
 * Gate a route on an active enrollment. Stack AFTER requireAuth.
 *
 * The resolver maps the request to the program(s) containing the content
 * (string | string[] | null). Access is granted if the user holds an active
 * enrollment in ANY resolved program; the granting row lands on
 * c.get('enrollment'). Memoization is request-scoped ONLY (stored on the
 * context) — revocation latency beats 1ms; never add a cross-request cache.
 *
 * Pre-cutover (isV2CutoverEnabled() === false) the legacy subscription remains
 * the access source; post-cutover, enrollments are the only source of truth.
 *
 * `deps` is options injection for tests only (query counting) — production
 * callers never pass it.
 */
export function requireEnrollment(
  programResolver: ProgramResolver,
  deps: RequireEnrollmentDeps = {},
): MiddlewareHandler<AppEnv> {
  const resolveEnrollment = deps.getActiveEnrollment ?? getActiveEnrollment
  const checkLegacyAccess = deps.hasLegacySubscriptionAccess ?? hasLegacySubscriptionAccess

  return async (c, next) => {
    const user = c.get('user')
    if (!user) {
      return throwError(c, 'UNAUTHORIZED')
    }

    if (!isV2CutoverEnabled()) {
      const cache = getCache(c)
      if (cache.legacyAccess === undefined) {
        cache.legacyAccess = await checkLegacyAccess(user.id)
      }
      if (!cache.legacyAccess) {
        return throwError(c, 'ENROLLMENT_REQUIRED')
      }
      return next()
    }

    const resolution = await programResolver(c)
    const programIds =
      resolution === null ? [] : typeof resolution === 'string' ? [resolution] : resolution
    if (programIds.length === 0) {
      return throwError(c, 'PROGRAM_NOT_FOUND')
    }

    const cache = getCache(c)
    for (const programId of programIds) {
      let enrollment = cache.byProgram.get(programId)
      if (enrollment === undefined) {
        enrollment = await resolveEnrollment(user.id, programId)
        cache.byProgram.set(programId, enrollment)
      }
      if (enrollment) {
        c.set('enrollment', enrollment)
        return next()
      }
    }
    return throwError(c, 'ENROLLMENT_REQUIRED')
  }
}
