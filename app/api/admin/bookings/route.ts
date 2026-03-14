import { withRoles, apiResponse, apiError } from '@/lib/auth-helpers'
import { query } from '@/lib/db'

function normalizeServices(value: unknown): Array<{ name: string; price: number }> {
  let source: unknown[] = []

  if (Array.isArray(value)) {
    source = value
  } else if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      source = Array.isArray(parsed) ? parsed : []
    } catch {
      source = []
    }
  }

  return source
    .map((item) => {
      if (!item || typeof item !== 'object') return null
      const row = item as Record<string, unknown>
      return {
        name: typeof row.name === 'string' ? row.name : 'Service',
        price: typeof row.price === 'number' ? row.price : Number(row.price) || 0,
      }
    })
    .filter((item): item is { name: string; price: number } => item !== null)
}

export const GET = withRoles(['admin', 'employee'], async (user, request) => {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    let sql = 'SELECT * FROM bookings'
    const params: string[] = []

    if (status) {
      sql += ' WHERE status = $1 ORDER BY created_at DESC'
      params.push(status)
    } else {
      sql += ' ORDER BY created_at DESC'
    }

    const bookings = await query(sql, params)
    const normalized = (bookings || []).map((booking: any) => ({
      ...booking,
      services: normalizeServices(booking.services),
    }))

    return apiResponse({
      bookings: normalized,
      count: normalized.length,
    })
  } catch (error) {
    console.error('Error fetching bookings:', error)
    return apiError('Failed to fetch bookings', 500)
  }
})
