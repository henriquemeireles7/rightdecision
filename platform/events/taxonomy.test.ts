import { describe, expect, test } from 'bun:test'
import {
  decisionKinds,
  decisionMeta,
  decisionTaxonomy,
  eventNames,
  eventSchema,
  eventSources,
} from '@/platform/events/taxonomy'

const LESSON_ID = '7b8a4c1e-2f3d-4a5b-9c8d-1e2f3a4b5c6d'

// The COMPLETE V2 event-name union for waves 1-4 — names reserved upfront like
// errors.ts reserves codes. Changing this list is an architectural decision.
const expectedNames = [
  // enrollment lifecycle
  'cohort_joined',
  'enrollment_created',
  'enrollment_expired',
  'enrollment_revoked',
  'enrollment_upgraded',
  // lesson lifecycle
  'lesson_started',
  'watch_heartbeat',
  'lesson_completed',
  'decision_prompt_answered',
  // lives
  'live_viewed',
  'replay_watched',
  // playbook
  'document_started',
  'answer_saved',
  'document_completed',
  // journal
  'journal_entry_saved',
  // handbook pillars (aspirations / plan / routine)
  'aspiration_created',
  'plan_created',
  'habit_logged',
  // interview
  'interview_started',
  'interview_distilled',
  'interview_confirmed',
  // chat
  'chat_message_sent',
  'ai_budget_hit',
  // funnel
  'cohort_page_viewed',
  'checkout_started',
  'checkout_completed',
  // admin/content
  'lesson_published',
  'cover_generated',
  // legacy backfill
  'legacy_decision_backfilled',
  'legacy_reading_backfilled',
]

describe('taxonomy: event-name union', () => {
  test('declares the complete V2 event-name union for waves 1-4 upfront', () => {
    const actual: string[] = [...eventNames]
    expect(actual.sort()).toEqual([...expectedNames].sort())
    expect(eventNames).toHaveLength(30)
  })

  test('rejects an event name outside the union', () => {
    const result = eventSchema.safeParse({ name: 'made_up_event', properties: {} })
    expect(result.success).toBe(false)
  })

  test('accepts a valid event with valid properties', () => {
    const result = eventSchema.safeParse({
      name: 'decision_prompt_answered',
      properties: { lessonId: LESSON_ID },
    })
    expect(result.success).toBe(true)
  })

  test('rejects invalid properties (wrong type)', () => {
    const result = eventSchema.safeParse({
      name: 'watch_heartbeat',
      properties: { lessonId: LESSON_ID, secondsWatched: 'thirty' },
    })
    expect(result.success).toBe(false)
  })

  test('rejects invalid properties (missing required key)', () => {
    const result = eventSchema.safeParse({ name: 'lesson_started', properties: {} })
    expect(result.success).toBe(false)
  })

  test('rejects negative heartbeat seconds', () => {
    const result = eventSchema.safeParse({
      name: 'watch_heartbeat',
      properties: { lessonId: LESSON_ID, secondsWatched: -5 },
    })
    expect(result.success).toBe(false)
  })

  test('strips unknown property keys (PII cannot sneak into the spine)', () => {
    const result = eventSchema.parse({
      name: 'decision_prompt_answered',
      properties: { lessonId: LESSON_ID, answerText: 'my private answer' },
    })
    expect(result.properties).toEqual({ lessonId: LESSON_ID })
  })

  test('journal_entry_saved validates entryDate as an ISO calendar date', () => {
    const bad = eventSchema.safeParse({
      name: 'journal_entry_saved',
      properties: { entryDate: 'June 12th', kind: 'morning' },
    })
    expect(bad.success).toBe(false)
    const good = eventSchema.safeParse({
      name: 'journal_entry_saved',
      properties: { entryDate: '2026-06-12', kind: 'evening' },
    })
    expect(good.success).toBe(true)
  })

  test('reserved later-wave names parse with minimal properties', () => {
    for (const name of [
      'ai_budget_hit',
      'cohort_page_viewed',
      'checkout_started',
      'checkout_completed',
      'cover_generated',
    ]) {
      expect(eventSchema.safeParse({ name, properties: {} }).success).toBe(true)
    }
  })

  test('legacy backfill events validate against the legacy row shape', () => {
    const decision = eventSchema.safeParse({
      name: 'legacy_decision_backfilled',
      properties: {
        classId: 'class-1',
        blockId: 'block-1',
        courseSlug: 'life-decisions',
        decisionType: 'text',
      },
    })
    expect(decision.success).toBe(true)
    const reading = eventSchema.safeParse({
      name: 'legacy_reading_backfilled',
      properties: {
        classId: 'class-1',
        courseSlug: 'life-decisions',
        timeSpentSec: 120,
        scrollDepth: 80,
      },
    })
    expect(reading.success).toBe(true)
  })
})

describe('taxonomy: Decision Graph v1', () => {
  test('exactly these events count as decisions (lesson prompts, playbook saves, journal entries, legacy backfill)', () => {
    expect(decisionTaxonomy).toEqual({
      decision_prompt_answered: 'lesson_prompt',
      answer_saved: 'playbook',
      journal_entry_saved: 'journal',
      legacy_decision_backfilled: 'lesson_prompt',
    })
  })

  test('decisionMeta returns the baked-in flag and kind for decision events', () => {
    expect(decisionMeta('decision_prompt_answered')).toEqual({
      isDecision: true,
      decisionKind: 'lesson_prompt',
    })
    expect(decisionMeta('answer_saved')).toEqual({ isDecision: true, decisionKind: 'playbook' })
    expect(decisionMeta('journal_entry_saved')).toEqual({
      isDecision: true,
      decisionKind: 'journal',
    })
    expect(decisionMeta('legacy_decision_backfilled')).toEqual({
      isDecision: true,
      decisionKind: 'lesson_prompt',
    })
  })

  test('decisionMeta returns false/null for non-decision events', () => {
    expect(decisionMeta('lesson_started')).toEqual({ isDecision: false, decisionKind: null })
    expect(decisionMeta('watch_heartbeat')).toEqual({ isDecision: false, decisionKind: null })
    expect(decisionMeta('checkout_completed')).toEqual({ isDecision: false, decisionKind: null })
    expect(decisionMeta('legacy_reading_backfilled')).toEqual({
      isDecision: false,
      decisionKind: null,
    })
  })

  test('every decision kind in the taxonomy is a valid decisionKind', () => {
    for (const kind of Object.values(decisionTaxonomy)) {
      expect(decisionKinds).toContain(kind)
    }
  })

  test('event sources match the events table enum', () => {
    expect(eventSources).toEqual(['app', 'stream_player', 'mobile', 'backfill'])
  })
})
