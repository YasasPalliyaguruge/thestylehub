import { auth } from '@/lib/auth'

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isLoggedIn = !!req.auth

  // Skip protection for API routes and non-admin routes.
  if (pathname.startsWith('/api') || !pathname.startsWith('/admin')) {
    return
  }

  // Allow unauthenticated access to login page.
  if (pathname === '/admin/login' || pathname.startsWith('/admin/login/')) {
    return
  }

  if (!isLoggedIn) {
    const url = new URL('/admin/login', req.url)
    return Response.redirect(url)
  }
})

export const config = {
  matcher: ['/admin/:path*'],
}
