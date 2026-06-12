// Pure cohort date math (eng-schema M7). No date libraries — Intl API only.
// Months are 1-based (1 = January) everywhere in this module.

const MONDAY = 1

/** Wall-clock fields of a UTC instant as seen in an IANA timezone. */
function partsInZone(timestampMs: number, timezone: string) {
  const formatted = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(timestampMs))
  const get = (type: string) => Number(formatted.find((part) => part.type === type)?.value)
  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    hour: get('hour'),
    minute: get('minute'),
    second: get('second'),
  }
}

/** Convert a wall-clock time in an IANA timezone to the UTC instant it represents. */
function zonedTimeToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  timezone: string,
): Date {
  const desiredAsUtc = Date.UTC(year, month - 1, day, hour)
  let timestampMs = desiredAsUtc
  // Two fixed-point iterations converge for all real timezone offsets, including
  // months containing a DST transition (the target hour is never inside the DST gap —
  // transitions happen at 2-3 AM local).
  for (let i = 0; i < 2; i++) {
    const shown = partsInZone(timestampMs, timezone)
    const shownAsUtc = Date.UTC(
      shown.year,
      shown.month - 1,
      shown.day,
      shown.hour,
      shown.minute,
      shown.second,
    )
    timestampMs -= shownAsUtc - desiredAsUtc
  }
  return new Date(timestampMs)
}

/**
 * UTC instant of the first Monday of (year, month) at `hour`:00 local time in `timezone`.
 * Stored as timestamptz; cron compares UTC instants — no tz math at read time (M7).
 */
export function computeFirstMonday(
  year: number,
  month: number,
  timezone: string,
  hour: number,
): Date {
  // A calendar date's weekday is timezone-independent.
  const firstDayOfWeek = new Date(Date.UTC(year, month - 1, 1)).getUTCDay()
  const day = 1 + ((MONDAY - firstDayOfWeek + 7) % 7)
  return zonedTimeToUtc(year, month, day, hour, timezone)
}

/** The calendar month AFTER the one `now` falls in, as seen in `timezone`. */
export function nextMonthOf(now: Date, timezone: string): { year: number; month: number } {
  const current = partsInZone(now.getTime(), timezone)
  if (current.month === 12) return { year: current.year + 1, month: 1 }
  return { year: current.year, month: current.month + 1 }
}
