// Import and configure dotenv FIRST - before any other imports
import { config } from 'dotenv'
const result = config({ path: '.env.local' })

if (result.error) {
  console.error('Error loading .env.local:', result.error)
  process.exit(1)
}

// Now import other modules
import { neon } from '@neondatabase/serverless'
import { hash } from 'bcryptjs'
import { services, team, portfolio, testimonials, pricing } from '../lib/data'
import { randomUUID } from 'crypto'

const db = neon(process.env.DATABASE_URL!)

// Helper to generate UUID or use existing if valid
function getUUID(id: string): string {
  // Check if it's already a valid UUID (has dashes and 36 chars)
  if (id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
    return id
  }
  // Generate a UUID v5 based on the input string for consistency
  return randomUUID()
}

async function seedData() {
  console.log('🌱 Starting database seeding...')

  try {
    // Hash default admin password
    const adminPassword = await hash('admin123', 12)

    // Insert admin user
    console.log('📝 Inserting admin users...')
    await db`INSERT INTO admin_users (email, password_hash, name, role)
      VALUES ('admin@stylehub.com', ${adminPassword}, 'Admin User', 'admin')
      ON CONFLICT (email) DO NOTHING`

    // Get admin ID for audit logs
    const adminResult = await db`SELECT id FROM admin_users WHERE email = 'admin@stylehub.com'`
    const adminId = adminResult[0]?.id

    // Insert services
    console.log('✂️  Inserting services...')
    for (const service of services) {
      const uuid = getUUID(service.id)
      await db`INSERT INTO services (id, name, description, price, duration, icon, category, popular, display_order, active)
        VALUES (${uuid}, ${service.name}, ${service.description}, ${service.price}, ${service.duration}, ${service.icon}, ${service.category}, ${service.popular || false}, 0, true)
        ON CONFLICT (id) DO NOTHING`
    }

    // Insert team members
    console.log('👥 Inserting team members...')
    const teamMemberIds: Record<string, string> = {}
    for (const member of team) {
      const uuid = getUUID(member.id)
      await db`INSERT INTO team_members (id, name, role, specialties, image_url, bio, experience_years, rating, client_count, active, display_order)
        VALUES (${uuid}, ${member.name}, ${member.role}, ${JSON.stringify(member.specialties)}::jsonb, ${member.image}, ${member.bio}, ${member.experience}, ${member.rating}, ${member.clients}, true, 0)
        ON CONFLICT (id) DO NOTHING`
      teamMemberIds[member.name] = uuid
    }

    // Insert portfolio items
    console.log('🖼️  Inserting portfolio items...')
    for (const item of portfolio) {
      const uuid = getUUID(item.id)
      const stylistName = item.stylist || ''
      const stylistId = teamMemberIds[stylistName] || null
      await db`INSERT INTO portfolio_items (id, before_image_url, after_image_url, category, stylist_id, client_name, description, active, display_order)
        VALUES (${uuid}, ${item.before}, ${item.after}, ${item.category}, ${stylistId}, null, null, true, 0)
        ON CONFLICT (id) DO NOTHING`
    }

    // Insert testimonials
    console.log('⭐ Inserting testimonials...')
    for (const testimonial of testimonials) {
      const uuid = getUUID(testimonial.id)
      await db`INSERT INTO testimonials (id, client_name, service, text, rating, image_url, date, featured, active, display_order)
        VALUES (${uuid}, ${testimonial.name}, ${testimonial.service}, ${testimonial.text}, ${testimonial.rating}, null, ${testimonial.date}, false, true, 0)
        ON CONFLICT (id) DO NOTHING`
    }

    // Insert pricing packages
    console.log('💰 Inserting pricing packages...')
    for (const pkg of pricing.men) {
      const uuid = getUUID(`men-${pkg.id}`)
      await db`INSERT INTO pricing_packages (id, name, description, gender, price, services, popular, active, display_order)
        VALUES (${uuid}, ${pkg.name}, ${pkg.description}, 'men', ${pkg.price}, ${JSON.stringify(pkg.services)}::jsonb, ${pkg.popular || false}, true, 0)
        ON CONFLICT (id) DO NOTHING`
    }

    for (const pkg of pricing.women) {
      const uuid = getUUID(`women-${pkg.id}`)
      await db`INSERT INTO pricing_packages (id, name, description, gender, price, services, popular, active, display_order)
        VALUES (${uuid}, ${pkg.name}, ${pkg.description}, 'women', ${pkg.price}, ${JSON.stringify(pkg.services)}::jsonb, ${pkg.popular || false}, true, 0)
        ON CONFLICT (id) DO NOTHING`
    }

    console.log('✅ Database seeding completed successfully!')
    console.log('')
    console.log('Default admin credentials:')
    console.log('  Email: admin@stylehub.com')
    console.log('  Password: admin123')
    console.log('')
    console.log('⚠️  IMPORTANT: Change the default password after first login!')

  } catch (error) {
    console.error('❌ Error seeding database:', error)
    process.exit(1)
  }
}

// Run the seed function
seedData()
  .then(() => {
    console.log('🎉 Seeding complete!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  })
