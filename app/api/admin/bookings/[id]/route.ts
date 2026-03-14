import { withRoles, apiResponse, apiError } from '@/lib/auth-helpers'
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
  status: z.enum(['pending', 'confirmed', 'cancelled', 'completed']).optional(),
  employee_id: z.string().uuid().optional().nullable(),
})

export const GET = withRoles(['admin', 'employee'], async (user, request, context) => {
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

export const PATCH = withRoles('admin', async (user, request, context) => {
  try {
    const { id } = await context.params
    const body = await request.json()

    const currentResult = await query('SELECT * FROM bookings WHERE id = $1', [id])
    if (!currentResult?.length) return apiError('Booking not found', 404)

    const validatedData = bookingUpdateSchema.parse(body)

    const updates: string[] = []
    const values: any[] = []
    let paramIndex = 1

    if (validatedData.status) {
      updates.push(`status = $${paramIndex++}`)
      values.push(validatedData.status)
    }

    if (validatedData.employee_id !== undefined) {
      updates.push(`employee_id = $${paramIndex++}`)
      values.push(validatedData.employee_id || null)
    }

    if (!updates.length) {
      return apiResponse({
        ...currentResult[0],
        services: normalizeServices(currentResult[0].services),
      })
    }

    values.push(id)
    const result = await query(
      `UPDATE bookings SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    )

    const nextStatus = validatedData.status || currentResult[0]?.status
    const nextEmployeeId = validatedData.employee_id !== undefined
      ? validatedData.employee_id || null
      : currentResult[0]?.employee_id || null

    if (nextStatus === 'completed' && currentResult[0]?.status !== 'completed') {
      const services = normalizeServices(currentResult[0].services)
      const total = services.reduce((sum, service) => sum + (service.price || 0), 0)
      const occurredAt = currentResult[0].date
        ? new Date(`${currentResult[0].date}T00:00:00`).toISOString()
        : new Date().toISOString()
      const employeeId = nextEmployeeId

      await query(
        `INSERT INTO finance_ledger (
          entry_type,
          source_type,
          source_id,
          category,
          description,
          amount,
          payment_method,
          occurred_at,
          created_by
        )
        SELECT $1, $2, $3, $4, $5, $6, $7, $8, $9
        WHERE NOT EXISTS (
          SELECT 1 FROM finance_ledger
          WHERE entry_type = $1 AND source_type = $2 AND source_id = $3
        )`,
        [
          'income',
          'booking',
          id,
          'Booking',
          `Booking income from ${currentResult[0].name || 'client'}`,
          Math.max(total, 0),
          null,
          occurredAt,
          user.id,
        ]
      )

      if (employeeId) {
        const existing = await query(
          `SELECT 1 FROM employee_service_logs WHERE source_type = $1 AND source_id = $2 AND employee_id = $3 LIMIT 1`,
          ['booking', id, employeeId]
        )
        if (!existing?.length) {
          for (const service of services) {
            await query(
              `INSERT INTO employee_service_logs (
                employee_id,
                source_type,
                source_id,
                service_name,
                amount,
                occurred_at,
                created_by
              )
              VALUES ($1, $2, $3, $4, $5, $6, $7)`,
              [
                employeeId,
                'booking',
                id,
                service.name,
                service.price || 0,
                occurredAt,
                user.id,
              ]
            )
          }
        }
      }
    }

    if (nextStatus === 'completed' && nextEmployeeId && currentResult[0]?.status === 'completed') {
      const existing = await query(
        `SELECT 1 FROM employee_service_logs WHERE source_type = $1 AND source_id = $2 AND employee_id = $3 LIMIT 1`,
        ['booking', id, nextEmployeeId]
      )
      if (!existing?.length) {
        const services = normalizeServices(currentResult[0].services)
        const occurredAt = currentResult[0].date
          ? new Date(`${currentResult[0].date}T00:00:00`).toISOString()
          : new Date().toISOString()

        for (const service of services) {
          await query(
            `INSERT INTO employee_service_logs (
              employee_id,
              source_type,
              source_id,
              service_name,
              amount,
              occurred_at,
              created_by
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
              nextEmployeeId,
              'booking',
              id,
              service.name,
              service.price || 0,
              occurredAt,
              user.id,
            ]
          )
        }
      }
    }

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

export const DELETE = withRoles('admin', async (user, request, context) => {
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
