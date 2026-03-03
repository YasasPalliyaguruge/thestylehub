import { withAuth, apiResponse, apiError } from '@/lib/auth-helpers'
import { createAuditLog, AuditActions, AuditEntityTypes } from '@/lib/audit-log'
import { query } from '@/lib/db'
import { z } from 'zod'

function normalizeObject(value: unknown): Record<string, any> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, any>
  }
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
    } catch {
      return {}
    }
  }
  return {}
}

const businessSchema = z.object({
  salon_name: z.string().optional(),
  tagline: z.string().optional(),
  description: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  hours: z.object({}).optional(),
  social_links: z.object({}).optional(),
})

// Singleton - always return the first (and only) record
export const GET = withAuth(async () => {
  try {
    const result = await query('SELECT * FROM business_info LIMIT 1')

    if (!result || result.length === 0) {
      // Return default business info if none exists
      return apiResponse({
        id: null,
        salon_name: 'The Style Hub',
        tagline: '',
        description: '',
        address: '',
        phone: '',
        email: '',
        hours: {},
        social_links: {},
      })
    }

    return apiResponse({
      ...result[0],
      hours: normalizeObject(result[0].hours),
      social_links: normalizeObject(result[0].social_links),
    })
  } catch (error) {
    return apiError('Failed to fetch business info', 500)
  }
})

export const PUT = withAuth(async (user, request) => {
  try {
    const body = await request.json()
    const validatedData = businessSchema.parse(body)

    // Check if business info exists
    const existing = await query('SELECT * FROM business_info LIMIT 1')

    if (existing && existing.length > 0) {
      // Update existing
      const updates: string[] = []
      const values: any[] = []
      let paramIndex = 1

      Object.entries(validatedData).forEach(([key, value]) => {
        if (value !== undefined) {
          updates.push(`${key} = $${paramIndex}`)
          values.push(key === 'hours' || key === 'social_links' ? JSON.stringify(value) : value)
          paramIndex++
        }
      })

      if (updates.length > 0) {
        values.push(existing[0].id)
        const result = await query(
          `UPDATE business_info SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
          values
        )

        await createAuditLog({
          admin_id: user.id,
          action: AuditActions.UPDATE,
          entity_type: AuditEntityTypes.BUSINESS_INFO,
          entity_id: existing[0].id,
          changes: { before: existing[0], after: result[0] },
        })

        return apiResponse({
          ...result[0],
          hours: normalizeObject(result[0].hours),
          social_links: normalizeObject(result[0].social_links),
        })
      }
    } else {
      // Create new
      const result = await query(
        `INSERT INTO business_info (salon_name, tagline, description, address, phone, email, hours, social_links)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          validatedData.salon_name || 'The Style Hub',
          validatedData.tagline || null,
          validatedData.description || null,
          validatedData.address || null,
          validatedData.phone || null,
          validatedData.email || null,
          validatedData.hours ? JSON.stringify(validatedData.hours) : null,
          validatedData.social_links ? JSON.stringify(validatedData.social_links) : null,
        ]
      )

      await createAuditLog({
        admin_id: user.id,
        action: AuditActions.CREATE,
        entity_type: AuditEntityTypes.BUSINESS_INFO,
        entity_id: result[0].id,
        changes: { created: result[0] },
      })

      return apiResponse({
        ...result[0],
        hours: normalizeObject(result[0].hours),
        social_links: normalizeObject(result[0].social_links),
      }, 201)
    }

    return apiResponse({
      ...existing[0],
      hours: normalizeObject(existing[0].hours),
      social_links: normalizeObject(existing[0].social_links),
    })
  } catch (error: any) {
    if (error.name === 'ZodError') return apiError(error.errors[0].message, 400)
    return apiError('Failed to update business info', 500)
  }
})
