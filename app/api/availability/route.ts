import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { z } from 'zod'

const availabilitySchema = z.object({
  stylist: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
})

// GET endpoint to check availability for a stylist on a specific date
// Returns array of already booked time slots
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const stylist = searchParams.get('stylist')
    const date = searchParams.get('date')

    const parsed = availabilitySchema.safeParse({ stylist, date })
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid parameters: stylist and date are required' },
        { status: 400 }
      )
    }

    // Query bookings for this stylist on this date
    // Only include active bookings (not cancelled)
    const result = await query(
      `SELECT time, services
       FROM bookings
       WHERE stylist = $1
         AND date = $2
         AND status NOT IN ('cancelled', 'completed')
       ORDER BY time`,
      [stylist, date]
    )

    // Extract booked time slots
    const bookedSlots = result.map((booking: any) => booking.time)

    return NextResponse.json({
      success: true,
      bookedSlots,
      count: bookedSlots.length,
    })
  } catch (error) {
    console.error('Availability API error:', error)
    return NextResponse.json(
      { error: 'Failed to check availability' },
      { status: 500 }
    )
  }
}
