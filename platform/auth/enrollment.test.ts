import { afterAll, afterEach, beforeAll, describe, expect, test } from 'bun:test'
import { Hono } from 'hono'
import { getActiveEnrollment } from '@/features/(shared)/enrollment/service'
import { env } from '@/platform/env'
import {
  createTestEnrollment,
  createTestProgram,
  createTestSubscription,
  createTestUser,
} from '@/platform/test/factories'
import { apiCall, assertError, assertSuccess } from '@/platform/test/helpers'
import { setupTestDb, teardownTestDb } from '@/platform/test/setup'
import type { AppEnv, AppUser } from '@/platform/types'
import { isV2CutoverEnabled, requireEnrollment, setV2CutoverOverrideForTests } from './enrollment'

type RequireEnrollmentArgs = Parameters<typeof requireEnrollment>

function asAppUser(user: { id: string; email: string; name: string }): AppUser {
  return { id: user.id, email: user.email, name: user.name, role: 'free' }
}

/** Tiny Hono test app: optional user stub + one or more requireEnrollment in the chain. */
function buildApp(options: {
  user?: AppUser
  resolver: RequireEnrollmentArgs[0]
  deps?: RequireEnrollmentArgs[1]
  middlewareCount?: number
}) {
  const app = new Hono<AppEnv>()
  if (options.user) {
    const user = options.user
    app.use('*', async (c, next) => {
      c.set('user', user)
      await next()
    })
  }
  for (let i = 0; i < (options.middlewareCount ?? 1); i++) {
    app.use('/content', requireEnrollment(options.resolver, options.deps))
  }
  app.get('/content', (c) =>
    c.json({ ok: true, data: { enrollmentId: c.get('enrollment')?.id ?? null } }),
  )
  return app
}

describe('isV2CutoverEnabled (both states in one process via the test override)', () => {
  afterEach(() => setV2CutoverOverrideForTests(undefined))

  test('reads env when no override is set', () => {
    expect(isV2CutoverEnabled()).toBe(env.V2_ENROLLMENT_CUTOVER)
  })

  test('override true enables the cutover', () => {
    setV2CutoverOverrideForTests(true)
    expect(isV2CutoverEnabled()).toBe(true)
  })

  test('override false disables the cutover', () => {
    setV2CutoverOverrideForTests(false)
    expect(isV2CutoverEnabled()).toBe(false)
  })

  test('clearing the override falls back to env', () => {
    setV2CutoverOverrideForTests(true)
    setV2CutoverOverrideForTests(undefined)
    expect(isV2CutoverEnabled()).toBe(env.V2_ENROLLMENT_CUTOVER)
  })
})

