import { Resend } from 'resend'

// Skip email on localhost or if API key is not configured
const isLocalhost = process.env.NODE_ENV !== 'production'
const resendApiKey = process.env.RESEND_API_KEY

const resend = resendApiKey ? new Resend(resendApiKey) : null

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'noreply@thestylehub.com'
const FROM_NAME = process.env.RESEND_FROM_NAME || 'The Style Hub'

// Log email content in development instead of sending
function logEmail(subject: string, to: string, html: string) {
  console.log('\n📧 [EMAIL SKIPPED - localhost]')
  console.log(`To: ${to}`)
  console.log(`Subject: ${subject}`)
  console.log('--- HTML Content ---')
  console.log(html.substring(0, 200) + '...')
  console.log('---------------------\n')
}

export async function sendBookingConfirmationEmail(
  to: string,
  bookingData: {
    name: string
    services: Array<{ name: string; price: number }>
    stylist: string
    date: string
    time: string
  }
) {
  try {
    // Calculate total price
    const totalPrice = bookingData.services.reduce((sum, s) => sum + (s.price || 0), 0)

    const emailHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Booking Confirmed - The Style Hub</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #D4AF37 0%, #F4E4C1 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .header h1 { color: #0A0A0A; margin: 0; font-size: 28px; }
    .content { background: #fff; padding: 30px; border: 1px solid #e0e0e0; }
    .booking-details { background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e0e0e0; }
    .detail-row:last-child { border-bottom: none; }
    .detail-label { font-weight: bold; color: #D4AF37; }
    .service-item { padding: 8px 0; border-bottom: 1px dashed #e0e0e0; }
    .service-item:last-child { border-bottom: none; }
    .service-name { font-weight: 500; }
    .service-price { color: #D4AF37; font-weight: bold; }
    .total-row { display: flex; justify-content: space-between; padding: 12px 0; border-top: 2px solid #D4AF37; margin-top: 10px; font-weight: bold; font-size: 16px; }
    .footer { background: #0A0A0A; color: #fff; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; font-size: 14px; }
    .footer a { color: #D4AF37; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✂️ Booking Confirmed</h1>
    </div>
    <div class="content">
      <p>Dear <strong>${bookingData.name}</strong>,</p>
      <p>Thank you for booking with The Style Hub! We're excited to see you.</p>
      <div class="booking-details">
        <div class="detail-row">
          <span class="detail-label">Services:</span>
        </div>
        ${bookingData.services.map(s => `
          <div class="service-item">
            <span class="service-name">${s.name}</span>
            ${s.price ? `<span class="service-price">LKR ${s.price.toLocaleString()}</span>` : ''}
          </div>
        `).join('')}
        ${totalPrice > 0 ? `
          <div class="total-row">
            <span>Total:</span>
            <span>LKR ${totalPrice.toLocaleString()}</span>
          </div>
        ` : ''}
        <div class="detail-row">
          <span class="detail-label">Stylist:</span>
          <span>${bookingData.stylist}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Date:</span>
          <span>${new Date(bookingData.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Time:</span>
          <span>${bookingData.time}</span>
        </div>
      </div>
      <p><strong>Please arrive 10 minutes early</strong> for your appointment.</p>
      <p>If you need to reschedule or cancel, please call us at <strong>+94 (31) 223-4567</strong>.</p>
    </div>
    <div class="footer">
      <p>The Style Hub • No. 123, Main Street, Negombo 11500, Sri Lanka</p>
      <p>+94 (31) 223-4567 • <a href="mailto:thestylehub.negombo@gmail.com">thestylehub.negombo@gmail.com</a></p>
    </div>
  </div>
</body>
</html>`

    // Skip sending emails on localhost
    if (isLocalhost || !resend) {
      logEmail('Booking Confirmed - The Style Hub', to, emailHtml)
      return { success: true, skipped: true }
    }

    const { data, error } = await resend!.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: to,
      subject: 'Booking Confirmed - The Style Hub',
      html: emailHtml,
    })

    if (error) {
      console.error('Email error:', error)
      return { success: false, error }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Failed to send email:', error)
    return { success: false, error }
  }
}

export async function sendContactNotificationEmail(
  contactData: {
    name: string
    email: string
    phone?: string
    message: string
  }
) {
  try {
    const emailHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Contact Form Submission</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #D4AF37 0%, #F4E4C1 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .header h1 { color: #0A0A0A; margin: 0; }
    .content { background: #fff; padding: 30px; border: 1px solid #e0e0e0; }
    .info { background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 10px 0; }
    .info p { margin: 5px 0; }
    .message-box { background: #f0f0f0; padding: 15px; border-left: 4px solid #D4AF37; margin: 15px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📬 New Contact Form Submission</h1>
    </div>
    <div class="content">
      <h2>Contact Information:</h2>
      <div class="info">
        <p><strong>Name:</strong> ${contactData.name}</p>
        <p><strong>Email:</strong> <a href="mailto:${contactData.email}">${contactData.email}</a></p>
        ${contactData.phone ? `<p><strong>Phone:</strong> <a href="tel:${contactData.phone}">${contactData.phone}</a></p>` : ''}
        <p><strong>Sent:</strong> ${new Date().toLocaleString()}</p>
      </div>
      <h3>Message:</h3>
      <div class="message-box">
        ${contactData.message.replace(/\n/g, '<br>')}
      </div>
    </div>
  </div>
</body>
</html>`

    // Skip sending emails on localhost
    if (isLocalhost || !resend) {
      logEmail(`New Contact Form Submission from ${contactData.name}`, 'thestylehub.negombo@gmail.com', emailHtml)
      return { success: true, skipped: true }
    }

    const { data, error } = await resend!.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: 'thestylehub.negombo@gmail.com',
      subject: `New Contact Form Submission from ${contactData.name}`,
      html: emailHtml,
    })

    if (error) {
      console.error('Email error:', error)
      return { success: false, error }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Failed to send notification email:', error)
    return { success: false, error }
  }
}

export async function sendContactConfirmationEmail(
  to: string,
  name: string
) {
  try {
    const emailHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Thank You - The Style Hub</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #D4AF37 0%, #F4E4C1 100%); padding: 30px; text-align: center; border-radius: 10px; }
    .header h1 { color: #0A0A0A; margin: 0; }
    .content { background: #fff; padding: 30px; border: 1px solid #e0e0e0; border-radius: 0 0 10px 10px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✉️ Message Received</h1>
    </div>
    <div class="content">
      <p>Dear <strong>${name}</strong>,</p>
      <p>Thank you for contacting The Style Hub!</p>
      <p>We have received your message and will get back to you within 24 hours.</p>
      <p>If you need immediate assistance, please call us at <strong>+94 (31) 223-4567</strong>.</p>
      <p>We look forward to serving you!</p>
    </div>
  </div>
</body>
</html>`

    // Skip sending emails on localhost
    if (isLocalhost || !resend) {
      logEmail('Thank you for contacting The Style Hub', to, emailHtml)
      return { success: true, skipped: true }
    }

    const { data, error } = await resend!.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: to,
      subject: 'Thank you for contacting The Style Hub',
      html: emailHtml,
    })

    if (error) {
      console.error('Email error:', error)
      return { success: false, error }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Failed to send confirmation email:', error)
    return { success: false, error }
  }
}
