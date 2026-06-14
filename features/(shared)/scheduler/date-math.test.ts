import { describe, expect, it } from 'bun:test'
import { computeFirstMonday, nextMonthOf } from './date-math'

// Fixtures required by eng-schema M7: first-Monday-is-the-1st, first-Monday-is-the-7th,
// year boundary (December→January), DST-transition month in a DST-observing zone.

describe('computeFirstMonday', () => {
  it('handles first-Monday-is-the-1st (September 2025, America/Sao_Paulo)', () => {
    // Sep 1, 2025 is a Monday. São Paulo is UTC-3 (no DST since 2019): 09:00 local = 12:00Z.
    const result = computeFirstMonday(2025, 9, 'America/Sao_Paulo', 9)
    expect(result.toISOString()).toBe('2025-09-01T12:00:00.000Z')
  })

  it('handles first-Monday-is-the-7th (July 2025, America/Sao_Paulo)', () => {
    // Jul 1, 2025 is a Tuesday → first Monday is Jul 7.
    const result = computeFirstMonday(2025, 7, 'America/Sao_Paulo', 9)
    expect(result.toISOString()).toBe('2025-07-07T12:00:00.000Z')
  })

  it('handles the year-boundary month (January 2026, America/Sao_Paulo)', () => {
    // Jan 1, 2026 is a Thursday → first Monday is Jan 5.
    const result = computeFirstMonday(2026, 1, 'America/Sao_Paulo', 9)
    expect(result.toISOString()).toBe('2026-01-05T12:00:00.000Z')
  })

  it('handles the DST-start month in America/New_York (March 2026, EST before the switch)', () => {
    // Mar 1, 2026 is a Sunday → first Monday is Mar 2. DST starts Mar 8, so
    // the first Monday is still EST (UTC-5): 09:00 local = 14:00Z.
    const result = computeFirstMonday(2026, 3, 'America/New_York', 9)
    expect(result.toISOString()).toBe('2026-03-02T14:00:00.000Z')
  })

  it('uses the DST offset after the spring-forward switch (April 2026, EDT)', () => {
    // Apr 1, 2026 is a Wednesday → first Monday is Apr 6, in EDT (UTC-4): 09:00 local = 13:00Z.
    const result = computeFirstMonday(2026, 4, 'America/New_York', 9)
    expect(result.toISOString()).toBe('2026-04-06T13:00:00.000Z')
  })

  it('handles the DST-end month in America/New_York (November 2026, back to EST)', () => {
    // Nov 1, 2026 is a Sunday (DST ends that morning) → first Monday is Nov 2,
    // already EST (UTC-5): 09:00 local = 14:00Z.
    const result = computeFirstMonday(2026, 11, 'America/New_York', 9)
    expect(result.toISOString()).toBe('2026-11-02T14:00:00.000Z')
  })

  it('respects the hour parameter', () => {
    const result = computeFirstMonday(2025, 9, 'America/Sao_Paulo', 14)
    expect(result.toISOString()).toBe('2025-09-01T17:00:00.000Z')
  })

  it('works in UTC', () => {
    const result = computeFirstMonday(2025, 9, 'UTC', 9)
    expect(result.toISOString()).toBe('2025-09-01T09:00:00.000Z')
  })
})

describe('nextMonthOf', () => {
  it('returns the next month mid-year', () => {
    expect(nextMonthOf(new Date('2026-06-12T15:00:00Z'), 'America/Sao_Paulo')).toEqual({
      year: 2026,
      month: 7,
    })
  })

  it('rolls December into January of the next year', () => {
    expect(nextMonthOf(new Date('2025-12-31T23:00:00Z'), 'America/Sao_Paulo')).toEqual({
      year: 2026,
      month: 1,
    })
  })

  it('determines the current month in the timezone, not in UTC', () => {
    // 2026-01-01T01:00Z is still Dec 31, 2025 22:00 in São Paulo (UTC-3),
    // so the next month is January 2026, not February.
    expect(nextMonthOf(new Date('2026-01-01T01:00:00Z'), 'America/Sao_Paulo')).toEqual({
      year: 2026,
      month: 1,
    })
  })
})
