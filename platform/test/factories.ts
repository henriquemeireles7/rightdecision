import { testDb } from './setup'
import {
  users,
  sessions,
  subscriptions,
  wins,
  onboardingProfiles,
  pipelineRuns,
  platformAccounts,
} from '@/platform/db/schema'

let counter = 0
function nextId() {
  counter++
  return counter
}

export async function createTestUser(
  overrides: Partial<typeof users.$inferInsert> = {},
) {
  const n = nextId()
  const [user] = await testDb
    .insert(users)
    .values({
      email: `test-${n}@example.com`,
      name: `Test User ${n}`,
      role: 'free',
      ...overrides,
    })
    .returning()
  return user
}

export async function createTestSession(userId: string) {
  const [session] = await testDb
    .insert(sessions)
    .values({
      userId,
      token: `test-session-${nextId()}`,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    })
    .returning()
  return session
}

export async function createTestSubscription(
  userId: string,
  overrides: Partial<typeof subscriptions.$inferInsert> = {},
) {
  const n = nextId()
  const [subscription] = await testDb
    .insert(subscriptions)
    .values({
      userId,
      stripeCustomerId: `cus_test_${n}`,
      stripeSubscriptionId: `sub_test_${n}`,
      status: 'active',
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      ...overrides,
    })
    .returning()
  return subscription
}

export async function createTestWin(
  userId: string,
  overrides: Partial<typeof wins.$inferInsert> = {},
) {
  const [win] = await testDb
    .insert(wins)
    .values({
      userId,
      lifeArea: 'career',
      description: `Test win ${nextId()}`,
      ...overrides,
    })
    .returning()
  return win
}

export async function createTestOnboardingProfile(
  userId: string,
  overrides: Partial<typeof onboardingProfiles.$inferInsert> = {},
) {
  const [profile] = await testDb
    .insert(onboardingProfiles)
    .values({
      userId,
      throughlineQ1: 'Test answer 1',
      throughlineQ2: 'Test answer 2',
      throughlineQ3: 'Test answer 3',
      throughlineNamed: 'Test throughline',
      ...overrides,
    })
    .returning()
  return profile
}

export async function createTestPipelineRun(
  overrides: Partial<typeof pipelineRuns.$inferInsert> = {},
) {
  const [run] = await testDb
    .insert(pipelineRuns)
    .values({
      inputVideoUrl: `https://storage.example.com/test-${nextId()}.mp4`,
      status: 'queued',
      ...overrides,
    })
    .returning()
  return run
}

export async function createTestPlatformAccount(
  overrides: Partial<typeof platformAccounts.$inferInsert> = {},
) {
  const n = nextId()
  const [account] = await testDb
    .insert(platformAccounts)
    .values({
      platform: 'tiktok',
      accountHandle: `@test_account_${n}`,
      accountType: 'brand',
      ...overrides,
    })
    .returning()
  return account
}
