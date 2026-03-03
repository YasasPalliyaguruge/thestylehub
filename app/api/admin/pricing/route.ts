import { withAuth, apiResponse, apiError } from '@/lib/auth-helpers'
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
  name: z.string().min(1, 'Package name is required'),
  description: z.string().optional(),
  gender: z.enum(['men', 'women']),
  price: z.number().positive('Price must be positive'),
  services: z.array(z.string()).min(1, 'At least one service is required'),
  popular: z.boolean().default(false),
  display_order: z.number().default(0),
  active: z.boolean().default(true),
})

export const GET = withAuth(async () => {
  try {
    const packages = await query(`
      SELECT id, name, description, gender, price::float as price, services, popular, active, display_order, created_at
      FROM pricing_packages
      ORDER BY gender ASC, display_order ASC, name ASC
    `)
    const normalized = (packages || []).map((pkg: any) => ({
      ...pkg,
      services: normalizeStringArray(pkg.services),
    }))
    return apiResponse(normalized)
  } catch (error) {
    return apiError('Failed to fetch pricing packages', 500)
  }
})

export const POST = withAuth(async (user, request) => {
  try {
    const body = await request.json()
    const validatedData = pricingSchema.parse(body)

    const result = await query(
      `INSERT INTO pricing_packages (name, description, gender, price, services, popular, display_order, active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        validatedData.name,
        validatedData.description || null,
        validatedData.gender,
        validatedData.price,
        JSON.stringify(validatedData.services),
        validatedData.popular,
        validatedData.display_order,
        validatedData.active,
      ]
    )

    await createAuditLog({
      admin_id: user.id,
      action: AuditActions.CREATE,
      entity_type: AuditEntityTypes.PRICING_PACKAGE,
      entity_id: result[0].id,
      changes: { created: result[0] },
    })

    return apiResponse(result[0], 201)
  } catch (error: any) {
    if (error.name === 'ZodError') return apiError(error.errors[0].message, 400)
    return apiError('Failed to create pricing package', 500)
  }
})
