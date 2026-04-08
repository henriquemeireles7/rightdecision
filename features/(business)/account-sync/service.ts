import { eq } from 'drizzle-orm'
import { db } from '@/platform/db/client'
import { platformAccounts } from '@/platform/db/schema'
import { listProfiles } from '@/providers/social-posting'

const PLATFORM_DEFAULTS: Record<string, { charLimit: number; hashtagLimit: number }> = {
  instagram: { charLimit: 2200, hashtagLimit: 30 },
  tiktok: { charLimit: 4000, hashtagLimit: 100 },
  youtube: { charLimit: 5000, hashtagLimit: 15 },
  facebook: { charLimit: 63206, hashtagLimit: 30 },
  x: { charLimit: 280, hashtagLimit: 5 },
  threads: { charLimit: 500, hashtagLimit: 5 },
  linkedin: { charLimit: 3000, hashtagLimit: 5 },
}

export async function syncPlatformAccounts() {
  const profiles = await listProfiles()

  let created = 0
  let updated = 0

  for (const profile of profiles) {
    const existing = await db.query.platformAccounts.findFirst({
      where: eq(platformAccounts.uploadPostProfileId, profile.id),
    })

    const defaults = PLATFORM_DEFAULTS[profile.platform] ?? { charLimit: 2200, hashtagLimit: 30 }

    if (existing) {
      await db
        .update(platformAccounts)
        .set({
          accountHandle: profile.handle,
          platform: profile.platform as typeof existing.platform,
          updatedAt: new Date(),
        })
        .where(eq(platformAccounts.id, existing.id))
      updated++
    } else {
      await db.insert(platformAccounts).values({
        platform: profile.platform as 'instagram',
        accountHandle: profile.handle,
        accountType: 'brand',
        uploadPostProfileId: profile.id,
        charLimit: defaults.charLimit,
        hashtagLimit: defaults.hashtagLimit,
      })
      created++
    }
  }

  return { synced: profiles.length, created, updated }
}
