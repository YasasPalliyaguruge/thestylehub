import { withRoles, apiResponse, apiError } from '@/lib/auth-helpers'
import { query } from '@/lib/db'

export const DELETE = withRoles('admin', async (user, request, context) => {
  try {
    const { id } = await context.params
    const currentResult = await query('SELECT * FROM finance_ledger WHERE id = $1', [id])
    if (!currentResult?.length) return apiError('Finance entry not found', 404)

    await query('DELETE FROM finance_ledger WHERE id = $1', [id])

    return apiResponse({ message: 'Finance entry deleted successfully' })
  } catch (error) {
    console.error('Error deleting finance entry:', error)
    return apiError('Failed to delete finance entry', 500)
  }
})