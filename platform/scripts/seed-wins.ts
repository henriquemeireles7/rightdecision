/**
 * Seed the Wins Board with founding wins.
 * Run: bun platform/scripts/seed-wins.ts
 *
 * These wins are marked is_seed=true and auto-hidden when 20+ real wins exist.
 * Content style: personal, specific, context-based ("I have clarity on...")
 * NOT generic ("I completed Phase 1").
 */

import { db } from '@/platform/db/client'
import { wins } from '@/platform/db/schema'

const SEED_USER_ID = '00000000-0000-0000-0000-000000000001' // placeholder — linked to admin user

const seedWins = [
  {
    lifeArea: 'career' as const,
    description:
      'I finally named it: I was avoiding the promotion conversation because I was afraid of the responsibility. Naming the avoidance changed everything.',
  },
  {
    lifeArea: 'relationships' as const,
    description:
      'Had the conversation with my partner I was putting off for 3 months. Turns out he felt the same way. We just needed one of us to start.',
  },
  {
    lifeArea: 'health' as const,
    description:
      'Realized my "I don\'t have time to exercise" was actually "I don\'t prioritize myself." Started with 15 minutes. Day 12 now.',
  },
  {
    lifeArea: 'money' as const,
    description:
      'Looked at my actual numbers for the first time in 2 years. Scary but freeing. Made a plan to clear the credit card in 8 months.',
  },
  {
    lifeArea: 'career' as const,
    description:
      'Quit the side project that was draining me. Not everything that could work should be pursued. One decision, massive relief.',
  },
  {
    lifeArea: 'relationships' as const,
    description:
      'Set a boundary with my mother-in-law. She was surprised but respected it. I spent 4 years assuming she wouldn\'t.',
  },
  {
    lifeArea: 'health' as const,
    description:
      'Stopped saying "I should sleep more" and set a phone alarm at 10pm. Simple constraint, sleeping 7+ hours consistently now.',
  },
  {
    lifeArea: 'money' as const,
    description:
      'Negotiated my rate up 20%. The constraint wasn\'t the market — it was that I never asked. Three emails. Done.',
  },
]

async function main() {
  console.log(`Seeding ${seedWins.length} founding wins...`)

  for (const win of seedWins) {
    await db
      .insert(wins)
      .values({
        userId: SEED_USER_ID,
        lifeArea: win.lifeArea,
        description: win.description,
        isSeed: true,
      })
      .onConflictDoNothing()
  }

  console.log(`Done. ${seedWins.length} wins seeded with is_seed=true.`)
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
