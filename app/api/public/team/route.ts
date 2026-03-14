import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

function normalizeStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((v): v is string => typeof v === 'string')
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : []
    } catch {
      return []
    }
  }
  return []
}

// GET /api/public/team - Fetch all active team members
export async function GET() {
  try {
    const team = await query(`
      SELECT id, name, role, specialties, bio,
             experience_years as experience, rating, client_count as clients,
             display_order, active
      FROM team_members
      WHERE active = true
      ORDER BY display_order ASC, name ASC
    `)

    const normalized = (team || []).map((member: any) => ({
      ...member,
      specialties: normalizeStringArray(member.specialties),
    }))

    return NextResponse.json({ success: true, data: normalized })
  } catch (error) {
    console.error('Error fetching team members:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch team members' },
      { status: 500 }
    )
  }
}
