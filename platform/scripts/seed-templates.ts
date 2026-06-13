/**
 * Seed content for the two fill-in documents (P5, ADR 16 naming):
 * "Life Playbook" (paid program) and "Starter Notebook" (free program).
 *
 * Idempotent by slug: missing templates are created (published v1); existing v1
 * templates are refreshed to this file's content (the seed is the author while
 * version = 1); templates the admin has republished (version > 1) are SKIPPED —
 * the admin owns them now, and overwriting would break field-id immutability.
 *
 * All instruction prose / example answers are end-user content — written against
 * decisions/voice.md (Indy register: warm, direct, kitchen-table; no AI vocabulary,
 * no hype). The voice smoke test in seed-templates.test.ts enforces a banned-word
 * list. Founder review before launch is the human gate (roadmap risk #1).
 *
 * Usage: bun run platform/scripts/seed-templates.ts
 */

import { and, eq } from 'drizzle-orm'
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import type * as schema from '@/platform/db/schema'
import { documentTemplates, programs, type TemplateSchema } from '@/platform/db/schema'
import { FREE_PROGRAM_SLUG, PAID_PROGRAM_SLUG } from '@/platform/programs'
import { validateTemplateSchemaForWrite } from '@/platform/templates'

type Db = PostgresJsDatabase<typeof schema>

export const LIFE_PLAYBOOK_SLUG = 'life-playbook'
export const STARTER_NOTEBOOK_SLUG = 'starter-notebook'

export type SeedTemplateDef = {
  slug: string
  title: string
  sortOrder: number
  programSlug: string
  programTier: 'free' | 'paid'
  programName: string
  schema: TemplateSchema
}

