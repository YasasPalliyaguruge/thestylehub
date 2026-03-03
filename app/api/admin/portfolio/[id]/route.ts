import { withAuth, apiResponse, apiError } from '@/lib/auth-helpers'
import { createAuditLog, AuditActions, AuditEntityTypes } from '@/lib/audit-log'
import { query } from '@/lib/db'
import { z } from 'zod'

const portfolioSchema = z.object({
  before_image_url: z.string().url().optional(),
  after_image_url: z.string().url().optional(),
  category: z.string().optional(),
  stylist_id: z.string().uuid().optional().or(z.literal('')),
  client_name: z.string().optional(),
  description: z.string().optional(),
  display_order: z.number().optional(),
  active: z.boolean().optional(),
})

export const GET = withAuth(async (user, request, context) => {
  try {
    const { id } = await context.params
    const result = await query('SELECT * FROM portfolio_items WHERE id = $1', [id])
    if (!result?.length) return apiError('Portfolio item not found', 404)
    return apiResponse(result[0])
  } catch (error) {
    console.error('Error fetching portfolio item:', error)
    return apiError('Failed to fetch portfolio item', 500)
  }
})

export const PUT = withAuth(async (user, request, context) => {
  try {
    const { id } = await context.params
    const body = await request.json()

    const currentResult = await query('SELECT * FROM portfolio_items WHERE id = $1', [id])
    if (!currentResult?.length) return apiError('Portfolio item not found', 404)

    const validatedData = portfolioSchema.parse(body)
    const updates: string[] = []
    const values: any[] = []
    let paramIndex = 1

    Object.entries(validatedData).forEach(([key, value]) => {
      if (value !== undefined) {
        updates.push(`${key} = $${paramIndex}`)
        values.push(value ?? null)
        paramIndex++
      }
    })

    if (updates.length === 0) return apiError('No fields to update', 400)

    values.push(id)
    const result = await query(
      `UPDATE portfolio_items SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    )

    await createAuditLog({
      admin_id: user.id,
      action: AuditActions.UPDATE,
      entity_type: AuditEntityTypes.PORTFOLIO,
      entity_id: id,
      changes: { before: currentResult[0], after: result[0] },
    })

    return apiResponse(result[0])
  } catch (error: any) {
    if (error.name === 'ZodError') return apiError(error.errors[0].message, 400)
    return apiError('Failed to update portfolio item', 500)
  }
})

export const DELETE = withAuth(async (user, request, context) => {
  try {
    const { id } = await context.params
    const currentResult = await query('SELECT * FROM portfolio_items WHERE id = $1', [id])
    if (!currentResult?.length) return apiError('Portfolio item not found', 404)

    await query('UPDATE portfolio_items SET active = false WHERE id = $1', [id])

    await createAuditLog({
      admin_id: user.id,
      action: AuditActions.DELETE,
      entity_type: AuditEntityTypes.PORTFOLIO,
      entity_id: id,
      changes: { deleted: currentResult[0] },
    })

    return apiResponse({ message: 'Portfolio item deleted successfully' })
  } catch (error) {
    console.error('Error deleting portfolio item:', error)
    return apiError('Failed to delete portfolio item', 500)
  }
})
