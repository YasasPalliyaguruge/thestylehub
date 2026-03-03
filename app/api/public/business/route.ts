import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

// GET /api/public/business - Fetch business information
export async function GET() {
  try {
    const business = await query(`
      SELECT id, salon_name, tagline, description, address, phone, email, hours, social_links
      FROM business_info
      LIMIT 1
    `)

    return NextResponse.json({ success: true, data: business[0] || null })
  } catch (error) {
    console.error('Error fetching business info:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch business info' },
      { status: 500 }
    )
  }
}
