import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

// GET /api/public/pricing - Fetch all active pricing packages
export async function GET() {
  try {
    const pricing = await query(`
      SELECT id, name, description, gender, price::float as price, services, popular, active, display_order
      FROM pricing_packages
      WHERE active = true
      ORDER BY gender ASC, display_order ASC, price ASC
    `)

    return NextResponse.json({ success: true, data: pricing })
  } catch (error) {
    console.error('Error fetching pricing packages:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch pricing packages' },
      { status: 500 }
    )
  }
}
