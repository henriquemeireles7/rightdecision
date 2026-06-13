import '@/platform/test/dom-preload'

import { describe, expect, test } from 'bun:test'
import { createHeartbeatBatcher } from './heartbeats'

type Sent = Array<Array<{ lessonId: string; secondsWatched: number }>>

function spies() {
  const sent: Sent = []
  const beaconed: Sent = []
  return {
    sent,
    beaconed,
    send: (events: Sent[number]) => {
      sent.push(events)
      return Promise.resolve()
    },
    beacon: (events: Sent[number]) => {
      beaconed.push(events)
      return true
    },
  }
}

describe('unit: heartbeat batcher', () => {
  test('folds records to the max secondsWatched per lesson', async () => {
    const s = spies()
    const batcher = createHeartbeatBatcher({ send: s.send, beacon: s.beacon })
    batcher.record('lesson-1', 30)
    batcher.record('lesson-1', 90)
    batcher.record('lesson-1', 60) // out of order — must not rewind
    batcher.record('lesson-2', 15)
    await batcher.flush()
    expect(s.sent).toEqual([
      [
        { lessonId: 'lesson-1', secondsWatched: 90 },
        { lessonId: 'lesson-2', secondsWatched: 15 },
      ],
    ])
  })

  test('flush is a no-op when empty', async () => {
    const s = spies()
    const batcher = createHeartbeatBatcher({ send: s.send, beacon: s.beacon })
    await batcher.flush()
    expect(s.sent).toEqual([])
  })

  test('flush drains the buffer (no double send)', async () => {
    const s = spies()
    const batcher = createHeartbeatBatcher({ send: s.send, beacon: s.beacon })
    batcher.record('lesson-1', 30)
    await batcher.flush()
    await batcher.flush()
    expect(s.sent.length).toBe(1)
  })

  test('send failures are swallowed and events are re-buffered for the next flush', async () => {
    const s = spies()
    let failures = 0
    const batcher = createHeartbeatBatcher({
      send: (events) => {
        if (failures++ === 0) return Promise.reject(new Error('offline'))
        return s.send(events)
      },
      beacon: s.beacon,
    })
    batcher.record('lesson-1', 30)
    await batcher.flush() // fails, swallowed — telemetry never breaks the UI
    batcher.record('lesson-1', 60)
    await batcher.flush()
    expect(s.sent).toEqual([[{ lessonId: 'lesson-1', secondsWatched: 60 }]])
  })

  test('pagehide flushes through the beacon, not fetch', () => {
    const s = spies()
    const batcher = createHeartbeatBatcher({ send: s.send, beacon: s.beacon })
    batcher.start()
    batcher.record('lesson-1', 45)
    window.dispatchEvent(new Event('pagehide'))
    expect(s.beaconed).toEqual([[{ lessonId: 'lesson-1', secondsWatched: 45 }]])
    expect(s.sent).toEqual([])
    batcher.stop()
  })

  test('interval flushes on the configured cadence', async () => {
    const s = spies()
    const batcher = createHeartbeatBatcher({ send: s.send, beacon: s.beacon, flushIntervalMs: 5 })
    batcher.start()
    batcher.record('lesson-1', 30)
    await new Promise((resolve) => setTimeout(resolve, 30))
    batcher.stop()
    expect(s.sent.length).toBeGreaterThanOrEqual(1)
    expect(s.sent[0]).toEqual([{ lessonId: 'lesson-1', secondsWatched: 30 }])
  })

  test('stop flushes whatever is left and removes listeners', async () => {
    const s = spies()
    const batcher = createHeartbeatBatcher({ send: s.send, beacon: s.beacon })
    batcher.start()
    batcher.record('lesson-1', 75)
    batcher.stop()
    await Promise.resolve()
    expect(s.sent).toEqual([[{ lessonId: 'lesson-1', secondsWatched: 75 }]])
    // after stop, pagehide must not beacon
    window.dispatchEvent(new Event('pagehide'))
    expect(s.beaconed).toEqual([])
  })
})
