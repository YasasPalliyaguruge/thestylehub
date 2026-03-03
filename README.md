# The Style Hub (Salon Web + Admin CMS)

Production-ready Next.js application for a salon website with a protected admin panel and PostgreSQL backend.

## Tech Stack

- Next.js 16 (App Router)
- React 19 + TypeScript
- Tailwind CSS
- NextAuth (credentials)
- Neon Postgres (`@neondatabase/serverless`)
- Resend (transactional email)

## Features

- Public website sections (hero, services, portfolio, team, pricing, testimonials)
- Booking wizard with availability checks and collision prevention
- Contact form with persistence and email notifications
- Full admin CMS for services, team, portfolio, pricing, testimonials, business info, hero content
- Admin inbox for bookings and contact messages
- Audit logging for admin write actions

## Environment Variables

Copy `.env.local.example` to `.env.local` and fill values:

- `DATABASE_URL`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `RESEND_API_KEY` (optional in local dev)
- `RESEND_FROM_EMAIL`
- `RESEND_FROM_NAME`

## Setup

```bash
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

Default seeded admin credentials:

- Email: `admin@stylehub.com`
- Password: `admin123`

Change password immediately after first login.

## Quality Checks

```bash
npm run lint
npm run build
```

## Production Deployment Checklist

1. Set all required env vars in your hosting provider.
2. Run DB migrations against production DB: `npm run db:migrate`.
3. Seed only if you need initial data: `npm run db:seed`.
4. Ensure `NEXTAUTH_URL` points to your live domain.
5. Use HTTPS and secure cookie defaults (already handled in production mode).
6. Verify admin login, booking creation, contact form, and admin CRUD after deployment.

## Notes

- Admin routes are protected by auth proxy and server-side auth checks.
- Deprecated `middleware.ts` was migrated to `proxy.ts` for Next.js 16 conventions.
