'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ArrowLeft, Plus } from 'lucide-react'
import { AdminFormSection, AdminPageTransition, AdminShellHeader } from '@/components/admin/ui'

export default function NewTeamMemberPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    specialties: '',
    bio: '',
    experience_years: '',
    rating: '',
    client_count: '',
    active: true,
    display_order: 0,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const payload: Record<string, unknown> = {
        name: formData.name.trim(),
        role: formData.role.trim(),
        specialties: formData.specialties
          .split(',')
          .map((v) => v.trim())
          .filter(Boolean),
        bio: formData.bio.trim() || undefined,
        active: formData.active,
        display_order: formData.display_order,
      }

      if (formData.experience_years.trim()) {
        payload.experience_years = Number(formData.experience_years)
      }
      if (formData.rating.trim()) {
        payload.rating = Number(formData.rating)
      }
      if (formData.client_count.trim()) {
        payload.client_count = Number(formData.client_count)
      }

      const response = await fetch('/api/admin/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create team member')
      }

      router.push('/admin/team')
    } catch (err: any) {
      setError(err.message || 'Failed to create team member')
    } finally {
      setLoading(false)
    }
  }


  return (
    <AdminPageTransition className="space-y-5 max-w-4xl">
      <div className="flex items-center justify-between gap-3">
        <Link href="/admin/team" className="admin-btn-secondary">
          <ArrowLeft className="w-4 h-4" />
          Back to Team
        </Link>
      </div>

      <AdminShellHeader
        title="Add Team Member"
        subtitle="Create a new stylist or staff profile."
      />

      {error ? <div className="admin-card border-red-500/40 text-red-300">{error}</div> : null}

      <form onSubmit={handleSubmit} className="space-y-5">
        <AdminFormSection title="Profile">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-300 mb-2">Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                className="px-4 py-3"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-2">Role *</label>
              <input
                type="text"
                required
                value={formData.role}
                onChange={(e) => setFormData((prev) => ({ ...prev, role: e.target.value }))}
                placeholder="Senior Stylist"
                className="px-4 py-3"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-300 mb-2">Specialties (comma separated)</label>
              <input
                type="text"
                value={formData.specialties}
                onChange={(e) => setFormData((prev) => ({ ...prev, specialties: e.target.value }))}
                placeholder="Balayage, Color Correction, Bridal"
                className="px-4 py-3"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-300 mb-2">Bio</label>
              <textarea
                rows={4}
                value={formData.bio}
                onChange={(e) => setFormData((prev) => ({ ...prev, bio: e.target.value }))}
                className="px-4 py-3 resize-none"
              />
            </div>
          </div>
        </AdminFormSection>

        <AdminFormSection title="Metrics & Visibility">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm text-gray-300 mb-2">Experience (years)</label>
              <input
                type="number"
                min="0"
                value={formData.experience_years}
                onChange={(e) => setFormData((prev) => ({ ...prev, experience_years: e.target.value }))}
                className="px-4 py-3"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-2">Rating (1-5)</label>
              <input
                type="number"
                min="1"
                max="5"
                step="0.1"
                value={formData.rating}
                onChange={(e) => setFormData((prev) => ({ ...prev, rating: e.target.value }))}
                className="px-4 py-3"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-2">Client Count</label>
              <input
                type="number"
                min="0"
                value={formData.client_count}
                onChange={(e) => setFormData((prev) => ({ ...prev, client_count: e.target.value }))}
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

          <label className="inline-flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.active}
              onChange={(e) => setFormData((prev) => ({ ...prev, active: e.target.checked }))}
              className="w-4 h-4"
            />
            Active profile
          </label>
        </AdminFormSection>

        <div className="flex flex-wrap justify-end gap-3">
          <Link href="/admin/team" className="admin-btn-secondary">
            Cancel
          </Link>
          <button type="submit" disabled={loading} className="admin-btn-primary disabled:opacity-60">
            <Plus className="w-4 h-4" />
            {loading ? 'Creating...' : 'Add Team Member'}
          </button>
        </div>
      </form>
    </AdminPageTransition>
  )
}
