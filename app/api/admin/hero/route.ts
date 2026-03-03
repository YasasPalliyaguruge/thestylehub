import { withAuth, apiResponse, apiError } from '@/lib/auth-helpers'
import { createAuditLog, AuditActions, AuditEntityTypes } from '@/lib/audit-log'
import { query } from '@/lib/db'
import { z } from 'zod'

const heroSchema = z.object({
  headline: z.string().optional(),
  subheadline: z.string().optional(),
  badge_text: z.string().optional(),
  primary_cta_text: z.string().optional(),
  primary_cta_link: z.string().optional(),
  secondary_cta_text: z.string().optional(),
  secondary_cta_link: z.string().optional(),
  background_image_url: z.string().url().optional().or(z.literal('')),
  active: z.boolean().optional(),
})

// Singleton - always return the first (and only) active record
export const GET = withAuth(async () => {
  try {
    const result = await query('SELECT * FROM hero_content WHERE active = true LIMIT 1')

    if (!result || result.length === 0) {
      return apiResponse({
        id: null,
        headline: '',
        subheadline: '',
        badge_text: '',
        primary_cta_text: '',
        primary_cta_link: '',
        secondary_cta_text: '',
        secondary_cta_link: '',
        background_image_url: '',
        active: true,
      })
    }

    return apiResponse(result[0])
  } catch (error) {
    return apiError('Failed to fetch hero content', 500)
  }
})

export const PUT = withAuth(async (user, request) => {
  try {
    const body = await request.json()
    const validatedData = heroSchema.parse(body)

    // Get existing hero content
    const existing = await query('SELECT * FROM hero_content WHERE active = true LIMIT 1')

    if (existing && existing.length > 0) {
      // Update existing
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

      if (updates.length > 0) {
        values.push(existing[0].id)
        const result = await query(
          `UPDATE hero_content SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
          values
        )

        await createAuditLog({
          admin_id: user.id,
          action: AuditActions.UPDATE,
          entity_type: AuditEntityTypes.HERO_CONTENT,
          entity_id: existing[0].id,
          changes: { before: existing[0], after: result[0] },
        })

        return apiResponse(result[0])
      }
    } else {
      // Create new
      const result = await query(
        `INSERT INTO hero_content (headline, subheadline, badge_text, primary_cta_text, primary_cta_link, secondary_cta_text, secondary_cta_link, background_image_url, active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [
          validatedData.headline || '',
          validatedData.subheadline || null,
          validatedData.badge_text || null,
          validatedData.primary_cta_text || null,
          validatedData.primary_cta_link || null,
          validatedData.secondary_cta_text || null,
          validatedData.secondary_cta_link || null,
          validatedData.background_image_url || null,
          validatedData.active !== false,
        ]
      )

      await createAuditLog({
        admin_id: user.id,
        action: AuditActions.CREATE,
        entity_type: AuditEntityTypes.HERO_CONTENT,
        entity_id: result[0].id,
        changes: { created: result[0] },
      })

      return apiResponse(result[0], 201)
    }

    return apiResponse(existing[0])
  } catch (error: any) {
    if (error.name === 'ZodError') return apiError(error.errors[0].message, 400)
    return apiError('Failed to update hero content', 500)
  }
})
