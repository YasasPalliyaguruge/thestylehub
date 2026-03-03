import { withAuth, apiResponse, apiError } from '@/lib/auth-helpers'
import { createAuditLog, AuditActions, AuditEntityTypes } from '@/lib/audit-log'
import { query } from '@/lib/db'
import { z } from 'zod'

const testimonialSchema = z.object({
  client_name: z.string().min(1).optional(),
  service: z.string().optional(),
  text: z.string().min(1).optional(),
  rating: z.number().int().min(1).max(5).optional(),
  image_url: z.string().url().optional().or(z.literal('')),
  date: z.string().optional(),
  featured: z.boolean().optional(),
  display_order: z.number().optional(),
  active: z.boolean().optional(),
})

export const GET = withAuth(async (user, request, context) => {
  try {
    const { id } = await context.params
    const result = await query('SELECT * FROM testimonials WHERE id = $1', [id])
    if (!result?.length) return apiError('Testimonial not found', 404)
    return apiResponse(result[0])
  } catch (error) {
    console.error('Error fetching testimonial:', error)
    return apiError('Failed to fetch testimonial', 500)
  }
})

export const PUT = withAuth(async (user, request, context) => {
  try {
    const { id } = await context.params
    const body = await request.json()

    const currentResult = await query('SELECT * FROM testimonials WHERE id = $1', [id])
    if (!currentResult?.length) return apiError('Testimonial not found', 404)

    const validatedData = testimonialSchema.parse(body)
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
      `UPDATE testimonials SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    )

    await createAuditLog({
      admin_id: user.id,
      action: AuditActions.UPDATE,
      entity_type: AuditEntityTypes.TESTIMONIAL,
      entity_id: id,
      changes: { before: currentResult[0], after: result[0] },
    })

    return apiResponse(result[0])
  } catch (error: any) {
    if (error.name === 'ZodError') return apiError(error.errors[0].message, 400)
    return apiError('Failed to update testimonial', 500)
  }
})

export const DELETE = withAuth(async (user, request, context) => {
  try {
    const { id } = await context.params
    const currentResult = await query('SELECT * FROM testimonials WHERE id = $1', [id])
    if (!currentResult?.length) return apiError('Testimonial not found', 404)

    await query('UPDATE testimonials SET active = false WHERE id = $1', [id])

    await createAuditLog({
      admin_id: user.id,
      action: AuditActions.DELETE,
      entity_type: AuditEntityTypes.TESTIMONIAL,
      entity_id: id,
      changes: { deleted: currentResult[0] },
    })

    return apiResponse({ message: 'Testimonial deleted successfully' })
  } catch (error) {
    console.error('Error deleting testimonial:', error)
    return apiError('Failed to delete testimonial', 500)
  }
})
