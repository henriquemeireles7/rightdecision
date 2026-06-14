import { afterAll, beforeAll, beforeEach, describe, expect, it, mock } from 'bun:test'

// mock.module BEFORE importing jobs.ts (which transitively imports providers/email
// via the drip-email feature) — placeholder Resend keys must never be hit.
const mockSendEmail = mock(() => Promise.resolve())
mock.module('@/providers/email', () => ({ sendEmail: mockSendEmail }))

import { dripEmails, type enrollments, type programs } from '@/platform/db/schema'
import { env } from '@/platform/env'
import { createTestEnrollment, createTestProgram, createTestUser } from '@/platform/test/factories'
import { setupTestDb, teardownTestDb, testDb } from '@/platform/test/setup'
import { computeFirstMonday, nextMonthOf } from './date-math'

const {
  COHORT_START_HOUR,
  cohortAutoCreationJob,
  enrollmentExpirySweepJob,
  processPendingDripsJob,
} = await import('./jobs')
const { tick } = await import('./tick')

// Shared factories cover programs/enrollments; drips have no factory yet so a local
// helper creates them (platform/test rule: factories for reusable test data).
async function createProgram(overrides: Partial<typeof programs.$inferInsert> = {}) {
  const program = await createTestProgram(overrides)
  if (!program) throw new Error('failed to create test program')
  return program
}

async function createEnrollment(
  userId: string,
  programId: string,
  overrides: Partial<typeof enrollments.$inferInsert> = {},
) {
  const enrollment = await createTestEnrollment(userId, programId, overrides)
  if (!enrollment) throw new Error('failed to create test enrollment')
  return enrollment
}

async function createDrip(userId: string, overrides: Partial<typeof dripEmails.$inferInsert> = {}) {
  const [drip] = await testDb
    .insert(dripEmails)
    .values({
      userId,
      emailIndex: 0,
      decisionText: 'I will quit the job that is killing me.',
      scheduledAt: new Date(Date.now() - 60 * 60 * 1000),
      ...overrides,
    })
    .returning()
  if (!drip) throw new Error('failed to create test drip')
  return drip
}

const NOW = new Date('2026-06-12T15:00:00Z')

