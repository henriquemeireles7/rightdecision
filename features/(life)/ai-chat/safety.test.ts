import { describe, expect, test } from 'bun:test'
import {
  CRISIS_RESOURCES,
  CRISIS_RESPONSE,
  classifyCrisis,
  NOT_THERAPY_LINE,
  SAFETY_SYSTEM_PROMPT,
} from './safety'

describe('ai-chat safety: crisis classification (TESTED deliverable)', () => {
  test('self-harm / suicidal signals are detected', () => {
    const crisisInputs = [
      'I want to kill myself',
      "I don't want to be alive anymore",
      'I am going to end it all tonight',
      'thinking about suicide again',
      'I want to hurt myself',
      'I have a plan to end my life',
      'everyone would be better off if I were dead',
    ]
    for (const input of crisisInputs) {
      expect(classifyCrisis(input)).toBe(true)
    }
  })

  test('crisis detection is case-insensitive and tolerates surrounding text', () => {
    expect(classifyCrisis('Honestly... I WANT TO KILL MYSELF and I cannot stop')).toBe(true)
  })

  test('ordinary stuck-but-safe messages are NOT misclassified as crisis', () => {
    const safeInputs = [
      'I feel stuck in my career and cannot decide what to do',
      'I want to quit my job but I am scared',
      'My relationship is dying and I do not know how to fix it',
      'I keep killing my chances by overthinking',
      'this deadline is killing me',
    ]
    for (const input of safeInputs) {
      expect(classifyCrisis(input)).toBe(false)
    }
  })
})

describe('ai-chat safety: crisis RESPONSE is referral + boundary, NEVER advice', () => {
  test('the response surfaces crisis resources', () => {
    expect(CRISIS_RESPONSE).toContain(CRISIS_RESOURCES.primaryLine)
    expect(CRISIS_RESPONSE).toContain(CRISIS_RESOURCES.emergencyLine)
  })

  test('the response states a boundary (this is not the place for it) — no advice/decomposition', () => {
    // boundary present
    expect(CRISIS_RESPONSE.toLowerCase()).toMatch(
      /not the right place|can't be the|not what i can/i,
    )
    // NEVER advice/decision-decomposition language on a crisis turn
    expect(CRISIS_RESPONSE.toLowerCase()).not.toMatch(
      /decompose|break (it|this) down|first step|your playbook/i,
    )
  })

  test('the boundary is warm, not clinical or alarming (voice.md)', () => {
    expect(CRISIS_RESPONSE.toLowerCase()).not.toMatch(/emergency!|warning|alert/i)
  })
})

describe('ai-chat safety: crisis-resource placeholder (FOUNDER INPUT)', () => {
  test('CRISIS_RESOURCES is a clearly-marked placeholder, not invented numbers', () => {
    expect(CRISIS_RESOURCES.isPlaceholder).toBe(true)
    expect(CRISIS_RESOURCES.todo.toLowerCase()).toContain('founder')
  })

  test('uses only the generic 988 / emergency-services placeholders', () => {
    expect(CRISIS_RESOURCES.primaryLine).toContain('988')
    expect(CRISIS_RESOURCES.emergencyLine.toLowerCase()).toContain('emergency')
  })
})

describe('ai-chat safety: disclosures', () => {
  test('the "not therapy" line is present and warm (voice.md)', () => {
    expect(NOT_THERAPY_LINE.toLowerCase()).toContain('not therapy')
  })

  test('the safety system prompt forbids advice on crisis and requires referral', () => {
    expect(SAFETY_SYSTEM_PROMPT.toLowerCase()).toContain('crisis')
    expect(SAFETY_SYSTEM_PROMPT.toLowerCase()).toMatch(/do not give advice|point her to|hand off/i)
  })
})
