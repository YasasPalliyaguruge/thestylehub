import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { withAuth, apiResponse, apiError } from '@/lib/auth-helpers'
import { createAuditLog, AuditActions, AuditEntityTypes } from '@/lib/audit-log'
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
  name: z.string().min(1, 'Name is required'),
  role: z.string().min(1, 'Role is required'),
  specialties: z.array(z.string()).optional(),
  image_url: z.string().url().optional().or(z.literal('')),
  bio: z.string().optional(),
  experience_years: z.number().int().min(0).optional(),
  rating: z.number().min(1).max(5).optional(),
  client_count: z.number().int().min(0).optional(),
  display_order: z.number().default(0),
  active: z.boolean().default(true),
})

export const GET = withAuth(async () => {
  try {
    const team = await query(`
      SELECT id, name, role, specialties, image_url, bio, experience_years, rating::float as rating, client_count, active, display_order, created_at
      FROM team_members
      ORDER BY display_order ASC, name ASC
    `)
    const normalized = (team || []).map((member: any) => ({
      ...member,
      specialties: normalizeStringArray(member.specialties),
    }))
    return apiResponse(normalized)
  } catch (error) {
    console.error('Error fetching team members:', error)
    return apiError('Failed to fetch team members', 500)
  }
})

export const POST = withAuth(async (user, request) => {
  try {
    const body = await request.json()
    const validatedData = teamSchema.parse(body)

    const result = await query(
      `INSERT INTO team_members (name, role, specialties, image_url, bio, experience_years, rating, client_count, display_order, active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        validatedData.name,
        validatedData.role,
        validatedData.specialties ? JSON.stringify(validatedData.specialties) : null,
        validatedData.image_url || null,
        validatedData.bio || null,
        validatedData.experience_years || null,
        validatedData.rating || null,
        validatedData.client_count || null,
        validatedData.display_order,
        validatedData.active,
      ]
    )

    if (!result || result.length === 0) {
      return apiError('Failed to create team member', 500)
    }

    await createAuditLog({
      admin_id: user.id,
      action: AuditActions.CREATE,
      entity_type: AuditEntityTypes.TEAM_MEMBER,
      entity_id: result[0].id,
      changes: { created: result[0] },
    })

    return apiResponse(result[0], 201)
  } catch (error: any) {
    console.error('Error creating team member:', error)
    if (error.name === 'ZodError') {
      return apiError(error.errors[0].message, 400)
    }
    return apiError('Failed to create team member', 500)
  }
})
