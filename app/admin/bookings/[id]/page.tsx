'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import {
  AdminBadge,
  AdminCard,
  AdminLoading,
  AdminPageTransition,
  AdminShellHeader,
} from '@/components/admin/ui'

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
  employee_id?: string | null
}

interface TeamMember {
  id: string
  name: string
  role: string
  active: boolean
}

function asServiceList(value: unknown): Array<{ name: string; price: number }> {
  if (Array.isArray(value)) return value as Array<{ name: string; price: number }>
  return []
}

export default function BookingDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const bookingId = params.id as string

  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [role, setRole] = useState<'admin' | 'employee'>('admin')
  const [invoiceId, setInvoiceId] = useState<string | null>(null)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [employeeId, setEmployeeId] = useState('')

  useEffect(() => {
    fetchBooking()
    fetchRole()
    fetchInvoice()
    fetchTeam()
  }, [bookingId])

  const fetchRole = async () => {
    try {
      const response = await fetch('/api/admin/settings')
      const data = await response.json()
      if (response.ok && data.data?.role) {
        setRole(data.data.role)
      }
    } catch (err) {
      console.error('Error fetching role:', err)
    }
  }

  const fetchInvoice = async () => {
    try {
      const response = await fetch(`/api/admin/pos/invoices?bookingId=${bookingId}`)
      const data = await response.json()
      const list = data.data?.invoices || []
      if (list.length > 0) {
        setInvoiceId(list[0].id)
      } else {
        setInvoiceId(null)
      }
    } catch (err) {
      console.error('Error fetching invoice:', err)
    }
  }

  const fetchBooking = async () => {
    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}`)
      const data = await response.json()

      if (response.ok && data.data) {
        setBooking(data.data)
        setEmployeeId(data.data.employee_id || '')
      } else {
        setError(data.error || 'Booking not found')
      }
    } catch (err) {
      console.error('Error fetching booking:', err)
      setError('Failed to load booking')
    } finally {
      setLoading(false)
    }
  }

  const fetchTeam = async () => {
    try {
      const response = await fetch('/api/admin/team')
      const data = await response.json()
      setTeamMembers((data.data || []).filter((member: TeamMember) => member.active))
    } catch (err) {
      console.error('Error fetching team members:', err)
    }
  }

  const updateStatus = async (status: string) => {
    if (role !== 'admin') return
    setSaving(true)
    setError('')

    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })

      const data = await response.json()
      if (response.ok) {
        setBooking(data.data)
      } else {
        setError(data.error || 'Failed to update status')
      }
    } catch {
      setError('Failed to update status')
    } finally {
      setSaving(false)
    }
  }

  const updateEmployee = async (nextEmployeeId: string) => {
    if (role !== 'admin') return
    setSaving(true)
    setError('')

    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employee_id: nextEmployeeId || null }),
      })

      const data = await response.json()
      if (response.ok) {
        setBooking(data.data)
        setEmployeeId(data.data.employee_id || '')
      } else {
        setError(data.error || 'Failed to update employee')
      }
    } catch {
      setError('Failed to update employee')
    } finally {
      setSaving(false)
    }
  }

  const deleteBooking = async () => {
    if (role !== 'admin') return
    if (!confirm('Are you sure you want to delete this booking? This action cannot be undone.')) return
    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}`, { method: 'DELETE' })
      if (response.ok) {
        router.push('/admin/bookings')
      } else {
        setError('Failed to delete booking')
      }
    } catch {
      setError('Failed to delete booking')
    }
  }

  if (loading) return <AdminLoading label="Loading booking details..." />
  if (!booking) return <div className="text-red-400">{error || 'Booking not found'}</div>

  const services = asServiceList(booking.services)
  const totalPrice = services.reduce((sum, s) => sum + (s.price || 0), 0)

  return (
    <AdminPageTransition className="space-y-5">
      <div className="flex items-center justify-between">
        <Link href="/admin/bookings" className="admin-btn-secondary">
          Back to Bookings
        </Link>
        <AdminBadge variant={booking.status}>{booking.status}</AdminBadge>
      </div>

      <AdminShellHeader
        title="Booking Details"
        subtitle={`Reference ID: ${booking.id}`}
      />

      {error && <div className="admin-card text-red-300">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <AdminCard>
          <h2 className="text-white text-lg font-medium mb-4">Customer Information</h2>
          <div className="space-y-3 text-gray-300">
            <p><span className="text-gray-500">Name:</span> {booking.name}</p>
            <p><span className="text-gray-500">Email:</span> <a href={`mailto:${booking.email}`} className="text-gold-primary">{booking.email}</a></p>
            {booking.phone && <p><span className="text-gray-500">Phone:</span> <a href={`tel:${booking.phone}`} className="text-gold-primary">{booking.phone}</a></p>}
          </div>
        </AdminCard>

        <AdminCard>
          <h2 className="text-white text-lg font-medium mb-4">Appointment Details</h2>
          <div className="space-y-3 text-gray-300">
            <p><span className="text-gray-500">Date:</span> {new Date(booking.date + 'T00:00:00').toLocaleDateString()}</p>
            <p><span className="text-gray-500">Time:</span> {booking.time}</p>
            <p><span className="text-gray-500">Stylist:</span> {booking.stylist}</p>
            <div className="flex items-center gap-3">
              <span className="text-gray-500">Assigned employee:</span>
              <select
                value={employeeId}
                disabled={role !== 'admin' || saving}
                onChange={(event) => updateEmployee(event.target.value)}
                className="px-3 py-2"
              >
                <option value="">Unassigned</option>
                {teamMembers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </AdminCard>

        <AdminCard className="md:col-span-2">
          <h2 className="text-white text-lg font-medium mb-4">Services</h2>
          <div className="space-y-2">
            {services.map((service, index) => (
              <div key={index} className="flex justify-between text-gray-300 py-2 border-b border-gold-primary/10">
                <span>{service.name}</span>
                <span className="text-gold-primary">LKR {service.price?.toLocaleString() || 'N/A'}</span>
              </div>
            ))}
            <div className="flex justify-between font-semibold pt-2">
              <span className="text-gold-primary">Total</span>
              <span className="text-gold-primary">LKR {totalPrice.toLocaleString()}</span>
            </div>
          </div>
        </AdminCard>
      </div>

      <AdminCard>
        <h2 className="text-white text-lg font-medium mb-4">Actions</h2>
        <div className="flex flex-wrap gap-2 mb-5">
          {['pending', 'confirmed', 'completed', 'cancelled'].map((status) => (
            <button
              key={status}
              onClick={() => updateStatus(status)}
              disabled={saving || booking.status === status || role !== 'admin'}
              className={booking.status === status ? 'admin-btn-primary capitalize' : 'admin-btn-secondary capitalize'}
            >
              {status}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-3">
          {invoiceId ? (
            <Link href={`/admin/pos/invoices/${invoiceId}`} className="admin-btn-secondary">
              Print Invoice
            </Link>
          ) : (
            <Link href={`/admin/pos?bookingId=${booking.id}`} className="admin-btn-secondary">
              Create Invoice
            </Link>
          )}
          <a href={`mailto:${booking.email}`} className="admin-btn-secondary">Send Email</a>
          {booking.phone && <a href={`tel:${booking.phone}`} className="admin-btn-secondary">Call</a>}
          {role === 'admin' && (
            <button onClick={deleteBooking} className="admin-btn-secondary text-red-300 border-red-500/30">
              Delete Booking
            </button>
          )}
        </div>
      </AdminCard>
    </AdminPageTransition>
  )
}
