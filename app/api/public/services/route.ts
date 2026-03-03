import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

// GET /api/public/services - Fetch all active services
export async function GET() {
  try {
    const services = await query(`
      SELECT id, name, description, price::float as price, duration, icon, category, popular, active
      FROM services
      WHERE active = true
      ORDER BY category ASC, display_order ASC, name ASC
    `)

    return NextResponse.json({ success: true, data: services })
  } catch (error) {
    console.error('Error fetching services:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch services' },
      { status: 500 }
    )
  }
}
