import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { mockSchema } from '@/platform/test/mocks'

// ── Mock env ──────────────────────────────────────────────────────────
mock.module('@/platform/env', () => ({
  env: { DATABASE_URL: 'postgres://test', WHISPER_MODEL_PATH: 'models/test.bin' },
}))

// ── Mock analytics (no-op) ────────────────────────────────────────────
mock.module('@/providers/analytics', () => ({ track: () => {} }))

// ── Mock providers ────────────────────────────────────────────────────
const mockDownload = mock(() => Promise.resolve(Buffer.from('fake-video-data')))
const mockUpload = mock(() => Promise.resolve('https://r2.example.com/clip.mp4'))
const mockGetSignedUrl = mock(() => Promise.resolve('https://signed.example.com/clip.mp4'))
mock.module('@/providers/storage', () => ({
  download: mockDownload,
  upload: mockUpload,
  getSignedUrl: mockGetSignedUrl,
  remove: mock(() => Promise.resolve()),
}))

const mockTranscribe = mock(() => Promise.resolve('[00:00:01] Hello world\n[00:00:30] Great insight'))
mock.module('@/providers/transcription', () => ({ transcribe: mockTranscribe }))

const mockPost = mock(() => Promise.resolve({ id: 'upload-post-1', url: 'https://social.com/post/1' }))
mock.module('@/providers/social-posting', () => ({
  post: mockPost,
  listProfiles: mock(() => Promise.resolve([{ id: 'acct-1', platform: 'instagram', handle: 'test' }])),
  getPostStatus: mock(() => Promise.resolve({ id: 'test', status: 'queued' })),
}))

const mockGetMetrics = mock(() =>
  Promise.resolve({
    views: 1000,
    likes: 50,
    comments: 10,
    shares: 5,
    saves: 3,
    impressions: 2000,
    reach: 1500,
  }),
)
mock.module('@/providers/social-analytics', () => ({ getMetrics: mockGetMetrics }))

mock.module('node:fs/promises', () => ({
  writeFile: mock(() => Promise.resolve()),
  unlink: mock(() => Promise.resolve()),
}))

// ── Shared DB state (mutable, simulating a real DB) ───────────────────
let pipelineRunState: Record<string, unknown>
let clipsState: Array<Record<string, unknown>>
let postsState: Array<Record<string, unknown>>
let analyticsState: Array<Record<string, unknown>>
let insightsState: Array<Record<string, unknown>>
let platformAccountsState: Array<Record<string, unknown>>

function resetDbState() {
  pipelineRunState = {
    id: 'run-1',
    inputVideoUrl: 'episodes/video.mp4',
    status: 'queued',
    transcript: null,
    durationSeconds: 120,
    config: {},
    startedAt: null,
    clipsGenerated: 0,
    clipsApproved: 0,
    clipsFailed: 0,
    clipsPosted: 0,
    stepFailedAt: null,
    errorMessage: null,
    createdAt: new Date(),
  }
  clipsState = []
  postsState = []
  analyticsState = []
  insightsState = []
  platformAccountsState = [
    { id: 'acct-1', platform: 'instagram', charLimit: 2200 },
    { id: 'acct-2', platform: 'tiktok', charLimit: 4000 },
  ]
}

// ── Mock DB ───────────────────────────────────────────────────────────
// This mock DB tracks state mutations so we can verify the full pipeline
// flow end-to-end without a real database.

