/**
 * Pure formatting helpers — Intl-localized dates, static per-minute countdown text
 * (reduced-motion rule: no ticking), durations, sizes, calendar + YouTube embed URLs.
 */

type DateInput = string | Date

const toDate = (value: DateInput): Date => (value instanceof Date ? value : new Date(value))

/** "Monday, July 1, 2026" in the member's locale — the pre-start welcome date. */
export function formatStartDate(value: DateInput, locale?: string): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'full' }).format(toDate(value))
}

/** "Jun 15, 2026, 6:00 PM" in the member's locale and timezone — lives schedule. */
export function formatScheduled(value: DateInput, locale?: string): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(
    toDate(value),
  )
}

/**
 * Static countdown TEXT, minute-granular (design rule: no animated ticking).
 * Past/imminent dates read "Starting now" — live-now derivation belongs to the API.
 */
export function formatCountdown(target: DateInput, now: Date): string {
  const totalMinutes = Math.floor((toDate(target).getTime() - now.getTime()) / 60_000)
  if (totalMinutes < 1) return 'Starting now'
  const days = Math.floor(totalMinutes / (60 * 24))
  if (days >= 1) return `Starts in ${days} ${days === 1 ? 'day' : 'days'}`
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours >= 1) {
    const tail = minutes > 0 ? ` ${minutes} ${minutes === 1 ? 'minute' : 'minutes'}` : ''
    return `Starts in ${hours} ${hours === 1 ? 'hour' : 'hours'}${tail}`
  }
  return `Starts in ${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`
}

/** "10 min" / "1 hr 5 min" — lesson durations. Sub-minute rounds up to 1 min. */
export function formatDuration(seconds: number | null | undefined): string {
  if (seconds == null || seconds <= 0) return ''
  const totalMinutes = Math.max(1, Math.round(seconds / 60))
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours === 0) return `${minutes} min`
  return minutes > 0 ? `${hours} hr ${minutes} min` : `${hours} hr`
}

/** "1.2 MB" / "44 KB" — material sizes. */
export function formatBytes(bytes: number | null | undefined): string {
  if (bytes == null || bytes <= 0) return ''
  if (bytes >= 1_000_000) {
    const mb = bytes / 1_000_000
    return `${mb >= 10 ? Math.round(mb) : Math.round(mb * 10) / 10} MB`
  }
  return `${Math.max(1, Math.round(bytes / 1000))} KB`
}

/** Watch progress 0–100 for resume bars. Unknown duration renders no progress. */
export function progressPercent(
  secondsWatched: number,
  durationSeconds: number | null | undefined,
): number {
  if (!durationSeconds || durationSeconds <= 0) return 0
  return Math.min(100, Math.round((secondsWatched / durationSeconds) * 100))
}

/**
 * The member's LOCAL calendar day as 'YYYY-MM-DD' — the journal's entryDate is
 * computed client-side in the user's zone and sent explicitly (never derived
 * server-side from UTC now).
 */
export function todayLocalDate(now: Date = new Date()): string {
  const month = `${now.getMonth() + 1}`.padStart(2, '0')
  const day = `${now.getDate()}`.padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

const toCalendarStamp = (date: Date): string =>
  date
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '')

/** Google Calendar template link for an upcoming live (1-hour default block). */
export function calendarUrl(title: string, startsAt: DateInput, description?: string): string {
  const start = toDate(startsAt)
  const end = new Date(start.getTime() + 60 * 60 * 1000)
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${toCalendarStamp(start)}/${toCalendarStamp(end)}`,
    ...(description ? { details: description } : {}),
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

const YOUTUBE_ID = /^[A-Za-z0-9_-]{6,20}$/

/** YouTube watch/share/live URL → embed URL. Null for anything not youtube.com/youtu.be. */
export function youtubeEmbedUrl(url: string | null | undefined): string | null {
  if (!url) return null
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return null
  }
  const host = parsed.hostname.replace(/^www\./, '')
  let id: string | null = null
  if (host === 'youtu.be') id = parsed.pathname.slice(1)
  else if (host === 'youtube.com' || host === 'm.youtube.com') {
    const [, kind, second] = parsed.pathname.split('/')
    if (parsed.pathname === '/watch') id = parsed.searchParams.get('v')
    else if ((kind === 'live' || kind === 'embed') && second) id = second
  }
  return id && YOUTUBE_ID.test(id) ? `https://www.youtube.com/embed/${id}` : null
}
