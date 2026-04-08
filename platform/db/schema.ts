import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

// ─── Users ───
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  role: text('role', { enum: ['free', 'pro', 'admin'] })
    .notNull()
    .default('free'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// ─── Sessions (Better Auth) ───
export const sessions = pgTable('sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// ─── Accounts (Better Auth) ───
export const accounts = pgTable('accounts', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// ─── Verification (Better Auth) ───
export const verifications = pgTable('verifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// ─── Purchases (legacy — kept for migration reference) ───
export const purchases = pgTable('purchases', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  email: text('email').notNull(),
  stripeCustomerId: text('stripe_customer_id').notNull(),
  stripeSessionId: text('stripe_session_id').notNull().unique(),
  status: text('status', { enum: ['active', 'refunded', 'revoked'] })
    .notNull()
    .default('active'),
  amountCents: integer('amount_cents').notNull(),
  purchasedAt: timestamp('purchased_at').notNull().defaultNow(),
})

// ─── Subscriptions (PRD: recurring Stripe billing) ───
export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  stripeCustomerId: text('stripe_customer_id').notNull(),
  stripeSubscriptionId: text('stripe_subscription_id').notNull().unique(),
  status: text('status', { enum: ['active', 'past_due', 'cancelled', 'trialing'] })
    .notNull()
    .default('active'),
  currentPeriodEnd: timestamp('current_period_end').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// ─── Course Progress (PRD: string-based class/course IDs) ───
export const courseProgress = pgTable(
  'course_progress',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    classId: text('class_id').notNull(),
    courseId: text('course_id').notNull(),
    completedAt: timestamp('completed_at').notNull().defaultNow(),
  },
  (table) => [uniqueIndex('course_progress_user_class_idx').on(table.userId, table.classId)],
)

// ─── Onboarding Sessions (PRD: anonymous pre-account data) ───
export const onboardingSessions = pgTable('onboarding_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  sessionData: jsonb('session_data').$type<{
    throughlineQ1?: string
    throughlineQ2?: string
    throughlineQ3?: string
    throughlineNamed?: string
    email?: string
  }>(),
  currentStep: integer('current_step').notNull().default(1),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  expiresAt: timestamp('expires_at').notNull(),
})

