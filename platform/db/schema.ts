import { sql } from 'drizzle-orm'
import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'
import { z } from 'zod'

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
  planInterval: text('plan_interval', { enum: ['month', 'year'] })
    .notNull()
    .default('year'),
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
    stepTimings:
      jsonb('step_timings').$type<
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
    profileSlug: text('profile_slug'),
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
    index('idx_posts_profile_slug').on(table.profileSlug),
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

// ─── Webhook Events (idempotency tracking for Stripe webhooks) ───
export const webhookEvents = pgTable('webhook_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  stripeEventId: text('stripe_event_id').notNull().unique(),
  eventType: text('event_type').notNull(),
  processedAt: timestamp('processed_at').notNull().defaultNow(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

// ─── User Decisions (LD: in-class decision block responses) ───
export const userDecisions = pgTable(
  'user_decisions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    classId: text('class_id').notNull(),
    blockId: text('block_id').notNull(),
    courseSlug: text('course_slug').notNull(),
    decisionType: text('decision_type', { enum: ['text', 'choice'] }).notNull(),
    prompt: text('prompt').notNull(),
    response: text('response').notNull(),
    isCustom: boolean('is_custom').notNull().default(false),
    previousContext: jsonb('previous_context').$type<string[]>(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('user_decisions_user_class_block_idx').on(
      table.userId,
      table.classId,
      table.blockId,
    ),
    index('user_decisions_user_created_idx').on(table.userId, table.createdAt),
  ],
)

// ─── Reading Analytics (LD: reading behavior tracking) ───
export const readingAnalytics = pgTable(
  'reading_analytics',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    classId: text('class_id').notNull(),
    courseSlug: text('course_slug').notNull(),
    timeSpentSec: integer('time_spent_sec').notNull().default(0),
    scrollDepth: integer('scroll_depth').notNull().default(0),
    completedAt: timestamp('completed_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [uniqueIndex('reading_analytics_user_class_idx').on(table.userId, table.classId)],
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

// ═══════════════════════════════════════════════════════════
// Free Intro Funnel (Doc 13)
// ═══════════════════════════════════════════════════════════

// ─── Free Intro Sessions (anonymous pre-account sessions for free intro) ───
export const freeIntroSessions = pgTable('free_intro_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  lessonOneAnswer: text('lesson_one_answer'),
  lessonOneCompletedAt: timestamp('lesson_one_completed_at'),
  email: text('email'),
  mergedToUserId: uuid('merged_to_user_id').references(() => users.id, {
    onDelete: 'set null',
  }),
  abVariant: text('ab_variant'),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// ─── Drip Emails (scheduled follow-up emails for free intro completers) ───
export const dripEmails = pgTable(
  'drip_emails',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    emailIndex: integer('email_index').notNull(),
    decisionText: text('decision_text').notNull(),
    scheduledAt: timestamp('scheduled_at').notNull(),
    sentAt: timestamp('sent_at'),
    status: text('status', { enum: ['pending', 'sent', 'skipped'] })
      .notNull()
      .default('pending'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('drip_emails_user_index_idx').on(table.userId, table.emailIndex),
    index('drip_emails_pending_idx').on(table.status, table.scheduledAt),
  ],
)

// ═══════════════════════════════════════════════════════════
// Platform V2 (eng-schema.md — schema gate artifact)
// Conventions: text enums (not pg enums), FK cascade, named indexes,
// timestamptz for all scheduling timestamps. events is append-only (NO updatedAt).
// ═══════════════════════════════════════════════════════════

// ─── Template Schema (V2: document_templates.schema jsonb shape, Zod-validated) ───
export const templateFieldSchema = z.object({
  id: z.string().min(1), // stable, immutable once published
  label: z.string(),
  kind: z.enum(['short_text', 'long_text', 'select', 'multi_select', 'date', 'scale_1_10']),
  required: z.boolean(),
  placeholder: z.string().optional(),
  options: z.array(z.string()).optional(), // select/multi_select only
  exampleAnswer: z.string().optional(), // empty-page invitation copy
  // Version stamps (P5): the single jsonb row carries ALL versions' fields; a document
  // pinned at version P sees fields where (addedInVersion ?? 1) <= P and
  // (deprecatedInVersion is unset or > P). Stamped server-side on published updates
  // (features/(admin)/templates) — admin adds/deprecates, NEVER renames/retypes.
  addedInVersion: z.number().int().min(1).optional(), // absent = 1
  deprecatedInVersion: z.number().int().min(1).optional(), // absent = active
})

export const templatePageSchema = z.object({
  id: z.string().min(1),
  title: z.string(),
  instruction: z.string().optional(), // page carries instruction prose (Indy register)
  fields: z.array(templateFieldSchema),
})

export const templateChapterSchema = z.object({
  id: z.string().min(1),
  title: z.string(),
  pages: z.array(templatePageSchema),
})

export const templateSchemaSchema = z.object({
  chapters: z.array(templateChapterSchema),
})

export type TemplateSchema = z.infer<typeof templateSchemaSchema>

// ─── Programs (V2: entry point — free cohort program + paid full program) ───
export const programs = pgTable('programs', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  tier: text('tier', { enum: ['free', 'paid'] }).notNull(),
  status: text('status', { enum: ['draft', 'active', 'archived'] })
    .notNull()
    .default('draft'),
  coverImageKey: text('cover_image_key'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// ─── Cohorts (V2: monthly free cohorts; upcoming/running derives from dates — no status enum) ───
export const cohorts = pgTable(
  'cohorts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    programId: uuid('program_id')
      .notNull()
      .references(() => programs.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
    endsAt: timestamp('ends_at', { withTimezone: true }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    // Cron idempotency key — double-fired auto-creation no-ops via onConflictDoNothing
    uniqueIndex('cohorts_program_start_idx').on(table.programId, table.startsAt),
  ],
)

// ─── Enrollments (V2: THE access primitive — one row per user per program) ───
export const enrollments = pgTable(
  'enrollments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    programId: uuid('program_id')
      .notNull()
      .references(() => programs.id, { onDelete: 'cascade' }),
    // Nullable: paid = evergreen no cohort; free = cohort-bound
    cohortId: uuid('cohort_id').references(() => cohorts.id, { onDelete: 'cascade' }),
    status: text('status', { enum: ['active', 'expired', 'revoked'] })
      .notNull()
      .default('active'),
    source: text('source', { enum: ['signup', 'purchase', 'admin', 'migration'] }).notNull(),
    stripeSubscriptionId: text('stripe_subscription_id'),
    startedAt: timestamp('started_at').notNull().defaultNow(),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    // One row per user per program; free re-enrollment UPDATEs cohortId (TD-2)
    uniqueIndex('enrollments_user_program_idx').on(table.userId, table.programId),
    // Hot access check
    index('enrollments_user_status_idx').on(table.userId, table.status),
  ],
)

// ─── Courses (V2: DB-backed — ADR 7; content/courses.json untouched) ───
export const courses = pgTable('courses', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  description: text('description'),
  coverImageKey: text('cover_image_key'),
  status: text('status', { enum: ['draft', 'published', 'archived'] })
    .notNull()
    .default('draft'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// ─── Program Courses (V2: program ↔ course join with ordering) ───
export const programCourses = pgTable(
  'program_courses',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    programId: uuid('program_id')
      .notNull()
      .references(() => programs.id, { onDelete: 'cascade' }),
    courseId: uuid('course_id')
      .notNull()
      .references(() => courses.id, { onDelete: 'cascade' }),
    sortOrder: integer('sort_order').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('program_courses_program_course_idx').on(table.programId, table.courseId),
  ],
)

// ─── Modules (V2: course sections; 2:3 cover art — ADR 18) ───
export const modules = pgTable(
  'modules',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    courseId: uuid('course_id')
      .notNull()
      .references(() => courses.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description'),
    coverImageKey: text('cover_image_key'),
    sortOrder: integer('sort_order').notNull(),
    status: text('status', { enum: ['draft', 'published'] })
      .notNull()
      .default('draft'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  // NOT unique — reordering with unique requires two-phase updates
  (table) => [index('modules_course_sort_idx').on(table.courseId, table.sortOrder)],
)

// ─── Lessons (V2: video lessons; PUBLISH INVARIANT enforced in service code:
//     status='published' requires videoStatus='ready' AND captionsReady AND decisionPrompt) ───
export const lessons = pgTable(
  'lessons',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    moduleId: uuid('module_id')
      .notNull()
      .references(() => modules.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description'),
    sortOrder: integer('sort_order').notNull(),
    streamVideoId: text('stream_video_id'),
    videoStatus: text('video_status', {
      enum: ['none', 'uploading', 'processing', 'ready', 'error'],
    })
      .notNull()
      .default('none'),
    durationSeconds: integer('duration_seconds'),
    thumbnailKey: text('thumbnail_key'), // 16:9 R2
    captionsReady: boolean('captions_ready').notNull().default(false),
    decisionPrompt: text('decision_prompt'), // TD-3: exactly one per lesson = column not table
    status: text('status', { enum: ['draft', 'published'] })
      .notNull()
      .default('draft'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [index('lessons_module_sort_idx').on(table.moduleId, table.sortOrder)],
)

// ─── Materials (V2: downloadable files in R2; optional lesson link) ───
export const materials = pgTable('materials', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  fileKey: text('file_key').notNull(), // R2
  fileSizeBytes: integer('file_size_bytes'),
  mimeType: text('mime_type'),
  lessonId: uuid('lesson_id').references(() => lessons.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// ─── Program Materials (V2: program ↔ material join) ───
export const programMaterials = pgTable(
  'program_materials',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    programId: uuid('program_id')
      .notNull()
      .references(() => programs.id, { onDelete: 'cascade' }),
    materialId: uuid('material_id')
      .notNull()
      .references(() => materials.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('program_materials_program_material_idx').on(table.programId, table.materialId),
  ],
)

// ─── Lives (V2: monthly live sessions; upcoming/live/replay derives from dates;
//     cancellation is a human act — explicit column, Gate C) ───
export const lives = pgTable(
  'lives',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    programId: uuid('program_id')
      .notNull()
      .references(() => programs.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description'),
    scheduledAt: timestamp('scheduled_at', { withTimezone: true }).notNull(),
    youtubeUrl: text('youtube_url'),
    replayStreamVideoId: text('replay_stream_video_id'),
    replayStatus: text('replay_status', { enum: ['none', 'processing', 'ready'] })
      .notNull()
      .default('none'),
    cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [index('lives_program_scheduled_idx').on(table.programId, table.scheduledAt)],
)

// ─── Document Templates (V2: Playbook→paid, Starter Notebook→free; TD-4:
//     structure = jsonb authorship doc, answers = relational rows; field ids
//     STABLE + immutable once published — admin adds/deprecates, never renames) ───
export const documentTemplates = pgTable('document_templates', {
  id: uuid('id').defaultRandom().primaryKey(),
  programId: uuid('program_id')
    .notNull()
    .references(() => programs.id, { onDelete: 'cascade' }),
  slug: text('slug').notNull(),
  title: text('title').notNull(),
  sortOrder: integer('sort_order').notNull(),
  version: integer('version').notNull().default(1),
  schema: jsonb('schema').$type<TemplateSchema>().notNull(),
  status: text('status', { enum: ['draft', 'published'] })
    .notNull()
    .default('draft'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// ─── Documents (V2: a user's instance of a template; version pinned at instantiation) ───
export const documents = pgTable(
  'documents',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    templateId: uuid('template_id')
      .notNull()
      .references(() => documentTemplates.id, { onDelete: 'cascade' }),
    templateVersion: integer('template_version').notNull(),
    status: text('status', { enum: ['empty', 'in_progress', 'complete'] })
      .notNull()
      .default('empty'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [uniqueIndex('documents_user_template_idx').on(table.userId, table.templateId)],
)

// ─── Document Answers (V2: ADR 9's "structured typed rows"; autosave-on-blur
//     upserts against (documentId, fieldId); confirmedAt = ADR 11 trust moment) ───
export const documentAnswers = pgTable(
  'document_answers',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    documentId: uuid('document_id')
      .notNull()
      .references(() => documents.id, { onDelete: 'cascade' }),
    fieldId: text('field_id').notNull(),
    value: text('value').notNull(),
    source: text('source', { enum: ['typed', 'interview'] })
      .notNull()
      .default('typed'),
    confirmedAt: timestamp('confirmed_at', { withTimezone: true }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('document_answers_document_field_idx').on(table.documentId, table.fieldId),
  ],
)

// ─── Journal Entries (V2: entryDate computed CLIENT-side in user's zone, sent
//     explicitly — never derived server-side from UTC now; NO streak columns) ───
export const journalEntries = pgTable(
  'journal_entries',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    entryDate: date('entry_date').notNull(),
    kind: text('kind', { enum: ['morning', 'evening'] }).notNull(),
    prompt: text('prompt'),
    content: text('content').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('journal_entries_user_date_kind_idx').on(table.userId, table.entryDate, table.kind),
  ],
)

// ─── Conversations (V2: AI chat + interview threads) ───
export const conversations = pgTable('conversations', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  kind: text('kind', { enum: ['chat', 'interview'] }).notNull(),
  title: text('title'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// ─── Conversation Messages (V2: append-only rows; per-message usage needs a message id) ───
export const conversationMessages = pgTable('conversation_messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  conversationId: uuid('conversation_id')
    .notNull()
    .references(() => conversations.id, { onDelete: 'cascade' }),
  role: text('role', { enum: ['user', 'assistant'] }).notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// ─── Interviews (V2: AI interviews a document page; confirmation writes
//     document_answers with source='interview') ───
export const interviews = pgTable('interviews', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  documentId: uuid('document_id')
    .notNull()
    .references(() => documents.id, { onDelete: 'cascade' }),
  pageId: text('page_id').notNull(),
  conversationId: uuid('conversation_id').references(() => conversations.id, {
    onDelete: 'cascade',
  }),
  distilledFields: jsonb('distilled_fields').$type<Record<string, string>>(),
  status: text('status', {
    enum: ['active', 'distilling', 'awaiting_confirmation', 'confirmed', 'abandoned'],
  })
    .notNull()
    .default('active'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// ─── Events (V2: THE spine — append-only, NO updatedAt; name = Zod discriminated
//     union at write boundary NOT pg enum (TD-5); Decision Graph v1 via isDecision) ───
export const events = pgTable(
  'events',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
    anonymousId: text('anonymous_id'), // pre-auth funnel events
    name: text('name').notNull(),
    properties: jsonb('properties').$type<Record<string, unknown>>().notNull().default({}),
    source: text('source', { enum: ['app', 'stream_player', 'mobile', 'backfill'] })
      .notNull()
      .default('app'),
    isDecision: boolean('is_decision').notNull().default(false),
    decisionKind: text('decision_kind', { enum: ['lesson_prompt', 'playbook', 'journal'] }),
    // Backfill idempotency: sourceRef='user_decisions:<uuid>' — script re-runnable
    sourceRef: text('source_ref'),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(), // event time
    createdAt: timestamp('created_at').notNull().defaultNow(), // ingest time
  },
  (table) => [
    index('events_user_occurred_idx').on(table.userId, table.occurredAt),
    index('events_name_occurred_idx').on(table.name, table.occurredAt),
    index('events_user_occurred_decision_idx')
      .on(table.userId, table.occurredAt)
      .where(sql`is_decision`),
    uniqueIndex('events_source_ref_idx').on(table.sourceRef).where(sql`source_ref IS NOT NULL`),
  ],
)

// ─── AI Usage (V2: token metering — ADR 10; budget = sum() over (userId, createdAt)
//     for current month; NO materialized counter until measurably slow) ───
export const aiUsage = pgTable(
  'ai_usage',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    conversationId: uuid('conversation_id').references(() => conversations.id, {
      onDelete: 'cascade',
    }),
    messageId: uuid('message_id').references(() => conversationMessages.id, {
      onDelete: 'cascade',
    }),
    kind: text('kind', {
      enum: ['chat', 'interview', 'distill', 'suggestion', 'cover_gen'],
    }).notNull(),
    model: text('model').notNull(),
    inputTokens: integer('input_tokens').notNull(),
    outputTokens: integer('output_tokens').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [index('ai_usage_user_created_idx').on(table.userId, table.createdAt)],
)

// ─── Lesson Progress (V2: READ model for resume position — heartbeats still flow
//     to events for analytics; completedAt set when decision prompt answered, ADR 1;
//     existing courseProgress table is the text course's, untouched) ───
export const lessonProgress = pgTable(
  'lesson_progress',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    lessonId: uuid('lesson_id')
      .notNull()
      .references(() => lessons.id, { onDelete: 'cascade' }),
    secondsWatched: integer('seconds_watched').notNull().default(0),
    durationSeconds: integer('duration_seconds'), // denormalized at write for % math
    // The user's decision-prompt answer (ADR 1) — answer TEXT lives here, NEVER in events (PII)
    promptAnswer: text('prompt_answer'),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    lastWatchedAt: timestamp('last_watched_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('lesson_progress_user_lesson_idx').on(table.userId, table.lessonId),
    // The continue-watching rail is one query
    index('lesson_progress_user_watched_idx').on(table.userId, table.lastWatchedAt),
  ],
)
