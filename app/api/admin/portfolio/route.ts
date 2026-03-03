import { withAuth, apiResponse, apiError } from '@/lib/auth-helpers'
import { createAuditLog, AuditActions, AuditEntityTypes } from '@/lib/audit-log'
import { query } from '@/lib/db'
import { z } from 'zod'

const portfolioSchema = z.object({
  before_image_url: z.string().url('Invalid before image URL'),
  after_image_url: z.string().url('Invalid after image URL'),
  category: z.string().optional(),
  stylist_id: z.string().uuid().optional().or(z.literal('')),
  client_name: z.string().optional(),
  description: z.string().optional(),
  display_order: z.number().default(0),
  active: z.boolean().default(true),
})

export const GET = withAuth(async () => {
  try {
    const portfolio = await query(`
      SELECT p.*, t.name as stylist_name
      FROM portfolio_items p
      LEFT JOIN team_members t ON p.stylist_id = t.id
      ORDER BY p.display_order ASC, p.created_at DESC
    `)
    return apiResponse(portfolio || [])
  } catch (error) {
    return apiError('Failed to fetch portfolio', 500)
  }
})

export const POST = withAuth(async (user, request) => {
  try {
    const body = await request.json()
    const validatedData = portfolioSchema.parse(body)

    const result = await query(
      `INSERT INTO portfolio_items (before_image_url, after_image_url, category, stylist_id, client_name, description, display_order, active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        validatedData.before_image_url,
        validatedData.after_image_url,
        validatedData.category || null,
        validatedData.stylist_id || null,
        validatedData.client_name || null,
        validatedData.description || null,
        validatedData.display_order,
        validatedData.active,
      ]
    )

    await createAuditLog({
      admin_id: user.id,
      action: AuditActions.CREATE,
      entity_type: AuditEntityTypes.PORTFOLIO,
      entity_id: result[0].id,
      changes: { created: result[0] },
    })

    return apiResponse(result[0], 201)
  } catch (error: any) {
    if (error.name === 'ZodError') return apiError(error.errors[0].message, 400)
    return apiError('Failed to create portfolio item', 500)
  }
})
