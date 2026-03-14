import { withRoles, apiResponse, apiError } from '@/lib/auth-helpers'
import { query } from '@/lib/db'
import { z } from 'zod'

const compSchema = z.object({
  employee_id: z.string().uuid(),
  base_salary: z.number().nonnegative(),
  commission_rate: z.number().min(0).max(100),
  bonus_rate: z.number().min(0).max(100),
})

function isMissingTable(error: any) {
  const message = `${error?.message || ''}`
  return error?.code === '42P01' || message.includes('employee_comp_settings') || message.includes('team_members')
}

export const GET = withRoles('admin', async () => {
  try {
    const rows = await query(
      `SELECT
        tm.id as employee_id,
        tm.name as employee_name,
        tm.role as employee_role,
        tm.active as employee_active,
        cs.base_salary,
        cs.commission_rate,
        cs.bonus_rate,
        cs.updated_at
      FROM team_members tm
      LEFT JOIN employee_comp_settings cs ON cs.employee_id = tm.id
      ORDER BY tm.display_order, tm.name`
    )

    return apiResponse({ settings: rows || [] })
  } catch (error) {
    console.error('Error fetching compensation settings:', error)
    if (isMissingTable(error)) {
      return apiError('Staff tracking tables missing. Run migrations (006_employee_tracking.sql).', 500)
    }
    return apiError('Failed to fetch compensation settings', 500)
  }
})

export const POST = withRoles('admin', async (user, request) => {
  try {
    const body = await request.json()
    const validated = compSchema.parse(body)

    const result = await query(
      `INSERT INTO employee_comp_settings (
        employee_id,
        base_salary,
        commission_rate,
        bonus_rate,
        updated_at
      )
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
      ON CONFLICT (employee_id)
      DO UPDATE SET
        base_salary = EXCLUDED.base_salary,
        commission_rate = EXCLUDED.commission_rate,
        bonus_rate = EXCLUDED.bonus_rate,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *`,
      [
        validated.employee_id,
        validated.base_salary,
        validated.commission_rate,
        validated.bonus_rate,
      ]
    )

    return apiResponse(result?.[0] || null)
  } catch (error: any) {
    if (error.name === 'ZodError') return apiError(error.errors[0].message, 400)
    console.error('Error saving compensation settings:', error)
    if (isMissingTable(error)) {
      return apiError('Staff tracking tables missing. Run migrations (006_employee_tracking.sql).', 500)
    }
    return apiError('Failed to save compensation settings', 500)
  }
})
