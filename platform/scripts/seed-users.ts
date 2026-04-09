/**
 * Seed admin and test users for Right Decision.
 * Idempotent: skips existing users, updates role if needed.
 *
 * Usage: bun platform/scripts/seed-users.ts <password>
 */

import { eq } from 'drizzle-orm'
import { auth } from '@/platform/auth/config'
import { db } from '@/platform/db/client'
import { subscriptions, users } from '@/platform/db/schema'

const SEED_USERS = [
  {
    email: 'henry@rightdecision.io',
    name: 'Henry Meireles',
    role: 'admin' as const,
    needsSubscription: false,
  },
  {
    email: 'hsameireles@gmail.com',
    name: 'Henrique Meireles',
    role: 'pro' as const,
    needsSubscription: true,
  },
]

async function seedUsers() {
  const password = Bun.argv[2]
  if (!password || password.length < 8) {
    console.error('Usage: bun platform/scripts/seed-users.ts <password>')
    console.error('Password must be at least 8 characters.')
    process.exit(1)
  }

  for (const seed of SEED_USERS) {
    const existing = await db.query.users.findFirst({
      where: eq(users.email, seed.email),
    })

    let userId: string

    if (existing) {
      userId = existing.id
      console.log(`[skip] ${seed.email} already exists (id: ${userId})`)

      if (existing.role !== seed.role) {
        await db
          .update(users)
          .set({ role: seed.role, emailVerified: true })
          .where(eq(users.id, userId))
        console.log(`[update] ${seed.email} role: ${existing.role} -> ${seed.role}`)
      }
    } else {
      const result = await auth.api.signUpEmail({
        body: { name: seed.name, email: seed.email, password },
      })

      const user = result as unknown as { user: { id: string } }
      userId = user.user.id

      await db
        .update(users)
        .set({ role: seed.role, emailVerified: true })
        .where(eq(users.id, userId))

      console.log(`[created] ${seed.email} (role: ${seed.role}, id: ${userId})`)
    }

    if (seed.needsSubscription) {
      const existingSub = await db.query.subscriptions.findFirst({
        where: eq(subscriptions.userId, userId),
      })

      if (existingSub) {
        console.log(`[skip] ${seed.email} already has subscription`)
      } else {
        const oneYearFromNow = new Date()
        oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1)

        await db.insert(subscriptions).values({
          userId,
          stripeCustomerId: 'cus_seed_test',
          stripeSubscriptionId: 'sub_seed_test',
          status: 'active',
          currentPeriodEnd: oneYearFromNow,
        })
        console.log(`[created] ${seed.email} subscription (active, 1 year)`)
      }
    }
  }

  console.log('Seed complete.')
  process.exit(0)
}

seedUsers().catch((e) => {
  console.error('Seed failed:', e)
  process.exit(1)
})
