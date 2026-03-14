import { config } from 'dotenv'
const result = config({ path: '.env.local' })

if (result.error) {
  console.error('Error loading .env.local:', result.error)
  process.exit(1)
}

import { neon } from '@neondatabase/serverless'
import { readFileSync } from 'fs'
import { parse } from 'csv-parse/sync'
import { join } from 'path'

const db = neon(process.env.DATABASE_URL!)

interface CsvRow {
  Date: string
  Type: string
  Category: string
  Description: string
  'Amount (LKR)': string
  'Payment Method': string
}

function normalizeText(value: string) {
  return value.trim().replace(/\s+/g, ' ')
}

async function importExpenses() {
  console.log('Importing expenses from expense.csv...')

  const filePath = join(process.cwd(), 'expense.csv')
  const content = readFileSync(filePath, 'utf-8')
  const records = parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as CsvRow[]

  let inserted = 0
  let skipped = 0

  for (const row of records) {
    const category = normalizeText(row.Category || 'Other')
    const description = normalizeText(row.Description || '')
    const paymentMethod = normalizeText(row['Payment Method'] || '')
    const amount = -Math.abs(Number(row['Amount (LKR)'] || 0))
    const occurredAt = row.Date ? new Date(`${row.Date}T00:00:00`).toISOString() : new Date().toISOString()

    const existing = await db`
      SELECT id FROM finance_ledger
      WHERE source_type = 'import'
        AND occurred_at::date = ${row.Date}
        AND amount = ${amount}
        AND description = ${description}
      LIMIT 1
    `

    if (existing.length) {
      skipped++
      continue
    }

    await db`
      INSERT INTO finance_ledger (
        entry_type,
        source_type,
        source_id,
        category,
        description,
        amount,
        payment_method,
        occurred_at,
        created_by
      )
      VALUES (
        'expense',
        'import',
        NULL,
        ${category},
        ${description},
        ${amount},
        ${paymentMethod || null},
        ${occurredAt},
        NULL
      )
    `

    inserted++
  }

  console.log(`Import complete. Inserted: ${inserted}, Skipped: ${skipped}`)
}

importExpenses()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Import failed:', error)
    process.exit(1)
  })
