/// <reference lib="dom" />
/**
 * Test-only fixtures for client/admin component tests (not a test file — no .test. suffix).
 * makeData() builds an AdminData fake where every unscripted method rejects loudly, so a
 * component calling an endpoint the test didn't script fails with a readable message.
 * Row factories mirror the wire shapes (Drizzle rows after JSON serialization: Date → string).
 */
import type {
  AdminCohort,
  AdminCohortSuggestion,
  AdminCourse,
  AdminData,
  AdminLesson,
  AdminLive,
  AdminMaterial,
  AdminModule,
  AdminProgram,
  AdminTemplate,
  AdminTemplateSchema,
  DistributionClip,
  DistributionPost,
  DistributionRun,
  DistributionRunDetail,
} from './data'

/** happy-dom starts at about:blank — point it at a real path before router tests. */
export function setBrowserPath(path: string): void {
  ;(window as unknown as { happyDOM: { setURL: (url: string) => void } }).happyDOM.setURL(
    `http://localhost:3000${path}`,
  )
}

export function makeData(overrides: Partial<AdminData> = {}): AdminData {
  return new Proxy(overrides, {
    get(target, prop: string) {
      const scripted = target[prop as keyof AdminData]
      if (scripted) return scripted
      return () => Promise.reject(new Error(`AdminData.${prop} was called but not scripted`))
    },
  }) as AdminData
}

const NOW = '2026-06-01T10:00:00.000Z'

export function makeCourse(overrides: Partial<AdminCourse> = {}): AdminCourse {
  return {
    id: 'c-1',
    slug: 'first-course',
    title: 'First Course',
    description: null,
    coverImageKey: null,
    status: 'draft',
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  }
}

export function makeModule(
  overrides: Partial<AdminModule> = {},
  lessons: AdminLesson[] = [],
): AdminModule {
  return {
    id: 'm-1',
    courseId: 'c-1',
    title: 'Module One',
    description: null,
    coverImageKey: null,
    sortOrder: 0,
    status: 'draft',
    createdAt: NOW,
    updatedAt: NOW,
    lessons,
    ...overrides,
  }
}

export function makeLesson(overrides: Partial<AdminLesson> = {}): AdminLesson {
  return {
    id: 'l-1',
    moduleId: 'm-1',
    title: 'Lesson One',
    description: null,
    sortOrder: 0,
    streamVideoId: null,
    videoStatus: 'none',
    durationSeconds: null,
    thumbnailKey: null,
    captionsReady: false,
    decisionPrompt: null,
    status: 'draft',
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  }
}

export function makeProgram(overrides: Partial<AdminProgram> = {}): AdminProgram {
  return {
    id: 'p-1',
    slug: 'life-decisions-paid',
    name: 'Life Decisions',
    description: null,
    tier: 'paid',
    status: 'active',
    coverImageKey: null,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  }
}

export function makeCohort(overrides: Partial<AdminCohort> = {}): AdminCohort {
  return {
    id: 'ch-1',
    programId: 'p-1',
    title: 'July Cohort',
    startsAt: '2026-07-06T13:00:00.000Z',
    endsAt: null,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  }
}

export function makeSuggestion(
  overrides: Partial<AdminCohortSuggestion> = {},
): AdminCohortSuggestion {
  return { startsAt: '2026-07-06T13:00:00.000Z', title: 'July 2026 Cohort', ...overrides }
}

export function makeLive(overrides: Partial<AdminLive> = {}): AdminLive {
  return {
    id: 'lv-1',
    programId: 'p-1',
    title: 'June Live',
    description: null,
    scheduledAt: '2026-06-20T17:00:00.000Z',
    youtubeUrl: null,
    replayStreamVideoId: null,
    replayStatus: 'none',
    cancelledAt: null,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  }
}

export function makeTemplateSchema(
  overrides: Partial<AdminTemplateSchema> = {},
): AdminTemplateSchema {
  return {
    chapters: [
      {
        id: 'ch-seeing',
        title: 'Seeing Clearly',
        pages: [
          {
            id: 'pg-where-you-are',
            title: 'Where You Are',
            instruction: 'Start with what is true right now.',
            fields: [
              {
                id: 'one-true-thing',
                label: 'One true thing',
                kind: 'long_text',
                required: true,
                exampleAnswer: 'I keep postponing the move.',
              },
              {
                id: 'life-area',
                label: 'Life area',
                kind: 'select',
                required: false,
                options: ['Career', 'Family', 'Health'],
              },
            ],
          },
        ],
      },
    ],
    ...overrides,
  }
}

export function makeTemplate(overrides: Partial<AdminTemplate> = {}): AdminTemplate {
  return {
    id: 't-1',
    programId: 'p-1',
    slug: 'starter-notebook',
    title: 'Starter Notebook',
    sortOrder: 0,
    version: 1,
    schema: makeTemplateSchema(),
    status: 'draft',
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  }
}

// ─── Distribution (Project 7) ───

export function makeRun(overrides: Partial<DistributionRun> = {}): DistributionRun {
  return {
    id: 'run-1',
    inputVideoUrl: 'pipeline/abc/episode.mp4',
    inputVideoSize: null,
    durationSeconds: null,
    category: null,
    status: 'selected',
    stepFailedAt: null,
    errorMessage: null,
    transcript: null,
    config: { flow: 'short' },
    stepTimings: null,
    clipsGenerated: 0,
    clipsApproved: 0,
    clipsPosted: 0,
    clipsFailed: 0,
    startedAt: NOW,
    completedAt: null,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  } as DistributionRun
}

export function makeClip(overrides: Partial<DistributionClip> = {}): DistributionClip {
  return {
    id: 'clip-1',
    pipelineRunId: 'run-1',
    sourceTimestampStart: 0,
    sourceTimestampEnd: 30,
    duration: 30,
    score: 8,
    suggestedTitle: 'The hook',
    transcriptSnippet: 'A line worth clipping.',
    storageUrl: null,
    approved: false,
    cutStatus: 'pending',
    platformFit: ['tiktok'],
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  } as DistributionClip
}

export function makePost(overrides: Partial<DistributionPost> = {}): DistributionPost {
  return {
    id: 'post-1',
    clipId: 'clip-1',
    platformAccountId: 'acct-1',
    platformName: 'tiktok',
    uploadPostId: null,
    uploadPostResponse: null,
    description: 'caption',
    hashtags: ['#decision'],
    cta: null,
    profileSlug: null,
    status: 'scheduled',
    scheduledAt: null,
    postedAt: null,
    failureReason: null,
    retryCount: 0,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  } as DistributionPost
}

export function makeRunDetail(
  overrides: Partial<DistributionRunDetail> = {},
): DistributionRunDetail {
  return {
    run: makeRun(),
    clips: [],
    posts: [],
    ...overrides,
  } as DistributionRunDetail
}

export function makeMaterial(overrides: Partial<AdminMaterial> = {}): AdminMaterial {
  return {
    id: 'mt-1',
    title: 'Workbook',
    description: null,
    fileKey: 'materials/uuid/workbook.pdf',
    fileSizeBytes: 1024,
    mimeType: 'application/pdf',
    lessonId: null,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  }
}
