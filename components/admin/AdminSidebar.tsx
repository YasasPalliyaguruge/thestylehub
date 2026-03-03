'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import {
  LayoutDashboard,
  Scissors,
  Users,
  Images,
  Star,
  BadgeDollarSign,
  Building2,
  Megaphone,
  CalendarDays,
  Mail,
  Settings,
  ChevronDown,
  LogOut,
  ShieldCheck,
} from 'lucide-react'
import { useMemo, useState } from 'react'

interface NavItem {
  label: string
  href?: string
  icon: LucideIcon
  children?: Array<{
    label: string
    href: string
    icon: LucideIcon
  }>
}

const navigation: NavItem[] = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  {
    label: 'Content',
    icon: Scissors,
    children: [
      { label: 'Services', href: '/admin/services', icon: Scissors },
      { label: 'Team', href: '/admin/team', icon: Users },
      { label: 'Portfolio', href: '/admin/portfolio', icon: Images },
      { label: 'Testimonials', href: '/admin/testimonials', icon: Star },
      { label: 'Pricing', href: '/admin/pricing', icon: BadgeDollarSign },
    ],
  },
  {
    label: 'Operations',
    icon: CalendarDays,
    children: [
      { label: 'Bookings', href: '/admin/bookings', icon: CalendarDays },
      { label: 'Messages', href: '/admin/messages', icon: Mail },
    ],
  },
  {
    label: 'Brand',
    icon: Building2,
    children: [
      { label: 'Business Info', href: '/admin/business', icon: Building2 },
      { label: 'Hero Content', href: '/admin/content', icon: Megaphone },
    ],
  },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
]

interface AdminSidebarProps {
  onNavigate?: () => void
}

export default function AdminSidebar({ onNavigate }: AdminSidebarProps) {
  const pathname = usePathname()
  const [expandedItems, setExpandedItems] = useState<string[]>(['Content', 'Operations', 'Brand'])

  const pageTitle = useMemo(() => {
    const leaf = pathname?.split('/').filter(Boolean).at(-1) || 'admin'
    if (leaf === 'admin') return 'Dashboard'
    return leaf.replace(/-/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase())
  }, [pathname])

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin'
    return pathname?.startsWith(href)
  }

  return (
    <div className="h-full flex flex-col admin-sidebar">
      <div className="p-5 border-b border-gold-primary/15">
        <Link
          href="/admin"
          className="flex items-center gap-3 group"
          onClick={onNavigate}
        >
          <div className="relative w-10 h-10 rounded-xl admin-gold-gradient flex items-center justify-center shadow-gold-glow">
            <ShieldCheck className="w-5 h-5 text-black-primary" />
          </div>
          <div>
            <h1 className="font-display text-base text-white tracking-wide leading-tight">
              The Style Hub
            </h1>
            <p className="text-xs text-gold-primary/85 uppercase tracking-[0.18em]">Admin</p>
          </div>
        </Link>
      </div>

      <div className="px-4 py-3 border-b border-gold-primary/10">
        <p className="text-[11px] uppercase tracking-[0.18em] text-gray-500">Current</p>
        <p className="text-sm text-white mt-1">{pageTitle}</p>
      </div>

      <nav className="flex-1 p-4 overflow-y-auto space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon
          const hasChildren = !!item.children?.length
          const isExpanded = expandedItems.includes(item.label)
          const groupActive = hasChildren
            ? item.children!.some((child) => isActive(child.href))
            : !!item.href && isActive(item.href)

          if (!hasChildren && item.href) {
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={onNavigate}
                className={`admin-nav-link ${groupActive ? 'admin-nav-link-active' : ''}`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            )
          }

          return (
            <div key={item.label}>
              <button
                type="button"
                onClick={() =>
                  setExpandedItems((prev) =>
                    prev.includes(item.label)
                      ? prev.filter((v) => v !== item.label)
                      : [...prev, item.label]
                  )
                }
                className={`admin-nav-link w-full justify-between ${groupActive ? 'admin-nav-link-active' : ''}`}
              >
                <span className="flex items-center gap-3">
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </span>
                <motion.span
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="w-4 h-4" />
                </motion.span>
              </button>

              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-1 ml-3 pl-3 border-l border-gold-primary/15 space-y-1">
                      {item.children?.map((child) => {
                        const ChildIcon = child.icon
                        const childActive = isActive(child.href)
                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            onClick={onNavigate}
                            className={`admin-nav-child ${childActive ? 'admin-nav-child-active' : ''}`}
                          >
                            <ChildIcon className="w-3.5 h-3.5" />
                            <span>{child.label}</span>
                          </Link>
                        )
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </nav>

      <div className="p-4 border-t border-gold-primary/10">
        <button
          onClick={() => signOut({ callbackUrl: '/admin/login' })}
          className="admin-logout-btn"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  )
}