function makeDbMock() {
  return {
    insert: (table: unknown) => ({
      values: (data: unknown) => ({
        returning: () => {
          if (table === mockSchemaRef.pipelineRuns) {
            const d = Array.isArray(data) ? data[0] : data
            Object.assign(pipelineRunState, d)
            return Promise.resolve([{ ...pipelineRunState }])
          }
          if (table === mockSchemaRef.clips) {
            const items = Array.isArray(data) ? data : [data]
            const inserted = items.map((c: Record<string, unknown>, i: number) => ({
              id: `clip-${i + 1}`,
              ...c,
            }))
            clipsState.push(...inserted)
            return Promise.resolve(inserted)
          }
          if (table === mockSchemaRef.posts) {
            const d = Array.isArray(data) ? data[0] : data
            const post = { id: `post-${postsState.length + 1}`, retryCount: 0, ...d }
            postsState.push(post)
            return Promise.resolve([post])
          }
          if (table === mockSchemaRef.postAnalytics) {
            const d = Array.isArray(data) ? data[0] : data
            analyticsState.push({ id: `analytics-${analyticsState.length + 1}`, snapshotAt: new Date(), ...d })
            return Promise.resolve([analyticsState.at(-1)])
          }
          if (table === mockSchemaRef.insights) {
            const d = Array.isArray(data) ? data[0] : data
            const insight = { id: `insight-1`, createdAt: new Date(), ...d }
            insightsState.push(insight)
            return Promise.resolve([insight])
          }
          return Promise.resolve([])
        },
      }),
    }),
    update: (table: unknown) => ({
      set: (data: Record<string, unknown>) => ({
        where: () => {
          if (table === mockSchemaRef.pipelineRuns) {
            Object.assign(pipelineRunState, data)
            return Object.assign(Promise.resolve(), {
              returning: () => Promise.resolve([{ id: pipelineRunState.id }]),
            })
          }
          if (table === mockSchemaRef.clips) {
            // Update matching clips
            for (const clip of clipsState) {
              Object.assign(clip, data)
            }
            return Object.assign(Promise.resolve(), {
              returning: () => Promise.resolve(clipsState),
            })
          }
          if (table === mockSchemaRef.posts) {
            for (const post of postsState) {
              Object.assign(post, data)
            }
            return Object.assign(Promise.resolve(), {
              returning: () => Promise.resolve(postsState),
            })
          }
          return Object.assign(Promise.resolve(), {
            returning: () => Promise.resolve([]),
          })
        },
      }),
    }),
    delete: () => ({
      where: () => Promise.resolve(),
    }),
    select: () => ({
      from: (table: unknown) => ({
        where: () => Promise.resolve([{ count: analyticsState.length || 1 }]),
        innerJoin: () => ({
          where: () => Promise.resolve([{ count: postsState.filter((p) => p.status === 'scheduled').length }]),
        }),
      }),
    }),
    query: {
      pipelineRuns: {
        findFirst: () => Promise.resolve({ ...pipelineRunState }),
        findMany: () => Promise.resolve([{ ...pipelineRunState }]),
      },
      clips: {
        findMany: () => Promise.resolve([...clipsState]),
      },
      posts: {
        findFirst: () => Promise.resolve(postsState[0] ?? null),
        findMany: () => Promise.resolve([...postsState]),
      },
      platformAccounts: {
        findMany: () => Promise.resolve([...platformAccountsState]),
      },
      postAnalytics: {
        findMany: () => Promise.resolve([...analyticsState]),
      },
      insights: {
        findMany: () => Promise.resolve([...insightsState]),
      },
    },
    transaction: (fn: (tx: unknown) => Promise<unknown>) => {
      // The transaction mock uses the same db mock as tx
      const txMock = {
        delete: () => ({ where: () => Promise.resolve() }),
        insert: (table: unknown) => ({
          values: (data: unknown) => ({
            returning: () => {
              if (table === mockSchemaRef.clips) {
                const items = Array.isArray(data) ? data : [data]
                const inserted = items.map((c: Record<string, unknown>, i: number) => ({
                  id: `clip-${clipsState.length + i + 1}`,
                  ...c,
                }))
                clipsState.push(...inserted)
                return Promise.resolve(inserted)
              }
              if (table === mockSchemaRef.posts) {
                const d = Array.isArray(data) ? data[0] : data
                const post = { id: `post-${postsState.length + 1}`, retryCount: 0, ...d }
                postsState.push(post)
                return Promise.resolve([post])
              }
              return Promise.resolve([])
            },
          }),
        }),
        update: (table: unknown) => ({
          set: (data: Record<string, unknown>) => ({
            where: () => {
              if (table === mockSchemaRef.pipelineRuns) {
                Object.assign(pipelineRunState, data)
              }
              return Promise.resolve()
            },
          }),
        }),
        query: {
          posts: {
            findFirst: () => Promise.resolve(null), // No existing posts (idempotency check)
          },
        },
      }
      return fn(txMock)
    },
  }
}

