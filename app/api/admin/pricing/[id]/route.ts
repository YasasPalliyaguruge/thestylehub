import { withAuth, withRoles, apiResponse, apiError } from '@/lib/auth-helpers'
import { createAuditLog, AuditActions, AuditEntityTypes } from '@/lib/audit-log'
import { query } from '@/lib/db'
import { z } from 'zod'

function normalizeStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((v): v is string => typeof v === 'string')
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : []
    } catch {
      return []
    }
  }
  return []
}

const pricingSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  gender: z.enum(['men', 'women']).optional(),
  price: z.number().positive().optional(),
  services: z.array(z.string()).min(1).optional(),
  popular: z.boolean().optional(),
  display_order: z.number().optional(),
  active: z.boolean().optional(),
})

export const GET = withAuth(async (user, request, context) => {
  try {
    const { id } = await context.params
    const result = await query('SELECT * FROM pricing_packages WHERE id = $1', [id])
    if (!result?.length) return apiError('Pricing package not found', 404)
    return apiResponse({
      ...result[0],
      services: normalizeStringArray(result[0].services),
    })
  } catch (error) {
    console.error('Error fetching pricing package:', error)
    return apiError('Failed to fetch pricing package', 500)
  }
})

export const PUT = withRoles('admin', async (user, request, context) => {
  try {
    const { id } = await context.params
    const body = await request.json()

    const currentResult = await query('SELECT * FROM pricing_packages WHERE id = $1', [id])
    if (!currentResult?.length) return apiError('Pricing package not found', 404)

    const validatedData = pricingSchema.parse(body)
    const updates: string[] = []
    const values: any[] = []
    let paramIndex = 1

    Object.entries(validatedData).forEach(([key, value]) => {
      if (value !== undefined) {
        updates.push(`${key} = $${paramIndex}`)
        values.push(key === 'services' ? JSON.stringify(value) : value)
        paramIndex++
      }
    })

    if (updates.length === 0) return apiError('No fields to update', 400)

    values.push(id)
    const result = await query(
      `UPDATE pricing_packages SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    )

    await createAuditLog({
      admin_id: user.id,
      action: AuditActions.UPDATE,
      entity_type: AuditEntityTypes.PRICING_PACKAGE,
      entity_id: id,
      changes: { before: currentResult[0], after: result[0] },
    })

    return apiResponse({
      ...result[0],
      services: normalizeStringArray(result[0].services),
    })
  } catch (error: any) {
    if (error.name === 'ZodError') return apiError(error.errors[0].message, 400)
    return apiError('Failed to update pricing package', 500)
  }
})

export const DELETE = withRoles('admin', async (user, request, context) => {
  try {
    const { id } = await context.params
    const currentResult = await query('SELECT * FROM pricing_packages WHERE id = $1', [id])
    if (!currentResult?.length) return apiError('Pricing package not found', 404)

    await query('DELETE FROM pricing_packages WHERE id = $1', [id])

    await createAuditLog({
      admin_id: user.id,
      action: AuditActions.DELETE,
      entity_type: AuditEntityTypes.PRICING_PACKAGE,
      entity_id: id,
      changes: { deleted: currentResult[0] },
    })

    return apiResponse({ message: 'Pricing package deleted successfully' })
  } catch (error) {
    console.error('Error deleting pricing package:', error)
    return apiError('Failed to delete pricing package', 500)
  }
})
