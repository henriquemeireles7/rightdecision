import '@/platform/test/dom-preload'

import { afterAll, afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { act, cleanup, fireEvent, render, waitFor } from '@testing-library/preact'
import { options } from 'preact'
import { setApiFetchForTests } from '../lib/api'
import {
  catalogFixture,
  errorEnvelope,
  jsonFetch,
  lessonFixture,
  setTestUrl,
  unlockedLesson,
  unlockedProgram,
} from '../test-fixtures'
import { LessonPage } from './lesson'

type ConfigWindow = { __APP_CONFIG__?: unknown }

// Preact defers effect flushes to requestAnimationFrame, which happy-dom never fires
// for renders committed outside act(). Flush on a macrotask instead (NOT synchronously —
// a sync flush runs child effects before refs attach). Restored after this file.
type RafOptions = { requestAnimationFrame?: (cb: () => void) => void }
const previousRaf = (options as RafOptions).requestAnimationFrame
;(options as RafOptions).requestAnimationFrame = (cb) => setTimeout(cb, 0)
afterAll(() => {
  ;(options as RafOptions).requestAnimationFrame = previousRaf
})

/** Let the macrotask-scheduled effect flush run (batcher start, player attach). */
const flushEffects = () => act(() => new Promise<void>((resolve) => setTimeout(resolve, 5)))

beforeEach(() => {
  setTestUrl('/app/lessons/lesson-1')
  ;(window as ConfigWindow).__APP_CONFIG__ = { manifest: {}, streamCustomerCode: 'c0de' }
})

afterEach(() => {
  cleanup()
  setApiFetchForTests(null)
  delete (window as ConfigWindow).__APP_CONFIG__
})

const LESSON_GET = 'GET /api/player/lessons/lesson-1'

const mockLesson = (routes: Record<string, unknown> = {}) =>
  setApiFetchForTests(
    jsonFetch({
      [LESSON_GET]: { ok: true, data: lessonFixture() },
      'GET /api/catalog': { ok: true, data: catalogFixture() },
      ...routes,
    }),
  )

describe('page: Lesson', () => {
  test('loading state pins the ink canvas aspect (zero CLS)', () => {
    mockLesson()
    const { getByRole, container } = render(<LessonPage lessonId="lesson-1" />)
    expect(getByRole('status')).toBeTruthy()
    expect(container.querySelector('.bg-ink [class*="aspect-video"]')).toBeTruthy()
  })

  test('VIDEO_NOT_READY renders the processing state inside the ink canvas', async () => {
    mockLesson({ [LESSON_GET]: () => errorEnvelope('VIDEO_NOT_READY', 409) })
    const { findByText } = render(<LessonPage lessonId="lesson-1" />)
    expect(await findByText(/still processing/)).toBeTruthy()
  })

  test('other errors render what/why/how with retry', async () => {
    mockLesson({ [LESSON_GET]: () => errorEnvelope('ENROLLMENT_REQUIRED', 403) })
    const { findByRole } = render(<LessonPage lessonId="lesson-1" />)
    expect(await findByRole('alert')).toBeTruthy()
    expect(await findByRole('button', { name: 'Try again' })).toBeTruthy()
  })

  test('ready: video plays the signed manifest inside the ink canvas, cream below', async () => {
    mockLesson()
    const { container, findByRole } = render(<LessonPage lessonId="lesson-1" />)
    expect(await findByRole('heading', { level: 1, name: 'Naming the real decision' })).toBeTruthy()
    const video = container.querySelector('video') as HTMLVideoElement
    expect(video).toBeTruthy()
    expect(video.closest('.bg-ink')).toBeTruthy()
    await waitFor(() =>
      expect(video.getAttribute('src') ?? '').toContain(
        'customer-c0de.cloudflarestream.com/signed.jwt.token/manifest/video.m3u8',
      ),
    )
    expect(video.hasAttribute('controls')).toBe(true)
  })

  test('captions track + keyboard-operable toggle when captions are ready', async () => {
    mockLesson()
    const { container, findByRole } = render(<LessonPage lessonId="lesson-1" />)
    const toggle = await findByRole('button', { name: /Captions/ })
    expect(toggle.getAttribute('aria-pressed')).toBe('false')
    expect(container.querySelector('track[kind="captions"]')).toBeTruthy()
    fireEvent.click(toggle)
    expect(toggle.getAttribute('aria-pressed')).toBe('true')
  })

  test('no captions track when captionsReady is false', async () => {
    mockLesson({
      [LESSON_GET]: {
        ok: true,
        data: lessonFixture({
          lesson: { ...lessonFixture().lesson, captionsReady: false },
        }),
      },
    })
    const { container, findByRole } = render(<LessonPage lessonId="lesson-1" />)
    await findByRole('heading', { level: 1 })
    expect(container.querySelector('track')).toBeNull()
  })

  test('decision prompt is an inline panel below the player — locked until video end', async () => {
    mockLesson()
    const { container, findByText } = render(<LessonPage lessonId="lesson-1" />)
    expect(await findByText('What is the decision you have been avoiding?')).toBeTruthy()
    expect(container.querySelector('dialog')).toBeNull() // NEVER a modal
    const textarea = container.querySelector('textarea') as HTMLTextAreaElement
    expect(textarea.disabled).toBe(true)
    expect(await findByText('Finish the video to unlock your decision.')).toBeTruthy()
  })

  test('video end unlocks the prompt; submit confirms in sage green with the count', async () => {
    let answered: unknown = null
    mockLesson({
      'POST /api/player/lessons/lesson-1/answer': ({ init }: { init?: RequestInit }) => {
        answered = JSON.parse(String(init?.body))
        return new Response(
          JSON.stringify({
            ok: true,
            data: { completedAt: '2026-06-12T13:00:00.000Z', promptAnswer: 'I will quit.' },
          }),
          { headers: { 'content-type': 'application/json' } },
        )
      },
      'GET /api/catalog': {
        ok: true,
        data: catalogFixture({
          programs: [
            unlockedProgram({
              courses: [
                {
                  ...unlockedProgram().courses[0],
                  modules: [
                    {
                      ...unlockedProgram().courses[0]?.modules[0],
                      lessons: [
                        unlockedLesson('lesson-1', {
                          progress: {
                            secondsWatched: 600,
                            completedAt: '2026-06-12T13:00:00.000Z',
                            lastWatchedAt: '2026-06-12T13:00:00.000Z',
                          },
                        }),
                      ],
                    },
                  ],
                },
              ],
            }),
          ],
        }),
      },
    })
    const { container, findByRole, findByText } = render(<LessonPage lessonId="lesson-1" />)
    await findByRole('heading', { level: 1 })

    const video = container.querySelector('video') as HTMLVideoElement
    fireEvent(video, new Event('ended'))

    const textarea = container.querySelector('textarea') as HTMLTextAreaElement
    await waitFor(() => expect(textarea.disabled).toBe(false))
    fireEvent.input(textarea, { target: { value: 'I will quit.' } })
    fireEvent.click(await findByRole('button', { name: 'Make it real' }))

    const confirmation = await findByText('Decision recorded.')
    expect(confirmation.className).toContain('text-success')
    expect(answered).toEqual({ answer: 'I will quit.' })
    expect(await findByText('Decisions made:')).toBeTruthy()
    expect(await findByText('1')).toBeTruthy()
  })

  test('skip-to-end (seek near the end) also unlocks the prompt', async () => {
    mockLesson()
    const { container, findByRole } = render(<LessonPage lessonId="lesson-1" />)
    await findByRole('heading', { level: 1 })
    const video = container.querySelector('video') as HTMLVideoElement
    Object.defineProperty(video, 'duration', { value: 600, configurable: true })
    video.currentTime = 599.8
    fireEvent.timeUpdate(video)
    const textarea = container.querySelector('textarea') as HTMLTextAreaElement
    await waitFor(() => expect(textarea.disabled).toBe(false))
  })

  test('already-answered prompt shows the prior answer, not the form', async () => {
    mockLesson({
      [LESSON_GET]: {
        ok: true,
        data: lessonFixture({
          progress: {
            secondsWatched: 600,
            completedAt: '2026-06-01T00:00:00.000Z',
            lastWatchedAt: '2026-06-01T00:00:00.000Z',
          },
          promptAnswer: 'I already chose.',
        }),
      },
    })
    const { container, findByText } = render(<LessonPage lessonId="lesson-1" />)
    expect(await findByText('I already chose.')).toBeTruthy()
    expect(container.querySelector('textarea')).toBeNull()
  })

  test('failed submit keeps the text and shows a retryable error', async () => {
    mockLesson({
      'POST /api/player/lessons/lesson-1/answer': () => errorEnvelope('INTERNAL_ERROR', 500),
    })
    const { container, findByRole } = render(<LessonPage lessonId="lesson-1" />)
    await findByRole('heading', { level: 1 })
    fireEvent(container.querySelector('video') as HTMLVideoElement, new Event('ended'))
    const textarea = container.querySelector('textarea') as HTMLTextAreaElement
    await waitFor(() => expect(textarea.disabled).toBe(false))
    fireEvent.input(textarea, { target: { value: 'Try me' } })
    fireEvent.click(await findByRole('button', { name: 'Make it real' }))
    expect(await findByRole('alert')).toBeTruthy()
    expect(textarea.value).toBe('Try me')
  })

  test('watch heartbeats fold timeupdate positions and flush on unmount', async () => {
    const batches: unknown[] = []
    mockLesson({
      'POST /api/watch-events': ({ init }: { init?: RequestInit }) => {
        batches.push(JSON.parse(String(init?.body)))
        return new Response(JSON.stringify({ ok: true, data: { accepted: 1 } }), {
          headers: { 'content-type': 'application/json' },
        })
      },
    })
    const { container, findByRole, unmount } = render(<LessonPage lessonId="lesson-1" />)
    await findByRole('heading', { level: 1 })
    await flushEffects() // batcher.start() is effect-scheduled
    const video = container.querySelector('video') as HTMLVideoElement
    video.currentTime = 31
    fireEvent.timeUpdate(video)
    video.currentTime = 64
    fireEvent.timeUpdate(video)
    unmount()
    await waitFor(() => expect(batches.length).toBe(1))
    expect(batches[0]).toEqual({ events: [{ lessonId: 'lesson-1', secondsWatched: 64 }] })
  })
})
