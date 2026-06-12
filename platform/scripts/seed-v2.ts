/**
 * V2 dev seed — produces EVERY UI-relevant state from the foundation roadmap
 * enumeration (decisions/product/01-platform-v2/foundation/roadmap.md §13):
 * admin user; paid user (evergreen, null cohort); free user mid-cohort; free
 * user pre-start; expired free enrollment; lessons in every videoStatus; a
 * published lesson satisfying the publish invariant + a draft one; lives in
 * upcoming/replay/cancelled states; published template + one filled + one
 * empty document; journal entries; a conversation with messages; an ai_usage
 * row near the free monthly token budget ceiling.
 *
 * Idempotent via delete+recreate STRICTLY scoped to seed data: seed users live
 * at @seed.rightdecision.io; seed programs/courses are keyed by slug. Dev-only —
 * NEVER point this at production.
 *
 * Password hashing uses Better Auth's scrypt hasher (better-auth/crypto) and
 * writes the credential accounts row directly — same storage shape as
 * auth.api.signUpEmail (see seed-users.ts) without sending verification emails.
 *
 * Usage: bun run platform/scripts/seed-v2.ts [password]   (default: rightdecision-dev)
 */

import { hashPassword } from 'better-auth/crypto'
import { inArray, like } from 'drizzle-orm'
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import type * as schema from '@/platform/db/schema'
import {
  accounts,
  aiUsage,
  cohorts,
  conversationMessages,
  conversations,
  courses,
  documentAnswers,
  documents,
  documentTemplates,
  enrollments,
  journalEntries,
  lessons,
  lives,
  modules,
  programCourses,
  programs,
  type TemplateSchema,
  templateSchemaSchema,
  users,
} from '@/platform/db/schema'
import { env } from '@/platform/env'
import { PAID_PROGRAM_SLUG } from './migrate-subscribers-to-enrollments'

type Db = PostgresJsDatabase<typeof schema>

export const FREE_PROGRAM_SLUG = 'life-decisions-free'
export const SEED_COURSE_SLUG = 'right-decision-foundations'
export const SEED_TEMPLATE_SLUG = 'life-playbook'
export const SEED_EMAIL_DOMAIN = 'seed.rightdecision.io'
export const DEFAULT_SEED_PASSWORD = 'rightdecision-dev'

export const SEED_EMAILS = {
  admin: `admin@${SEED_EMAIL_DOMAIN}`,
  paid: `paid@${SEED_EMAIL_DOMAIN}`,
  freeMidCohort: `free-midcohort@${SEED_EMAIL_DOMAIN}`,
  freePreStart: `free-prestart@${SEED_EMAIL_DOMAIN}`,
  freeExpired: `free-expired@${SEED_EMAIL_DOMAIN}`,
} as const

const DAY_MS = 24 * 60 * 60 * 1000

function daysFrom(now: Date, days: number): Date {
  return new Date(now.getTime() + days * DAY_MS)
}

function firstRow<T>(rows: T[], what: string): T {
  const row = rows[0]
  if (row === undefined) throw new Error(`Seed write returned no rows: ${what}`)
  return row
}

function dateString(now: Date, daysAgo: number): string {
  return daysFrom(now, -daysAgo).toISOString().slice(0, 10)
}

/** Life Playbook template using the full v1 field vocabulary (eng-schema DX SF2). */
function buildTemplateSchema(): TemplateSchema {
  return templateSchemaSchema.parse({
    chapters: [
      {
        id: 'ch-foundation',
        title: 'The Foundation',
        pages: [
          {
            id: 'pg-the-decision',
            title: 'The One Decision',
            instruction: 'You already know the decision. This page is where you stop circling it.',
            fields: [
              {
                id: 'f-decision-name',
                label: 'Name the decision in one sentence',
                kind: 'short_text',
                required: true,
                placeholder: 'The decision I keep avoiding is...',
              },
              {
                id: 'f-decision-story',
                label: 'What happens if you keep not making it?',
                kind: 'long_text',
                required: true,
                exampleAnswer: 'Another year of the same conversations with myself.',
              },
              {
                id: 'f-life-area',
                label: 'Which area of life does it live in?',
                kind: 'select',
                required: true,
                options: ['health', 'relationships', 'career', 'money'],
              },
              {
                id: 'f-tried-before',
                label: 'What have you already tried?',
                kind: 'multi_select',
                required: false,
                options: ['therapy', 'journaling', 'courses', 'books', 'coaching', 'nothing'],
              },
              {
                id: 'f-decide-by',
                label: 'When will you decide by?',
                kind: 'date',
                required: false,
              },
              {
                id: 'f-certainty',
                label: 'How certain are you, right now?',
                kind: 'scale_1_10',
                required: true,
              },
            ],
          },
        ],
      },
    ],
  })
}

