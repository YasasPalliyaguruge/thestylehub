import { withRoles, apiResponse, apiError } from '@/lib/auth-helpers'
import { query } from '@/lib/db'

function isMissingTable(error: any) {
  return error?.code === '42P01' || `${error?.message || ''}`.includes('employee_attendance')
}

export const DELETE = withRoles('admin', async (user, request, context) => {
  try {
    const { id } = await context.params
    const currentResult = await query('SELECT * FROM employee_attendance WHERE id = $1', [id])
    if (!currentResult?.length) return apiError('Attendance record not found', 404)

    await query('DELETE FROM employee_attendance WHERE id = $1', [id])

    return apiResponse({ message: 'Attendance record deleted successfully' })
  } catch (error) {
    console.error('Error deleting attendance:', error)
    if (isMissingTable(error)) {
      return apiError('Staff tracking tables missing. Run migrations (006_employee_tracking.sql).', 500)
    }
    return apiError('Failed to delete attendance record', 500)
  }
})