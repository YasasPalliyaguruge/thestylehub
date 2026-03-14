import { withRoles, apiResponse, apiError } from '@/lib/auth-helpers'
import { createAuditLog, AuditActions, AuditEntityTypes } from '@/lib/audit-log'
import { query } from '@/lib/db'
import { z } from 'zod'

const updateSchema = z.object({
  status: z.enum(['paid', 'unpaid', 'void']).optional(),
  payment_method: z.string().optional().or(z.literal('')),
})

function normalizeItems(value: unknown): Array<{ name: string; qty: number; unit_price: number }> {
  if (Array.isArray(value)) return value as Array<{ name: string; qty: number; unit_price: number }>
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }
  return []
}

function toNumber(value: any) {
  if (typeof value === 'number') return value
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

export const GET = withRoles(['admin', 'employee'], async (user, request, context) => {
  try {
    const { id } = await context.params
    const result = await query(
      `SELECT
        i.*,
        au.name as staff_name,
        au.email as staff_email,
        tm.name as assigned_employee_name
       FROM pos_invoices i
       LEFT JOIN admin_users au ON au.id = i.created_by
       LEFT JOIN team_members tm ON tm.id = i.employee_id
       WHERE i.id = $1`,
      [id]
    )
    if (!result?.length) return apiError('Invoice not found', 404)

    const business = await query('SELECT * FROM business_info LIMIT 1')

    const invoice = result[0]
    return apiResponse({
      invoice: {
        ...invoice,
        items: normalizeItems(invoice.items),
        subtotal: toNumber(invoice.subtotal),
        tax: toNumber(invoice.tax),
        discount: toNumber(invoice.discount),
        total: toNumber(invoice.total),
      },
      business: business?.[0] || null,
    })
  } catch (error) {
    console.error('Error fetching invoice:', error)
    return apiError('Failed to fetch invoice', 500)
  }
})

export const PUT = withRoles('admin', async (user, request, context) => {
  try {
    const { id } = await context.params
    const body = await request.json()
    const validatedData = updateSchema.parse(body)

    const currentResult = await query('SELECT * FROM pos_invoices WHERE id = $1', [id])
    if (!currentResult?.length) return apiError('Invoice not found', 404)

    const updates: string[] = []
    const values: any[] = []
    let paramIndex = 1

    if (validatedData.status) {
      updates.push(`status = $${paramIndex++}`)
      values.push(validatedData.status)

      updates.push(`paid_at = $${paramIndex++}`)
      values.push(validatedData.status === 'paid' ? new Date().toISOString() : null)
    }

    if (validatedData.payment_method !== undefined) {
      updates.push(`payment_method = $${paramIndex++}`)
      values.push(validatedData.payment_method || null)
    }

    if (!updates.length) {
      return apiResponse({
        ...currentResult[0],
        items: normalizeItems(currentResult[0].items),
        subtotal: toNumber(currentResult[0].subtotal),
        tax: toNumber(currentResult[0].tax),
        discount: toNumber(currentResult[0].discount),
        total: toNumber(currentResult[0].total),
      })
    }

    values.push(id)
    const result = await query(
      `UPDATE pos_invoices SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    )

    if (validatedData.status) {
      const previousStatus = currentResult[0].status
      const nextStatus = validatedData.status
      const total = toNumber(currentResult[0].total)
      const invoiceNumber = currentResult[0].invoice_number
      const employeeId = currentResult[0].employee_id || null

      if (previousStatus !== 'paid' && nextStatus === 'paid') {
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
          SELECT $1::VARCHAR, $2::VARCHAR, $3::UUID, $4::VARCHAR, $5::TEXT, $6::DECIMAL, $7::VARCHAR, $8::TIMESTAMP, $9::UUID
          WHERE NOT EXISTS (
            SELECT 1 FROM finance_ledger
            WHERE entry_type = $1 AND source_type = $2 AND source_id = $3
          )`,
          [
            'income',
            'pos',
            id,
            'POS',
            `POS invoice ${invoiceNumber}`,
            total,
            validatedData.payment_method ?? currentResult[0].payment_method ?? null,
            new Date().toISOString(),
            user.id,
          ]
        )

        if (employeeId) {
          const existing = await query(
            `SELECT 1 FROM employee_service_logs WHERE source_type = $1 AND source_id = $2 AND employee_id = $3 LIMIT 1`,
            ['pos', id, employeeId]
          )
          if (!existing?.length) {
            const items = normalizeItems(currentResult[0].items)
            for (const item of items) {
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
                  'pos',
                  id,
                  item.name,
                  item.qty * item.unit_price,
                  new Date().toISOString(),
                  user.id,
                ]
              )
            }
          }
        }
      }

      if (previousStatus === 'paid' && nextStatus === 'void') {
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
          SELECT $1::VARCHAR, $2::VARCHAR, $3::UUID, $4::VARCHAR, $5::TEXT, $6::DECIMAL, $7::VARCHAR, $8::TIMESTAMP, $9::UUID
          WHERE NOT EXISTS (
            SELECT 1 FROM finance_ledger
            WHERE entry_type = $1 AND source_type = $2 AND source_id = $3
          )`,
          [
            'income',
            'pos_void',
            id,
            'POS',
            `Void of POS invoice ${invoiceNumber}`,
            -Math.abs(total),
            currentResult[0].payment_method ?? null,
            new Date().toISOString(),
            user.id,
          ]
        )
      }
    }

    await createAuditLog({
      admin_id: user.id,
      action: AuditActions.UPDATE,
      entity_type: AuditEntityTypes.POS_INVOICE,
      entity_id: id,
      changes: { before: currentResult[0], after: result[0] },
    })

    return apiResponse({
      ...result[0],
      items: normalizeItems(result[0].items),
      subtotal: toNumber(result[0].subtotal),
      tax: toNumber(result[0].tax),
      discount: toNumber(result[0].discount),
      total: toNumber(result[0].total),
    })
  } catch (error: any) {
    if (error.name === 'ZodError') return apiError(error.errors[0].message, 400)
    console.error('Error updating invoice:', error)
    return apiError('Failed to update invoice', 500)
  }
})

export const DELETE = withRoles('admin', async (user, request, context) => {
  try {
    const { id } = await context.params
    const currentResult = await query('SELECT * FROM pos_invoices WHERE id = $1', [id])
    if (!currentResult?.length) return apiError('Invoice not found', 404)

    await query('DELETE FROM pos_invoices WHERE id = $1', [id])

    await createAuditLog({
      admin_id: user.id,
      action: AuditActions.DELETE,
      entity_type: AuditEntityTypes.POS_INVOICE,
      entity_id: id,
      changes: { deleted: currentResult[0] },
    })

    return apiResponse({ message: 'Invoice deleted successfully' })
  } catch (error) {
    console.error('Error deleting invoice:', error)
    return apiError('Failed to delete invoice', 500)
  }
})
