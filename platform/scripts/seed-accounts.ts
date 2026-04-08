/**
 * Seed 13 platform accounts for BD pipeline.
 * Idempotent: skips existing accounts (checks by handle).
 *
 * Usage: bun platform/scripts/seed-accounts.ts
 */
import { db } from '@/platform/db/client'
import { platformAccounts } from '@/platform/db/schema'
import { eq, and } from 'drizzle-orm'

const accounts = [
  // TikTok (3)
  { platform: 'tiktok', accountHandle: '@rightdecision', accountType: 'brand', charLimit: 300, hashtagLimit: 5 },
  { platform: 'tiktok', accountHandle: '@henrydecisions', accountType: 'personal', charLimit: 300, hashtagLimit: 5 },
  { platform: 'tiktok', accountHandle: '@indydecisions', accountType: 'personal', charLimit: 300, hashtagLimit: 5 },
  // Instagram (3)
  { platform: 'instagram', accountHandle: '@rightdecision', accountType: 'brand', charLimit: 2200, hashtagLimit: 30 },
  { platform: 'instagram', accountHandle: '@henrydecisions', accountType: 'personal', charLimit: 2200, hashtagLimit: 30 },
  { platform: 'instagram', accountHandle: '@indydecisions', accountType: 'personal', charLimit: 2200, hashtagLimit: 30 },
  // Facebook (3)
  { platform: 'facebook', accountHandle: 'Right Decision', accountType: 'brand', charLimit: 63206, hashtagLimit: 10 },
  { platform: 'facebook', accountHandle: 'Henry Meireles', accountType: 'personal', charLimit: 63206, hashtagLimit: 10 },
  { platform: 'facebook', accountHandle: 'Indy Meireles', accountType: 'personal', charLimit: 63206, hashtagLimit: 10 },
  // X (3)
  { platform: 'x', accountHandle: '@rightdecision', accountType: 'brand', charLimit: 280, hashtagLimit: 3 },
  { platform: 'x', accountHandle: '@henrydecisions', accountType: 'personal', charLimit: 280, hashtagLimit: 3 },
  { platform: 'x', accountHandle: '@indydecisions', accountType: 'personal', charLimit: 280, hashtagLimit: 3 },
  // YouTube (1)
  { platform: 'youtube', accountHandle: 'Right Decision', accountType: 'brand', charLimit: 5000, hashtagLimit: 15 },
] as const

async function seed() {
  let created = 0
  let skipped = 0

  for (const account of accounts) {
    const existing = await db.query.platformAccounts.findFirst({
      where: and(eq(platformAccounts.platform, account.platform), eq(platformAccounts.accountHandle, account.accountHandle)),
    })
    if (existing) {
      skipped++
      continue
    }

    await db.insert(platformAccounts).values({
      platform: account.platform,
      accountHandle: account.accountHandle,
      accountType: account.accountType,
      charLimit: account.charLimit,
      hashtagLimit: account.hashtagLimit,
      isActive: true,
    })
    created++
  }

  console.log(`Seed complete: ${created} created, ${skipped} skipped (already existed)`)
  process.exit(0)
}

seed().catch((e) => {
  console.error('Seed failed:', e)
  process.exit(1)
})
