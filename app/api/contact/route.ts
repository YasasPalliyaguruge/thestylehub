import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { sendContactNotificationEmail, sendContactConfirmationEmail } from '@/lib/email'
import { z } from 'zod'

const contactSchema = z.object({
  name: z.string().trim().min(2),
  email: z.email(),
  phone: z.string().trim().min(7).max(20).optional().or(z.literal('')),
  message: z.string().trim().min(10),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = contactSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid contact payload' },
        { status: 400 }
      )
    }

    const { name, email, phone, message } = parsed.data

    // Insert contact message into database
    const result = await query(
      `INSERT INTO contact_messages (name, email, phone, message)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name, email, phone || null, message]
    )

    if (!result || result.length === 0) {
      return NextResponse.json(
        { error: 'Failed to save message' },
        { status: 500 }
      )
    }

    const contact = result[0]

    // Send notification email to business
    const notificationEmailResult = await sendContactNotificationEmail({
      name,
      email,
      phone,
      message,
    })

    // Send confirmation email to sender
    const confirmationEmailResult = await sendContactConfirmationEmail(email, name)

    return NextResponse.json({
      success: true,
      message: 'Your message has been sent successfully. We will get back to you soon!',
      notificationEmailSent: notificationEmailResult.success,
      confirmationEmailSent: confirmationEmailResult.success,
    })
  } catch (error) {
    console.error('Contact API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET endpoint to retrieve contact messages (for admin purposes - requires auth)
// This endpoint is deprecated - use /api/admin/messages instead
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
    const unreadOnly = searchParams.get('unread') === 'true'

    let sql = 'SELECT id, name, email, phone, message, read, created_at FROM contact_messages'
    const params: string[] = []

    if (unreadOnly) {
      sql += ' WHERE read = false ORDER BY created_at DESC'
    } else {
      sql += ' ORDER BY created_at DESC'
    }

    const messages = await query(sql, params)

    return NextResponse.json({
      success: true,
      messages: messages || [],
      count: messages?.length || 0,
    })
  } catch (error) {
    console.error('Contact GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
