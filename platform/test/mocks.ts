/**
 * Shared mock factories for ALL test files.
 * Prevents schema mock duplication across feature tests.
 */

/** Full schema mock — prevents Bun mock.module leakage between test files.
 * Every table must be present even if empty, otherwise other test files
 * in the same Bun process get partial schema imports. */
export function mockSchema() {
  return {
    users: { id: 'id', email: 'email', role: 'role' },
    sessions: { id: 'id', userId: 'user_id', token: 'token' },
    accounts: {},
    verifications: {},
    purchases: {},
    subscriptions: {
      id: 'id',
      userId: 'user_id',
      stripeCustomerId: 'stripe_customer_id',
      stripeSubscriptionId: 'stripe_subscription_id',
      status: 'status',
    },
    courseProgress: { userId: 'user_id', classId: 'class_id', courseId: 'course_id' },
    onboardingSessions: { id: 'id', currentStep: 'current_step' },
    onboardingProfiles: { id: 'id', userId: 'user_id' },
    wins: { id: 'id', userId: 'user_id', lifeArea: 'life_area' },
    bookmarks: { id: 'id', userId: 'user_id', classId: 'class_id' },
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
