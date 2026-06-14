/// <reference lib="dom" />
/**
 * Client-side watch-event buffer (eng-schema S5): folds heartbeats to the max
 * secondsWatched per lesson, POSTs batches every ~30s through the api-client, and
 * flushes via navigator.sendBeacon on pagehide (the reading-analytics pattern).
 * Telemetry NEVER breaks playback — send failures are swallowed and re-buffered.
 */
import { postWatchEvents } from './data'

export type Heartbeat = { lessonId: string; secondsWatched: number }

/** Mirrors WATCH_EVENTS rate-limit sizing: ~2 POSTs/min in practice. */
const HEARTBEAT_FLUSH_INTERVAL_MS = 30_000

type BatcherOptions = {
  flushIntervalMs?: number
  /** Injection for TESTS — production uses postWatchEvents / navigator.sendBeacon. */
  send?: (events: Heartbeat[]) => Promise<unknown>
  beacon?: (events: Heartbeat[]) => unknown
}

function defaultBeacon(events: Heartbeat[]) {
  const body = new Blob([JSON.stringify({ events })], { type: 'application/json' })
  return navigator.sendBeacon('/api/watch-events', body)
}

export function createHeartbeatBatcher(options: BatcherOptions = {}) {
  const flushIntervalMs = options.flushIntervalMs ?? HEARTBEAT_FLUSH_INTERVAL_MS
  const send = options.send ?? ((events: Heartbeat[]) => postWatchEvents(events))
  const beacon = options.beacon ?? defaultBeacon

  const buffer = new Map<string, number>()
  let interval: ReturnType<typeof setInterval> | null = null

  const drain = (): Heartbeat[] => {
    const events = [...buffer.entries()].map(([lessonId, secondsWatched]) => ({
      lessonId,
      secondsWatched,
    }))
    buffer.clear()
    return events
  }

  const refold = (events: Heartbeat[]) => {
    for (const event of events) {
      const existing = buffer.get(event.lessonId) ?? 0
      buffer.set(event.lessonId, Math.max(existing, event.secondsWatched))
    }
  }

  const flush = async (): Promise<void> => {
    if (buffer.size === 0) return
    const events = drain()
    try {
      await send(events)
    } catch {
      // Offline/failed POST: keep the fold so the next flush carries the position
      refold(events)
    }
  }

  const onPagehide = () => {
    if (buffer.size === 0) return
    beacon(drain()) // fetch may never complete during unload — beacon survives it
  }

  return {
    /** Fold a position sample — monotonic per lesson (out-of-order safe). */
    record(lessonId: string, secondsWatched: number) {
      const existing = buffer.get(lessonId) ?? 0
      buffer.set(lessonId, Math.max(existing, Math.floor(secondsWatched)))
    },
    flush,
    start() {
      if (interval) return
      interval = setInterval(() => void flush(), flushIntervalMs)
      window.addEventListener('pagehide', onPagehide)
    },
    stop() {
      if (interval) clearInterval(interval)
      interval = null
      window.removeEventListener('pagehide', onPagehide)
      void flush()
    },
  }
}