describe('integration: scheduler jobs', () => {
  beforeAll(setupTestDb)
  afterAll(teardownTestDb)
  beforeEach(async () => {
    await teardownTestDb()
    mockSendEmail.mockClear()
  })

  describe('cohortAutoCreationJob', () => {
    it('creates next-month first-Monday cohorts for active free programs', async () => {
      const program = await createProgram()

      const created = await cohortAutoCreationJob(NOW)

      expect(created).toBe(1)
      const rows = await testDb.query.cohorts.findMany()
      expect(rows).toHaveLength(1)
      const { year, month } = nextMonthOf(NOW, env.COHORT_TIMEZONE)
      const expectedStartsAt = computeFirstMonday(
        year,
        month,
        env.COHORT_TIMEZONE,
        COHORT_START_HOUR,
      )
      expect(rows[0]?.programId).toBe(program.id)
      expect(rows[0]?.startsAt.toISOString()).toBe(expectedStartsAt.toISOString())
    })

    it('creates one cohort per active free program', async () => {
      await createProgram()
      await createProgram()

      const created = await cohortAutoCreationJob(NOW)

      expect(created).toBe(2)
      expect(await testDb.query.cohorts.findMany()).toHaveLength(2)
    })

    it('is idempotent — second run with the same now is a no-op', async () => {
      await createProgram()

      const first = await cohortAutoCreationJob(NOW)
      const second = await cohortAutoCreationJob(NOW)

      expect(first).toBe(1)
      expect(second).toBe(0)
      expect(await testDb.query.cohorts.findMany()).toHaveLength(1)
    })

    it('skips paid programs', async () => {
      await createProgram({ tier: 'paid' })

      const created = await cohortAutoCreationJob(NOW)

      expect(created).toBe(0)
      expect(await testDb.query.cohorts.findMany()).toHaveLength(0)
    })

    it('skips inactive free programs (draft and archived)', async () => {
      await createProgram({ status: 'draft' })
      await createProgram({ status: 'archived' })

      const created = await cohortAutoCreationJob(NOW)

      expect(created).toBe(0)
      expect(await testDb.query.cohorts.findMany()).toHaveLength(0)
    })
  })

  describe('enrollmentExpirySweepJob', () => {
    it('flips only active enrollments whose expiresAt is in the past', async () => {
      const user = await createTestUser()
      if (!user) throw new Error('failed to create test user')
      const program = await createProgram()
      const past = new Date(NOW.getTime() - 1000)
      const future = new Date(NOW.getTime() + 1000)

      const shouldExpire = await createEnrollment(user.id, program.id, { expiresAt: past })
      const stillRunning = await createEnrollment(user.id, (await createProgram()).id, {
        expiresAt: future,
      })
      const evergreen = await createEnrollment(user.id, (await createProgram()).id, {
        expiresAt: null,
      })
      const revoked = await createEnrollment(user.id, (await createProgram()).id, {
        expiresAt: past,
        status: 'revoked',
      })
      const alreadyExpired = await createEnrollment(user.id, (await createProgram()).id, {
        expiresAt: past,
        status: 'expired',
      })

      const flipped = await enrollmentExpirySweepJob(NOW)

      expect(flipped).toBe(1)
      const byId = new Map(
        (await testDb.query.enrollments.findMany()).map((row) => [row.id, row.status]),
      )
      expect(byId.get(shouldExpire.id)).toBe('expired')
      expect(byId.get(stillRunning.id)).toBe('active')
      expect(byId.get(evergreen.id)).toBe('active')
      expect(byId.get(revoked.id)).toBe('revoked')
      expect(byId.get(alreadyExpired.id)).toBe('expired')
    })

    it('is idempotent — second run with the same now is a no-op', async () => {
      const user = await createTestUser()
      if (!user) throw new Error('failed to create test user')
      const program = await createProgram()
      await createEnrollment(user.id, program.id, {
        expiresAt: new Date(NOW.getTime() - 1000),
      })

      const first = await enrollmentExpirySweepJob(NOW)
      const second = await enrollmentExpirySweepJob(NOW)

      expect(first).toBe(1)
      expect(second).toBe(0)
    })
  })

  describe('processPendingDripsJob', () => {
    it('sends due pending drips (the previously-dead processPendingDrips gets a caller)', async () => {
      const user = await createTestUser()
      if (!user) throw new Error('failed to create test user')
      await createDrip(user.id)

      const sent = await processPendingDripsJob(NOW)

      expect(sent).toBe(1)
      expect(mockSendEmail).toHaveBeenCalledTimes(1)
      const drips = await testDb.query.dripEmails.findMany()
      expect(drips[0]?.status).toBe('sent')
      // app URL is injected from env, not left as a {{app_url}} placeholder
      const [, msg] = mockSendEmail.mock.calls[0] as unknown as [
        string,
        { html: string; text: string },
      ]
      expect(msg.html).toContain(env.PUBLIC_APP_URL)
      expect(msg.html).not.toContain('{{app_url}}')
    })

    it('is idempotent — second run sends nothing new', async () => {
      const user = await createTestUser()
      if (!user) throw new Error('failed to create test user')
      await createDrip(user.id)

      const first = await processPendingDripsJob(NOW)
      const second = await processPendingDripsJob(NOW)

      expect(first).toBe(1)
      expect(second).toBe(0)
      expect(mockSendEmail).toHaveBeenCalledTimes(1)
    })
  })

  describe('tick (default jobs list, end to end)', () => {
    it('runs the real jobs against the database', async () => {
      await createProgram()
      const user = await createTestUser()
      if (!user) throw new Error('failed to create test user')
      await createEnrollment(user.id, (await createProgram()).id, {
        expiresAt: new Date(NOW.getTime() - 1000),
      })
      await createDrip(user.id)

      await tick(NOW)

      expect(await testDb.query.cohorts.findMany()).toHaveLength(2)
      const enrollmentRows = await testDb.query.enrollments.findMany()
      expect(enrollmentRows[0]?.status).toBe('expired')
      const drips = await testDb.query.dripEmails.findMany()
      expect(drips[0]?.status).toBe('sent')
    })
  })
})
