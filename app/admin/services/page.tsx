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
import { Plus, Scissors } from 'lucide-react'

interface Service {
  id: string
  name: string
  description: string | null
  price: number
  duration: string | null
  icon: string | null
  category: string
  popular: boolean
  display_order: number
  active: boolean
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchServices()
  }, [])

  const fetchServices = async () => {
    try {
      const response = await fetch('/api/admin/services')
      const data = await response.json()
      setServices(data.data || [])
    } catch (error) {
      console.error('Error fetching services:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleActive = async (id: string, active: boolean) => {
    await fetch(`/api/admin/services/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !active }),
    })
    fetchServices()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return
    await fetch(`/api/admin/services/${id}`, { method: 'DELETE' })
    fetchServices()
  }

  const filteredServices = services.filter((service) => {
    const matchesActive =
      filter === 'all' || (filter === 'active' && service.active) || (filter === 'inactive' && !service.active)
    const matchesCategory = categoryFilter === 'all' || service.category === categoryFilter
    const matchesSearch =
      searchQuery === '' ||
      service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (service.description && service.description.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesActive && matchesCategory && matchesSearch
  })

  const categories = Array.from(new Set(services.map((s) => s.category)))

  if (loading) return <AdminLoading label="Loading services..." />

  return (
    <AdminPageTransition className="space-y-5">
      <AdminShellHeader
        title="Services"
        subtitle="Manage service catalog, pricing, and visibility."
        actions={
          <Link href="/admin/services/new" className="admin-btn-primary">
            <Plus className="w-4 h-4" />
            Add Service
          </Link>
        }
      />

      <AdminFilterBar>
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[220px]">
            <input
              type="text"
              placeholder="Search services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-4 py-2.5"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            {(['all', 'active', 'inactive'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={filter === status ? 'admin-btn-primary capitalize' : 'admin-btn-secondary capitalize'}
              >
                {status}
              </button>
            ))}
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2.5 min-w-[180px]"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </AdminFilterBar>

      {filteredServices.length === 0 ? (
        <AdminEmptyState
          icon={Scissors}
          title="No services found"
          description="Create your first service or adjust filters."
        />
      ) : (
        <AdminTableShell>
          <table className="w-full min-w-[960px]">
            <thead>
              <tr>
                <th className="px-6 py-4 text-left text-xs uppercase tracking-[0.12em] text-gray-400">Service</th>
                <th className="px-6 py-4 text-left text-xs uppercase tracking-[0.12em] text-gray-400">Category</th>
                <th className="px-6 py-4 text-left text-xs uppercase tracking-[0.12em] text-gray-400">Price</th>
                <th className="px-6 py-4 text-left text-xs uppercase tracking-[0.12em] text-gray-400">Duration</th>
                <th className="px-6 py-4 text-left text-xs uppercase tracking-[0.12em] text-gray-400">Status</th>
                <th className="px-6 py-4 text-right text-xs uppercase tracking-[0.12em] text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gold-primary/10">
              {filteredServices.map((service) => (
                <tr key={service.id}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {service.icon && <span className="text-xl">{service.icon}</span>}
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-white font-medium">{service.name}</p>
                          {service.popular && <AdminBadge variant="featured">Popular</AdminBadge>}
                        </div>
                        {service.description && <p className="text-sm text-gray-400 line-clamp-1">{service.description}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <AdminBadge>{service.category}</AdminBadge>
                  </td>
                  <td className="px-6 py-4 text-white">Rs. {service.price.toLocaleString()}</td>
                  <td className="px-6 py-4 text-gray-400">{service.duration || '-'}</td>
                  <td className="px-6 py-4">
                    <button onClick={() => handleToggleActive(service.id, service.active)}>
                      <AdminBadge variant={service.active ? 'active' : 'inactive'}>
                        {service.active ? 'Active' : 'Inactive'}
                      </AdminBadge>
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/admin/services/${service.id}`} className="admin-btn-secondary">Edit</Link>
                      <button onClick={() => handleDelete(service.id)} className="admin-btn-secondary text-red-300 border-red-500/30">
                        Delete
                      </button>
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
