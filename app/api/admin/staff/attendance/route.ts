import { withRoles, apiResponse, apiError } from '@/lib/auth-helpers'
import { query } from '@/lib/db'
import { z } from 'zod'

const attendanceSchema = z.object({
  employee_id: z.string().uuid(),
  attendance_date: z.string().min(1),
  check_in_at: z.string().optional().nullable(),
  check_out_at: z.string().optional().nullable(),
  notes: z.string().optional().or(z.literal('')),
})

function isMissingTable(error: any) {
  return error?.code === '42P01' || `${error?.message || ''}`.includes('employee_attendance')
}

export const GET = withRoles('admin', async (user, request) => {
  try {
    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get('employeeId')
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    const params: any[] = []
    let sql = `
      SELECT a.*, tm.name as employee_name
      FROM employee_attendance a
      JOIN team_members tm ON tm.id = a.employee_id
    `

    const where: string[] = []
    if (employeeId) {
      params.push(employeeId)
      where.push(`a.employee_id = $${params.length}`)
    }
    if (from) {
      params.push(from)
      where.push(`a.attendance_date >= $${params.length}`)
    }
    if (to) {
      params.push(to)
      where.push(`a.attendance_date <= $${params.length}`)
    }

    if (where.length) sql += ` WHERE ${where.join(' AND ')}`
    sql += ' ORDER BY a.attendance_date DESC'

    const rows = await query(sql, params)
    return apiResponse({ records: rows || [] })
  } catch (error) {
    console.error('Error fetching attendance:', error)
    if (isMissingTable(error)) {
      return apiError('Staff tracking tables missing. Run migrations (006_employee_tracking.sql).', 500)
    }
    return apiError('Failed to fetch attendance', 500)
  }
})

export const POST = withRoles('admin', async (user, request) => {
  try {
    const body = await request.json()
    const validated = attendanceSchema.parse(body)

    const result = await query(
      `INSERT INTO employee_attendance (
        employee_id,
        attendance_date,
        check_in_at,
        check_out_at,
        notes,
        created_by,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
      ON CONFLICT (employee_id, attendance_date)
      DO UPDATE SET
        check_in_at = EXCLUDED.check_in_at,
        check_out_at = EXCLUDED.check_out_at,
        notes = EXCLUDED.notes,
        created_by = EXCLUDED.created_by,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *`,
      [
        validated.employee_id,
        validated.attendance_date,
        validated.check_in_at || null,
        validated.check_out_at || null,
        validated.notes?.trim() || null,
        user.id,
      ]
    )

    return apiResponse(result?.[0] || null)
  } catch (error: any) {
    if (error.name === 'ZodError') return apiError(error.errors[0].message, 400)
    console.error('Error saving attendance:', error)
    if (isMissingTable(error)) {
      return apiError('Staff tracking tables missing. Run migrations (006_employee_tracking.sql).', 500)
    }
    return apiError('Failed to save attendance', 500)
  }
})
