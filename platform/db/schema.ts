import { boolean, integer, jsonb, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core'

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
