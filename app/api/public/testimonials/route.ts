import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

// GET /api/public/testimonials - Fetch all active testimonials (featured first)
export async function GET() {
  try {
    const testimonials = await query(`
      SELECT id, client_name as name, service, text, rating, image_url as image,
             featured, display_order, active, created_at
      FROM testimonials
      WHERE active = true
      ORDER BY featured DESC, display_order ASC, created_at DESC
    `)

    return NextResponse.json({ success: true, data: testimonials })
  } catch (error) {
    console.error('Error fetching testimonials:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch testimonials' },
      { status: 500 }
    )
  }
}
