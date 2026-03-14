import { withRoles, apiResponse, apiError } from '@/lib/auth-helpers'
import { query } from '@/lib/db'
import { z } from 'zod'

const paymentSchema = z.object({
  employee_id: z.string().uuid(),
  entry_type: z.enum(['salary', 'bonus', 'commission', 'adjustment']),
  amount: z.number().positive(),
  period_start: z.string().optional().nullable(),
  period_end: z.string().optional().nullable(),
  payment_method: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
  paid_at: z.string().optional().nullable(),
})

function isMissingTable(error: any) {
  const message = `${error?.message || ''}`
  return error?.code === '42P01' || message.includes('employee_payments') || message.includes('finance_ledger')
}

export const GET = withRoles('admin', async (user, request) => {
  try {
    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get('employeeId')
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    const params: any[] = []
    let sql = `
      SELECT p.*, tm.name as employee_name
      FROM employee_payments p
      JOIN team_members tm ON tm.id = p.employee_id
    `

    const where: string[] = []
    if (employeeId) {
      params.push(employeeId)
      where.push(`p.employee_id = $${params.length}`)
    }
    if (from) {
      params.push(from)
      where.push(`p.paid_at >= $${params.length}`)
    }
    if (to) {
      params.push(to)
      where.push(`p.paid_at <= $${params.length}`)
    }

    if (where.length) sql += ` WHERE ${where.join(' AND ')}`
    sql += ' ORDER BY p.paid_at DESC NULLS LAST, p.created_at DESC'

    const rows = await query(sql, params)
    return apiResponse({ payments: rows || [] })
  } catch (error) {
    console.error('Error fetching payments:', error)
    if (isMissingTable(error)) {
      return apiError('Staff tracking tables missing. Run migrations (006_employee_tracking.sql).', 500)
    }
    return apiError('Failed to fetch payments', 500)
  }
})

export const POST = withRoles('admin', async (user, request) => {
  try {
    const body = await request.json()
    const validated = paymentSchema.parse(body)

    const paymentResult = await query(
      `INSERT INTO employee_payments (
        employee_id,
        entry_type,
        amount,
        period_start,
        period_end,
        payment_method,
        notes,
        paid_at,
        created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        validated.employee_id,
        validated.entry_type,
        validated.amount,
        validated.period_start || null,
        validated.period_end || null,
        validated.payment_method || null,
        validated.notes?.trim() || null,
        validated.paid_at || new Date().toISOString(),
        user.id,
      ]
    )

    const payment = paymentResult?.[0]
    if (!payment) return apiError('Failed to record payment', 500)

    const employee = await query('SELECT name FROM team_members WHERE id = $1', [validated.employee_id])
    const employeeName = employee?.[0]?.name || 'Employee'

    await query(
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
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        'expense',
        'payroll',
        payment.id,
        'Payroll',
        `${validated.entry_type} payment for ${employeeName}`,
        -Math.abs(validated.amount),
        validated.payment_method || null,
        payment.paid_at || new Date().toISOString(),
        user.id,
      ]
    )

    return apiResponse(payment, 201)
  } catch (error: any) {
    if (error.name === 'ZodError') return apiError(error.errors[0].message, 400)
    console.error('Error recording payment:', error)
    if (isMissingTable(error)) {
      return apiError('Staff tracking tables missing. Run migrations (006_employee_tracking.sql).', 500)
    }
    return apiError('Failed to record payment', 500)
  }
})
