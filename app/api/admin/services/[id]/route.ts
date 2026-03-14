import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { withAuth, withRoles, apiResponse, apiError } from '@/lib/auth-helpers'
import { createAuditLog, AuditActions, AuditEntityTypes } from '@/lib/audit-log'
import { z } from 'zod'

const serviceSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  price: z.number().positive().optional(),
  duration: z.string().optional(),
  icon: z.string().optional(),
  category: z.enum(['hair', 'beard', 'styling', 'color', 'treatment']).optional(),
  popular: z.boolean().optional(),
  display_order: z.number().optional(),
  active: z.boolean().optional(),
})

export const GET = withAuth(async (user, request, context) => {
  try {
    const { id } = await context.params
    const result = await query('SELECT * FROM services WHERE id = $1', [id])

    if (!result || result.length === 0) {
      return apiError('Service not found', 404)
    }

    return apiResponse(result[0])
  } catch (error) {
    console.error('Error fetching service:', error)
    return apiError('Failed to fetch service', 500)
  }
})

export const PUT = withRoles('admin', async (user, request, context) => {
  try {
    const { id } = await context.params
    const body = await request.json()

    const currentResult = await query('SELECT * FROM services WHERE id = $1', [id])

    if (!currentResult || currentResult.length === 0) {
      return apiError('Service not found', 404)
    }

    const currentService = currentResult[0]
    const validatedData = serviceSchema.parse(body)

    const updates: string[] = []
    const values: any[] = []
    let paramIndex = 1

    Object.entries(validatedData).forEach(([key, value]) => {
      if (value !== undefined) {
        updates.push(`${key} = $${paramIndex}`)
        values.push(value)
        paramIndex++
      }
    })

    if (updates.length === 0) {
      return apiError('No fields to update', 400)
    }

    values.push(id)
    const result = await query(
      `UPDATE services SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    )

    if (!result || result.length === 0) {
      return apiError('Failed to update service', 500)
    }

    await createAuditLog({
      admin_id: user.id,
      action: AuditActions.UPDATE,
      entity_type: AuditEntityTypes.SERVICE,
      entity_id: id,
      changes: { before: currentService, after: result[0] },
    })

    return apiResponse(result[0])
  } catch (error: any) {
    console.error('Error updating service:', error)
    if (error.name === 'ZodError') return apiError(error.errors[0].message, 400)
    return apiError('Failed to update service', 500)
  }
})

export const DELETE = withRoles('admin', async (user, request, context) => {
  try {
    const { id } = await context.params

    const currentResult = await query('SELECT * FROM services WHERE id = $1', [id])

    if (!currentResult || currentResult.length === 0) {
      return apiError('Service not found', 404)
    }

    await query('DELETE FROM services WHERE id = $1', [id])

    await createAuditLog({
      admin_id: user.id,
      action: AuditActions.DELETE,
      entity_type: AuditEntityTypes.SERVICE,
      entity_id: id,
      changes: { deleted: currentResult[0] },
    })

    return apiResponse({ message: 'Service deleted successfully' })
  } catch (error) {
    console.error('Error deleting service:', error)
    return apiError('Failed to delete service', 500)
  }
})
