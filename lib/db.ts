import { neon } from '@neondatabase/serverless'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set')
}

// Create Neon serverless connection (tagged template function)
// Don't set global timeout - will be set per query
export const db = neon(process.env.DATABASE_URL)

// Helper function to run queries with $1, $2 style placeholders
// Converts to tagged template syntax dynamically
// Includes retry logic for network issues
export async function query<T = any>(sql: string, params?: any[], retries = 4): Promise<T[]> {
  let lastError: any

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const p = params || []
      const paramCount = p.length

      // Replace $1, $2, etc. with empty placeholders for splitting
      let tempSql = sql
      for (let i = 1; i <= paramCount; i++) {
        tempSql = tempSql.replace(`$${i}`, '\x00')
      }
      const parts = tempSql.split('\x00')

      // Create proper TemplateStringsArray
      const templateStrings = [...parts] as any
      templateStrings.raw = [...parts]
      Object.freeze(templateStrings.raw)
      Object.freeze(templateStrings)

      // Execute using tagged template with per-query timeout
      const result = await Promise.race([
        (db as any)(templateStrings, ...p),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Query timeout')), 45000)
        ) as Promise<T[]>
      ])
      return result as T[]
    } catch (error: any) {
      lastError = error

      // Check if this is a network/timeout error that's worth retrying
      const isNetworkError =
        error?.code === 'ETIMEDOUT' ||
        error?.code === 'ECONNRESET' ||
        error?.code === 23 || // TIMEOUT_ERR
        error?.message?.includes('fetch failed') ||
        error?.message?.includes('timeout') ||
        error?.message?.includes('network') ||
        error?.message?.includes('aborted') ||
        error?.message === 'Query timeout'

      if (isNetworkError && attempt < retries) {
        console.warn(`Database query failed (attempt ${attempt + 1}/${retries + 1}), retrying...`)
        // Wait before retry with exponential backoff (up to 8 seconds)
        await new Promise(resolve => setTimeout(resolve, Math.min(2000 * Math.pow(2, attempt), 8000)))
        continue
      }

      // If not a network error or out of retries, throw
      console.error('Database query error:', error)
      throw error
    }
  }

  // Should never reach here, but TypeScript needs it
  throw lastError
}

// Bookings
export interface Booking {
  id: string
  services: Array<{ name: string; price: number }>
  stylist: string
  date: string
  time: string
  name: string
  email: string
  phone: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  created_at: string
}

// Contact messages
export interface ContactMessage {
  id: string
  name: string
  email: string
  phone?: string
  message: string
  read: boolean
  created_at: string
}
