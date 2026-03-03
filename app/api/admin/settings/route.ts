import { withAuth, apiResponse } from '@/lib/auth-helpers'
import { query } from '@/lib/db'

export const GET = withAuth(async (user) => {
  const result = await query(
    'SELECT id, name, email, role, last_login, created_at FROM admin_users WHERE id = $1',
    [user.id]
  )

  if (!result || result.length === 0) {
    return apiResponse({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      last_login: null,
      created_at: new Date().toISOString(),
    })
  }

  return apiResponse(result[0])
})
