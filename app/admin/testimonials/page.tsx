'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Plus, Star } from 'lucide-react'
import {
  AdminBadge,
  AdminEmptyState,
  AdminFilterBar,
  AdminLoading,
  AdminPageTransition,
  AdminShellHeader,
  AdminTableShell,
} from '@/components/admin/ui'

interface Testimonial {
  id: string
  client_name: string
  service: string | null
  text: string
  rating: number | null
  featured: boolean
  active: boolean
}

export default function TestimonialsPage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'featured' | 'active' | 'inactive'>('all')
  const [error, setError] = useState('')
  const [role, setRole] = useState<'admin' | 'employee'>('admin')

  useEffect(() => {
    fetchTestimonials()
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

  const fetchTestimonials = async () => {
    try {
      const response = await fetch('/api/admin/testimonials')
      const data = await response.json()
      setTestimonials(Array.isArray(data.data) ? data.data : [])
    } catch {
      setError('Failed to fetch testimonials.')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleActive = async (id: string, active: boolean) => {
    try {
      const response = await fetch(`/api/admin/testimonials/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !active }),
      })
      if (!response.ok) throw new Error()
      fetchTestimonials()
    } catch {
      setError('Failed to update testimonial status.')
    }
  }

  const handleToggleFeatured = async (id: string, featured: boolean) => {
    try {
      const response = await fetch(`/api/admin/testimonials/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featured: !featured }),
      })
      if (!response.ok) throw new Error()
      fetchTestimonials()
    } catch {
      setError('Failed to update featured status.')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this testimonial?')) return

    try {
      const response = await fetch(`/api/admin/testimonials/${id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error()
      fetchTestimonials()
    } catch {
      setError('Failed to delete testimonial.')
    }
  }

  const filtered = testimonials.filter((item) => {
    if (filter === 'featured') return item.featured
    if (filter === 'active') return item.active
    if (filter === 'inactive') return !item.active
    return true
  })

  if (loading) return <AdminLoading label="Loading testimonials..." />

  return (
    <AdminPageTransition className="space-y-5">
      <AdminShellHeader
        title="Testimonials"
        subtitle="Manage client feedback and homepage featured reviews."
        actions={
          <Link href="/admin/testimonials/new" className="admin-btn-primary">
            <Plus className="w-4 h-4" />
            Add Testimonial
          </Link>
        }
      />

      {error ? <div className="admin-card border-red-500/40 text-red-300">{error}</div> : null}

      <AdminFilterBar>
        <div className="flex flex-wrap gap-2">
          {(['all', 'featured', 'active', 'inactive'] as const).map((state) => (
            <button
              key={state}
              onClick={() => setFilter(state)}
              className={filter === state ? 'admin-btn-primary capitalize' : 'admin-btn-secondary capitalize'}
            >
              {state}
            </button>
          ))}
        </div>
      </AdminFilterBar>

      {filtered.length === 0 ? (
        <AdminEmptyState
          icon={Star}
          title="No testimonials found"
          description="Add your first client review or adjust filters."
        />
      ) : (
        <AdminTableShell>
          <table className="w-full min-w-[980px]">
            <thead>
              <tr>
                <th className="px-6 py-4 text-left text-xs uppercase tracking-[0.12em] text-gray-400">Client</th>
                <th className="px-6 py-4 text-left text-xs uppercase tracking-[0.12em] text-gray-400">Service</th>
                <th className="px-6 py-4 text-left text-xs uppercase tracking-[0.12em] text-gray-400">Review</th>
                <th className="px-6 py-4 text-left text-xs uppercase tracking-[0.12em] text-gray-400">Rating</th>
                <th className="px-6 py-4 text-left text-xs uppercase tracking-[0.12em] text-gray-400">Status</th>
                <th className="px-6 py-4 text-right text-xs uppercase tracking-[0.12em] text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gold-primary/10">
              {filtered.map((item) => (
                <tr key={item.id}>
                  <td className="px-6 py-4 text-white font-medium">{item.client_name}</td>
                  <td className="px-6 py-4 text-gray-300">{item.service || '-'}</td>
                  <td className="px-6 py-4 text-gray-300">
                    <p className="line-clamp-2 max-w-lg">{item.text}</p>
                  </td>
                  <td className="px-6 py-4">
                    {item.rating ? <span className="text-gold-primary">{'★'.repeat(item.rating)}</span> : '-'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => handleToggleActive(item.id, item.active)}>
                        <AdminBadge variant={item.active ? 'active' : 'inactive'}>
                          {item.active ? 'Active' : 'Inactive'}
                        </AdminBadge>
                      </button>
                      {item.featured ? <AdminBadge variant="featured">Featured</AdminBadge> : null}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleToggleFeatured(item.id, item.featured)} className="admin-btn-secondary">
                        {item.featured ? 'Unfeature' : 'Feature'}
                      </button>
                      <Link href={`/admin/testimonials/${item.id}`} className="admin-btn-secondary">
                        Edit
                      </Link>
                      {role === 'admin' && (
                        <button onClick={() => handleDelete(item.id)} className="admin-btn-secondary text-red-300 border-red-500/40">
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
