'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Suspense, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Lock, Mail, ShieldCheck } from 'lucide-react'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/admin'
  const reduceMotion = useReducedMotion()

  const [formData, setFormData] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      })

      if (result?.error) {
        setError('Invalid email or password.')
      } else {
        router.push(callbackUrl)
        router.refresh()
      }
    } catch {
      setError('Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen bg-black-primary flex items-center justify-center p-4 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -left-24 w-[480px] h-[480px] rounded-full bg-gold-primary/10 blur-3xl" />
        <div className="absolute -bottom-48 -right-20 w-[520px] h-[520px] rounded-full bg-gold-primary/10 blur-3xl" />
      </div>

      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 18 }}
        animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.28 }}
        className="relative w-full max-w-md"
      >
        <div className="admin-card p-8 md:p-10">
          <div className="text-center mb-8">
            <div className="mx-auto w-14 h-14 rounded-2xl admin-gold-gradient flex items-center justify-center shadow-gold-glow">
              <ShieldCheck className="w-7 h-7 text-black-primary" />
            </div>
            <h1 className="mt-4 text-3xl font-display text-white">Admin Login</h1>
            <p className="mt-2 text-sm text-gray-400">The Style Hub control center</p>
          </div>

          {error ? (
            <div className="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm text-gray-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                  className="pl-10 pr-4 py-3"
                  placeholder="admin@example.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                  className="pl-10 pr-4 py-3"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={reduceMotion || loading ? undefined : { y: -1 }}
              whileTap={reduceMotion || loading ? undefined : { scale: 0.99 }}
              className="admin-btn-primary w-full justify-center disabled:opacity-60"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </motion.button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/" className="text-sm text-gold-primary hover:text-gold-light transition-colors">
              Back to Website
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

function LoginFallback() {
  return (
    <div className="min-h-screen bg-black-primary flex items-center justify-center">
      <div className="admin-card text-gray-300">Loading login...</div>
    </div>
  )
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  )
}
