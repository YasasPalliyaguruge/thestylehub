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

interface Testimonial {
  id: string
  client_name: string
  service: string | null
  text: string
  rating: number | null
  image_url: string | null
  date: string | null
  featured: boolean
  active: boolean
  display_order: number
}

export default function EditTestimonialPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [testimonial, setTestimonial] = useState<Testimonial | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    client_name: '',
    service: '',
    text: '',
    rating: 5,
    image_url: '',
    date: '',
    featured: false,
    active: true,
    display_order: 0,
  })

  useEffect(() => {
    const fetchTestimonial = async () => {
      try {
        const response = await fetch(`/api/admin/testimonials/${id}`)
        const data = await response.json()
        if (!response.ok || !data?.data) {
          throw new Error(data.error || 'Failed to load testimonial')
        }

        const next: Testimonial = data.data
        setTestimonial(next)
        setFormData({
          client_name: next.client_name || '',
          service: next.service || '',
          text: next.text || '',
          rating: next.rating || 5,
          image_url: next.image_url || '',
          date: next.date ? String(next.date).slice(0, 10) : '',
          featured: !!next.featured,
          active: !!next.active,
          display_order: Number(next.display_order || 0),
        })
      } catch (err: any) {
        setError(err.message || 'Failed to load testimonial')
      } finally {
        setLoading(false)
      }
    }

    fetchTestimonial()
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      const response = await fetch(`/api/admin/testimonials/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_name: formData.client_name.trim(),
          service: formData.service.trim() || undefined,
          text: formData.text.trim(),
          rating: formData.rating || undefined,
          image_url: formData.image_url.trim() || '',
          date: formData.date || undefined,
          featured: formData.featured,
          active: formData.active,
          display_order: formData.display_order,
        }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to update testimonial')
      router.push('/admin/testimonials')
    } catch (err: any) {
      setError(err.message || 'Failed to update testimonial')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this testimonial?')) return

    try {
      const response = await fetch(`/api/admin/testimonials/${id}`, { method: 'DELETE' })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to delete testimonial')
      router.push('/admin/testimonials')
    } catch (err: any) {
      setError(err.message || 'Failed to delete testimonial')
    }
  }

  if (loading) return <AdminLoading label="Loading testimonial..." />
  if (!testimonial) return <div className="admin-card border-red-500/40 text-red-300">{error || 'Testimonial not found.'}</div>

  return (
    <AdminPageTransition className="space-y-5 max-w-4xl">
      <div className="flex items-center justify-between gap-3">
        <Link href="/admin/testimonials" className="admin-btn-secondary">
          <ArrowLeft className="w-4 h-4" />
          Back to Testimonials
        </Link>
      </div>

      <AdminShellHeader title="Edit Testimonial" subtitle={`Update review from "${testimonial.client_name}".`} />

      {error ? <div className="admin-card border-red-500/40 text-red-300">{error}</div> : null}

      <form onSubmit={handleSubmit} className="space-y-5">
        <AdminFormSection title="Testimonial Details">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-300 mb-2">Client Name *</label>
              <input
                type="text"
                required
                value={formData.client_name}
                onChange={(e) => setFormData((prev) => ({ ...prev, client_name: e.target.value }))}
                className="px-4 py-3"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-2">Service</label>
              <input
                type="text"
                value={formData.service}
                onChange={(e) => setFormData((prev) => ({ ...prev, service: e.target.value }))}
                className="px-4 py-3"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-300 mb-2">Review Text *</label>
              <textarea
                rows={5}
                required
                value={formData.text}
                onChange={(e) => setFormData((prev) => ({ ...prev, text: e.target.value }))}
                className="px-4 py-3 resize-none"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-2">Rating</label>
              <select
                value={formData.rating}
                onChange={(e) => setFormData((prev) => ({ ...prev, rating: Number(e.target.value) }))}
                className="px-4 py-3"
              >
                <option value={5}>5 Stars</option>
                <option value={4}>4 Stars</option>
                <option value={3}>3 Stars</option>
                <option value={2}>2 Stars</option>
                <option value={1}>1 Star</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-2">Date</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
                className="px-4 py-3"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-300 mb-2">Client Image URL</label>
              <input
                type="url"
                value={formData.image_url}
                onChange={(e) => setFormData((prev) => ({ ...prev, image_url: e.target.value }))}
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
                checked={formData.featured}
                onChange={(e) => setFormData((prev) => ({ ...prev, featured: e.target.checked }))}
                className="w-4 h-4"
              />
              Featured
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
            Delete Testimonial
          </button>

          <div className="flex flex-wrap gap-3">
            <Link href="/admin/testimonials" className="admin-btn-secondary">
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
