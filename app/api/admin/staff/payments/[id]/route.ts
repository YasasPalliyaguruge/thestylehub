import { withRoles, apiResponse, apiError } from '@/lib/auth-helpers'
import { createAuditLog, AuditActions, AuditEntityTypes } from '@/lib/audit-log'
import { query } from '@/lib/db'

export const DELETE = withRoles('admin', async (user, request, context) => {
  try {
    const { id } = await context.params
    const currentResult = await query('SELECT * FROM employee_payments WHERE id = $1', [id])
    if (!currentResult?.length) return apiError('Payment record not found', 404)

    await query('DELETE FROM employee_payments WHERE id = $1', [id])

    await createAuditLog({
      admin_id: user.id,
      action: AuditActions.DELETE,
      entity_type: AuditEntityTypes.EMPLOYEE_PAYMENT,
      entity_id: id,
      changes: { deleted: currentResult[0] },
    })

    return apiResponse({ message: 'Payment record deleted successfully' })
  } catch (error) {
    console.error('Error deleting payment record:', error)
    return apiError('Failed to delete payment record', 500)
  }
})