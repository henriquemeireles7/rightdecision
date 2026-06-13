import { describe, expect, test } from 'bun:test'
import {
  calendarUrl,
  formatBytes,
  formatCountdown,
  formatDuration,
  formatScheduled,
  formatStartDate,
  progressPercent,
  youtubeEmbedUrl,
} from './format'

const NOW = new Date('2026-06-12T12:00:00.000Z')

describe('unit: formatStartDate', () => {
  test('localizes via Intl with an explicit locale', () => {
    expect(formatStartDate('2026-07-01T00:00:00.000Z', 'en-US')).toContain('July')
    expect(formatStartDate('2026-07-01T00:00:00.000Z', 'en-US')).toContain('2026')
  })

  test('accepts Date instances', () => {
    expect(formatStartDate(new Date('2026-07-01T00:00:00.000Z'), 'en-US')).toContain('July')
  })
})

describe('unit: formatScheduled', () => {
  test('includes date and time', () => {
    const out = formatScheduled('2026-06-15T18:00:00.000Z', 'en-US')
    expect(out).toContain('Jun')
    expect(out).toMatch(/\d{1,2}:\d{2}/)
  })
})

describe('unit: formatCountdown (static per-minute text, never seconds)', () => {
  test('days away', () => {
    expect(formatCountdown(new Date('2026-06-15T12:00:00.000Z'), NOW)).toBe('Starts in 3 days')
  })

  test('hours away', () => {
    expect(formatCountdown(new Date('2026-06-12T15:30:00.000Z'), NOW)).toBe(
      'Starts in 3 hours 30 minutes',
    )
  })

  test('minutes away', () => {
    expect(formatCountdown(new Date('2026-06-12T12:25:00.000Z'), NOW)).toBe('Starts in 25 minutes')
  })

  test('one minute or less, still upcoming', () => {
    expect(formatCountdown(new Date('2026-06-12T12:00:30.000Z'), NOW)).toBe('Starting now')
  })

  test('past dates read as starting now (state derivation owns live-now)', () => {
    expect(formatCountdown(new Date('2026-06-12T11:00:00.000Z'), NOW)).toBe('Starting now')
  })

  test('never contains seconds', () => {
    expect(formatCountdown(new Date('2026-06-12T12:25:42.000Z'), NOW)).not.toMatch(/second/)
  })
})

describe('unit: formatDuration', () => {
  test('minutes only', () => expect(formatDuration(600)).toBe('10 min'))
  test('hours and minutes', () => expect(formatDuration(3900)).toBe('1 hr 5 min'))
  test('under a minute', () => expect(formatDuration(45)).toBe('1 min'))
  test('null is empty', () => expect(formatDuration(null)).toBe(''))
})

describe('unit: formatBytes', () => {
  test('MB', () => expect(formatBytes(1_245_000)).toBe('1.2 MB'))
  test('KB', () => expect(formatBytes(45_000)).toBe('45 KB'))
  test('null is empty', () => expect(formatBytes(null)).toBe(''))
})

describe('unit: progressPercent', () => {
  test('ratio of watched to duration', () => expect(progressPercent(120, 600)).toBe(20))
  test('clamps to 100', () => expect(progressPercent(700, 600)).toBe(100))
  test('zero/unknown duration is 0', () => {
    expect(progressPercent(120, null)).toBe(0)
    expect(progressPercent(120, 0)).toBe(0)
  })
})

describe('unit: calendarUrl', () => {
  test('builds a Google Calendar template link with UTC times', () => {
    const url = calendarUrl('Monthly Live', '2026-06-15T18:00:00.000Z')
    expect(url).toContain('https://calendar.google.com/calendar/render?action=TEMPLATE')
    expect(url).toContain('20260615T180000Z%2F20260615T190000Z')
    expect(url).toContain('Monthly+Live')
  })
})

describe('unit: youtubeEmbedUrl', () => {
  test('watch URLs', () => {
    expect(youtubeEmbedUrl('https://www.youtube.com/watch?v=abc123xyz')).toBe(
      'https://www.youtube.com/embed/abc123xyz',
    )
  })
  test('youtu.be URLs', () => {
    expect(youtubeEmbedUrl('https://youtu.be/abc123xyz')).toBe(
      'https://www.youtube.com/embed/abc123xyz',
    )
  })
  test('live URLs', () => {
    expect(youtubeEmbedUrl('https://www.youtube.com/live/abc123xyz?feature=share')).toBe(
      'https://www.youtube.com/embed/abc123xyz',
    )
  })
  test('already-embed URLs pass through', () => {
    expect(youtubeEmbedUrl('https://www.youtube.com/embed/abc123xyz')).toBe(
      'https://www.youtube.com/embed/abc123xyz',
    )
  })
  test('non-YouTube URLs return null (never embed arbitrary origins)', () => {
    expect(youtubeEmbedUrl('https://evil.example.com/watch?v=abc')).toBeNull()
    expect(youtubeEmbedUrl(null)).toBeNull()
    expect(youtubeEmbedUrl('not a url')).toBeNull()
  })
})