describe('integration: requireEnrollment', () => {
  beforeAll(setupTestDb)
  afterAll(teardownTestDb)
  afterEach(() => setV2CutoverOverrideForTests(undefined))

  test('401 UNAUTHORIZED when there is no session', async () => {
    setV2CutoverOverrideForTests(true)
    const app = buildApp({ resolver: () => 'irrelevant' })

    const response = await apiCall(app, 'GET', '/content')

    assertError(response, 'UNAUTHORIZED')
  })

  test('403 ENROLLMENT_REQUIRED when no active enrollment (cutover on)', async () => {
    setV2CutoverOverrideForTests(true)
    const user = await createTestUser()
    const program = await createTestProgram()
    const app = buildApp({ user: asAppUser(user!), resolver: () => program!.id })

    const response = await apiCall(app, 'GET', '/content')

    assertError(response, 'ENROLLMENT_REQUIRED')
  })

  test('403 ENROLLMENT_REQUIRED for revoked and date-lapsed enrollments (cutover on)', async () => {
    setV2CutoverOverrideForTests(true)
    const program = await createTestProgram()
    const revokedUser = await createTestUser()
    await createTestEnrollment(revokedUser!.id, program!.id, { status: 'revoked' })
    const lapsedUser = await createTestUser()
    await createTestEnrollment(lapsedUser!.id, program!.id, {
      expiresAt: new Date(Date.now() - 60_000),
    })

    const revokedResponse = await apiCall(
      buildApp({ user: asAppUser(revokedUser!), resolver: () => program!.id }),
      'GET',
      '/content',
    )
    const lapsedResponse = await apiCall(
      buildApp({ user: asAppUser(lapsedUser!), resolver: () => program!.id }),
      'GET',
      '/content',
    )

    assertError(revokedResponse, 'ENROLLMENT_REQUIRED')
    assertError(lapsedResponse, 'ENROLLMENT_REQUIRED')
  })

  test('200 with the granting enrollment on context for an active enrollment (cutover on)', async () => {
    setV2CutoverOverrideForTests(true)
    const user = await createTestUser()
    const program = await createTestProgram()
    const enrollment = await createTestEnrollment(user!.id, program!.id)
    const app = buildApp({ user: asAppUser(user!), resolver: () => program!.id })

    const response = await apiCall(app, 'GET', '/content')

    const data = assertSuccess(response) as { enrollmentId: string }
    expect(data.enrollmentId).toBe(enrollment!.id)
  })

  test('404 PROGRAM_NOT_FOUND when the resolver finds no program (cutover on)', async () => {
    setV2CutoverOverrideForTests(true)
    const user = await createTestUser()
    const app = buildApp({ user: asAppUser(user!), resolver: () => null })

    const response = await apiCall(app, 'GET', '/content')

    assertError(response, 'PROGRAM_NOT_FOUND')
  })

  test('grants access when enrolled in ANY of the programs containing the content (cutover on)', async () => {
    setV2CutoverOverrideForTests(true)
    const user = await createTestUser()
    const freeProgram = await createTestProgram()
    const paidProgram = await createTestProgram({ tier: 'paid' })
    const enrollment = await createTestEnrollment(user!.id, paidProgram!.id)
    const app = buildApp({
      user: asAppUser(user!),
      resolver: () => [freeProgram!.id, paidProgram!.id],
    })

    const response = await apiCall(app, 'GET', '/content')

    const data = assertSuccess(response) as { enrollmentId: string }
    expect(data.enrollmentId).toBe(enrollment!.id)
  })

  test('memoizes per request: repeated checks hit the DB once, next request queries again', async () => {
    setV2CutoverOverrideForTests(true)
    const user = await createTestUser()
    const program = await createTestProgram()
    await createTestEnrollment(user!.id, program!.id)

    let queryCount = 0
    const countingGetActiveEnrollment: typeof getActiveEnrollment = (userId, programId) => {
      queryCount++
      return getActiveEnrollment(userId, programId)
    }
    const app = buildApp({
      user: asAppUser(user!),
      resolver: () => program!.id,
      deps: { getActiveEnrollment: countingGetActiveEnrollment },
      middlewareCount: 2, // two enrollment gates in the same request chain
    })

    assertSuccess(await apiCall(app, 'GET', '/content'))
    expect(queryCount).toBe(1)

    // Memoization is request-scoped only — a fresh request queries again (no cross-request cache)
    assertSuccess(await apiCall(app, 'GET', '/content'))
    expect(queryCount).toBe(2)
  })

  describe('cutover off — legacy subscriptions remain the access source', () => {
    test('200 for a user with an active legacy subscription, no enrollment row', async () => {
      setV2CutoverOverrideForTests(false)
      const user = await createTestUser()
      await createTestSubscription(user!.id)
      const program = await createTestProgram()
      const app = buildApp({ user: asAppUser(user!), resolver: () => program!.id })

      assertSuccess(await apiCall(app, 'GET', '/content'))
    })

    test('403 ENROLLMENT_REQUIRED without a subscription, even with an active enrollment', async () => {
      setV2CutoverOverrideForTests(false)
      const user = await createTestUser()
      const program = await createTestProgram()
      await createTestEnrollment(user!.id, program!.id)
      const app = buildApp({ user: asAppUser(user!), resolver: () => program!.id })

      assertError(await apiCall(app, 'GET', '/content'), 'ENROLLMENT_REQUIRED')
    })

    test('403 for cancelled and period-lapsed subscriptions', async () => {
      setV2CutoverOverrideForTests(false)
      const program = await createTestProgram()
      const cancelledUser = await createTestUser()
      await createTestSubscription(cancelledUser!.id, { status: 'cancelled' })
      const lapsedUser = await createTestUser()
      await createTestSubscription(lapsedUser!.id, {
        currentPeriodEnd: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // past grace
      })

      assertError(
        await apiCall(
          buildApp({ user: asAppUser(cancelledUser!), resolver: () => program!.id }),
          'GET',
          '/content',
        ),
        'ENROLLMENT_REQUIRED',
      )
      assertError(
        await apiCall(
          buildApp({ user: asAppUser(lapsedUser!), resolver: () => program!.id }),
          'GET',
          '/content',
        ),
        'ENROLLMENT_REQUIRED',
      )
    })

    test('memoizes the legacy check per request', async () => {
      setV2CutoverOverrideForTests(false)
      const user = await createTestUser()
      await createTestSubscription(user!.id)
      const program = await createTestProgram()

      let legacyCount = 0
      const app = buildApp({
        user: asAppUser(user!),
        resolver: () => program!.id,
        deps: {
          hasLegacySubscriptionAccess: (_userId: string) => {
            legacyCount++
            return Promise.resolve(true)
          },
        },
        middlewareCount: 2,
      })

      assertSuccess(await apiCall(app, 'GET', '/content'))
      expect(legacyCount).toBe(1)
    })
  })
})
