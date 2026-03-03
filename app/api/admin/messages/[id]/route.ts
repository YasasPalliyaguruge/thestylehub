import { withAuth, apiResponse, apiError } from '@/lib/auth-helpers'
import { query } from '@/lib/db'
import { z } from 'zod'

const messageUpdateSchema = z.object({
  read: z.boolean(),
})

export const GET = withAuth(async (user, request, context) => {
  try {
    const { id } = await context.params
    const result = await query('SELECT * FROM contact_messages WHERE id = $1', [id])
    if (!result?.length) return apiError('Message not found', 404)

    // Mark as read when viewed.
    await query('UPDATE contact_messages SET read = true WHERE id = $1', [id])

    return apiResponse({ ...result[0], read: true })
  } catch (error) {
    console.error('Error fetching message:', error)
    return apiError('Failed to fetch message', 500)
  }
})

export const PATCH = withAuth(async (user, request, context) => {
  try {
    const { id } = await context.params
    const body = await request.json()

    const currentResult = await query('SELECT * FROM contact_messages WHERE id = $1', [id])
    if (!currentResult?.length) return apiError('Message not found', 404)

    const validatedData = messageUpdateSchema.parse(body)

    const result = await query(
      'UPDATE contact_messages SET read = $1 WHERE id = $2 RETURNING *',
      [validatedData.read, id]
    )

    return apiResponse(result[0])
  } catch (error: any) {
    if (error.name === 'ZodError') return apiError(error.errors[0].message, 400)
    return apiError('Failed to update message', 500)
  }
})

export const DELETE = withAuth(async (user, request, context) => {
  try {
    const { id } = await context.params
    const currentResult = await query('SELECT * FROM contact_messages WHERE id = $1', [id])
    if (!currentResult?.length) return apiError('Message not found', 404)

    await query('DELETE FROM contact_messages WHERE id = $1', [id])

    return apiResponse({ message: 'Message deleted successfully' })
  } catch (error) {
    console.error('Error deleting message:', error)
    return apiError('Failed to delete message', 500)
  }
})
