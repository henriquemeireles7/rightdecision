import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'bun:test'
import { and, eq, inArray, isNull, like } from 'drizzle-orm'
import {
  accounts,
  aiUsage,
  cohorts,
  conversationMessages,
  conversations,
  documentAnswers,
  documents,
  documentTemplates,
  enrollments,
  journalEntries,
  lessons,
  lives,
  programs,
  templateSchemaSchema,
  users,
} from '@/platform/db/schema'
import { env } from '@/platform/env'
import { setupTestDb, teardownTestDb, testDb } from '@/platform/test/setup'
import { PAID_PROGRAM_SLUG } from './migrate-subscribers-to-enrollments'
import { FREE_PROGRAM_SLUG, SEED_EMAILS, seedV2 } from './seed-v2'

async function userByEmail(email: string) {
  const user = await testDb.query.users.findFirst({ where: eq(users.email, email) })
  if (!user) throw new Error(`seed user missing: ${email}`)
  return user
}

describe('integration: seed-v2', () => {
  beforeAll(setupTestDb)
  afterAll(teardownTestDb)
  beforeEach(teardownTestDb)

  test('runs clean on an empty DB and produces every enumerated state', async () => {
    const now = new Date()
    await seedV2(testDb, { password: 'seed-test-password' })

    // admin user
    const admin = await userByEmail(SEED_EMAILS.admin)
    expect(admin.role).toBe('admin')

    // credential accounts with hashed passwords for all seed users
    const seedUsers = await testDb
      .select()
      .from(users)
      .where(like(users.email, '%@seed.rightdecision.io'))
    expect(seedUsers).toHaveLength(5)
    for (const user of seedUsers) {
      const account = await testDb.query.accounts.findFirst({
        where: and(eq(accounts.userId, user.id), eq(accounts.providerId, 'credential')),
      })
      expect(account?.password).toBeTruthy()
      expect(account?.password).not.toBe('seed-test-password') // hashed, not plaintext
    }

    const paidProgram = await testDb.query.programs.findFirst({
      where: eq(programs.slug, PAID_PROGRAM_SLUG),
    })
    const freeProgram = await testDb.query.programs.findFirst({
      where: eq(programs.slug, FREE_PROGRAM_SLUG),
    })
    expect(paidProgram?.tier).toBe('paid')
    expect(freeProgram?.tier).toBe('free')

    // paid user: evergreen enrollment, null cohort
    const paidUser = await userByEmail(SEED_EMAILS.paid)
    const [paidEnrollment] = await testDb
      .select()
      .from(enrollments)
      .where(eq(enrollments.userId, paidUser.id))
    expect(paidEnrollment!.programId).toBe(paidProgram?.id as string)
    expect(paidEnrollment!.cohortId).toBeNull()
    expect(paidEnrollment!.status).toBe('active')

    // free user mid-cohort: cohort started in the past
    const midUser = await userByEmail(SEED_EMAILS.freeMidCohort)
    const [midEnrollment] = await testDb
      .select()
      .from(enrollments)
      .where(eq(enrollments.userId, midUser.id))
    expect(midEnrollment!.status).toBe('active')
    expect(midEnrollment!.cohortId).not.toBeNull()
    const midCohort = await testDb.query.cohorts.findFirst({
      where: eq(cohorts.id, midEnrollment!.cohortId as string),
    })
    expect(midCohort?.startsAt.getTime()).toBeLessThan(now.getTime())

    // free user pre-start: cohort starts in the future
    const preUser = await userByEmail(SEED_EMAILS.freePreStart)
    const [preEnrollment] = await testDb
      .select()
      .from(enrollments)
      .where(eq(enrollments.userId, preUser.id))
    const preCohort = await testDb.query.cohorts.findFirst({
      where: eq(cohorts.id, preEnrollment!.cohortId as string),
    })
    expect(preCohort?.startsAt.getTime()).toBeGreaterThan(now.getTime())

    // expired free enrollment
    const expiredUser = await userByEmail(SEED_EMAILS.freeExpired)
    const [expiredEnrollment] = await testDb
      .select()
      .from(enrollments)
      .where(eq(enrollments.userId, expiredUser.id))
    expect(expiredEnrollment!.status).toBe('expired')

    // lessons cover every videoStatus
    const allLessons = await testDb.select().from(lessons)
    const statuses = new Set(allLessons.map((l) => l.videoStatus))
    expect(statuses).toEqual(new Set(['none', 'uploading', 'processing', 'ready', 'error']))

    // published lesson satisfies the publish invariant; draft lesson exists
    const published = allLessons.filter((l) => l.status === 'published')
    expect(published).toHaveLength(1)
    expect(published[0]?.videoStatus).toBe('ready')
    expect(published[0]?.captionsReady).toBe(true)
    expect(published[0]?.decisionPrompt).toBeTruthy()
    expect(allLessons.some((l) => l.status === 'draft')).toBe(true)

    // lives: upcoming / replay-ready / cancelled
    const allLives = await testDb.select().from(lives)
    expect(
      allLives.some((l) => l.scheduledAt.getTime() > now.getTime() && l.cancelledAt === null),
    ).toBe(true)
    expect(allLives.some((l) => l.replayStatus === 'ready' && l.replayStreamVideoId !== null)).toBe(
      true,
    )
    expect(allLives.some((l) => l.cancelledAt !== null)).toBe(true)

    // published templates (P5 seed content): Life Playbook (paid) + Starter Notebook (free)
    const allTemplates = await testDb.select().from(documentTemplates)
    expect(allTemplates).toHaveLength(2)
    const playbook = allTemplates.find((t) => t.slug === 'life-playbook')
    const notebook = allTemplates.find((t) => t.slug === 'starter-notebook')
    expect(playbook?.status).toBe('published')
    expect(playbook?.programId).toBe(paidProgram?.id as string)
    expect(notebook?.status).toBe('published')
    expect(notebook?.programId).toBe(freeProgram?.id as string)
    // the Life Playbook exercises the full v1 field vocabulary
    const parsed = templateSchemaSchema.parse(playbook?.schema)
    const kinds = new Set(
      parsed.chapters.flatMap((c) => c.pages.flatMap((p) => p.fields.map((f) => f.kind))),
    )
    expect(kinds).toEqual(
      new Set(['short_text', 'long_text', 'select', 'multi_select', 'date', 'scale_1_10']),
    )

    // one filled document (with answers) + one empty document (without)
    const allDocuments = await testDb.select().from(documents)
    expect(allDocuments).toHaveLength(2)
    const filled = allDocuments.find((d) => d.status === 'in_progress')
    const empty = allDocuments.find((d) => d.status === 'empty')
    expect(filled).toBeDefined()
    expect(empty).toBeDefined()
    const filledAnswers = await testDb
      .select()
      .from(documentAnswers)
      .where(eq(documentAnswers.documentId, filled?.id as string))
    expect(filledAnswers.length).toBeGreaterThan(0)
    const emptyAnswers = await testDb
      .select()
      .from(documentAnswers)
      .where(eq(documentAnswers.documentId, empty?.id as string))
    expect(emptyAnswers).toHaveLength(0)

    // journal entries: morning + evening across a few days
    const entries = await testDb
      .select()
      .from(journalEntries)
      .where(eq(journalEntries.userId, paidUser.id))
    expect(entries.length).toBeGreaterThanOrEqual(6)
    expect(entries.some((e) => e.kind === 'morning')).toBe(true)
    expect(entries.some((e) => e.kind === 'evening')).toBe(true)
    expect(new Set(entries.map((e) => e.entryDate)).size).toBeGreaterThanOrEqual(3)

    // a conversation with messages
    const [conversation] = await testDb
      .select()
      .from(conversations)
      .where(eq(conversations.userId, paidUser.id))
    expect(conversation).toBeDefined()
    const messages = await testDb
      .select()
      .from(conversationMessages)
      .where(eq(conversationMessages.conversationId, conversation!.id))
    expect(messages.length).toBeGreaterThanOrEqual(2)
    expect(messages.some((m) => m.role === 'user')).toBe(true)
    expect(messages.some((m) => m.role === 'assistant')).toBe(true)

    // ai_usage near the free monthly token budget ceiling
    const usageRows = await testDb.select().from(aiUsage).where(eq(aiUsage.userId, midUser.id))
    expect(usageRows.length).toBeGreaterThan(0)
    const totalTokens = usageRows.reduce((sum, r) => sum + r.inputTokens + r.outputTokens, 0)
    expect(totalTokens).toBeGreaterThanOrEqual(env.AI_MONTHLY_TOKEN_BUDGET_FREE * 0.85)
    expect(totalTokens).toBeLessThan(env.AI_MONTHLY_TOKEN_BUDGET_FREE)
  })

  test('runs twice without error and without duplicating seed data', async () => {
    await seedV2(testDb, { password: 'seed-test-password' })
    await seedV2(testDb, { password: 'seed-test-password' })

    const seedUsers = await testDb
      .select()
      .from(users)
      .where(like(users.email, '%@seed.rightdecision.io'))
    expect(seedUsers).toHaveLength(5)

    const allPrograms = await testDb
      .select()
      .from(programs)
      .where(inArray(programs.slug, [PAID_PROGRAM_SLUG, FREE_PROGRAM_SLUG]))
    expect(allPrograms).toHaveLength(2)

    expect(await testDb.select().from(documents)).toHaveLength(2)
    expect(await testDb.select().from(lives)).toHaveLength(3)
    const allLessons = await testDb.select().from(lessons)
    expect(allLessons.filter((l) => l.status === 'published')).toHaveLength(1)
  })

  test('does not touch non-seed data', async () => {
    const [bystander] = await testDb
      .insert(users)
      .values({ email: 'real-user@example.com', name: 'Real User', role: 'free' })
      .returning()

    await seedV2(testDb, { password: 'seed-test-password' })
    await seedV2(testDb, { password: 'seed-test-password' })

    const stillThere = await testDb.query.users.findFirst({
      where: eq(users.id, bystander!.id),
    })
    expect(stillThere).toBeDefined()
    // bystander has no enrollments created by seed
    const rows = await testDb
      .select()
      .from(enrollments)
      .where(and(eq(enrollments.userId, bystander!.id), isNull(enrollments.cohortId)))
    expect(rows).toHaveLength(0)
  })
})
