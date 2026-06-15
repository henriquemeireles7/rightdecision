import { z } from 'zod'

/**
 * The COMPLETE V2 event-name union for waves 1-4, declared UPFRONT (ADR 6,
 * eng-schema TD-5): names are reserved here the way errors.ts reserves codes.
 * Later projects only fill in property schemas — they never invent names.
 *
 * This is Decision Graph v1: which actions count toward "Decisions Made" is
 * baked into `decisionTaxonomy` below. Callers cannot override it.
 *
 * Rules:
 * - Adding an event = additive union change. NEVER rename or repurpose a name.
 * - Properties are ids + enums ONLY. NEVER answer/journal/chat text (PII stays
 *   in its own table; unknown keys are stripped at parse time).
 */

export const decisionKinds = ['lesson_prompt', 'playbook', 'journal'] as const
export type DecisionKind = (typeof decisionKinds)[number]

/** Mirrors the events.source column enum (platform/db/schema.ts). */
export const eventSources = ['app', 'stream_player', 'mobile', 'backfill'] as const
export type EventSource = (typeof eventSources)[number]

const uuid = z.uuid()

function event<Name extends string, Props extends z.ZodRawShape>(name: Name, properties: Props) {
  return z.object({ name: z.literal(name), properties: z.object(properties) })
}

export const eventSchema = z.discriminatedUnion('name', [
  // ─── Enrollment lifecycle (Wave 1) ───
  event('cohort_joined', { programId: uuid, cohortId: uuid }),
  event('enrollment_created', {
    enrollmentId: uuid,
    programId: uuid,
    enrollmentSource: z.enum(['signup', 'purchase', 'admin', 'migration']),
  }),
  event('enrollment_expired', { enrollmentId: uuid, programId: uuid }),
  event('enrollment_revoked', { enrollmentId: uuid, programId: uuid }),
  event('enrollment_upgraded', { enrollmentId: uuid, programId: uuid }),

  // ─── Lesson lifecycle (Wave 2 — members area) ───
  event('lesson_started', { lessonId: uuid }),
  event('watch_heartbeat', { lessonId: uuid, secondsWatched: z.number().int().nonnegative() }),
  event('lesson_completed', { lessonId: uuid }),
  // The decision act of the lesson (ADR 1). NEVER include the answer text (PII).
  event('decision_prompt_answered', { lessonId: uuid }),

  // ─── Lives (Wave 2) ───
  event('live_viewed', { liveId: uuid }),
  event('replay_watched', { liveId: uuid }),

  // ─── Playbook (Wave 3 — name reserved; P5 may extend properties) ───
  event('document_started', { documentId: uuid, templateId: uuid }),
  // The playbook decision act. fieldId only — NEVER the answer value (PII).
  event('answer_saved', { documentId: uuid, fieldId: z.string().min(1) }),
  event('document_completed', { documentId: uuid }),

  // ─── Journal (Wave 3) — NEVER the entry content (PII) ───
  event('journal_entry_saved', {
    entryDate: z.iso.date(),
    kind: z.enum(['morning', 'evening']),
  }),

  // ─── Handbook pillars (aspirations / plan / routine) — ids + enums ONLY; titles/notes
  //     are PII and stay in their own tables. These are NOT decisions (Decision Graph v1 is
  //     unchanged): wiring plan-decisions into "Decisions Made" is a deliberate later choice. ───
  event('aspiration_created', {
    aspirationId: uuid,
    lifeArea: z.enum([
      'health',
      'relationships',
      'career',
      'money',
      'home',
      'experiences',
      'growth',
      'other',
    ]),
  }),
  event('plan_created', { planId: uuid }),
  event('habit_logged', { habitId: uuid, logDate: z.iso.date() }),

  // ─── Interview (Wave 4 — names reserved; P6 fills properties) ───
  event('interview_started', { interviewId: uuid }),
  event('interview_distilled', { interviewId: uuid }),
  event('interview_confirmed', { interviewId: uuid }),

  // ─── AI chat (Wave 4 — names reserved; P6 fills properties) ───
  event('chat_message_sent', { conversationId: uuid }),
  event('ai_budget_hit', {}),

  // ─── Funnel (Wave 2 — pre-auth events carry anonymousId; P4 fills properties) ───
  event('cohort_page_viewed', {}),
  event('checkout_started', {}),
  event('checkout_completed', {}),

  // ─── Admin / content (Wave 1-2 — P2 fills properties where minimal) ───
  event('lesson_published', { lessonId: uuid }),
  event('cover_generated', {}),

  // ─── Legacy migration backfill (Wave 1, eng-schema M8) — properties mirror the
  //     legacy rows minus PII; idempotency via sourceRef='user_decisions:<uuid>' ───
  event('legacy_decision_backfilled', {
    classId: z.string().min(1),
    blockId: z.string().min(1),
    courseSlug: z.string().min(1),
    decisionType: z.enum(['text', 'choice']),
  }),
  event('legacy_reading_backfilled', {
    classId: z.string().min(1),
    courseSlug: z.string().min(1),
    timeSpentSec: z.number().int().nonnegative(),
    scrollDepth: z.number().int().nonnegative(),
  }),
])

export type EventInput = z.infer<typeof eventSchema>
export type EventName = EventInput['name']

/** Every reserved event name, derived from the union (no manual list to drift). */
export const eventNames: readonly EventName[] = eventSchema.options.map(
  (option) => option.shape.name.value,
)

/**
 * Decision Graph v1 — THE definition of "Decisions Made" (roadmap deliverable 6):
 * lesson prompts: yes; playbook saves: yes; journal entries: yes (tagged separately);
 * legacy decision backfill keeps its lesson_prompt nature. Everything else: no.
 */
export const decisionTaxonomy = {
  decision_prompt_answered: 'lesson_prompt',
  answer_saved: 'playbook',
  journal_entry_saved: 'journal',
  legacy_decision_backfilled: 'lesson_prompt',
} as const satisfies Partial<Record<EventName, DecisionKind>>

/** isDecision/decisionKind for a given event name — baked in, never caller-supplied. */
export function decisionMeta(name: EventName): {
  isDecision: boolean
  decisionKind: DecisionKind | null
} {
  const kind = (decisionTaxonomy as Partial<Record<EventName, DecisionKind>>)[name]
  return kind ? { isDecision: true, decisionKind: kind } : { isDecision: false, decisionKind: null }
}
