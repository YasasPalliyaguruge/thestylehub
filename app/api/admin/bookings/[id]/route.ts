import { withAuth, apiResponse, apiError } from '@/lib/auth-helpers'
import { createAuditLog, AuditActions, AuditEntityTypes } from '@/lib/audit-log'
import { query } from '@/lib/db'
import { z } from 'zod'

function normalizeServices(value: unknown): Array<{ name: string; price: number }> {
  let source: unknown[] = []

  if (Array.isArray(value)) {
    source = value
  } else if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      source = Array.isArray(parsed) ? parsed : []
    } catch {
      source = []
    }
  }

  return source
    .map((item) => {
      if (!item || typeof item !== 'object') return null
      const row = item as Record<string, unknown>
      return {
        name: typeof row.name === 'string' ? row.name : 'Service',
        price: typeof row.price === 'number' ? row.price : Number(row.price) || 0,
      }
    })
    .filter((item): item is { name: string; price: number } => item !== null)
}

const bookingUpdateSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'cancelled', 'completed']),
})

export const GET = withAuth(async (user, request, context) => {
  try {
    const { id } = await context.params
    const result = await query('SELECT * FROM bookings WHERE id = $1', [id])
    if (!result?.length) return apiError('Booking not found', 404)
    return apiResponse({
      ...result[0],
      services: normalizeServices(result[0].services),
    })
  } catch (error) {
    console.error('Error fetching booking:', error)
    return apiError('Failed to fetch booking', 500)
  }
})

export const PATCH = withAuth(async (user, request, context) => {
  try {
    const { id } = await context.params
    const body = await request.json()

    const currentResult = await query('SELECT * FROM bookings WHERE id = $1', [id])
    if (!currentResult?.length) return apiError('Booking not found', 404)

    const validatedData = bookingUpdateSchema.parse(body)

    const result = await query(
      'UPDATE bookings SET status = $1 WHERE id = $2 RETURNING *',
      [validatedData.status, id]
    )

    await createAuditLog({
      admin_id: user.id,
      action: AuditActions.UPDATE,
      entity_type: AuditEntityTypes.BOOKING,
      entity_id: id,
      changes: { before: currentResult[0], after: result[0] },
    })

    return apiResponse({
      ...result[0],
      services: normalizeServices(result[0].services),
    })
  } catch (error: any) {
    if (error.name === 'ZodError') return apiError(error.errors[0].message, 400)
    return apiError('Failed to update booking', 500)
  }
})

export const DELETE = withAuth(async (user, request, context) => {
  try {
    const { id } = await context.params
    const currentResult = await query('SELECT * FROM bookings WHERE id = $1', [id])
    if (!currentResult?.length) return apiError('Booking not found', 404)

    await query('DELETE FROM bookings WHERE id = $1', [id])

    await createAuditLog({
      admin_id: user.id,
      action: AuditActions.DELETE,
      entity_type: AuditEntityTypes.BOOKING,
      entity_id: id,
      changes: { deleted: currentResult[0] },
    })

    return apiResponse({ message: 'Booking deleted successfully' })
  } catch (error) {
    console.error('Error deleting booking:', error)
    return apiError('Failed to delete booking', 500)
  }
})
