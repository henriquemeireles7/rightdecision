import { migrate } from 'drizzle-orm/postgres-js/migrator'
import { db } from '@/platform/db/client'

async function main() {
  console.log('Running migrations...')
  await migrate(db, { migrationsFolder: './platform/db/migrations' })
  console.log('Migrations complete')
  process.exit(0)
}

main().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})