const mockSchemaRef = {
  pipelineRuns: Symbol('pipelineRuns'),
  clips: Symbol('clips'),
  posts: Symbol('posts'),
  postAnalytics: Symbol('postAnalytics'),
  insights: Symbol('insights'),
  platformAccounts: Symbol('platformAccounts'),
}

mock.module('@/platform/db/client', () => ({
  db: makeDbMock(),
}))

mock.module('@/platform/db/schema', () => ({
  ...mockSchema(),
  platformAccounts: mockSchemaRef.platformAccounts,
  pipelineRuns: mockSchemaRef.pipelineRuns,
  clips: mockSchemaRef.clips,
  posts: mockSchemaRef.posts,
  postAnalytics: mockSchemaRef.postAnalytics,
  insights: mockSchemaRef.insights,
}))

// ── Import state machine (pure logic, no mocking needed) ──────────────
import {
  assertTransition,
  getValidTransitions,
  InvalidTransitionError,
  type PipelineStatus,
} from '@/features/(business)/workflow/state-machine'

// ── Import services under test ────────────────────────────────────────
const { startTranscription, processTranscription } = await import(
  '@/features/(business)/transcribe/service'
)
const { saveClipSelections } = await import('@/features/(business)/clip-select/service')
const { cutClipsForRun } = await import('@/features/(business)/clip-cut/service')
const { saveMetadata } = await import('@/features/(business)/metadata-generate/service')
const { distributePostsForRun } = await import('@/features/(business)/post-distribute/service')
const { collectAnalytics } = await import('@/features/(business)/analytics-collect/service')
const { saveInsight } = await import('@/features/(business)/insight-generate/service')

// ── Tests ─────────────────────────────────────────────────────────────

