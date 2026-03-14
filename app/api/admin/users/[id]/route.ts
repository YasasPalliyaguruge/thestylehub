import { withRoles, apiResponse, apiError, hashPassword, isValidPassword } from '@/lib/auth-helpers'
import { createAuditLog, AuditActions, AuditEntityTypes } from '@/lib/audit-log'
import { query } from '@/lib/db'
import { z } from 'zod'

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  role: z.enum(['admin', 'employee']).optional(),
  active: z.boolean().optional(),
  password: z.string().min(8).optional(),
})

export const PATCH = withRoles('admin', async (user, request, context) => {
  try {
    const { id } = await context.params
    const body = await request.json()
    const validated = updateSchema.parse(body)

    const current = await query('SELECT id, name, email, role, active FROM admin_users WHERE id = $1', [id])
    if (!current?.length) return apiError('User not found', 404)

    const updates: string[] = []
    const values: any[] = []
    let paramIndex = 1

    if (validated.name !== undefined) {
      updates.push(`name = $${paramIndex++}`)
      values.push(validated.name.trim())
    }
    if (validated.role !== undefined) {
      updates.push(`role = $${paramIndex++}`)
      values.push(validated.role)
    }
    if (validated.active !== undefined) {
      updates.push(`active = $${paramIndex++}`)
      values.push(validated.active)
    }

    if (validated.password !== undefined) {
      if (!isValidPassword(validated.password)) {
        return apiError('Password must be at least 8 characters with upper, lower, and number', 400)
      }
      const passwordHash = await hashPassword(validated.password)
      updates.push(`password_hash = $${paramIndex++}`)
      values.push(passwordHash)
    }

    if (!updates.length) {
      return apiResponse(current[0])
    }

    values.push(id)
    const result = await query(
      `UPDATE admin_users SET ${updates.join(', ')} WHERE id = $${paramIndex}
       RETURNING id, name, email, role, active, created_at, last_login`,
      values
    )

    await createAuditLog({
      admin_id: user.id,
      action: AuditActions.UPDATE,
      entity_type: AuditEntityTypes.ADMIN_USER,
      entity_id: id,
      changes: { before: current[0], after: result[0] },
    })

    return apiResponse(result[0])
  } catch (error: any) {
    if (error.name === 'ZodError') return apiError(error.errors[0].message, 400)
    console.error('Error updating user:', error)
    return apiError('Failed to update user', 500)
  }
})
