import { withAuth, apiResponse, apiError } from '@/lib/auth-helpers'
import { createAuditLog, AuditActions, AuditEntityTypes } from '@/lib/audit-log'
import { query } from '@/lib/db'
import { z } from 'zod'

const testimonialSchema = z.object({
  client_name: z.string().min(1, 'Client name is required'),
  service: z.string().optional(),
  text: z.string().min(1, 'Testimonial text is required'),
  rating: z.number().int().min(1).max(5).optional(),
  image_url: z.string().url().optional().or(z.literal('')),
  date: z.string().optional(),
  featured: z.boolean().default(false),
  display_order: z.number().default(0),
  active: z.boolean().default(true),
})

export const GET = withAuth(async () => {
  try {
    const testimonials = await query(`
      SELECT * FROM testimonials
      ORDER BY featured DESC, display_order ASC, created_at DESC
    `)
    return apiResponse(testimonials || [])
  } catch (error) {
    return apiError('Failed to fetch testimonials', 500)
  }
})

export const POST = withAuth(async (user, request) => {
  try {
    const body = await request.json()
    const validatedData = testimonialSchema.parse(body)

    const result = await query(
      `INSERT INTO testimonials (client_name, service, text, rating, image_url, date, featured, display_order, active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        validatedData.client_name,
        validatedData.service || null,
        validatedData.text,
        validatedData.rating || null,
        validatedData.image_url || null,
        validatedData.date || null,
        validatedData.featured,
        validatedData.display_order,
        validatedData.active,
      ]
    )

    await createAuditLog({
      admin_id: user.id,
      action: AuditActions.CREATE,
      entity_type: AuditEntityTypes.TESTIMONIAL,
      entity_id: result[0].id,
      changes: { created: result[0] },
    })

    return apiResponse(result[0], 201)
  } catch (error: any) {
    if (error.name === 'ZodError') return apiError(error.errors[0].message, 400)
    return apiError('Failed to create testimonial', 500)
  }
})
