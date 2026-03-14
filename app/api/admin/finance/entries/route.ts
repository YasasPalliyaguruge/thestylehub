import { withRoles, apiResponse, apiError } from '@/lib/auth-helpers'
import { query } from '@/lib/db'
import { z } from 'zod'

const createSchema = z.object({
  entry_type: z.enum(['expense', 'income']).optional(),
  category: z.string().min(1),
  description: z.string().optional().or(z.literal('')),
  amount: z.number().positive(),
  payment_method: z.string().optional().or(z.literal('')),
  occurred_at: z.string().optional(),
})

function toNumber(value: any) {
  if (typeof value === 'number') return value
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

export const GET = withRoles('admin', async (user, request) => {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const source = searchParams.get('source')
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    const params: any[] = []
    let sql = `SELECT *
               FROM finance_ledger`

    const clauses: string[] = []
    if (type) {
      params.push(type)
      clauses.push(`entry_type = $${params.length}`)
    }
    if (source) {
      params.push(source)
      clauses.push(`source_type = $${params.length}`)
    }
    if (from) {
      params.push(from)
      clauses.push(`occurred_at >= $${params.length}::timestamptz`)
    }
    if (to) {
      params.push(to)
      clauses.push(`occurred_at <= $${params.length}::timestamptz`)
    }

    if (clauses.length) {
      sql += ` WHERE ${clauses.join(' AND ')}`
    }

    sql += ` ORDER BY occurred_at DESC, created_at DESC`

    const entries = await query(sql, params)
    const normalized = (entries || []).map((entry: any) => ({
      ...entry,
      amount: toNumber(entry.amount),
    }))

    return apiResponse({ entries: normalized })
  } catch (error) {
    console.error('Error fetching finance entries:', error)
    return apiError('Failed to fetch finance entries', 500)
  }
})

export const POST = withRoles('admin', async (user, request) => {
  try {
    const body = await request.json()
    const validated = createSchema.parse(body)

    const entryType = validated.entry_type || 'expense'
    const amount = entryType === 'expense' ? -Math.abs(validated.amount) : Math.abs(validated.amount)
    const occurredAt = validated.occurred_at
      ? new Date(validated.occurred_at).toISOString()
      : new Date().toISOString()

    const result = await query(
      `INSERT INTO finance_ledger (
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
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        entryType,
        'manual',
        null,
        validated.category,
        validated.description || null,
        amount,
        validated.payment_method || null,
        occurredAt,
        user.id,
      ]
    )

    return apiResponse(result[0], 201)
  } catch (error: any) {
    if (error.name === 'ZodError') return apiError(error.errors[0].message, 400)
    console.error('Error creating finance entry:', error)
    return apiError('Failed to create finance entry', 500)
  }
})
