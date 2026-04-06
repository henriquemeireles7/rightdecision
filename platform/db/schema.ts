import { boolean, integer, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core'

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

// ─── Purchases ───
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

// ─── Course Progress ───
export const courseProgress = pgTable(
  'course_progress',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    moduleId: integer('module_id').notNull(),
    completedAt: timestamp('completed_at').notNull().defaultNow(),
  },
  (table) => [uniqueIndex('course_progress_user_module_idx').on(table.userId, table.moduleId)],
)
