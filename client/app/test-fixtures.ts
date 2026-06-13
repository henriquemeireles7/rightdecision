/// <reference lib="dom" />
/**
 * TEST-ONLY fixtures + seams for client/app tests. Never imported by app code.
 *
 * Mocking strategy (documented in client/app/CLAUDE.md): tests inject a fetch-level
 * mock through the api-client's own ApiClientOptions.fetch seam via setApiFetchForTests.
 * jsonFetch matches requests on "METHOD /path" keys and returns envelope JSON.
 */

type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Response | Promise<Response>
type RouteHandler = unknown | ((req: { url: URL; init?: RequestInit }) => Response)

/** Point happy-dom at an /app URL (history.pushState needs a real origin). */
export function setTestUrl(path: string) {
  const happy = (window as unknown as { happyDOM?: { setURL?: (url: string) => void } }).happyDOM
  happy?.setURL?.(`http://localhost:3000${path}`)
}

/** Build a fetch mock keyed by "METHOD /path". Values: envelope object or handler fn. */
export function jsonFetch(routes: Record<string, RouteHandler>): FetchLike {
  return (input, init) => {
    const url = new URL(
      input instanceof Request ? input.url : String(input),
      'http://localhost:3000',
    )
    const method = (init?.method ?? (input instanceof Request ? input.method : 'GET')).toUpperCase()
    const handler = routes[`${method} ${url.pathname}`]
    if (handler === undefined) {
      return new Response(
        JSON.stringify({
          ok: false,
          code: 'NOT_FOUND',
          message: `No mock for ${method} ${url.pathname}`,
        }),
        { status: 404, headers: { 'content-type': 'application/json' } },
      )
    }
    if (typeof handler === 'function') {
      return (handler as (req: { url: URL; init?: RequestInit }) => Response)({ url, init })
    }
    return new Response(JSON.stringify(handler), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })
  }
}

/** Error-envelope response helper for jsonFetch handler values. */
export function errorEnvelope(code: string, status: number, message = code): Response {
  return new Response(JSON.stringify({ ok: false, code, message }), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

// ─── Catalog fixtures (mirror features/(life)/catalog/service.ts getCatalog) ───

export function unlockedLesson(
  id: string,
  overrides: Partial<{
    title: string
    durationSeconds: number | null
    videoStatus: string
    thumbnailKey: string | null
    progress: { secondsWatched: number; completedAt: string | null; lastWatchedAt: string } | null
  }> = {},
) {
  return {
    id,
    title: overrides.title ?? `Lesson ${id}`,
    description: 'A lesson.',
    durationSeconds: overrides.durationSeconds ?? 600,
    thumbnailKey: overrides.thumbnailKey ?? `thumbs/${id}.png`,
    videoStatus: overrides.videoStatus ?? 'ready',
    progress: overrides.progress ?? null,
  }
}

export function unlockedProgram(overrides: Record<string, unknown> = {}) {
  return {
    id: 'prog-free',
    slug: 'life-decisions-free',
    name: 'Life Decisions',
    description: 'The free program.',
    tier: 'free',
    coverImageKey: 'covers/programs/free.png',
    unlocked: true,
    cohortStartsAt: null,
    courses: [
      {
        id: 'course-1',
        slug: 'the-one-decision',
        title: 'The One Decision',
        description: 'The course.',
        coverImageKey: 'covers/courses/one.png',
        modules: [
          {
            id: 'module-1',
            title: 'Seeing Clearly',
            description: 'Module one.',
            coverImageKey: 'covers/modules/one.png',
            lessons: [
              unlockedLesson('lesson-1', {
                progress: {
                  secondsWatched: 120,
                  completedAt: null,
                  lastWatchedAt: '2026-06-10T10:00:00.000Z',
                },
              }),
              unlockedLesson('lesson-2'),
              unlockedLesson('lesson-3', { videoStatus: 'processing' }),
            ],
          },
        ],
      },
    ],
    ...overrides,
  }
}

export function lockedProgram(overrides: Record<string, unknown> = {}) {
  return {
    id: 'prog-paid',
    slug: 'life-decisions-paid',
    name: 'The Full Program',
    description: 'Everything, plus monthly lives.',
    tier: 'paid',
    coverImageKey: 'covers/programs/paid.png',
    unlocked: false,
    cohortStartsAt: null,
    courses: [
      {
        id: 'course-2',
        slug: 'deep-work',
        title: 'Decide For Real',
        description: 'The paid course.',
        coverImageKey: 'covers/courses/paid.png',
        modules: [
          {
            id: 'module-2',
            title: 'The Decision Audit',
            description: 'What you have been avoiding.',
            coverImageKey: 'covers/modules/paid.png',
            lessons: [
              { id: 'locked-1', title: 'Naming the real decision' },
              { id: 'locked-2', title: 'The cost of waiting' },
            ],
          },
        ],
      },
    ],
    ...overrides,
  }
}

export function catalogFixture(overrides: Record<string, unknown> = {}) {
  return {
    programs: [unlockedProgram(), lockedProgram()],
    continueWatching: [
      {
        lessonId: 'lesson-1',
        moduleId: 'module-1',
        title: 'Lesson lesson-1',
        thumbnailKey: 'thumbs/lesson-1.png',
        secondsWatched: 120,
        durationSeconds: 600,
        lastWatchedAt: '2026-06-10T10:00:00.000Z',
      },
    ],
    cohortStartsAt: null,
    ...overrides,
  }
}

// ─── Lives fixtures (mirror features/(life)/lives-view/service.ts toLiveView) ───

export function liveFixture(
  state: 'upcoming' | 'live-now' | 'replay-ready' | 'cancelled',
  overrides: Record<string, unknown> = {},
) {
  return {
    id: `live-${state}`,
    programId: 'prog-free',
    title: `Live session (${state})`,
    description: 'Monthly live.',
    scheduledAt: state === 'upcoming' ? '2027-01-15T18:00:00.000Z' : '2026-06-01T18:00:00.000Z',
    cancelledAt: state === 'cancelled' ? '2026-05-30T00:00:00.000Z' : null,
    youtubeUrl: 'https://www.youtube.com/watch?v=abc123xyz',
    replayReady: state === 'replay-ready',
    state,
    ...overrides,
  }
}

// ─── Materials fixtures (mirror features/(life)/materials-view/service.ts) ───

export function materialFixture(id: string, overrides: Record<string, unknown> = {}) {
  return {
    id,
    title: `Workbook ${id}`,
    description: 'A printable workbook.',
    fileSizeBytes: 1_245_000,
    mimeType: 'application/pdf',
    lessonId: null,
    createdAt: '2026-05-01T00:00:00.000Z',
    ...overrides,
  }
}

// ─── Lesson fixture (mirror features/(life)/player/service.ts getLesson) ───

export function lessonFixture(overrides: Record<string, unknown> = {}) {
  return {
    lesson: {
      id: 'lesson-1',
      title: 'Naming the real decision',
      description: 'The first lesson.',
      durationSeconds: 600,
      thumbnailKey: 'thumbs/lesson-1.png',
      captionsReady: true,
      decisionPrompt: 'What is the decision you have been avoiding?',
    },
    streamVideoId: 'stream-vid-1',
    playbackToken: 'signed.jwt.token',
    progress: { secondsWatched: 120, completedAt: null, lastWatchedAt: '2026-06-10T10:00:00.000Z' },
    promptAnswer: null,
    ...overrides,
  }
}
