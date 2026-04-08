/** Full schema mock — prevents Bun mock.module leakage between test files */
export function mockSchema() {
  return {
    users: {},
    sessions: {},
    accounts: {},
    verifications: {},
    purchases: {},
    subscriptions: {},
    courseProgress: {},
    onboardingSessions: {},
    onboardingProfiles: {},
    wins: {},
    bookmarks: {},
    platformAccounts: { id: 'id', platform: 'platform' },
    pipelineRuns: {
      id: 'id',
      status: 'status',
      createdAt: 'created_at',
      inputVideoUrl: 'input_video_url',
    },
    clips: {
      id: 'id',
      pipelineRunId: 'pipeline_run_id',
      approved: 'approved',
      sourceTimestampStart: 'source_timestamp_start',
    },
    posts: {
      id: 'id',
      status: 'status',
      clipId: 'clip_id',
      platformAccountId: 'platform_account_id',
      postedAt: 'posted_at',
      uploadPostId: 'upload_post_id',
    },
    postAnalytics: { snapshotAt: 'snapshot_at', postId: 'post_id' },
    insights: { createdAt: 'created_at' },
  }
}

/** Promise that also supports .returning() for CAS update mocks */
export function casResult(id = 'run-1') {
  return Object.assign(Promise.resolve(), {
    returning: () => Promise.resolve([{ id }]),
  })
}

/** Basic db.update mock chain with CAS support */
export function mockUpdateWithCas(id = 'run-1') {
  return () => ({ set: () => ({ where: () => casResult(id) }) })
}

/** Transaction mock — wraps a mock tx object through the callback */
export function mockTransaction(tx: Record<string, unknown>) {
  return (fn: (t: typeof tx) => Promise<unknown>) => fn(tx)
}
