'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  AdminBadge,
  AdminEmptyState,
  AdminFilterBar,
  AdminLoading,
  AdminPageTransition,
  AdminShellHeader,
  AdminTableShell,
} from '@/components/admin/ui'
import { CalendarDays } from 'lucide-react'

interface Booking {
  id: string
  name: string
  email: string
  phone: string | null
  services: Array<{ name: string; price: number }>
  stylist: string
  date: string
  time: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  created_at: string
}

function asServiceList(value: unknown): Array<{ name: string; price: number }> {
  if (Array.isArray(value)) return value as Array<{ name: string; price: number }>
  return []
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [role, setRole] = useState<'admin' | 'employee'>('admin')

  useEffect(() => {
    fetchBookings()
    fetchRole()
  }, [])

  const fetchRole = async () => {
    try {
      const response = await fetch('/api/admin/settings')
      const data = await response.json()
      if (response.ok && data.data?.role) {
        setRole(data.data.role)
      }
    } catch (error) {
      console.error('Error fetching role:', error)
    }
  }

  const fetchBookings = async () => {
    try {
      const response = await fetch('/api/admin/bookings')
      const data = await response.json()
      setBookings(data.data?.bookings || [])
    } catch (error) {
      console.error('Error fetching bookings:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (id: string, status: string) => {
    if (role !== 'admin') return
    try {
      await fetch(`/api/admin/bookings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      fetchBookings()
    } catch (error) {
      console.error('Error updating status:', error)
    }
  }

  const deleteBooking = async (id: string) => {
    if (role !== 'admin') return
    if (!confirm('Are you sure you want to delete this booking?')) return
    try {
      await fetch(`/api/admin/bookings/${id}`, { method: 'DELETE' })
      fetchBookings()
    } catch (error) {
      console.error('Error deleting booking:', error)
    }
  }

  const filteredBookings = bookings.filter((booking) => {
    const matchesStatus = filter === 'all' || booking.status === filter
    const matchesSearch =
      searchQuery === '' ||
      booking.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.stylist.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesStatus && matchesSearch
  })

  if (loading) return <AdminLoading label="Loading bookings..." />

  return (
    <AdminPageTransition className="space-y-5">
      <AdminShellHeader
        title="Bookings"
        subtitle="Manage salon bookings and appointment statuses."
      />

      <AdminFilterBar>
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[220px]">
            <input
              type="text"
              placeholder="Search by name, email, or stylist..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-4 py-2.5"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={filter === status ? 'admin-btn-primary capitalize' : 'admin-btn-secondary capitalize'}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </AdminFilterBar>

      {filteredBookings.length === 0 ? (
        <AdminEmptyState
          icon={CalendarDays}
          title="No bookings found"
          description="Try adjusting your filters or wait for new bookings."
        />
      ) : (
        <AdminTableShell>
          <table className="w-full min-w-[900px]">
            <thead>
              <tr>
                <th className="px-6 py-4 text-left text-xs uppercase tracking-[0.12em] text-gray-400">Customer</th>
                <th className="px-6 py-4 text-left text-xs uppercase tracking-[0.12em] text-gray-400">Services</th>
                <th className="px-6 py-4 text-left text-xs uppercase tracking-[0.12em] text-gray-400">Stylist</th>
                <th className="px-6 py-4 text-left text-xs uppercase tracking-[0.12em] text-gray-400">Date & Time</th>
                <th className="px-6 py-4 text-left text-xs uppercase tracking-[0.12em] text-gray-400">Status</th>
                <th className="px-6 py-4 text-right text-xs uppercase tracking-[0.12em] text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gold-primary/10">
              {filteredBookings.map((booking) => (
                <tr key={booking.id}>
                  <td className="px-6 py-4">
                    <p className="text-white font-medium">{booking.name}</p>
                    <p className="text-sm text-gray-400">{booking.email}</p>
                    {booking.phone && <p className="text-sm text-gray-500">{booking.phone}</p>}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-300">
                    {asServiceList(booking.services).map((s, i) => (
                      <div key={i}>{s.name}</div>
                    ))}
                  </td>
                  <td className="px-6 py-4 text-gray-300">{booking.stylist}</td>
                  <td className="px-6 py-4 text-sm text-gray-300">
                    <p>{booking.date}</p>
                    <p className="text-gray-500">{booking.time}</p>
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={booking.status}
                      disabled={role !== 'admin'}
                      onChange={(e) => updateStatus(booking.id, e.target.value)}
                      className="px-3 py-2"
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                    <div className="mt-2">
                      <AdminBadge variant={booking.status}>{booking.status}</AdminBadge>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/admin/bookings/${booking.id}`} className="admin-btn-secondary">
                        View
                      </Link>
                      {role === 'admin' && (
                        <button onClick={() => deleteBooking(booking.id)} className="admin-btn-secondary text-red-300 border-red-500/30">
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </AdminTableShell>
      )}
    </AdminPageTransition>
  )
}
