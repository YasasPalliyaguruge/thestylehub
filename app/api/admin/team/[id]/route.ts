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

const teamSchema = z.object({
  name: z.string().min(1).optional(),
  role: z.string().min(1).optional(),
  specialties: z.array(z.string()).optional(),
  image_url: z.string().url().optional().or(z.literal('')),
  bio: z.string().optional(),
  experience_years: z.number().int().min(0).optional(),
  rating: z.number().min(1).max(5).optional(),
  client_count: z.number().int().min(0).optional(),
  display_order: z.number().optional(),
  active: z.boolean().optional(),
})

export const GET = withAuth(async (user, request, context) => {
  try {
    const { id } = await context.params
    const result = await query('SELECT * FROM team_members WHERE id = $1', [id])
    if (!result?.length) return apiError('Team member not found', 404)
    return apiResponse({
      ...result[0],
      specialties: normalizeStringArray(result[0].specialties),
    })
  } catch (error) {
    return apiError('Failed to fetch team member', 500)
  }
})

export const PUT = withAuth(async (user, request, context) => {
  try {
    const { id } = await context.params
    const body = await request.json()

    const currentResult = await query('SELECT * FROM team_members WHERE id = $1', [id])
    if (!currentResult?.length) return apiError('Team member not found', 404)

    const validatedData = teamSchema.parse(body)
    const updates: string[] = []
    const values: any[] = []
    let paramIndex = 1

    Object.entries(validatedData).forEach(([key, value]) => {
      if (value !== undefined) {
        updates.push(`${key} = $${paramIndex}`)
        values.push(key === 'specialties' && Array.isArray(value) ? JSON.stringify(value) : value)
        paramIndex++
      }
    })

    if (updates.length === 0) return apiError('No fields to update', 400)

    values.push(id)
    const result = await query(
      `UPDATE team_members SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    )

    await createAuditLog({
      admin_id: user.id,
      action: AuditActions.UPDATE,
      entity_type: AuditEntityTypes.TEAM_MEMBER,
      entity_id: id,
      changes: { before: currentResult[0], after: result[0] },
    })

    return apiResponse({
      ...result[0],
      specialties: normalizeStringArray(result[0].specialties),
    })
  } catch (error: any) {
    if (error.name === 'ZodError') return apiError(error.errors[0].message, 400)
    return apiError('Failed to update team member', 500)
  }
})

export const DELETE = withAuth(async (user, request, context) => {
  try {
    const { id } = await context.params
    const currentResult = await query('SELECT * FROM team_members WHERE id = $1', [id])
    if (!currentResult?.length) return apiError('Team member not found', 404)

    await query('UPDATE team_members SET active = false WHERE id = $1', [id])

    await createAuditLog({
      admin_id: user.id,
      action: AuditActions.DELETE,
      entity_type: AuditEntityTypes.TEAM_MEMBER,
      entity_id: id,
      changes: { deleted: currentResult[0] },
    })

    return apiResponse({ message: 'Team member deleted successfully' })
  } catch (error) {
    return apiError('Failed to delete team member', 500)
  }
})
