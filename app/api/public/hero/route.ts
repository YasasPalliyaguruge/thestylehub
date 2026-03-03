import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

// GET /api/public/hero - Fetch active hero content
export async function GET() {
  try {
    const hero = await query(`
      SELECT
        id,
        headline,
        subheadline as subtitle,
        badge_text,
        primary_cta_text as cta_button_text,
        secondary_cta_text as secondary_button_text,
        active
      FROM hero_content
      WHERE active = true
      LIMIT 1
    `)

    return NextResponse.json({ success: true, data: hero[0] || null })
  } catch (error) {
    console.error('Error fetching hero content:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch hero content' },
      { status: 500 }
    )
  }
}
