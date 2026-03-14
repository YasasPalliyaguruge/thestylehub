import { withRoles, apiResponse, apiError, hashPassword, isValidEmail, isValidPassword } from '@/lib/auth-helpers'
import { createAuditLog, AuditActions, AuditEntityTypes } from '@/lib/audit-log'
import { query } from '@/lib/db'
import { z } from 'zod'

const userSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['admin', 'employee']).optional(),
})

export const GET = withRoles('admin', async () => {
  try {
    const users = await query(
      `SELECT id, name, email, role, active, created_at, last_login
       FROM admin_users
       ORDER BY created_at DESC`
    )
    return apiResponse(users || [])
  } catch (error) {
    console.error('Error fetching users:', error)
    return apiError('Failed to fetch users', 500)
  }
})

export const POST = withRoles('admin', async (user, request) => {
  try {
    const body = await request.json()
    const validated = userSchema.parse(body)

    const normalizedEmail = validated.email.trim().toLowerCase()
    const normalizedName = validated.name.trim()

    if (!isValidEmail(normalizedEmail)) {
      return apiError('Invalid email address', 400)
    }
    if (!isValidPassword(validated.password)) {
      return apiError('Password must be at least 8 characters with upper, lower, and number', 400)
    }

    const existing = await query('SELECT id FROM admin_users WHERE LOWER(email) = LOWER($1)', [normalizedEmail])
    if (existing?.length) {
      return apiError('Email already exists', 400)
    }

    const passwordHash = await hashPassword(validated.password)

    const result = await query(
      `INSERT INTO admin_users (email, password_hash, name, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, name, role, active, created_at, last_login`,
      [normalizedEmail, passwordHash, normalizedName, validated.role || 'employee']
    )

    const created = result?.[0]
    if (!created) return apiError('Failed to create user', 500)

    await createAuditLog({
      admin_id: user.id,
      action: AuditActions.CREATE,
      entity_type: AuditEntityTypes.ADMIN_USER,
      entity_id: created.id,
      changes: { created },
    })

    return apiResponse(created, 201)
  } catch (error: any) {
    if (error.name === 'ZodError') return apiError(error.errors[0].message, 400)
    console.error('Error creating user:', error)
    return apiError('Failed to create user', 500)
  }
})
