import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { sendBookingConfirmationEmail } from '@/lib/email'
import { z } from 'zod'

const bookingSchema = z.object({
  services: z.array(z.object({
    name: z.string().min(1),
    price: z.number().nonnegative().optional().default(0),
  })).min(1, 'Please select at least one service'),
  stylist: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().min(1),
  name: z.string().min(2),
  email: z.email(),
  phone: z.string().min(7).max(20).optional().or(z.literal('')),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsedBody = bookingSchema.safeParse(body)

    // Support both old (service) and new (services) format
    const fallbackServices = body.service ? [{ name: body.service, price: 0 }] : null
    const servicesArray = parsedBody.success
      ? parsedBody.data.services
      : (fallbackServices || null)

    if (!servicesArray || !Array.isArray(servicesArray) || servicesArray.length === 0) {
      return NextResponse.json(
        { error: 'Please select at least one service' },
        { status: 400 }
      )
    }

    if (!parsedBody.success && !fallbackServices) {
      return NextResponse.json(
        { error: parsedBody.error.issues[0]?.message || 'Invalid booking data' },
        { status: 400 }
      )
    }

    const stylist = parsedBody.success ? parsedBody.data.stylist : body.stylist
    const date = parsedBody.success ? parsedBody.data.date : body.date
    const time = parsedBody.success ? parsedBody.data.time : body.time
    const name = parsedBody.success ? parsedBody.data.name : body.name
    const email = parsedBody.success ? parsedBody.data.email : body.email
    const phone = parsedBody.success ? parsedBody.data.phone : body.phone

    // Prevent double booking for same stylist/date/time.
    const existing = await query(
      `SELECT id
       FROM bookings
       WHERE stylist = $1
         AND date = $2
         AND time = $3
         AND status NOT IN ('cancelled', 'completed')
       LIMIT 1`,
      [stylist, date, time]
    )
    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'This time slot is no longer available. Please choose another time.' },
        { status: 409 }
      )
    }

    // Insert booking into database with services as JSONB
    const result = await query(
      `INSERT INTO bookings (services, stylist, date, time, name, email, phone)
       VALUES ($1::jsonb, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [JSON.stringify(servicesArray), stylist, date, time, name, email, phone || null]
    )

    if (!result || result.length === 0) {
      return NextResponse.json(
        { error: 'Failed to create booking' },
        { status: 500 }
      )
    }

    const booking = result[0]

    // Send confirmation email with services array
    const emailResult = await sendBookingConfirmationEmail(email, {
      name,
      services: servicesArray,
      stylist,
      date,
      time,
    })

    return NextResponse.json({
      success: true,
      booking: {
        id: booking.id,
        services: booking.services,
        stylist: booking.stylist,
        date: booking.date,
        time: booking.time,
        name: booking.name,
      },
      emailSent: emailResult.success,
    })
  } catch (error) {
    console.error('Booking API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET endpoint to retrieve bookings (for admin purposes - requires auth)
// This endpoint is deprecated - use /api/admin/bookings instead
export async function GET(request: NextRequest) {
  try {
    // Import auth dynamically to check session
    const { auth } = await import('@/lib/auth')
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    let sql = 'SELECT id, services, stylist, date, time, name, email, phone, status, created_at FROM bookings'
    const params: string[] = []

    if (status) {
      sql += ' WHERE status = $1 ORDER BY created_at DESC'
      params.push(status)
    } else {
      sql += ' ORDER BY created_at DESC'
    }

    const bookings = await query(sql, params)

    return NextResponse.json({
      success: true,
      bookings: bookings || [],
      count: bookings?.length || 0,
    })
  } catch (error) {
    console.error('Bookings GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
