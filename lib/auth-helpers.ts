import { compare, hash } from 'bcryptjs'
import { query } from './db'
import { auth } from './auth'

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return hash(password, 12)
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return compare(password, hashedPassword)
}

/**
 * Get the current session from server components
 */
export async function getSession() {
  try {
    const session = await auth()
    return session
  } catch (error) {
    console.error('Error getting session:', error)
    return null
  }
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession()
  return !!session?.user
}

/**
 * Get current user from session
 */
export async function getCurrentUser() {
  const session = await getSession()
  return session?.user || null
}

/**
 * Require authentication - throws if not authenticated
 */
export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized')
  }
  return user
}

/**
 * API route helper for protected routes
 * Wrap your API route handlers with this to require authentication
 */
export function withAuth<T>(
  handler: (user: any, request: Request, context?: any) => Promise<T>
) {
  return async (request: Request, context?: any): Promise<T | Response> => {
    try {
      const session = await auth()

      if (!session?.user) {
        return apiError('Unauthorized', 401)
      }

      return handler(session.user, request, context)
    } catch (error: any) {
      if (error?.message === 'Unauthorized') return apiError('Unauthorized', 401)
      console.error('Protected route error:', error)
      throw error
    }
  }
}

/**
 * Helper to create consistent API responses
 */
export function apiResponse<T>(data: T, status = 200) {
  return Response.json({ success: true, data }, { status })
}

/**
 * Helper to create error responses
 */
export function apiError(message: string, status = 400) {
  return Response.json({ success: false, error: message }, { status })
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate password strength
 * Minimum 8 characters, at least one uppercase, one lowercase, one number
 */
export function isValidPassword(password: string): boolean {
  if (password.length < 8) return false
  const hasUpperCase = /[A-Z]/.test(password)
  const hasLowerCase = /[a-z]/.test(password)
  const hasNumber = /\d/.test(password)
  return hasUpperCase && hasLowerCase && hasNumber
}