export type SeedSummary = {
  userIds: Record<keyof typeof SEED_EMAILS, string>
  paidProgramId: string
  freeProgramId: string
  courseId: string
  publishedLessonId: string
  templateId: string
  filledDocumentId: string
  emptyDocumentId: string
  conversationId: string
}

/** Remove previously seeded data only — scoped to seed emails and seed slugs. */
async function cleanupSeedData(db: Db) {
  // Cascades: users → enrollments, documents(+answers), journal, conversations(+messages), ai_usage
  await db.delete(users).where(like(users.email, `%@${SEED_EMAIL_DOMAIN}`))
  // Cascades: programs → cohorts, program_courses, lives, document_templates(+documents)
  await db.delete(programs).where(inArray(programs.slug, [PAID_PROGRAM_SLUG, FREE_PROGRAM_SLUG]))
  // Cascades: courses → modules → lessons
  await db.delete(courses).where(inArray(courses.slug, [SEED_COURSE_SLUG]))
}

async function createSeedUser(
  db: Db,
  passwordHash: string,
  fields: { email: string; name: string; role: 'free' | 'pro' | 'admin' },
): Promise<string> {
  const user = firstRow(
    await db
      .insert(users)
      .values({ ...fields, emailVerified: true })
      .returning({ id: users.id }),
    fields.email,
  )
  // Better Auth credential account shape (providerId 'credential', accountId = userId)
  await db.insert(accounts).values({
    userId: user.id,
    accountId: user.id,
    providerId: 'credential',
    password: passwordHash,
  })
  return user.id
}

