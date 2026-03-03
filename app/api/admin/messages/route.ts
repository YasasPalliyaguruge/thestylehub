import { withAuth, apiResponse, apiError } from '@/lib/auth-helpers'
import { query } from '@/lib/db'

export const GET = withAuth(async (user, request) => {
  try {
    const { searchParams } = new URL(request.url)
    const unreadOnly = searchParams.get('unread') === 'true'

    let sql = 'SELECT * FROM contact_messages'
    const params: string[] = []

    if (unreadOnly) {
      sql += ' WHERE read = false ORDER BY created_at DESC'
    } else {
      sql += ' ORDER BY created_at DESC'
    }

    const messages = await query(sql, params)

    return apiResponse({
      messages: messages || [],
      count: messages?.length || 0,
    })
  } catch (error) {
    console.error('Error fetching messages:', error)
    return apiError('Failed to fetch messages', 500)
  }
})
