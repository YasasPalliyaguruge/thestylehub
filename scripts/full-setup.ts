import { config } from 'dotenv'
config({ path: '.env.local' })

import { Client } from 'pg'
import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'
import { hash } from 'bcryptjs'
import { randomUUID } from 'crypto'
import { services, team, portfolio, testimonials, pricing } from '../lib/data'

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL not set')
    process.exit(1)
  }

  const client = new Client({ connectionString: process.env.DATABASE_URL })
  await client.connect()
  console.log('✅ Connected to Neon PostgreSQL\n')

  // ─── STEP 1: Run all migration files as complete SQL blocks ─────
  console.log('═══ STEP 1: Running migrations ═══')
  const migrationsDir = join(process.cwd(), 'db', 'migrations')
  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort()

  for (const file of files) {
    const sql = readFileSync(join(migrationsDir, file), 'utf-8')
    try {
      await client.query(sql)
      console.log(`  ✓ ${file}`)
    } catch (err: any) {
      if (
        err.message?.includes('already exists') ||
        err.message?.includes('duplicate key')
      ) {
        console.log(`  ⚠ ${file} (already applied)`)
      } else {
        console.error(`  ✗ ${file}: ${err.message}`)
      }
    }
  }

  // ─── STEP 2: Upsert admin with proper bcrypt hash ──────────────
  console.log('\n═══ STEP 2: Admin user ═══')
  const adminPassword = await hash('admin123', 12)
  await client.query(
    `INSERT INTO admin_users (email, password_hash, name, role, active)
     VALUES ($1, $2, $3, $4, true)
     ON CONFLICT (email) DO UPDATE SET password_hash = $2`,
    ['admin@stylehub.com', adminPassword, 'Admin User', 'admin']
  )
  console.log('  ✓ admin@stylehub.com / admin123')

  // ─── STEP 3: Clear stale seed data to avoid duplicates ─────────
  console.log('\n═══ STEP 3: Clearing stale seed data ═══')
  await client.query(`DELETE FROM portfolio_items`)
  await client.query(`DELETE FROM testimonials`)
  await client.query(`DELETE FROM pricing_packages`)
  await client.query(`DELETE FROM services`)
  await client.query(`DELETE FROM team_members WHERE id NOT IN (SELECT DISTINCT employee_id FROM employee_attendance WHERE employee_id IS NOT NULL UNION SELECT DISTINCT employee_id FROM pos_invoices WHERE employee_id IS NOT NULL UNION SELECT DISTINCT employee_id FROM bookings WHERE employee_id IS NOT NULL)`)
  console.log('  ✓ Cleared old seed rows')

  // ─── STEP 4: Seed services ─────────────────────────────────────
  console.log('\n═══ STEP 4: Services ═══')
  for (const svc of services) {
    await client.query(
      `INSERT INTO services (id, name, description, price, duration, icon, category, popular, display_order, active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0, true)`,
      [
        randomUUID(),
        svc.name,
        svc.description,
        svc.price,
        svc.duration,
        svc.icon,
        svc.category,
        svc.popular || false,
      ]
    )
  }
  console.log(`  ✓ ${services.length} services`)

  // ─── STEP 5: Seed team members ─────────────────────────────────
  console.log('\n═══ STEP 5: Team members ═══')
  const teamIds: Record<string, string> = {}
  for (const member of team) {
    const uuid = randomUUID()
    await client.query(
      `INSERT INTO team_members (id, name, role, specialties, image_url, bio, experience_years, rating, client_count, active, display_order)
       VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7, $8, $9, true, 0)`,
      [
        uuid,
        member.name,
        member.role,
        JSON.stringify(member.specialties),
        member.image,
        member.bio,
        member.experience,
        member.rating,
        member.clients,
      ]
    )
    teamIds[member.name] = uuid
  }
  console.log(`  ✓ ${team.length} team members`)

  // ─── STEP 6: Seed portfolio ────────────────────────────────────
  console.log('\n═══ STEP 6: Portfolio ═══')
  for (const item of portfolio) {
    const stylistId = teamIds[item.stylist] || null
    await client.query(
      `INSERT INTO portfolio_items (id, before_image_url, after_image_url, category, stylist_id, active, display_order)
       VALUES ($1, $2, $3, $4, $5, true, 0)`,
      [randomUUID(), item.before, item.after, item.category, stylistId]
    )
  }
  console.log(`  ✓ ${portfolio.length} portfolio items`)

  // ─── STEP 7: Seed testimonials ─────────────────────────────────
  console.log('\n═══ STEP 7: Testimonials ═══')
  for (const t of testimonials) {
    await client.query(
      `INSERT INTO testimonials (id, client_name, service, text, rating, date, active, display_order)
       VALUES ($1, $2, $3, $4, $5, $6, true, 0)`,
      [randomUUID(), t.name, t.service, t.text, t.rating, t.date]
    )
  }
  console.log(`  ✓ ${testimonials.length} testimonials`)

  // ─── STEP 8: Seed pricing ─────────────────────────────────────
  console.log('\n═══ STEP 8: Pricing packages ═══')
  let pkgCount = 0
  for (const pkg of pricing.men) {
    await client.query(
      `INSERT INTO pricing_packages (id, name, description, gender, price, services, popular, active, display_order)
       VALUES ($1, $2, $3, 'men', $4, $5::jsonb, $6, true, 0)`,
      [randomUUID(), pkg.name, pkg.description, pkg.price, JSON.stringify(pkg.services), pkg.popular || false]
    )
    pkgCount++
  }
  for (const pkg of pricing.women) {
    await client.query(
      `INSERT INTO pricing_packages (id, name, description, gender, price, services, popular, active, display_order)
       VALUES ($1, $2, $3, 'women', $4, $5::jsonb, $6, true, 0)`,
      [randomUUID(), pkg.name, pkg.description, pkg.price, JSON.stringify(pkg.services), pkg.popular || false]
    )
    pkgCount++
  }
  console.log(`  ✓ ${pkgCount} pricing packages`)

  // ─── STEP 9: Business info & hero ─────────────────────────────
  console.log('\n═══ STEP 9: Business info & hero ═══')
  const bizCheck = await client.query(`SELECT count(*) FROM business_info`)
  if (parseInt(bizCheck.rows[0].count) === 0) {
    await client.query(`
      INSERT INTO business_info (salon_name, tagline, description, address, phone, email, hours, social_links)
      VALUES (
        'The Style Hub',
        'Premium Unisex Salon Experience',
        'Award-winning luxury salon experience. Expert stylists, premium services, and an atmosphere of elegance.',
        '123 Fashion Street, Style City, SC 12345',
        '+1 (555) 123-4567',
        'info@stylehub.com',
        '{"monday":{"open":"09:00","close":"20:00","closed":false},"tuesday":{"open":"09:00","close":"20:00","closed":false},"wednesday":{"open":"09:00","close":"20:00","closed":false},"thursday":{"open":"09:00","close":"20:00","closed":false},"friday":{"open":"09:00","close":"21:00","closed":false},"saturday":{"open":"08:00","close":"19:00","closed":false},"sunday":{"open":null,"close":null,"closed":true}}'::jsonb,
        '{"instagram":"https://instagram.com/stylehub","facebook":"https://facebook.com/stylehub","twitter":"https://twitter.com/stylehub"}'::jsonb
      )
    `)
    console.log('  ✓ Business info inserted')
  } else {
    console.log('  ⚠ Business info already exists')
  }

  const heroCheck = await client.query(`SELECT count(*) FROM hero_content`)
  if (parseInt(heroCheck.rows[0].count) === 0) {
    await client.query(`
      INSERT INTO hero_content (headline, subheadline, badge_text, primary_cta_text, primary_cta_link, secondary_cta_text, secondary_cta_link, active)
      VALUES (
        'Experience Luxury Styling',
        'Where artistry meets elegance. Transform your look with our award-winning stylists.',
        'Now Open',
        'Book Appointment', '#booking',
        'View Services', '#services',
        true
      )
    `)
    console.log('  ✓ Hero content inserted')
  } else {
    console.log('  ⚠ Hero content already exists')
  }

  // ─── STEP 10: Verification ────────────────────────────────────
  console.log('\n═══ VERIFICATION ═══')
  const tables = [
    'admin_users', 'services', 'team_members', 'bookings',
    'portfolio_items', 'testimonials', 'pricing_packages',
    'pos_invoices', 'finance_ledger', 'business_info', 'hero_content',
    'contact_messages', 'admin_audit_log',
    'employee_attendance', 'employee_service_logs',
    'employee_comp_settings', 'employee_payments',
  ]

  for (const table of tables) {
    try {
      const res = await client.query(`SELECT count(*) FROM ${table}`)
      console.log(`  ${table}: ${res.rows[0].count} rows`)
    } catch (err: any) {
      console.error(`  ✗ ${table}: MISSING`)
    }
  }

  await client.end()
  console.log('\n🎉 Database fully set up!')
  console.log('   Admin: admin@stylehub.com / admin123')
}

main().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})
