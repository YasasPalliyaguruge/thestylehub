'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ArrowLeft, Plus, Upload } from 'lucide-react'
import { AdminFormSection, AdminLoading, AdminPageTransition, AdminShellHeader } from '@/components/admin/ui'
import { uploadImageToCloudinary } from '@/lib/cloudinary-upload'

interface TeamMember {
  id: string
  name: string
}

export default function NewPortfolioPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [uploadingBefore, setUploadingBefore] = useState(false)
  const [uploadingAfter, setUploadingAfter] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [error, setError] = useState('')
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [formData, setFormData] = useState({
    before_image_url: '',
    after_image_url: '',
    category: '',
    stylist_id: '',
    client_name: '',
    description: '',
    active: true,
    display_order: 0,
  })

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const response = await fetch('/api/admin/team')
        const data = await response.json()
        setTeamMembers(Array.isArray(data.data) ? data.data : [])
      } catch {
        setError('Failed to load team members.')
      } finally {
        setPageLoading(false)
      }
    }

    fetchTeam()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/admin/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          before_image_url: formData.before_image_url.trim(),
          after_image_url: formData.after_image_url.trim(),
          category: formData.category.trim() || undefined,
          stylist_id: formData.stylist_id || '',
          client_name: formData.client_name.trim() || undefined,
          description: formData.description.trim() || undefined,
          active: formData.active,
          display_order: formData.display_order,
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to create portfolio item')
      router.push('/admin/portfolio')
    } catch (err: any) {
      setError(err.message || 'Failed to create portfolio item')
    } finally {
      setLoading(false)
    }
  }

  const handlePortfolioUpload = async (file: File | null, variant: 'before' | 'after') => {
    if (!file) return
    setError('')
    if (variant === 'before') setUploadingBefore(true)
    if (variant === 'after') setUploadingAfter(true)

    try {
      if (!file.type.startsWith('image/')) {
        throw new Error('Please select a valid image file.')
      }
      const secureUrl = await uploadImageToCloudinary(file, { target: 'portfolio', variant })
      setFormData((prev) =>
        variant === 'before'
          ? { ...prev, before_image_url: secureUrl }
          : { ...prev, after_image_url: secureUrl }
      )
    } catch (err: any) {
      if (err?.message?.includes('CLOUDINARY_')) {
        setError('Cloudinary is not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.')
      } else {
        setError(err.message || 'Failed to upload image')
      }
    } finally {
      if (variant === 'before') setUploadingBefore(false)
      if (variant === 'after') setUploadingAfter(false)
    }
  }

  if (pageLoading) return <AdminLoading label="Loading form..." />

  return (
    <AdminPageTransition className="space-y-5 max-w-4xl">
      <div className="flex items-center justify-between gap-3">
        <Link href="/admin/portfolio" className="admin-btn-secondary">
          <ArrowLeft className="w-4 h-4" />
          Back to Portfolio
        </Link>
      </div>

      <AdminShellHeader
        title="Add Portfolio Item"
        subtitle="Create a new before-and-after showcase entry."
      />

      {error ? <div className="admin-card border-red-500/40 text-red-300">{error}</div> : null}

      <form onSubmit={handleSubmit} className="space-y-5">
        <AdminFormSection title="Images & Details">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-300 mb-2">Before Image URL *</label>
              <input
                type="url"
                required
                value={formData.before_image_url}
                onChange={(e) => setFormData((prev) => ({ ...prev, before_image_url: e.target.value }))}
                className="px-4 py-3"
              />
              <div className="mt-3 flex items-center gap-3">
                <label className="admin-btn-secondary cursor-pointer">
                  <Upload className="w-4 h-4" />
                  {uploadingBefore ? 'Uploading...' : formData.before_image_url ? 'Replace Before' : 'Upload Before'}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploadingBefore}
                    onChange={(e) => handlePortfolioUpload(e.target.files?.[0] || null, 'before')}
                  />
                </label>
              </div>
              {formData.before_image_url ? (
                <img
                  src={formData.before_image_url}
                  alt="Before preview"
                  className="mt-3 h-28 w-40 rounded-lg object-cover border border-gold-primary/20"
                />
              ) : null}
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-2">After Image URL *</label>
              <input
                type="url"
                required
                value={formData.after_image_url}
                onChange={(e) => setFormData((prev) => ({ ...prev, after_image_url: e.target.value }))}
                className="px-4 py-3"
              />
              <div className="mt-3 flex items-center gap-3">
                <label className="admin-btn-secondary cursor-pointer">
                  <Upload className="w-4 h-4" />
                  {uploadingAfter ? 'Uploading...' : formData.after_image_url ? 'Replace After' : 'Upload After'}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploadingAfter}
                    onChange={(e) => handlePortfolioUpload(e.target.files?.[0] || null, 'after')}
                  />
                </label>
              </div>
              {formData.after_image_url ? (
                <img
                  src={formData.after_image_url}
                  alt="After preview"
                  className="mt-3 h-28 w-40 rounded-lg object-cover border border-gold-primary/20"
                />
              ) : null}
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-2">Category</label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                placeholder="Color, Cut, Treatment"
                className="px-4 py-3"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-2">Stylist</label>
              <select
                value={formData.stylist_id}
                onChange={(e) => setFormData((prev) => ({ ...prev, stylist_id: e.target.value }))}
                className="px-4 py-3"
              >
                <option value="">Select stylist</option>
                {teamMembers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-2">Client Name</label>
              <input
                type="text"
                value={formData.client_name}
                onChange={(e) => setFormData((prev) => ({ ...prev, client_name: e.target.value }))}
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
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-300 mb-2">Description</label>
              <textarea
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                className="px-4 py-3 resize-none"
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
            Active
          </label>
        </AdminFormSection>

        <div className="flex flex-wrap justify-end gap-3">
          <Link href="/admin/portfolio" className="admin-btn-secondary">
            Cancel
          </Link>
          <button type="submit" disabled={loading} className="admin-btn-primary disabled:opacity-60">
            <Plus className="w-4 h-4" />
            {loading ? 'Creating...' : 'Add Portfolio Item'}
          </button>
        </div>
      </form>
    </AdminPageTransition>
  )
}
