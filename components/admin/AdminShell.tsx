'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePathname } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import AdminSidebar from '@/components/admin/AdminSidebar'

interface AdminShellProps {
  children: React.ReactNode
}

export default function AdminShell({ children }: AdminShellProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const isLoginPage = pathname === '/admin/login'

  useEffect(() => {
    if (!mobileOpen) return
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileOpen(false)
    }
    document.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  const pageTitle = useMemo(() => {
    if (!pathname) return 'Admin'
    if (pathname === '/admin') return 'Dashboard'
    const leaf = pathname.split('/').filter(Boolean).at(-1) || 'admin'
    return leaf.replace(/-/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase())
  }, [pathname])

  if (isLoginPage) {
    return <div className="admin-theme min-h-screen">{children}</div>
  }

  return (
    <div className="admin-theme min-h-screen bg-black-primary">
      <div className="admin-shell-bg" />

      <div className="relative flex min-h-screen">
        <aside className="hidden lg:flex w-72 border-r border-gold-primary/15 bg-black-dark/75 backdrop-blur-xl">
          <AdminSidebar />
        </aside>

        <AnimatePresence>
          {mobileOpen && (
            <>
              <motion.button
                aria-label="Close navigation"
                className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileOpen(false)}
              />
              <motion.aside
                className="fixed left-0 top-0 bottom-0 z-50 w-80 max-w-[84vw] border-r border-gold-primary/20 bg-black-dark/95 backdrop-blur-xl lg:hidden"
                initial={{ x: -320, opacity: 0.6 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -320, opacity: 0.6 }}
                transition={{ type: 'spring', stiffness: 250, damping: 28 }}
              >
                <AdminSidebar onNavigate={() => setMobileOpen(false)} />
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        <div className="flex-1 min-w-0">
          <header className="lg:hidden sticky top-0 z-30 border-b border-gold-primary/15 bg-black-dark/80 backdrop-blur-xl">
            <div className="h-16 px-4 flex items-center justify-between">
              <button
                type="button"
                className="admin-icon-btn"
                onClick={() => setMobileOpen((v) => !v)}
                aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
              <p className="text-sm text-white font-medium truncate">{pageTitle}</p>
              <div className="w-9" />
            </div>
          </header>

          <main className="px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={pathname}
                className="max-w-[1400px] mx-auto"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  )
}