// ─── Onboarding Profiles (PRD: throughline + ICP intelligence) ───
export const onboardingProfiles = pgTable('onboarding_profiles', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' })
    .unique(),
  throughlineQ1: text('throughline_q1'),
  throughlineQ2: text('throughline_q2'),
  throughlineQ3: text('throughline_q3'),
  throughlineNamed: text('throughline_named'),
  ageRange: text('age_range'),
  lifeAreas: text('life_areas').array(),
  triedBefore: text('tried_before').array(),
  timeStuck: text('time_stuck'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// ─── Wins (PRD: Wins Board social proof) ───
export const wins = pgTable('wins', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  lifeArea: text('life_area', { enum: ['health', 'relationships', 'career', 'money'] }).notNull(),
  description: text('description').notNull(),
  isSeed: boolean('is_seed').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

// ─── Bookmarks (PRD: class bookmarking) ───
export const bookmarks = pgTable(
  'bookmarks',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    classId: text('class_id').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [uniqueIndex('bookmarks_user_class_idx').on(table.userId, table.classId)],
)

// ═══════════════════════════════════════════════════════════
// BD Pipeline Tables (Business Decisions Phase 1)
// ═══════════════════════════════════════════════════════════

// ─── Platform Accounts (BD: social media account configuration) ───
export const platformAccounts = pgTable('platform_accounts', {
  id: uuid('id').defaultRandom().primaryKey(),
  platform: text('platform', {
    enum: [
      'tiktok',
      'instagram',
      'facebook',
      'x',
      'youtube',
      'threads',
      'linkedin',
      'pinterest',
      'reddit',
      'bluesky',
    ],
  }).notNull(),
  accountHandle: text('account_handle').notNull(),
  accountType: text('account_type', { enum: ['brand', 'personal'] }).notNull(),
  uploadPostProfileId: text('upload_post_profile_id'),
  postingSchedule: jsonb('posting_schedule').$type<{ times: string[] }>(),
  charLimit: integer('char_limit'),
  hashtagLimit: integer('hashtag_limit'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// ─── Pipeline Runs (BD: episode processing state machine) ───
export const pipelineRuns = pgTable(
  'pipeline_runs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    inputVideoUrl: text('input_video_url').notNull(),
    inputVideoSize: integer('input_video_size'),
    durationSeconds: integer('duration_seconds'),
    category: text('category'),
    status: text('status', {
      enum: [
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
        'failed',
      ],
    })
      .notNull()
      .default('queued'),
    stepFailedAt: text('step_failed_at'),
    errorMessage: text('error_message'),
    transcript: text('transcript'),
    config: jsonb('config').$type<{
      dryRun?: boolean
      autoApproveClips?: boolean
      autoApproveMetadata?: boolean
      maxClipsPerEpisode?: number
      clipScoreThreshold?: number
      targetPlatforms?: string[]
      schedulingMode?: 'immediate' | 'scheduled'
    }>(),
    stepTimings: jsonb('step_timings').$type<
      Record<string, { startedAt: string; completedAt?: string; durationMs?: number }>
    >(),
    clipsGenerated: integer('clips_generated').notNull().default(0),
    clipsApproved: integer('clips_approved').notNull().default(0),
    clipsPosted: integer('clips_posted').notNull().default(0),
    clipsFailed: integer('clips_failed').notNull().default(0),
    startedAt: timestamp('started_at'),
    completedAt: timestamp('completed_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('idx_runs_status').on(table.status),
    index('idx_runs_created').on(table.createdAt),
  ],
)

// ─── Clips (BD: individual video clips extracted from episodes) ───
export const clips = pgTable(
  'clips',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    pipelineRunId: uuid('pipeline_run_id')
      .notNull()
      .references(() => pipelineRuns.id, { onDelete: 'cascade' }),
    sourceTimestampStart: integer('source_timestamp_start').notNull(),
    sourceTimestampEnd: integer('source_timestamp_end').notNull(),
    duration: integer('duration').notNull(),
    score: integer('score'),
    suggestedTitle: text('suggested_title'),
    transcriptSnippet: text('transcript_snippet'),
    storageUrl: text('storage_url'),
    approved: boolean('approved').notNull().default(false),
    cutStatus: text('cut_status', { enum: ['pending', 'cutting', 'cut', 'failed'] })
      .notNull()
      .default('pending'),
    platformFit: text('platform_fit').array(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('idx_clips_pipeline_run').on(table.pipelineRunId),
    index('idx_clips_approved').on(table.pipelineRunId, table.approved),
  ],
)

// ─── Posts (BD: individual social media posts per clip per account) ───
export const posts = pgTable(
  'posts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    clipId: uuid('clip_id')
      .notNull()
      .references(() => clips.id, { onDelete: 'cascade' }),
    platformAccountId: uuid('platform_account_id')
      .notNull()
      .references(() => platformAccounts.id),
    platformName: text('platform_name'),
    uploadPostId: text('upload_post_id'),
    uploadPostResponse: jsonb('upload_post_response'),
    description: text('description'),
    hashtags: text('hashtags').array(),
    cta: text('cta'),
    status: text('status', { enum: ['scheduled', 'posted', 'failed', 'retrying', 'deleted'] })
      .notNull()
      .default('scheduled'),
    scheduledAt: timestamp('scheduled_at'),
    postedAt: timestamp('posted_at'),
    failureReason: text('failure_reason'),
    retryCount: integer('retry_count').notNull().default(0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('idx_posts_clip_account').on(table.clipId, table.platformAccountId),
    index('idx_posts_clip').on(table.clipId),
    index('idx_posts_status').on(table.status),
  ],
)

// ─── Post Analytics (BD: engagement metric snapshots, immutable) ───
export const postAnalytics = pgTable(
  'post_analytics',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    postId: uuid('post_id')
      .notNull()
      .references(() => posts.id, { onDelete: 'cascade' }),
    snapshotAt: timestamp('snapshot_at').notNull().defaultNow(),
    views: integer('views').notNull().default(0),
    likes: integer('likes').notNull().default(0),
    comments: integer('comments').notNull().default(0),
    shares: integer('shares').notNull().default(0),
    saves: integer('saves').notNull().default(0),
    impressions: integer('impressions').notNull().default(0),
    reach: integer('reach').notNull().default(0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('idx_analytics_post').on(table.postId),
    index('idx_analytics_snapshot').on(table.snapshotAt),
  ],
)

// ─── Insights (BD: AI-generated actionable recommendations) ───
export const insights = pgTable('insights', {
  id: uuid('id').defaultRandom().primaryKey(),
  dateRangeStart: timestamp('date_range_start').notNull(),
  dateRangeEnd: timestamp('date_range_end').notNull(),
  recommendation: text('recommendation').notNull(),
  supportingData: jsonb('supporting_data'),
  actedOn: boolean('acted_on').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})
