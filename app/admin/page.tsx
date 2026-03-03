import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  AdminCard,
  AdminShellHeader,
  AdminStatCard,
  AdminPageTransition,
} from '@/components/admin/ui'
import {
  CalendarDays,
  Mail,
  Scissors,
  Users,
  Images,
  BadgeDollarSign,
  Star,
  Settings,
} from 'lucide-react'

const quickLinks = [
  { href: '/admin/services/new', label: 'Add Service', icon: Scissors },
  { href: '/admin/team/new', label: 'Add Team Member', icon: Users },
  { href: '/admin/portfolio/new', label: 'Add Portfolio Item', icon: Images },
  { href: '/admin/business', label: 'Update Business Info', icon: Settings },
]

const manageLinks = [
  { href: '/admin/services', label: 'Services', icon: Scissors },
  { href: '/admin/team', label: 'Team', icon: Users },
  { href: '/admin/testimonials', label: 'Testimonials', icon: Star },
  { href: '/admin/pricing', label: 'Pricing', icon: BadgeDollarSign },
]

const inboxLinks = [
  { href: '/admin/bookings', label: 'Bookings', icon: CalendarDays },
  { href: '/admin/messages', label: 'Messages', icon: Mail },
]

export default async function AdminDashboardPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/admin/login')
  }

  const userName = String(session.user?.name || 'Admin')

  return (
    <AdminPageTransition className="space-y-6">
      <AdminShellHeader
        title="Dashboard"
        subtitle={`Welcome back, ${userName}. Here's your command center.`}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <AdminStatCard label="Content Blocks" value="5" note="Core CMS sections" icon="scissors" />
        <AdminStatCard label="Inbox Modules" value="2" note="Bookings and messages" icon="mail" />
        <AdminStatCard label="Theme" value="Luxury Black" note="Gold-accent enabled" icon="star" />
        <AdminStatCard label="Security" value="Protected" note="NextAuth + proxy guard" icon="settings" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <AdminCard className="space-y-4">
          <h2 className="text-lg text-white font-semibold">Quick Actions</h2>
          <div className="space-y-2">
            {quickLinks.map((item) => {
              const Icon = item.icon
              return (
                <Link key={item.href} href={item.href} className="admin-btn-secondary w-full justify-between">
                  <span className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-gold-primary" />
                    {item.label}
                  </span>
                  <span className="text-gold-primary">Go</span>
                </Link>
              )
            })}
          </div>
        </AdminCard>

        <AdminCard className="space-y-4">
          <h2 className="text-lg text-white font-semibold">Content Management</h2>
          <div className="space-y-2">
            {manageLinks.map((item) => {
              const Icon = item.icon
              return (
                <Link key={item.href} href={item.href} className="admin-btn-secondary w-full justify-between">
                  <span className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-gold-primary" />
                    {item.label}
                  </span>
                  <span className="text-gold-primary">Open</span>
                </Link>
              )
            })}
          </div>
        </AdminCard>

        <AdminCard className="space-y-4">
          <h2 className="text-lg text-white font-semibold">Inbox</h2>
          <div className="space-y-2">
            {inboxLinks.map((item) => {
              const Icon = item.icon
              return (
                <Link key={item.href} href={item.href} className="admin-btn-secondary w-full justify-between">
                  <span className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-gold-primary" />
                    {item.label}
                  </span>
                  <span className="text-gold-primary">View</span>
                </Link>
              )
            })}
          </div>
        </AdminCard>
      </div>
    </AdminPageTransition>
  )
}
