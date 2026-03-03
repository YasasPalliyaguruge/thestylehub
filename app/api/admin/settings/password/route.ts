import { withAuth, apiResponse, apiError } from '@/lib/auth-helpers'
import { query } from '@/lib/db'
import { compare, hash } from 'bcryptjs'

export const POST = withAuth(async (user, request) => {
  try {
    const body = await request.json()
    const { currentPassword, newPassword } = body

    if (!currentPassword || !newPassword) {
      return apiError('Current password and new password are required', 400)
    }

    if (newPassword.length < 8) {
      return apiError('New password must be at least 8 characters long', 400)
    }

    // Get current password hash
    const result = await query<{ password_hash: string }>(
      'SELECT password_hash FROM admin_users WHERE id = $1',
      [user.id]
    )

    if (!result || result.length === 0) {
      return apiError('User not found', 404)
    }

    // Verify current password
    const isValid = await compare(currentPassword, result[0].password_hash)

    if (!isValid) {
      return apiError('Current password is incorrect', 400)
    }

    // Hash new password
    const newPasswordHash = await hash(newPassword, 12)

    // Update password
    await query('UPDATE admin_users SET password_hash = $1 WHERE id = $2', [
      newPasswordHash,
      user.id,
    ])

    return apiResponse({ message: 'Password updated successfully' })
  } catch (error) {
    console.error('Error updating password:', error)
    return apiError('Failed to update password', 500)
  }
})
