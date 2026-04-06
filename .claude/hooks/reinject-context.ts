// Re-inject critical project rules after context compaction
// These reminders prevent Claude from drifting to wrong tools/patterns in long sessions

const reminders = [
  'Stack: Bun (not npm/yarn), Biome (not ESLint/Prettier), Hono (not Express), Preact (not React), Drizzle (not Prisma).',
  'Run `bun run check` before every commit (lint + typecheck + test).',
  'Every code folder has a nested CLAUDE.md — Claude Code auto-loads it. Check it for context before modifying files.',
  'Use throwError() from platform/errors.ts — never return ad-hoc errors.',
  'Use success() or paginated() from platform/responses.ts — never return raw c.json().',
  'Use env from platform/env.ts — never access process.env directly.',
  'Tests colocated: foo.ts -> foo.test.ts in the same folder.',
  'No manual type definitions — infer from Zod/Drizzle.',
]

console.log(reminders.join('\n'))
process.exit(0)