export async function seedV2(
  db: Db,
  opts: { password?: string; now?: Date } = {},
): Promise<SeedSummary> {
  const now = opts.now ?? new Date()
  const passwordHash = await hashPassword(opts.password ?? DEFAULT_SEED_PASSWORD)

  await cleanupSeedData(db)

  // ── Users ──
  const userIds = {
    admin: await createSeedUser(db, passwordHash, {
      email: SEED_EMAILS.admin,
      name: 'Seed Admin',
      role: 'admin',
    }),
    paid: await createSeedUser(db, passwordHash, {
      email: SEED_EMAILS.paid,
      name: 'Seed Paid Member',
      role: 'free',
    }),
    freeMidCohort: await createSeedUser(db, passwordHash, {
      email: SEED_EMAILS.freeMidCohort,
      name: 'Seed Free Mid-Cohort',
      role: 'free',
    }),
    freePreStart: await createSeedUser(db, passwordHash, {
      email: SEED_EMAILS.freePreStart,
      name: 'Seed Free Pre-Start',
      role: 'free',
    }),
    freeExpired: await createSeedUser(db, passwordHash, {
      email: SEED_EMAILS.freeExpired,
      name: 'Seed Free Expired',
      role: 'free',
    }),
  }

  // ── Programs ──
  const paidProgram = firstRow(
    await db
      .insert(programs)
      .values({
        slug: PAID_PROGRAM_SLUG,
        name: 'Life Decisions',
        description: 'The full program: instant access, monthly lives, the Life Playbook.',
        tier: 'paid',
        status: 'active',
      })
      .returning({ id: programs.id }),
    'paid program',
  )
  const freeProgram = firstRow(
    await db
      .insert(programs)
      .values({
        slug: FREE_PROGRAM_SLUG,
        name: 'Life Decisions — Free Cohort',
        description: 'The monthly cohort-based free program.',
        tier: 'free',
        status: 'active',
      })
      .returning({ id: programs.id }),
    'free program',
  )

  // ── Cohorts (free program): running, upcoming, long-finished ──
  const midCohort = firstRow(
    await db
      .insert(cohorts)
      .values({
        programId: freeProgram.id,
        title: 'Running cohort',
        startsAt: daysFrom(now, -7),
        endsAt: daysFrom(now, 21),
      })
      .returning({ id: cohorts.id }),
    'running cohort',
  )
  const preStartCohort = firstRow(
    await db
      .insert(cohorts)
      .values({
        programId: freeProgram.id,
        title: 'Upcoming cohort',
        startsAt: daysFrom(now, 7),
        endsAt: daysFrom(now, 35),
      })
      .returning({ id: cohorts.id }),
    'upcoming cohort',
  )
  const finishedCohort = firstRow(
    await db
      .insert(cohorts)
      .values({
        programId: freeProgram.id,
        title: 'Finished cohort',
        startsAt: daysFrom(now, -90),
        endsAt: daysFrom(now, -62),
      })
      .returning({ id: cohorts.id }),
    'finished cohort',
  )

  // ── Enrollments ──
  await db.insert(enrollments).values([
    {
      // paid = evergreen, no cohort
      userId: userIds.paid,
      programId: paidProgram.id,
      cohortId: null,
      status: 'active',
      source: 'purchase',
      stripeSubscriptionId: 'sub_seed_paid',
    },
    {
      userId: userIds.freeMidCohort,
      programId: freeProgram.id,
      cohortId: midCohort.id,
      status: 'active',
      source: 'signup',
    },
    {
      userId: userIds.freePreStart,
      programId: freeProgram.id,
      cohortId: preStartCohort.id,
      status: 'active',
      source: 'signup',
    },
    {
      userId: userIds.freeExpired,
      programId: freeProgram.id,
      cohortId: finishedCohort.id,
      status: 'expired',
      source: 'signup',
      expiresAt: daysFrom(now, -62),
    },
  ])

  // ── Course → module → lessons (every videoStatus) ──
  const course = firstRow(
    await db
      .insert(courses)
      .values({
        slug: SEED_COURSE_SLUG,
        title: 'Right Decision Foundations',
        description: 'The one decision that matters, and how to see it.',
        status: 'published',
      })
      .returning({ id: courses.id }),
    'course',
  )
  await db.insert(programCourses).values([
    { programId: paidProgram.id, courseId: course.id, sortOrder: 1 },
    { programId: freeProgram.id, courseId: course.id, sortOrder: 1 },
  ])
  const module1 = firstRow(
    await db
      .insert(modules)
      .values({
        courseId: course.id,
        title: 'Module 1 — See the Decision',
        description: 'Stop circling. Start seeing.',
        sortOrder: 1,
        status: 'published',
      })
      .returning({ id: modules.id }),
    'module 1',
  )

  const publishedLesson = firstRow(
    await db
      .insert(lessons)
      .values({
        moduleId: module1.id,
        title: 'The Decision You Already Know',
        description: 'Published lesson — satisfies the publish invariant.',
        sortOrder: 1,
        streamVideoId: 'seed-stream-ready',
        videoStatus: 'ready',
        durationSeconds: 480,
        captionsReady: true,
        decisionPrompt: 'What is the decision you have been avoiding?',
        status: 'published',
      })
      .returning({ id: lessons.id }),
    'published lesson',
  )
  await db.insert(lessons).values([
    {
      moduleId: module1.id,
      title: 'Draft Lesson (video ready, unpublished)',
      sortOrder: 2,
      streamVideoId: 'seed-stream-draft',
      videoStatus: 'ready',
      durationSeconds: 360,
      captionsReady: true,
      decisionPrompt: 'What would change if you decided today?',
      status: 'draft',
    },
    {
      moduleId: module1.id,
      title: 'Lesson Without Video',
      sortOrder: 3,
      videoStatus: 'none',
      status: 'draft',
    },
    {
      moduleId: module1.id,
      title: 'Lesson Mid-Upload',
      sortOrder: 4,
      videoStatus: 'uploading',
      status: 'draft',
    },
    {
      moduleId: module1.id,
      title: 'Lesson Processing',
      sortOrder: 5,
      streamVideoId: 'seed-stream-processing',
      videoStatus: 'processing',
      status: 'draft',
    },
    {
      moduleId: module1.id,
      title: 'Lesson With Encode Error',
      sortOrder: 6,
      streamVideoId: 'seed-stream-error',
      videoStatus: 'error',
      status: 'draft',
    },
  ])

  // ── Lives: upcoming / replay-ready / cancelled ──
  await db.insert(lives).values([
    {
      programId: paidProgram.id,
      title: 'Monthly Live — Upcoming',
      scheduledAt: daysFrom(now, 7),
    },
    {
      programId: paidProgram.id,
      title: 'Monthly Live — Replay Available',
      scheduledAt: daysFrom(now, -30),
      replayStreamVideoId: 'seed-stream-replay',
      replayStatus: 'ready',
    },
    {
      programId: paidProgram.id,
      title: 'Monthly Live — Cancelled',
      scheduledAt: daysFrom(now, 14),
      cancelledAt: daysFrom(now, -1),
    },
  ])

  // ── Published template + one filled + one empty document ──
  const template = firstRow(
    await db
      .insert(documentTemplates)
      .values({
        programId: paidProgram.id,
        slug: SEED_TEMPLATE_SLUG,
        title: 'Life Playbook',
        sortOrder: 1,
        version: 1,
        schema: buildTemplateSchema(),
        status: 'published',
      })
      .returning({ id: documentTemplates.id }),
    'template',
  )

  const filledDocument = firstRow(
    await db
      .insert(documents)
      .values({
        userId: userIds.paid,
        templateId: template.id,
        templateVersion: 1,
        status: 'in_progress',
      })
      .returning({ id: documents.id }),
    'filled document',
  )
  await db.insert(documentAnswers).values([
    {
      documentId: filledDocument.id,
      fieldId: 'f-decision-name',
      value: 'Leave the job that pays for the life I do not want.',
      source: 'typed',
    },
    {
      documentId: filledDocument.id,
      fieldId: 'f-life-area',
      value: 'career',
      source: 'typed',
    },
    {
      documentId: filledDocument.id,
      fieldId: 'f-certainty',
      value: '7',
      source: 'typed',
    },
  ])

  const emptyDocument = firstRow(
    await db
      .insert(documents)
      .values({
        userId: userIds.freeMidCohort,
        templateId: template.id,
        templateVersion: 1,
        status: 'empty',
      })
      .returning({ id: documents.id }),
    'empty document',
  )

  // ── Journal entries: morning + evening across 3 days ──
  await db.insert(journalEntries).values(
    [1, 2, 3].flatMap((daysAgo) => [
      {
        userId: userIds.paid,
        entryDate: dateString(now, daysAgo),
        kind: 'morning' as const,
        prompt: 'What would deciding look like today?',
        content: `Morning entry, ${daysAgo} day(s) ago.`,
      },
      {
        userId: userIds.paid,
        entryDate: dateString(now, daysAgo),
        kind: 'evening' as const,
        prompt: 'What did you avoid today?',
        content: `Evening entry, ${daysAgo} day(s) ago.`,
      },
    ]),
  )

  // ── A conversation with messages ──
  const conversation = firstRow(
    await db
      .insert(conversations)
      .values({
        userId: userIds.paid,
        kind: 'chat',
        title: 'Thinking through the career decision',
      })
      .returning({ id: conversations.id }),
    'conversation',
  )
  await db.insert(conversationMessages).values([
    {
      conversationId: conversation.id,
      role: 'user',
      content: 'I keep going back and forth on leaving my job.',
    },
    {
      conversationId: conversation.id,
      role: 'assistant',
      content:
        'Your playbook says the decision is already named. What makes today different from the last time you circled it?',
    },
    {
      conversationId: conversation.id,
      role: 'user',
      content: 'Nothing. That is the problem.',
    },
    {
      conversationId: conversation.id,
      role: 'assistant',
      content: 'Then the question is not whether — it is what you are waiting to feel first.',
    },
  ])

  // ── ai_usage near the free monthly token budget ceiling (~95%) ──
  const freeBudget = env.AI_MONTHLY_TOKEN_BUDGET_FREE
  await db.insert(aiUsage).values([
    {
      userId: userIds.freeMidCohort,
      kind: 'chat',
      model: 'claude-sonnet',
      inputTokens: Math.floor(freeBudget * 0.5),
      outputTokens: Math.floor(freeBudget * 0.25),
    },
    {
      userId: userIds.freeMidCohort,
      kind: 'chat',
      model: 'claude-sonnet',
      inputTokens: Math.floor(freeBudget * 0.15),
      outputTokens: Math.floor(freeBudget * 0.05),
    },
  ])

  return {
    userIds,
    paidProgramId: paidProgram.id,
    freeProgramId: freeProgram.id,
    courseId: course.id,
    publishedLessonId: publishedLesson.id,
    templateId: template.id,
    filledDocumentId: filledDocument.id,
    emptyDocumentId: emptyDocument.id,
    conversationId: conversation.id,
  }
}

if (import.meta.main) {
  const password = Bun.argv[2] ?? DEFAULT_SEED_PASSWORD
  if (password.length < 8) {
    console.error('Usage: bun run platform/scripts/seed-v2.ts [password]')
    console.error('Password must be at least 8 characters.')
    process.exit(1)
  }
  const { db } = await import('@/platform/db/client')
  seedV2(db, { password })
    .then((summary) => {
      console.log('Seeded V2 dev data. Seed users (CLI-arg or default dev credential):')
      for (const [key, email] of Object.entries(SEED_EMAILS)) {
        console.log(`  ${key}: ${email}`)
      }
      console.log(`Paid program: ${summary.paidProgramId} (${PAID_PROGRAM_SLUG})`)
      console.log(`Free program: ${summary.freeProgramId} (${FREE_PROGRAM_SLUG})`)
      process.exit(0)
    })
    .catch((err) => {
      console.error('Seed failed:', err)
      process.exit(1)
    })
}
