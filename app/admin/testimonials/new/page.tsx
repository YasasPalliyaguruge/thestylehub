'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ArrowLeft, Plus } from 'lucide-react'
import { AdminFormSection, AdminPageTransition, AdminShellHeader } from '@/components/admin/ui'

export default function NewTestimonialPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/admin/testimonials', {
        method: 'POST',
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
      if (!response.ok) throw new Error(data.error || 'Failed to create testimonial')
      router.push('/admin/testimonials')
    } catch (err: any) {
      setError(err.message || 'Failed to create testimonial')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AdminPageTransition className="space-y-5 max-w-4xl">
      <div className="flex items-center justify-between gap-3">
        <Link href="/admin/testimonials" className="admin-btn-secondary">
          <ArrowLeft className="w-4 h-4" />
          Back to Testimonials
        </Link>
      </div>

      <AdminShellHeader title="Add Testimonial" subtitle="Create a new client review entry." />

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
                placeholder="Balayage and Cut"
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
                placeholder="https://..."
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

        <div className="flex flex-wrap justify-end gap-3">
          <Link href="/admin/testimonials" className="admin-btn-secondary">
            Cancel
          </Link>
          <button type="submit" disabled={loading} className="admin-btn-primary disabled:opacity-60">
            <Plus className="w-4 h-4" />
            {loading ? 'Creating...' : 'Add Testimonial'}
          </button>
        </div>
      </form>
    </AdminPageTransition>
  )
}
