'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ArrowLeft, Save, Trash2 } from 'lucide-react'
import {
  AdminFormSection,
  AdminLoading,
  AdminPageTransition,
  AdminShellHeader,
} from '@/components/admin/ui'

interface Service {
  id: string
  name: string
  description: string | null
  price: number
  duration: string | null
  icon: string | null
  category: string
  popular: boolean
  active: boolean
  display_order: number
}

export default function EditServicePage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [service, setService] = useState<Service | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    duration: '',
    icon: '',
    category: 'hair',
    popular: false,
    active: true,
    display_order: 0,
  })

  useEffect(() => {
    const fetchService = async () => {
      try {
        const response = await fetch(`/api/admin/services/${id}`)
        const data = await response.json()
        if (!response.ok || !data?.data) {
          throw new Error(data.error || 'Failed to load service')
        }

        const next: Service = data.data
        setService(next)
        setFormData({
          name: next.name || '',
          description: next.description || '',
          price: Number(next.price || 0).toString(),
          duration: next.duration || '',
          icon: next.icon || '',
          category: next.category || 'hair',
          popular: !!next.popular,
          active: !!next.active,
          display_order: Number(next.display_order || 0),
        })
      } catch (err: any) {
        setError(err.message || 'Failed to load service')
      } finally {
        setLoading(false)
      }
    }

    fetchService()
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)

    const parsedPrice = Number(formData.price)
    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      setError('Please enter a valid price greater than 0.')
      setSaving(false)
      return
    }

    try {
      const response = await fetch(`/api/admin/services/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          price: parsedPrice,
          duration: formData.duration.trim() || undefined,
          icon: formData.icon.trim() || undefined,
          category: formData.category,
          popular: formData.popular,
          active: formData.active,
          display_order: formData.display_order,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update service')
      }

      router.push('/admin/services')
    } catch (err: any) {
      setError(err.message || 'Failed to update service')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this service?')) return

    setError('')
    try {
      const response = await fetch(`/api/admin/services/${id}`, { method: 'DELETE' })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete service')
      }
      router.push('/admin/services')
    } catch (err: any) {
      setError(err.message || 'Failed to delete service')
    }
  }

  if (loading) return <AdminLoading label="Loading service..." />
  if (!service) {
    return <div className="admin-card border-red-500/40 text-red-300">{error || 'Service not found.'}</div>
  }

  return (
    <AdminPageTransition className="space-y-5 max-w-4xl">
      <div className="flex items-center justify-between gap-3">
        <Link href="/admin/services" className="admin-btn-secondary">
          <ArrowLeft className="w-4 h-4" />
          Back to Services
        </Link>
      </div>

      <AdminShellHeader
        title="Edit Service"
        subtitle={`Update details for "${service.name}".`}
      />

      {error ? <div className="admin-card border-red-500/40 text-red-300">{error}</div> : null}

      <form onSubmit={handleSubmit} className="space-y-5">
        <AdminFormSection title="Service Details">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-300 mb-2">Service Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                className="px-4 py-3"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm text-gray-300 mb-2">Description</label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                className="px-4 py-3 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-2">Price (LKR) *</label>
              <input
                type="number"
                min="1"
                step="0.01"
                required
                value={formData.price}
                onChange={(e) => setFormData((prev) => ({ ...prev, price: e.target.value }))}
                className="px-4 py-3"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-2">Duration</label>
              <input
                type="text"
                value={formData.duration}
                onChange={(e) => setFormData((prev) => ({ ...prev, duration: e.target.value }))}
                className="px-4 py-3"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-2">Category *</label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                className="px-4 py-3"
              >
                <option value="hair">Hair</option>
                <option value="beard">Beard</option>
                <option value="styling">Styling</option>
                <option value="color">Color</option>
                <option value="treatment">Treatment</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-2">Icon (optional)</label>
              <input
                type="text"
                value={formData.icon}
                onChange={(e) => setFormData((prev) => ({ ...prev, icon: e.target.value }))}
                className="px-4 py-3"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-2">Display Order</label>
              <input
                type="number"
                value={formData.display_order}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, display_order: Number(e.target.value) || 0 }))
                }
                className="px-4 py-3"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-6">
            <label className="inline-flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.popular}
                onChange={(e) => setFormData((prev) => ({ ...prev, popular: e.target.checked }))}
                className="w-4 h-4"
              />
              Mark as Popular
            </label>

            <label className="inline-flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.active}
                onChange={(e) => setFormData((prev) => ({ ...prev, active: e.target.checked }))}
                className="w-4 h-4"
              />
              Active
            </label>
          </div>
        </AdminFormSection>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <button type="button" onClick={handleDelete} className="admin-btn-secondary text-red-300 border-red-500/40">
            <Trash2 className="w-4 h-4" />
            Delete Service
          </button>

          <div className="flex flex-wrap gap-3">
            <Link href="/admin/services" className="admin-btn-secondary">
              Cancel
            </Link>
            <button type="submit" disabled={saving} className="admin-btn-primary disabled:opacity-60">
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </form>
    </AdminPageTransition>
  )
}
