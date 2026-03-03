import NextAuth, { NextAuthConfig } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { compare } from 'bcryptjs'
import { query } from './db'
import type { DefaultSession } from 'next-auth'

export interface AdminUser {
  id: string
  email: string
  name: string
  role: string
}

declare module 'next-auth' {
  interface User {
    id: string
    role: string
  }
  interface Session {
    user: {
      id: string
      role: string
    } & DefaultSession['user']
  }
}

async function getUserByEmail(email: string): Promise<AdminUser | null> {
  try {
    const result = await query<AdminUser>(
      'SELECT id, email, name, role FROM admin_users WHERE email = $1 AND active = true',
      [email]
    )
    return result?.[0] || null
  } catch (error) {
    console.error('Error fetching user:', error)
    return null
  }
}

async function verifyPassword(email: string, password: string): Promise<AdminUser | null> {
  try {
    const result = await query<{ id: string; email: string; name: string; role: string; password_hash: string }>(
      'SELECT id, email, name, role, password_hash FROM admin_users WHERE email = $1 AND active = true',
      [email]
    )

    if (!result || result.length === 0) {
      return null
    }

    const user = result[0]
    const isValid = await compare(password, user.password_hash)

    if (!isValid) {
      return null
    }

    // Update last login
    await query(
      'UPDATE admin_users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    )

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    }
  } catch (error) {
    console.error('Error verifying password:', error)
    return null
  }
}

export const authOptions: NextAuthConfig = {
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await verifyPassword(
          credentials.email as string,
          credentials.password as string
        )

        return user
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
      }
      return session
    },
  },
  pages: {
    signIn: '/admin/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  cookies: {
    sessionToken: {
      name: 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
}

export const { handlers, auth, signIn, signOut } = NextAuth(authOptions)