const lifePlaybookSchema: TemplateSchema = {
  chapters: [
    {
      id: 'ch-who-i-am',
      title: 'Who I Am',
      pages: [
        {
          id: 'pg-my-story',
          title: 'My Story',
          instruction:
            'Nobody reads this but you and your AI. So skip the version you tell at dinner ' +
            'parties. Where are you actually, right now — and how did you get here? Plain ' +
            'words. The truth is shorter than the explanation.',
          fields: [
            {
              id: 'f-story-now',
              label: 'Where you are right now, honestly',
              kind: 'long_text',
              required: true,
              exampleAnswer:
                'Married, two kids, a job that pays well and costs me my mornings. From the ' +
                "outside it looks fine. That's the problem.",
            },
            {
              id: 'f-story-how',
              label: 'How you got here — the short version',
              kind: 'long_text',
              required: true,
              placeholder: 'Three or four sentences. The turns, not the whole road.',
            },
            {
              id: 'f-story-proud',
              label: "One thing you did that you're still proud of",
              kind: 'short_text',
              required: false,
              exampleAnswer: 'I left a city everyone told me to stay in.',
            },
          ],
        },
        {
          id: 'pg-my-values',
          title: 'My Values',
          instruction:
            "Not the values you'd put on a resume. The ones you'd actually fight for at 2am. " +
            "If you've never said one out loud, this is the place. Nobody is grading this.",
          fields: [
            {
              id: 'f-values-top',
              label: "The three you'd defend when it costs you something",
              kind: 'multi_select',
              required: true,
              options: [
                'honesty',
                'freedom',
                'family',
                'health',
                'craft',
                'faith',
                'beauty',
                'loyalty',
                'quiet',
              ],
            },
            {
              id: 'f-values-cost',
              label: 'Which one are you paying for right now — and what does it cost?',
              kind: 'long_text',
              required: true,
              exampleAnswer: 'Freedom. It costs me the approval of people I love.',
            },
          ],
        },
        {
          id: 'pg-my-fears',
          title: 'My Fears',
          instruction:
            'Fear hates being written down. It loses about half its weight on paper. Name what ' +
            "you're afraid of — small, large, ridiculous. Especially ridiculous.",
          fields: [
            {
              id: 'f-fears-biggest',
              label: 'The fear under all the other fears',
              kind: 'long_text',
              required: true,
              exampleAnswer: "That I'll get to 60 and realize I was always allowed to choose.",
            },
            {
              id: 'f-fears-instead',
              label: 'What you do instead of facing it',
              kind: 'short_text',
              required: true,
              placeholder: 'Reorganizing the closet counts. So does research.',
            },
            {
              id: 'f-fears-scale',
              label: 'How much is fear running your week right now?',
              kind: 'scale_1_10',
              required: false,
            },
          ],
        },
      ],
    },
    {
      id: 'ch-what-i-want',
      title: 'What I Want',
      pages: [
        {
          id: 'pg-perfect-day',
          title: 'My Perfect Day',
          instruction:
            'Not a vacation day. A Tuesday. If your life worked, what would an ordinary Tuesday ' +
            'look like, from waking up to falling asleep? Be specific — specifics are where the ' +
            'truth hides.',
          fields: [
            {
              id: 'f-day-morning',
              label: 'The morning',
              kind: 'long_text',
              required: true,
              exampleAnswer:
                'Up at 6 without an alarm. Coffee while the house is still quiet. Two hours of ' +
                'work that is mine before anyone needs me.',
            },
            {
              id: 'f-day-middle',
              label: 'The middle of the day',
              kind: 'long_text',
              required: true,
            },
            {
              id: 'f-day-evening',
              label: 'The evening',
              kind: 'long_text',
              required: true,
            },
            {
              id: 'f-day-people',
              label: "Who's in it?",
              kind: 'short_text',
              required: false,
              placeholder: 'Names, not categories.',
            },
          ],
        },
        {
          id: 'pg-what-i-want',
          title: 'What I Want and Why',
          instruction:
            "You've been asked what you want a hundred times and answered with what's " +
            'reasonable. Drop reasonable. What do you want?',
          fields: [
            {
              id: 'f-want-what',
              label: 'What you want, in plain words',
              kind: 'long_text',
              required: true,
              exampleAnswer:
                "Work I don't need a vacation from. A house with a kitchen people gather in.",
            },
            {
              id: 'f-want-why',
              label: 'Why this, why you, why now',
              kind: 'long_text',
              required: true,
            },
            {
              id: 'f-want-area',
              label: 'Where does the biggest want live?',
              kind: 'select',
              required: true,
              options: ['health', 'relationships', 'career', 'money'],
            },
          ],
        },
      ],
    },
    {
      id: 'ch-my-plan',
      title: 'My Plan',
      pages: [
        {
          id: 'pg-three-decisions',
          title: "This Year's Three Decisions",
          instruction:
            'Most people make zero real decisions a year. They make adjustments. You are going ' +
            'to make three. Decisions, not goals — a goal is a wish with a deadline. A decision ' +
            'closes a door behind you.',
          fields: [
            {
              id: 'f-plan-decision-1',
              label: 'Decision one',
              kind: 'short_text',
              required: true,
              exampleAnswer: "I'm leaving the job by March. Not 'exploring options.' Leaving.",
            },
            {
              id: 'f-plan-decision-2',
              label: 'Decision two',
              kind: 'short_text',
              required: true,
            },
            {
              id: 'f-plan-decision-3',
              label: 'Decision three',
              kind: 'short_text',
              required: true,
            },
            {
              id: 'f-plan-first-date',
              label: "When you'll make the first one",
              kind: 'date',
              required: false,
            },
          ],
        },
        {
          id: 'pg-commitments',
          title: 'My Commitments',
          instruction:
            "A decision without a commitment is a mood. Write what you're committing to, and " +
            "what you'll let go of to keep it. Both halves matter. The second one is the price.",
          fields: [
            {
              id: 'f-commit-keep',
              label: "What you're committing to",
              kind: 'long_text',
              required: true,
              exampleAnswer:
                'Thirty minutes every morning on the thing I said matters. Before email. Before ' +
                "anyone's awake.",
            },
            {
              id: 'f-commit-drop',
              label: "What you're letting go of to make room",
              kind: 'long_text',
              required: true,
            },
            {
              id: 'f-commit-certainty',
              label: 'How sure are you, today?',
              kind: 'scale_1_10',
              required: true,
            },
          ],
        },
      ],
    },
  ],
}

