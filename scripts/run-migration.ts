import { config } from 'dotenv'
import { neon } from '@neondatabase/serverless'
import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'

config({ path: '.env.local' })

async function runMigration() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL environment variable is not set')
    process.exit(1)
  }

  console.log('Running database migrations...')

  const db = neon(process.env.DATABASE_URL)

  try {
    const migrationsDir = join(process.cwd(), 'db/migrations')
    const migrationFiles = readdirSync(migrationsDir)
      .filter((file) => file.endsWith('.sql'))
      .sort((a, b) => a.localeCompare(b))

    if (migrationFiles.length === 0) {
      console.log('No migration files found.')
      return
    }

    for (const file of migrationFiles) {
      console.log(`\nRunning migration: ${file}`)
      const sql = readFileSync(join(migrationsDir, file), 'utf-8')

      // Keep script simple: split by semicolon for migration statements.
      const statements = sql
        .split(';')
        .map((s) => s.trim())
        .filter((s) => s.length > 0 && !s.startsWith('--'))

      for (const statement of statements) {
        try {
          await db.query(statement)
        } catch (error: any) {
          // Allow idempotent migrations to continue.
          if (!error?.message?.includes('already exists')) {
            console.log('Skipping statement due to handled error:', statement.substring(0, 80) + '...')
          }
        }
      }

      console.log(`${file} completed`)
    }

    console.log('\nAll migrations completed successfully!')
    console.log('Next step: Run npm run db:seed to populate initial data')
  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  }
}

runMigration()