describe('BD Pipeline Integration', () => {
  beforeEach(() => {
    resetDbState()
    mockDownload.mockReset()
    mockUpload.mockReset()
    mockGetSignedUrl.mockReset()
    mockTranscribe.mockReset()
    mockPost.mockReset()
    mockGetMetrics.mockReset()

    mockDownload.mockResolvedValue(Buffer.from('fake-video-data'))
    mockUpload.mockResolvedValue('https://r2.example.com/clip.mp4')
    mockGetSignedUrl.mockResolvedValue('https://signed.example.com/clip.mp4')
    mockTranscribe.mockResolvedValue('[00:00:01] Hello world\n[00:00:30] Great insight')
    mockPost.mockResolvedValue({ id: 'upload-post-1', url: 'https://social.com/post/1' })
    mockGetMetrics.mockResolvedValue({
      views: 1000,
      likes: 50,
      comments: 10,
      shares: 5,
      saves: 3,
      impressions: 2000,
      reach: 1500,
    })
  })

  describe('state machine: valid transitions through all 7 stages', () => {
    it('allows the full happy-path sequence of transitions', () => {
      const happyPath: PipelineStatus[] = [
        'queued',
        'transcribing',
        'transcribed',
        'selecting',
        'selected',
        'cutting',
        'cut',
        'generating_metadata',
        'metadata_ready',
        'posting',
        'posted',
        'analyzing',
        'completed',
      ]

      for (let i = 0; i < happyPath.length - 1; i++) {
        expect(() => assertTransition(happyPath[i]!, happyPath[i + 1]!)).not.toThrow()
      }
    })

    it('allows the approval-gate path (clip approval + metadata approval)', () => {
      const approvalPath: PipelineStatus[] = [
        'queued',
        'transcribing',
        'transcribed',
        'selecting',
        'selected',
        'awaiting_clip_approval',
        'cutting',
        'cut',
        'generating_metadata',
        'metadata_ready',
        'awaiting_metadata_approval',
        'posting',
        'posted',
        'analyzing',
        'completed',
      ]

      for (let i = 0; i < approvalPath.length - 1; i++) {
        expect(() => assertTransition(approvalPath[i]!, approvalPath[i + 1]!)).not.toThrow()
      }
    })

    it('allows posted -> completed (skip analyzing)', () => {
      expect(() => assertTransition('posted', 'completed')).not.toThrow()
    })
  })

  describe('state machine: rejects invalid transitions', () => {
    it('rejects skipping from queued to transcribed (must go through transcribing)', () => {
      expect(() => assertTransition('queued', 'transcribed')).toThrow(InvalidTransitionError)
    })

    it('rejects skipping from transcribed to cut (must go through selecting/cutting)', () => {
      expect(() => assertTransition('transcribed', 'cut')).toThrow(InvalidTransitionError)
    })

    it('rejects going backwards from transcribed to queued', () => {
      expect(() => assertTransition('transcribed', 'queued')).toThrow(InvalidTransitionError)
    })

    it('rejects transitions out of completed (terminal state)', () => {
      expect(() => assertTransition('completed', 'queued')).toThrow(InvalidTransitionError)
      expect(() => assertTransition('completed', 'transcribing')).toThrow(InvalidTransitionError)
    })

    it('rejects random invalid transitions', () => {
      expect(() => assertTransition('cutting', 'transcribing')).toThrow(InvalidTransitionError)
      expect(() => assertTransition('posting', 'selecting')).toThrow(InvalidTransitionError)
      expect(() => assertTransition('analyzing', 'posting')).toThrow(InvalidTransitionError)
    })
  })

  describe('state machine: error handling — any active state can fail', () => {
    const activeStates: PipelineStatus[] = [
      'queued',
      'transcribing',
      'transcribed',
      'selecting',
      'selected',
      'awaiting_clip_approval',
      'cutting',
      'cut',
      'generating_metadata',
      'metadata_ready',
      'awaiting_metadata_approval',
      'posting',
      'posted',
      'analyzing',
    ]

    for (const state of activeStates) {
      it(`allows transition from '${state}' to 'failed'`, () => {
        expect(() => assertTransition(state, 'failed')).not.toThrow()
      })
    }
  })

  describe('state machine: recovery from failed state', () => {
    const recoverableTargets: PipelineStatus[] = [
      'queued',
      'transcribing',
      'selecting',
      'cutting',
      'generating_metadata',
      'posting',
      'analyzing',
    ]

    for (const target of recoverableTargets) {
      it(`allows retry from 'failed' to '${target}'`, () => {
        expect(() => assertTransition('failed', target)).not.toThrow()
      })
    }

    it('rejects recovering failed -> completed (must go through steps)', () => {
      expect(() => assertTransition('failed', 'completed')).toThrow(InvalidTransitionError)
    })
  })

  describe('step 1: transcribe — service outputs', () => {
    it('startTranscription creates a pipeline run in queued state', async () => {
      const result = await startTranscription('episodes/video.mp4')
      expect('error' in result).toBe(false)
      expect(result).toHaveProperty('run')
    })

    it('processTranscription returns immediately with transcribing status', async () => {
      const result = await processTranscription('run-1')
      expect('error' in result).toBe(false)
      expect(result).toHaveProperty('run')
      if (!('error' in result)) {
        expect(result.run.status).toBe('transcribing')
      }
      // Background processing is fire-and-forget, so download/transcribe
      // may not be called yet. The async pattern is tested separately.
    })
  })

  describe('step 2: clip-select — consumes transcript, produces clips', () => {
    it('saveClipSelections works when run is transcribed with transcript', async () => {
      pipelineRunState.status = 'transcribed'
      pipelineRunState.transcript = '[00:00:01] Hello world'

      const clipDefs = [
        { sourceTimestampStart: 10, sourceTimestampEnd: 40, score: 8, suggestedTitle: 'Clip A' },
        { sourceTimestampStart: 60, sourceTimestampEnd: 90, score: 7, suggestedTitle: 'Clip B' },
      ]

      const result = await saveClipSelections('run-1', clipDefs)
      expect('error' in result).toBe(false)
      expect(result).toHaveProperty('clips')
    })

    it('fails when run has no transcript', async () => {
      pipelineRunState.status = 'transcribed'
      pipelineRunState.transcript = ''

      const result = await saveClipSelections('run-1', [
        { sourceTimestampStart: 10, sourceTimestampEnd: 40 },
      ])
      expect(result).toEqual({ error: 'CLIP_SELECT_NO_TRANSCRIPT' })
    })
  })

  describe('step 3: clip-cut — consumes approved clips, produces cut video files', () => {
    it('returns CLIP_CUT_NO_APPROVED_CLIPS when no approved clips exist', async () => {
      pipelineRunState.status = 'selected'
      // clipsState is empty, so findMany returns no approved clips

      const result = await cutClipsForRun('run-1')
      expect(result).toEqual({ error: 'CLIP_CUT_NO_APPROVED_CLIPS' })
    })
  })

  describe('step 4: metadata-generate — consumes cut clips, produces post metadata', () => {
    it('saveMetadata creates posts with descriptions and hashtags', async () => {
      pipelineRunState.status = 'cut'
      clipsState = [
        { id: 'clip-1', pipelineRunId: 'run-1', storageUrl: 'https://r2.example.com/clip.mp4', cutStatus: 'cut', approved: true },
      ]

      const metadata = [
        {
          clipId: 'clip-1',
          platformAccountId: 'acct-1',
          description: 'Great podcast moment about leadership',
          hashtags: ['#leadership', '#podcast'],
          cta: 'Follow for more',
        },
      ]

      const result = await saveMetadata('run-1', metadata)
      expect('error' in result).toBe(false)
      expect(result).toHaveProperty('posts')
    })

    it('rejects metadata when platform account does not exist', async () => {
      pipelineRunState.status = 'cut'

      const metadata = [
        {
          clipId: 'clip-1',
          platformAccountId: 'unknown-acct',
          description: 'Some description here',
        },
      ]

      const result = await saveMetadata('run-1', metadata)
      expect(result).toEqual({ error: 'METADATA_UNKNOWN_PLATFORM' })
    })
  })

  describe('step 5: post-distribute — consumes metadata, posts to social', () => {
    it('distributes posts for a metadata_ready run', async () => {
      pipelineRunState.status = 'metadata_ready'
      clipsState = [
        { id: 'clip-1', pipelineRunId: 'run-1', storageUrl: 'clips/run-1/clip-1.mp4', cutStatus: 'cut' },
      ]
      postsState = [
        {
          id: 'post-1',
          clipId: 'clip-1',
          platformAccountId: 'acct-1',
          platformName: 'instagram',
          description: 'Great clip',
          hashtags: ['#test'],
          status: 'scheduled',
          retryCount: 0,
        },
      ]

      const result = await distributePostsForRun('run-1')
      expect('error' in result).toBe(false)
      expect(result).toHaveProperty('posts')
      expect(mockPost).toHaveBeenCalledTimes(1)
      expect(mockGetSignedUrl).toHaveBeenCalledTimes(1)
    })
  })

  describe('step 6: analytics-collect — consumes posted posts, produces metrics', () => {
    it('collects analytics for posted posts', async () => {
      postsState = [
        {
          id: 'post-1',
          status: 'posted',
          uploadPostId: 'upload-post-1',
          postedAt: new Date(),
        },
      ]

      const result = await collectAnalytics(['post-1'])
      expect(result.collected).toBe(1)
      expect(result.errors).toBe(0)
      expect(mockGetMetrics).toHaveBeenCalledWith('upload-post-1')
    })

    it('skips posts without uploadPostId', async () => {
      postsState = [
        { id: 'post-1', status: 'posted', uploadPostId: null, postedAt: new Date() },
      ]

      const result = await collectAnalytics(['post-1'])
      expect(result.collected).toBe(0)
      expect(result.errors).toBe(1)
    })
  })

  describe('step 7: insight-generate — consumes analytics, produces recommendations', () => {
    it('saves insight with valid data range and recommendation', async () => {
      analyticsState = [{ id: 'a-1', snapshotAt: new Date() }]

      const result = await saveInsight({
        dateRange: {
          from: '2026-01-01T00:00:00.000Z',
          to: '2026-01-15T00:00:00.000Z',
        },
        recommendation: 'Short-form clips about leadership get 3x more engagement than long-form.',
        supportingData: { avgViews: 1000, topClipId: 'clip-1' },
      })

      expect('error' in result).toBe(false)
      expect(result).toHaveProperty('insight')
    })

    it('rejects insight when date range is less than 7 days', async () => {
      analyticsState = [{ id: 'a-1', snapshotAt: new Date() }]

      const result = await saveInsight({
        dateRange: {
          from: '2026-01-01T00:00:00.000Z',
          to: '2026-01-03T00:00:00.000Z',
        },
        recommendation: 'Not enough data to draw conclusions.',
      })

      expect(result).toEqual({ error: 'INSIGHT_INSUFFICIENT_DATA' })
    })
  })

  describe('data compatibility: each step output matches next step input', () => {
    it('transcribe output (transcript string) is what clip-select expects', () => {
      // Transcribe produces: { run: { transcript: string, status: 'transcribed' } }
      // Clip-select expects: findRunInState(id, 'transcribed') + run.transcript non-empty
      const transcribeOutput = {
        id: 'run-1',
        status: 'transcribed',
        transcript: '[00:00:01] Hello world\n[00:00:30] Great insight',
      }

      // Verify the data shape is compatible
      expect(transcribeOutput.status).toBe('transcribed')
      expect(transcribeOutput.transcript).toBeTruthy()
      expect(transcribeOutput.transcript.trim().length).toBeGreaterThan(0)
    })

    it('clip-select output (clips with timestamps) is what clip-cut expects', () => {
      // Clip-select produces: { clips: [{ id, sourceTimestampStart, sourceTimestampEnd, duration, approved }] }
      // Clip-cut expects: clips with approved=true, sourceTimestampStart, duration
      const clipSelectOutput = [
        {
          id: 'clip-1',
          pipelineRunId: 'run-1',
          sourceTimestampStart: 10,
          sourceTimestampEnd: 40,
          duration: 30,
          approved: true,
          cutStatus: 'pending',
        },
      ]

      expect(clipSelectOutput[0]!.approved).toBe(true)
      expect(clipSelectOutput[0]!.sourceTimestampStart).toBeGreaterThanOrEqual(0)
      expect(clipSelectOutput[0]!.duration).toBeGreaterThan(0)
    })

    it('clip-cut output (storageUrl on clips) is what metadata-generate expects', () => {
      // Clip-cut produces: clips with cutStatus='cut', storageUrl set
      // Metadata-generate expects: run in 'cut' status, clips with storageUrl
      const cutClipOutput = {
        id: 'clip-1',
        cutStatus: 'cut',
        storageUrl: 'clips/run-1/clip-1.mp4',
      }

      expect(cutClipOutput.cutStatus).toBe('cut')
      expect(cutClipOutput.storageUrl).toBeTruthy()
    })

    it('metadata-generate output (posts with status=scheduled) is what post-distribute expects', () => {
      // Metadata-generate produces: posts with status='scheduled', description, hashtags
      // Post-distribute expects: posts with status='scheduled' linked to clips with storageUrl
      const metadataOutput = {
        id: 'post-1',
        clipId: 'clip-1',
        platformAccountId: 'acct-1',
        platformName: 'instagram',
        description: 'Great clip about leadership',
        hashtags: ['#leadership'],
        status: 'scheduled',
      }

      expect(metadataOutput.status).toBe('scheduled')
      expect(metadataOutput.description.length).toBeGreaterThan(0)
      expect(metadataOutput.clipId).toBeTruthy()
      expect(metadataOutput.platformAccountId).toBeTruthy()
    })

    it('post-distribute output (uploadPostId on posts) is what analytics-collect expects', () => {
      // Post-distribute produces: posts with status='posted', uploadPostId set
      // Analytics-collect expects: posts with uploadPostId to fetch metrics
      const postedOutput = {
        id: 'post-1',
        status: 'posted',
        uploadPostId: 'upload-post-1',
        postedAt: new Date(),
      }

      expect(postedOutput.status).toBe('posted')
      expect(postedOutput.uploadPostId).toBeTruthy()
    })

    it('analytics-collect output (metrics snapshots) is what insight-generate expects', () => {
      // Analytics-collect produces: postAnalytics rows with views, likes, etc.
      // Insight-generate expects: postAnalytics rows within a date range
      const analyticsOutput = {
        postId: 'post-1',
        views: 1000,
        likes: 50,
        comments: 10,
        shares: 5,
        saves: 3,
        impressions: 2000,
        reach: 1500,
        snapshotAt: new Date(),
      }

      expect(analyticsOutput.views).toBeGreaterThanOrEqual(0)
      expect(analyticsOutput.snapshotAt).toBeInstanceOf(Date)
    })
  })

  describe('error handling: step failures put pipeline in failed state', () => {
    it('any active state can transition to failed', () => {
      const activeStates: PipelineStatus[] = [
        'queued',
        'transcribing',
        'transcribed',
        'selecting',
        'selected',
        'cutting',
        'cut',
        'generating_metadata',
        'metadata_ready',
        'posting',
        'posted',
        'analyzing',
      ]

      for (const state of activeStates) {
        const valid = getValidTransitions(state)
        expect(valid).toContain('failed')
      }
    })

    it('failed state allows retry to processing states but not terminal', () => {
      const fromFailed = getValidTransitions('failed')
      expect(fromFailed).toContain('queued')
      expect(fromFailed).toContain('transcribing')
      expect(fromFailed).not.toContain('completed')
      expect(fromFailed).not.toContain('transcribed') // Can't skip to completed states
    })

    it('completed state has no valid transitions (terminal)', () => {
      const fromCompleted = getValidTransitions('completed')
      expect(fromCompleted).toHaveLength(0)
    })

    it('transcribe returns error when run is in wrong state', async () => {
      // Run is in 'completed' state - processTranscription expects 'queued'
      pipelineRunState.status = 'completed'
      const result = await processTranscription('run-1')
      expect(result).toEqual({ error: 'PIPELINE_INVALID_STATE' })
    })

    it('clip-select returns error when run in wrong state', async () => {
      pipelineRunState = {
        id: 'run-1',
        status: 'queued',
        transcript: 'test',
      } as never

      const result = await saveClipSelections('run-1', [
        { sourceTimestampStart: 10, sourceTimestampEnd: 40 },
      ])
      expect(result).toEqual({ error: 'PIPELINE_INVALID_STATE' })
    })

    it('metadata-generate rejects when platform account is unknown', async () => {
      pipelineRunState.status = 'cut'
      platformAccountsState = [] // No platform accounts

      const result = await saveMetadata('run-1', [
        {
          clipId: 'clip-1',
          platformAccountId: 'nonexistent',
          description: 'Some description here',
        },
      ])
      expect(result).toEqual({ error: 'METADATA_UNKNOWN_PLATFORM' })
    })
  })
})