const starterNotebookSchema: TemplateSchema = {
  chapters: [
    {
      id: 'ch-where-i-am',
      title: 'Where I Am Now',
      pages: [
        {
          id: 'pg-one-decision',
          title: "The One Decision I'm Avoiding",
          instruction:
            'You knew the answer before you opened this page. Most people circle one decision ' +
            "for years and call the circling 'thinking it through.' Write it down. Just the " +
            'naming changes something.',
          fields: [
            {
              id: 'f-avoiding-decision',
              label: 'The decision, in one sentence',
              kind: 'short_text',
              required: true,
              exampleAnswer: 'Whether to stay in a marriage that is polite and nothing else.',
            },
            {
              id: 'f-avoiding-time',
              label: 'How long have you been circling it?',
              kind: 'select',
              required: true,
              options: [
                'Less than a year',
                '1-2 years',
                '3-5 years',
                'Longer than I want to admit',
              ],
            },
            {
              id: 'f-avoiding-cost',
              label: 'What the waiting has cost so far',
              kind: 'long_text',
              required: false,
              placeholder: 'Money, mornings, conversations you stopped having.',
            },
          ],
        },
        {
          id: 'pg-perfect-day-lite',
          title: 'My Perfect Day Lite',
          instruction:
            'A small version of an exercise from the full Playbook. One ordinary day, if your ' +
            "life worked. Don't write a vacation. Write a Tuesday.",
          fields: [
            {
              id: 'f-lite-day',
              label: 'Your ordinary day, if it worked',
              kind: 'long_text',
              required: true,
              exampleAnswer:
                "Quiet coffee. Work that uses me. Dinner where nobody's checking the time.",
            },
            {
              id: 'f-lite-feeling',
              label: "The one feeling that day has and today doesn't",
              kind: 'short_text',
              required: false,
            },
          ],
        },
      ],
    },
  ],
}

export const SEED_TEMPLATES: SeedTemplateDef[] = [
  {
    slug: LIFE_PLAYBOOK_SLUG,
    title: 'Life Playbook',
    sortOrder: 1,
    programSlug: PAID_PROGRAM_SLUG,
    programTier: 'paid',
    programName: 'Life Decisions',
    schema: lifePlaybookSchema,
  },
  {
    slug: STARTER_NOTEBOOK_SLUG,
    title: 'Starter Notebook',
    sortOrder: 1,
    programSlug: FREE_PROGRAM_SLUG,
    programTier: 'free',
    programName: 'Life Decisions — Free Cohort',
    schema: starterNotebookSchema,
  },
]

export type SeedTemplatesReport = {
  created: string[]
  updated: string[]
  skipped: string[]
}

async function ensureProgram(db: Db, def: SeedTemplateDef): Promise<string> {
  const [existing] = await db
    .select({ id: programs.id })
    .from(programs)
    .where(eq(programs.slug, def.programSlug))
    .limit(1)
  if (existing) return existing.id
  const [inserted] = await db
    .insert(programs)
    .values({
      slug: def.programSlug,
      name: def.programName,
      tier: def.programTier,
      status: 'active',
    })
    .returning({ id: programs.id })
  if (!inserted) throw new Error(`Seed could not create program ${def.programSlug}`)
  return inserted.id
}

/** Idempotent by slug: create missing, refresh v1, skip admin-republished (version > 1). */
export async function seedTemplates(db: Db): Promise<SeedTemplatesReport> {
  const report: SeedTemplatesReport = { created: [], updated: [], skipped: [] }

  for (const def of SEED_TEMPLATES) {
    // Seed content goes through the SAME validation as admin writes — never trust authors.
    const issue = validateTemplateSchemaForWrite(def.schema)
    if (issue) throw new Error(`Seed template ${def.slug} failed validation: ${issue}`)

    const programId = await ensureProgram(db, def)
    const [existing] = await db
      .select()
      .from(documentTemplates)
      .where(and(eq(documentTemplates.programId, programId), eq(documentTemplates.slug, def.slug)))
      .limit(1)

    if (!existing) {
      await db.insert(documentTemplates).values({
        programId,
        slug: def.slug,
        title: def.title,
        sortOrder: def.sortOrder,
        version: 1,
        schema: def.schema,
        status: 'published',
      })
      report.created.push(def.slug)
      continue
    }

    if (existing.version > 1) {
      // Admin republished it — the seed no longer owns this content.
      report.skipped.push(def.slug)
      continue
    }

    await db
      .update(documentTemplates)
      .set({
        title: def.title,
        sortOrder: def.sortOrder,
        schema: def.schema,
        status: 'published',
        updatedAt: new Date(),
      })
      .where(eq(documentTemplates.id, existing.id))
    report.updated.push(def.slug)
  }

  return report
}

if (import.meta.main) {
  const { db } = await import('@/platform/db/client')
  seedTemplates(db)
    .then((report) => {
      console.log('Seeded document templates:', report)
      process.exit(0)
    })
    .catch((err) => {
      console.error('Template seed failed:', err)
      process.exit(1)
    })
}
