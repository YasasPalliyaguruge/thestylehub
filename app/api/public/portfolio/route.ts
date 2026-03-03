import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

// GET /api/public/portfolio - Fetch all active portfolio items
export async function GET() {
  try {
    const portfolio = await query(`
      SELECT p.id, p.before_image_url as before, p.after_image_url as after,
             p.category, t.name as stylist, p.display_order, p.active
      FROM portfolio_items p
      LEFT JOIN team_members t ON p.stylist_id = t.id
      WHERE p.active = true
      ORDER BY p.display_order ASC, p.category ASC
    `)

    return NextResponse.json({ success: true, data: portfolio })
  } catch (error) {
    console.error('Error fetching portfolio items:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch portfolio items' },
      { status: 500 }
    )
  }
}
