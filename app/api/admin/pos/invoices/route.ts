import { withRoles, apiResponse, apiError } from '@/lib/auth-helpers'
import { createAuditLog, AuditActions, AuditEntityTypes } from '@/lib/audit-log'
import { query } from '@/lib/db'
import { z } from 'zod'

const invoiceItemSchema = z.object({
  name: z.string().min(1),
  qty: z.number().positive(),
  unit_price: z.number().nonnegative(),
})

const invoiceSchema = z.object({
  booking_id: z.string().uuid().optional().nullable(),
  employee_id: z.string().uuid().optional().nullable(),
  customer_name: z.string().min(1),
  customer_email: z.string().email().optional().or(z.literal('')),
  customer_phone: z.string().optional().or(z.literal('')),
  items: z.array(invoiceItemSchema).min(1),
  tax: z.number().nonnegative().optional(),
  discount: z.number().nonnegative().optional(),
  payment_method: z.string().optional().or(z.literal('')),
  status: z.enum(['paid', 'unpaid', 'void']).optional(),
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

export const GET = withRoles(['admin', 'employee'], async (user, request) => {
  try {
    const { searchParams } = new URL(request.url)
    const bookingId = searchParams.get('bookingId')
    const status = searchParams.get('status')

    const params: string[] = []
    let sql = `SELECT id, invoice_number, booking_id, customer_name, total, status, payment_method, created_at
               FROM pos_invoices`

    if (bookingId) {
      params.push(bookingId)
      sql += ` WHERE booking_id = $${params.length}`
    }

    if (status) {
      params.push(status)
      sql += `${params.length === 1 ? ' WHERE' : ' AND'} status = $${params.length}`
    }

    sql += ' ORDER BY created_at DESC LIMIT 100'

    const invoices = await query(sql, params)
    const normalized = (invoices || []).map((invoice: any) => ({
      ...invoice,
      total: toNumber(invoice.total),
    }))

    return apiResponse({ invoices: normalized })
  } catch (error) {
    console.error('Error fetching invoices:', error)
    return apiError('Failed to fetch invoices', 500)
  }
})

export const POST = withRoles('admin', async (user, request) => {
  try {
    const body = await request.json()
    const validatedData = invoiceSchema.parse(body)

    const items = validatedData.items.map((item) => ({
      name: item.name.trim(),
      qty: item.qty,
      unit_price: item.unit_price,
    }))

    const subtotal = items.reduce((sum, item) => sum + item.qty * item.unit_price, 0)
    const tax = validatedData.tax ?? 0
    const discount = validatedData.discount ?? 0
    const total = Math.max(subtotal + tax - discount, 0)
    const status = validatedData.status ?? 'unpaid'
    const paidAt = status === 'paid' ? new Date().toISOString() : null
    const employeeId = validatedData.employee_id || null

    const result = await query(
      `INSERT INTO pos_invoices (
        booking_id,
        employee_id,
        customer_name,
        customer_email,
        customer_phone,
        items,
        subtotal,
        tax,
        discount,
        total,
        payment_method,
        status,
        paid_at,
        created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *`,
      [
        validatedData.booking_id || null,
        employeeId,
        validatedData.customer_name,
        validatedData.customer_email || null,
        validatedData.customer_phone || null,
        JSON.stringify(items),
        subtotal,
        tax,
        discount,
        total,
        validatedData.payment_method || null,
        status,
        paidAt,
        user.id,
      ]
    )

    const invoice = result?.[0]
    if (!invoice) return apiError('Failed to create invoice', 500)

    if (status === 'paid') {
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
          invoice.id,
          'POS',
          `POS invoice ${invoice.invoice_number}`,
          total,
          validatedData.payment_method || null,
          new Date().toISOString(),
          user.id,
        ]
      )

      if (employeeId) {
        const existing = await query(
          `SELECT 1 FROM employee_service_logs WHERE source_type = $1 AND source_id = $2 AND employee_id = $3 LIMIT 1`,
          ['pos', invoice.id, employeeId]
        )

        if (!existing?.length) {
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
                invoice.id,
                item.name,
                item.qty * item.unit_price,
                paidAt || new Date().toISOString(),
                user.id,
              ]
            )
          }
        }
      }
    }

    await createAuditLog({
      admin_id: user.id,
      action: AuditActions.CREATE,
      entity_type: AuditEntityTypes.POS_INVOICE,
      entity_id: invoice.id,
      changes: { created: invoice },
    })

    return apiResponse({
      ...invoice,
      items: normalizeItems(invoice.items),
      subtotal: toNumber(invoice.subtotal),
      tax: toNumber(invoice.tax),
      discount: toNumber(invoice.discount),
      total: toNumber(invoice.total),
    }, 201)
  } catch (error: any) {
    console.error('Error creating invoice:', error)
    if (error.name === 'ZodError') {
      const errs = error.errors.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ')
      return apiError(`Validation Error: ${errs}`, 400)
    }
    return apiError(error.message || 'Failed to create invoice', 500)
  }
})
