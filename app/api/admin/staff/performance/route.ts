import { withRoles, apiResponse, apiError } from '@/lib/auth-helpers'
import { query } from '@/lib/db'
import { z } from 'zod'

const performanceSchema = z.object({
  employee_id: z.string().uuid(),
  service_name: z.string().min(1),
  amount: z.number().nonnegative(),
  occurred_at: z.string().optional(),
  source_type: z.enum(['manual', 'booking', 'pos']).optional(),
  source_id: z.string().uuid().optional().nullable(),
})

function isMissingTable(error: any) {
  return error?.code === '42P01' || `${error?.message || ''}`.includes('employee_service_logs')
}

export const GET = withRoles('admin', async (user, request) => {
  try {
    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get('employeeId')
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const sourceType = searchParams.get('source')

    const params: any[] = []
    let sql = `
      SELECT l.*, tm.name as employee_name
      FROM employee_service_logs l
      JOIN team_members tm ON tm.id = l.employee_id
    `

    const where: string[] = []
    if (employeeId) {
      params.push(employeeId)
      where.push(`l.employee_id = $${params.length}`)
    }
    if (from) {
      params.push(from)
      where.push(`l.occurred_at >= $${params.length}`)
    }
    if (to) {
      params.push(to)
      where.push(`l.occurred_at <= $${params.length}`)
    }
    if (sourceType) {
      params.push(sourceType)
      where.push(`l.source_type = $${params.length}`)
    }

    if (where.length) sql += ` WHERE ${where.join(' AND ')}`
    sql += ' ORDER BY l.occurred_at DESC'

    const rows = await query(sql, params)
    return apiResponse({ logs: rows || [] })
  } catch (error) {
    console.error('Error fetching performance logs:', error)
    if (isMissingTable(error)) {
      return apiError('Staff tracking tables missing. Run migrations (006_employee_tracking.sql).', 500)
    }
    return apiError('Failed to fetch performance logs', 500)
  }
})

export const POST = withRoles('admin', async (user, request) => {
  try {
    const body = await request.json()
    const validated = performanceSchema.parse(body)

    const result = await query(
      `INSERT INTO employee_service_logs (
        employee_id,
        source_type,
        source_id,
        service_name,
        amount,
        occurred_at,
        created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [
        validated.employee_id,
        validated.source_type || 'manual',
        validated.source_id || null,
        validated.service_name.trim(),
        validated.amount,
        validated.occurred_at || new Date().toISOString(),
        user.id,
      ]
    )

    return apiResponse(result?.[0] || null, 201)
  } catch (error: any) {
    if (error.name === 'ZodError') return apiError(error.errors[0].message, 400)
    console.error('Error creating performance log:', error)
    if (isMissingTable(error)) {
      return apiError('Staff tracking tables missing. Run migrations (006_employee_tracking.sql).', 500)
    }
    return apiError('Failed to create performance log', 500)
  }
})
