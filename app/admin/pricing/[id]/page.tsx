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

interface PricingPackage {
  id: string
  name: string
  description: string | null
  gender: 'men' | 'women'
  price: number
  services: unknown
  popular: boolean
  active: boolean
  display_order: number
}

function asStringList(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((v): v is string => typeof v === 'string')
  return []
}

export default function EditPricingPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [pkg, setPkg] = useState<PricingPackage | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    gender: 'men' as 'men' | 'women',
    price: '',
    services: '',
    popular: false,
    active: true,
    display_order: 0,
  })

  useEffect(() => {
    const fetchPackage = async () => {
      try {
        const response = await fetch(`/api/admin/pricing/${id}`)
        const data = await response.json()
        if (!response.ok || !data?.data) {
          throw new Error(data.error || 'Failed to load pricing package')
        }

        const next: PricingPackage = data.data
        setPkg(next)
        setFormData({
          name: next.name || '',
          description: next.description || '',
          gender: next.gender || 'men',
          price: Number(next.price || 0).toString(),
          services: asStringList(next.services).join('\n'),
          popular: !!next.popular,
          active: !!next.active,
          display_order: Number(next.display_order || 0),
        })
      } catch (err: any) {
        setError(err.message || 'Failed to load pricing package')
      } finally {
        setLoading(false)
      }
    }

    fetchPackage()
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)

    const price = Number(formData.price)
    const services = formData.services
      .split('\n')
      .map((v) => v.trim())
      .filter(Boolean)

    if (!Number.isFinite(price) || price <= 0) {
      setError('Please enter a valid price greater than 0.')
      setSaving(false)
      return
    }
    if (services.length === 0) {
      setError('Please include at least one service.')
      setSaving(false)
      return
    }

    try {
      const response = await fetch(`/api/admin/pricing/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          gender: formData.gender,
          price,
          services,
          popular: formData.popular,
          active: formData.active,
          display_order: formData.display_order,
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to update package')
      router.push('/admin/pricing')
    } catch (err: any) {
      setError(err.message || 'Failed to update package')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this package?')) return

    try {
      const response = await fetch(`/api/admin/pricing/${id}`, { method: 'DELETE' })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to delete package')
      router.push('/admin/pricing')
    } catch (err: any) {
      setError(err.message || 'Failed to delete package')
    }
  }

  if (loading) return <AdminLoading label="Loading pricing package..." />
  if (!pkg) return <div className="admin-card border-red-500/40 text-red-300">{error || 'Package not found.'}</div>

  return (
    <AdminPageTransition className="space-y-5 max-w-4xl">
      <div className="flex items-center justify-between gap-3">
        <Link href="/admin/pricing" className="admin-btn-secondary">
          <ArrowLeft className="w-4 h-4" />
          Back to Pricing
        </Link>
      </div>

      <AdminShellHeader title="Edit Pricing Package" subtitle={`Update details for "${pkg.name}".`} />

      {error ? <div className="admin-card border-red-500/40 text-red-300">{error}</div> : null}

      <form onSubmit={handleSubmit} className="space-y-5">
        <AdminFormSection title="Package Details">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-300 mb-2">Package Name *</label>
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
              <label className="block text-sm text-gray-300 mb-2">Gender *</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData((prev) => ({ ...prev, gender: e.target.value as 'men' | 'women' }))}
                className="px-4 py-3"
              >
                <option value="men">Men</option>
                <option value="women">Women</option>
              </select>
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
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-300 mb-2">Included Services *</label>
              <textarea
                rows={6}
                required
                value={formData.services}
                onChange={(e) => setFormData((prev) => ({ ...prev, services: e.target.value }))}
                className="px-4 py-3 resize-none"
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
            Delete Package
          </button>

          <div className="flex flex-wrap gap-3">
            <Link href="/admin/pricing" className="admin-btn-secondary">
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
