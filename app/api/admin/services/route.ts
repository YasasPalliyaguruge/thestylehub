import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { withAuth, apiResponse, apiError } from '@/lib/auth-helpers'
import { createAuditLog, AuditActions, AuditEntityTypes } from '@/lib/audit-log'
import { z } from 'zod'

// Validation schema
const serviceSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  price: z.number().positive('Price must be positive'),
  duration: z.string().optional(),
  icon: z.string().optional(),
  category: z.enum(['hair', 'beard', 'styling', 'color', 'treatment']),
  popular: z.boolean().default(false),
  display_order: z.number().default(0),
  active: z.boolean().default(true),
})

// GET /api/admin/services - List all services
export const GET = withAuth(async (user) => {
  try {
    const services = await query(`
      SELECT id, name, description, price::float as price, duration, icon, category, popular, display_order, active, created_at
      FROM services
      ORDER BY category ASC, display_order ASC, name ASC
    `)

    return apiResponse(services)
  } catch (error) {
    console.error('Error fetching services:', error)
    return apiError('Failed to fetch services', 500)
  }
})

// POST /api/admin/services - Create a new service
export const POST = withAuth(async (user, request) => {
  try {
    const body = await request.json()

    // Validate request body
    const validatedData = serviceSchema.parse(body)

    // Insert service
    const result = await query(
      `INSERT INTO services (name, description, price, duration, icon, category, popular, display_order, active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        validatedData.name,
        validatedData.description || null,
        validatedData.price,
        validatedData.duration || null,
        validatedData.icon || null,
        validatedData.category,
        validatedData.popular,
        validatedData.display_order,
        validatedData.active,
      ]
    )

    if (!result || result.length === 0) {
      return apiError('Failed to create service', 500)
    }

    const service = result[0]

    // Log the action
    await createAuditLog({
      admin_id: user.id,
      action: AuditActions.CREATE,
      entity_type: AuditEntityTypes.SERVICE,
      entity_id: service.id,
      changes: { created: service },
    })

    return apiResponse(service, 201)
  } catch (error: any) {
    console.error('Error creating service:', error)

    if (error.name === 'ZodError') {
      return apiError(error.errors[0].message, 400)
    }

    return apiError('Failed to create service', 500)
  }
})
