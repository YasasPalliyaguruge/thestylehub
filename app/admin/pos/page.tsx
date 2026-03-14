'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
  AdminCard,
  AdminFilterBar,
  AdminPageTransition,
  AdminShellHeader,
  AdminTableShell,
} from '@/components/admin/ui'
import { Receipt, Search } from 'lucide-react'

interface Service {
  id: string
  name: string
  price: number
  category: string
}

interface Booking {
  id: string
  name: string
  email: string
  phone: string | null
  services: Array<{ name: string; price: number }>
  stylist: string
  date: string
  time: string
  employee_id?: string | null
}

interface InvoiceListItem {
  id: string
  invoice_number: string
  booking_id: string | null
  customer_name: string
  total: number
  status: string
  payment_method?: string | null
  created_at: string
}

interface InvoiceItem {
  id: string
  name: string
  qty: number
  unit_price: number
}

interface TeamMember {
  id: string
  name: string
  role: string
  active: boolean
}

function PosInner() {
  const searchParams = useSearchParams()
  const prefillBookingId = searchParams.get('bookingId') || ''

  const [services, setServices] = useState<Service[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [invoices, setInvoices] = useState<InvoiceListItem[]>([])
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)

  const [mode, setMode] = useState<'walkin' | 'booking'>('walkin')
  const [bookingSearch, setBookingSearch] = useState('')
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null)

  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('')
  const [items, setItems] = useState<InvoiceItem[]>([])
  const [tax, setTax] = useState(0)
  const [discount, setDiscount] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [status, setStatus] = useState<'paid' | 'unpaid' | 'void'>('paid')
  const [creating, setCreating] = useState(false)
  const [createdInvoiceId, setCreatedInvoiceId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [updateError, setUpdateError] = useState('')
  const [role, setRole] = useState<'admin' | 'employee'>('admin')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [servicesRes, bookingsRes, invoicesRes, teamRes] = await Promise.all([
          fetch('/api/admin/services'),
          fetch('/api/admin/bookings'),
          fetch('/api/admin/pos/invoices'),
          fetch('/api/admin/team'),
        ])
        const servicesData = await servicesRes.json()
        const bookingsData = await bookingsRes.json()
        const invoicesData = await invoicesRes.json()
        const teamData = await teamRes.json()

        setServices(servicesData.data || [])
        setBookings(bookingsData.data?.bookings || [])
        setInvoices(invoicesData.data?.invoices || [])
        setTeamMembers((teamData.data || []).filter((member: TeamMember) => member.active))
      } catch (err) {
        console.error('Failed to load POS data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
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

  useEffect(() => {
    if (!prefillBookingId || !bookings.length) return
    setMode('booking')
    setSelectedBookingId(prefillBookingId)
  }, [prefillBookingId, bookings.length])

  useEffect(() => {
    if (mode === 'walkin') {
      setSelectedBookingId(null)
      setCustomerName('')
      setCustomerEmail('')
      setCustomerPhone('')
      setSelectedEmployeeId('')
      setItems([])
    }
    setCreatedInvoiceId(null)
    setError('')
  }, [mode])

  useEffect(() => {
    if (!selectedBookingId) return
    const booking = bookings.find((b) => b.id === selectedBookingId)
    if (!booking) return

    setCustomerName(booking.name)
    setCustomerEmail(booking.email)
    setCustomerPhone(booking.phone || '')
    setSelectedEmployeeId(booking.employee_id || '')
    setItems(
      booking.services.map((service) => ({
        id: crypto.randomUUID(),
        name: service.name,
        qty: 1,
        unit_price: service.price || 0,
      }))
    )
  }, [selectedBookingId, bookings])

  const availableBookings = useMemo(() => {
    const query = bookingSearch.toLowerCase().trim()
    if (!query) return bookings
    return bookings.filter(
      (booking) =>
        booking.name.toLowerCase().includes(query) ||
        booking.email.toLowerCase().includes(query) ||
        booking.id.toLowerCase().includes(query)
    )
  }, [bookings, bookingSearch])

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.qty * item.unit_price, 0),
    [items]
  )
  const total = Math.max(subtotal + tax - discount, 0)

  const addServiceItem = (service: Service) => {
    setItems((prev) => [...prev, { id: crypto.randomUUID(), name: service.name, qty: 1, unit_price: service.price }])
  }

  const addCustomItem = () => {
    setItems((prev) => [...prev, { id: crypto.randomUUID(), name: 'Custom Service', qty: 1, unit_price: 0 }])
  }

  const updateItem = (index: number, key: keyof InvoiceItem, value: number | string) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [key]: value } : item))
    )
  }

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  const resetForm = () => {
    if (mode === 'walkin') {
      setCustomerName('')
      setCustomerEmail('')
      setCustomerPhone('')
      setItems([])
    }
    setTax(0)
    setDiscount(0)
    setPaymentMethod('cash')
    setStatus('paid')
  }

  const createInvoice = async () => {
    setError('')
    setCreating(true)

    try {
      if (!customerName.trim()) {
        setError('Customer name is required.')
        return
      }
      if (!items.length) {
        setError('Add at least one service to the invoice.')
        return
      }

      const response = await fetch('/api/admin/pos/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_id: mode === 'booking' ? selectedBookingId : null,
          customer_name: customerName.trim(),
          customer_email: customerEmail.trim(),
          customer_phone: customerPhone.trim(),
          items: items.map((item) => ({
            name: item.name.trim(),
            qty: Number(item.qty) || 1,
            unit_price: Number(item.unit_price) || 0,
          })),
          tax,
          discount,
          payment_method: paymentMethod,
          status,
          employee_id: selectedEmployeeId || null,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        setError(data.error || 'Failed to create invoice')
        return
      }

      const created = data.data
      setCreatedInvoiceId(created?.id || null)
      if (created) {
        setInvoices((prev) => [created, ...prev].slice(0, 100))
      }
      resetForm()
    } catch (err) {
      console.error('Failed to create invoice:', err)
      setError('Failed to create invoice')
    } finally {
      setCreating(false)
    }
  }

  const updateInvoice = async (invoiceId: string, nextStatus?: InvoiceListItem['status'], nextPayment?: string) => {
    setUpdateError('')
    setUpdatingId(invoiceId)
    try {
      const response = await fetch(`/api/admin/pos/invoices/${invoiceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: nextStatus,
          payment_method: nextPayment,
        }),
      })
      const data = await response.json()
      if (!response.ok) {
        setUpdateError(data.error || 'Failed to update invoice')
        return
      }
      setInvoices((prev) =>
        prev.map((invoice) =>
          invoice.id === invoiceId
            ? {
                ...invoice,
                status: data.data?.status || invoice.status,
                payment_method: data.data?.payment_method ?? invoice.payment_method,
              }
            : invoice
        )
      )
    } catch (err) {
      console.error('Failed to update invoice:', err)
      setUpdateError('Failed to update invoice')
    } finally {
      setUpdatingId(null)
    }
  }

  const deleteInvoice = async (invoiceId: string) => {
    if (!confirm('Are you sure you want to delete this invoice?')) return
    setUpdateError('')
    try {
      const response = await fetch(`/api/admin/pos/invoices/${invoiceId}`, { method: 'DELETE' })
      if (!response.ok) {
        setUpdateError('Failed to delete invoice')
        return
      }
      setInvoices((prev) => prev.filter((invoice) => invoice.id !== invoiceId))
    } catch (err) {
      console.error('Failed to delete invoice:', err)
      setUpdateError('Failed to delete invoice')
    }
  }

  if (loading) {
    return (
      <AdminPageTransition>
        <AdminShellHeader title="Point of Sale" subtitle="Loading POS tools..." />
      </AdminPageTransition>
    )
  }

  return (
    <AdminPageTransition className="space-y-6">
      <AdminShellHeader
        title="Point of Sale"
        subtitle="Create walk-in invoices or bill existing bookings."
      />

      <AdminFilterBar>
        <div className="flex flex-wrap gap-2">
          <button
            className={mode === 'walkin' ? 'admin-btn-primary' : 'admin-btn-secondary'}
            onClick={() => setMode('walkin')}
          >
            Walk-in Invoice
          </button>
          <button
            className={mode === 'booking' ? 'admin-btn-primary' : 'admin-btn-secondary'}
            onClick={() => setMode('booking')}
          >
            Invoice From Booking
          </button>
        </div>
      </AdminFilterBar>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-6">
        <div className="space-y-5">
          {mode === 'booking' && (
            <AdminCard className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Search className="w-4 h-4" />
                Search bookings
              </div>
              <input
                type="text"
                value={bookingSearch}
                onChange={(event) => setBookingSearch(event.target.value)}
                placeholder="Search by name, email, or booking ID"
                className="px-4 py-2.5"
              />
              <div className="grid gap-2 max-h-56 overflow-y-auto">
                {availableBookings.map((booking) => (
                  <button
                    key={booking.id}
                    onClick={() => setSelectedBookingId(booking.id)}
                    className={`text-left px-4 py-3 rounded-xl border ${
                      selectedBookingId === booking.id
                        ? 'border-gold-primary/60 bg-gold-primary/10'
                        : 'border-gold-primary/15 bg-black/40'
                    }`}
                  >
                    <div className="text-sm text-white font-medium">{booking.name}</div>
                    <div className="text-xs text-gray-400">{booking.email}</div>
                    <div className="text-xs text-gray-500">
                      {booking.date} | {booking.time} | {booking.stylist}
                    </div>
                  </button>
                ))}
              </div>
            </AdminCard>
          )}

          <AdminCard className="space-y-4">
            <h2 className="text-lg text-white font-semibold">Customer Details</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider">Customer Name</label>
                <input
                  type="text"
                  placeholder="John Doe"
                  value={customerName}
                  onChange={(event) => setCustomerName(event.target.value)}
                  className="px-3 py-2.5"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider">Email Address</label>
                <input
                  type="email"
                  placeholder="john@example.com"
                  value={customerEmail}
                  onChange={(event) => setCustomerEmail(event.target.value)}
                  className="px-3 py-2.5"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider">Phone</label>
                <input
                  type="text"
                  placeholder="+94 77 123 4567"
                  value={customerPhone}
                  onChange={(event) => setCustomerPhone(event.target.value)}
                  className="px-3 py-2.5"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider">Assigned To</label>
                <select
                  value={selectedEmployeeId}
                  onChange={(event) => setSelectedEmployeeId(event.target.value)}
                  className="px-3 py-2.5"
                >
                  <option value="">Select Stylist</option>
                  {teamMembers.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </AdminCard>

          <AdminCard className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg text-white font-semibold">Invoice Items</h2>
              <div className="flex flex-wrap gap-2">
                <select
                  className="px-3 py-2"
                  onChange={(event) => {
                    const service = services.find((s) => s.id === event.target.value)
                    if (service) addServiceItem(service)
                    event.currentTarget.value = ''
                  }}
                  defaultValue=""
                >
                  <option value="" disabled>
                    Add service
                  </option>
                  {services.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name} - LKR {service.price?.toLocaleString()}
                    </option>
                  ))}
                </select>
                <button className="admin-btn-secondary" onClick={addCustomItem}>
                  Add custom item
                </button>
              </div>
            </div>

            {items.length === 0 ? (
              <div className="text-sm text-gray-400">No services added yet.</div>
            ) : (
              <div className="space-y-3">
                {items.map((item, index) => (
                  <div
                    key={item.id}
                    className="grid gap-2 md:grid-cols-[minmax(0,2fr)_80px_140px_32px] items-center"
                  >
                    <input
                      type="text"
                      value={item.name}
                      onChange={(event) => updateItem(index, 'name', event.target.value)}
                      className="px-3 py-2"
                    />
                    <input
                      type="number"
                      min={1}
                      value={item.qty}
                      onChange={(event) => updateItem(index, 'qty', Number(event.target.value))}
                      className="px-3 py-2"
                    />
                    <input
                      type="number"
                      min={0}
                      value={item.unit_price}
                      onChange={(event) => updateItem(index, 'unit_price', Number(event.target.value))}
                      className="px-3 py-2"
                    />
                    <button
                      className="admin-icon-btn"
                      onClick={() => removeItem(index)}
                      aria-label="Remove item"
                    >
                      x
                    </button>
                  </div>
                ))}
              </div>
            )}
          </AdminCard>

          <AdminCard className="space-y-4">
            <h2 className="text-lg text-white font-semibold">Totals</h2>
            <div className="grid gap-3 md:grid-cols-4">
              <div className="bg-black/40 rounded-xl px-4 py-3">
                <p className="text-xs text-gray-500 uppercase tracking-[0.16em]">Subtotal</p>
                <p className="text-white font-semibold mt-1">LKR {subtotal.toLocaleString()}</p>
              </div>
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-[0.16em]">Tax</label>
                <input
                  type="number"
                  min={0}
                  value={tax}
                  onChange={(event) => setTax(Number(event.target.value))}
                  className="mt-2 px-3 py-2 w-full"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-[0.16em]">Discount</label>
                <input
                  type="number"
                  min={0}
                  value={discount}
                  onChange={(event) => setDiscount(Number(event.target.value))}
                  className="mt-2 px-3 py-2 w-full"
                />
              </div>
              <div className="bg-black/40 rounded-xl px-4 py-3">
                <p className="text-xs text-gray-500 uppercase tracking-[0.16em]">Total</p>
                <p className="text-gold-primary font-semibold mt-1">LKR {total.toLocaleString()}</p>
              </div>
            </div>
          </AdminCard>

          <AdminCard className="space-y-4">
            <h2 className="text-lg text-white font-semibold">Payment</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(event) => setPaymentMethod(event.target.value)}
                  className="px-3 py-2.5"
                >
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="bank">Bank Transfer</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider">Payment Status</label>
                <select
                  value={status}
                  onChange={(event) => setStatus(event.target.value as 'paid' | 'unpaid' | 'void')}
                  className="px-3 py-2.5"
                >
                  <option value="paid">Paid</option>
                  <option value="unpaid">Unpaid</option>
                  <option value="void">Void</option>
                </select>
              </div>
            </div>

            {error && <div className="admin-card border-red-500/40 text-red-300">{error}</div>}

            <div className="flex flex-wrap items-center gap-3">
              <button
                className="admin-btn-primary"
                onClick={createInvoice}
                disabled={creating}
              >
                {creating ? 'Creating...' : 'Create Invoice'}
              </button>
              {createdInvoiceId && (
                <Link href={`/admin/pos/invoices/${createdInvoiceId}`} className="admin-btn-secondary">
                  View & Print Invoice
                </Link>
              )}
            </div>
          </AdminCard>
        </div>

        <div className="space-y-5">
          <AdminCard className="space-y-3">
            <div className="flex items-center gap-2 text-gold-primary">
              <Receipt className="w-5 h-5" />
              <h2 className="text-lg font-semibold text-white">Recent Invoices</h2>
            </div>
            {updateError ? <div className="admin-card border-red-500/40 text-red-300">{updateError}</div> : null}
            {invoices.length === 0 ? (
              <p className="text-sm text-gray-400">No invoices created yet.</p>
            ) : (
              <div className="space-y-3">
                {invoices.slice(0, 8).map((invoice) => (
                  <div
                    key={invoice.id}
                    className="rounded-xl border border-gold-primary/15 bg-black/40 px-4 py-3"
                  >
                    <div className="text-xs text-gray-400">{invoice.invoice_number}</div>
                    <div className="text-sm text-white font-medium">{invoice.customer_name}</div>
                    <div className="text-xs text-gray-500">LKR {Number(invoice.total).toLocaleString()}</div>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-400">
                      <span className={`rounded-full px-2 py-0.5 border ${
                        invoice.status === 'paid'
                          ? 'border-green-500/40 text-green-300'
                          : invoice.status === 'void'
                            ? 'border-red-500/40 text-red-300'
                            : 'border-gold-primary/30 text-gold-primary/80'
                      }`}>
                        {invoice.status}
                      </span>
                      {invoice.payment_method ? <span className="text-gray-400">via {invoice.payment_method}</span> : null}
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <Link href={`/admin/pos/invoices/${invoice.id}`} className="admin-btn-secondary text-xs">
                        View
                      </Link>
                      <select
                        value={invoice.status}
                        onChange={(event) => updateInvoice(invoice.id, event.target.value as InvoiceListItem['status'], invoice.payment_method || undefined)}
                        className="px-2 py-1 text-xs"
                        disabled={updatingId === invoice.id}
                      >
                        <option value="paid">Paid</option>
                        <option value="unpaid">Unpaid</option>
                        <option value="void">Void</option>
                      </select>
                      <select
                        value={invoice.payment_method || ''}
                        onChange={(event) => updateInvoice(invoice.id, invoice.status, event.target.value)}
                        className="px-2 py-1 text-xs"
                        disabled={updatingId === invoice.id}
                      >
                        <option value="">Payment method</option>
                        <option value="cash">Cash</option>
                        <option value="card">Card</option>
                        <option value="bank">Bank Transfer</option>
                      </select>
                      {role === 'admin' && (
                        <button onClick={() => deleteInvoice(invoice.id)} className="admin-btn-secondary text-red-300 border-red-500/30 text-xs">
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </AdminCard>

          <AdminTableShell>
            <table className="w-full min-w-[420px]">
              <thead>
                <tr>
                  <th className="px-6 py-4 text-left text-xs uppercase tracking-[0.12em] text-gray-400">Invoice</th>
                  <th className="px-6 py-4 text-left text-xs uppercase tracking-[0.12em] text-gray-400">Client</th>
                  <th className="px-6 py-4 text-right text-xs uppercase tracking-[0.12em] text-gray-400">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gold-primary/10">
                {invoices.slice(0, 6).map((invoice) => (
                  <tr key={invoice.id}>
                    <td className="px-6 py-4 text-sm text-gray-300">{invoice.invoice_number}</td>
                    <td className="px-6 py-4 text-sm text-gray-300">{invoice.customer_name}</td>
                    <td className="px-6 py-4 text-right text-sm text-gray-300">
                      LKR {Number(invoice.total).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </AdminTableShell>
        </div>
      </div>
    </AdminPageTransition>
  )
}

export default function PosPage() {
  return (
    <Suspense
      fallback={
        <AdminPageTransition>
          <AdminShellHeader title="Point of Sale" subtitle="Loading POS tools..." />
        </AdminPageTransition>
      }
    >
      <PosInner />
    </Suspense>
  )
}


