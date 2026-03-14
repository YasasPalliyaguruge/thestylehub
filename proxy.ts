import { auth } from '@/lib/auth'

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isLoggedIn = !!req.auth
  const isAdminRoute = pathname.startsWith('/admin')
  const isAdminApiRoute = pathname.startsWith('/api/admin')

  const employeeAllowedPrefixes = [
    '/admin/pos',
    '/admin/bookings',
    '/api/admin/pos',
    '/api/admin/bookings',
    '/api/admin/settings',
    '/api/admin/services',
  ]

  if (!isAdminRoute && !isAdminApiRoute) {
    return
  }

  // Allow unauthenticated access to login page.
  if (pathname === '/admin/login' || pathname.startsWith('/admin/login/')) {
    return
  }

  if (!isLoggedIn) {
    if (isAdminApiRoute) {
      return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    const url = new URL('/admin/login', req.url)
    url.searchParams.set('callbackUrl', pathname)
    return Response.redirect(url)
  }

  const role = req.auth?.user?.role
  if (role === 'employee') {
    const allowed = employeeAllowedPrefixes.some((prefix) => pathname.startsWith(prefix))
    if (!allowed) {
      if (isAdminApiRoute) {
        return Response.json({ success: false, error: 'Forbidden' }, { status: 403 })
      }
      return Response.redirect(new URL('/admin/pos', req.url))
    }
  }
})

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
}
