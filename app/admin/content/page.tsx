'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowLeft, Save } from 'lucide-react'
import {
  AdminFormSection,
  AdminLoading,
  AdminPageTransition,
  AdminShellHeader,
} from '@/components/admin/ui'

interface HeroContent {
  id: string | null
  headline: string
  subheadline: string | null
  badge_text: string | null
  primary_cta_text: string | null
  primary_cta_link: string | null
  secondary_cta_text: string | null
  secondary_cta_link: string | null
  background_image_url: string | null
  active: boolean
}

export default function HeroContentPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [formData, setFormData] = useState<HeroContent>({
    id: null,
    headline: '',
    subheadline: '',
    badge_text: '',
    primary_cta_text: '',
    primary_cta_link: '',
    secondary_cta_text: '',
    secondary_cta_link: '',
    background_image_url: '',
    active: true,
  })

  useEffect(() => {
    const fetchHero = async () => {
      try {
        const response = await fetch('/api/admin/hero')
        const data = await response.json()
        if (!response.ok || !data?.data) {
          throw new Error(data.error || 'Failed to load hero content')
        }

        const next = data.data
        setFormData({
          id: next.id ?? null,
          headline: next.headline || '',
          subheadline: next.subheadline || '',
          badge_text: next.badge_text || '',
          primary_cta_text: next.primary_cta_text || '',
          primary_cta_link: next.primary_cta_link || '',
          secondary_cta_text: next.secondary_cta_text || '',
          secondary_cta_link: next.secondary_cta_link || '',
          background_image_url: next.background_image_url || '',
          active: next.active !== false,
        })
      } catch (err: any) {
        setError(err.message || 'Failed to load hero content')
      } finally {
        setLoading(false)
      }
    }

    fetchHero()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/admin/hero', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          headline: formData.headline.trim(),
          subheadline: formData.subheadline?.trim() || '',
          badge_text: formData.badge_text?.trim() || '',
          primary_cta_text: formData.primary_cta_text?.trim() || '',
          primary_cta_link: formData.primary_cta_link?.trim() || '',
          secondary_cta_text: formData.secondary_cta_text?.trim() || '',
          secondary_cta_link: formData.secondary_cta_link?.trim() || '',
          background_image_url: formData.background_image_url?.trim() || '',
          active: formData.active,
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to update hero content')
      setSuccess('Hero content updated successfully.')
    } catch (err: any) {
      setError(err.message || 'Failed to update hero content')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <AdminLoading label="Loading hero content..." />

  return (
    <AdminPageTransition className="space-y-5 max-w-5xl">
      <div className="flex items-center justify-between gap-3">
        <Link href="/admin" className="admin-btn-secondary">
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
      </div>

      <AdminShellHeader title="Hero Content" subtitle="Customize the public homepage hero section." />

      {error ? <div className="admin-card border-red-500/40 text-red-300">{error}</div> : null}
      {success ? <div className="admin-card border-green-500/40 text-green-300">{success}</div> : null}

      <form onSubmit={handleSubmit} className="space-y-5">
        <AdminFormSection title="Hero Fields">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-300 mb-2">Headline</label>
              <input
                type="text"
                value={formData.headline}
                onChange={(e) => setFormData((prev) => ({ ...prev, headline: e.target.value }))}
                className="px-4 py-3"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-300 mb-2">Subheadline</label>
              <textarea
                rows={3}
                value={formData.subheadline || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, subheadline: e.target.value }))}
                className="px-4 py-3 resize-none"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-2">Badge Text</label>
              <input
                type="text"
                value={formData.badge_text || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, badge_text: e.target.value }))}
                className="px-4 py-3"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-2">Background Image URL</label>
              <input
                type="url"
                value={formData.background_image_url || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, background_image_url: e.target.value }))}
                className="px-4 py-3"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-2">Primary CTA Text</label>
              <input
                type="text"
                value={formData.primary_cta_text || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, primary_cta_text: e.target.value }))}
                className="px-4 py-3"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-2">Primary CTA Link</label>
              <input
                type="text"
                value={formData.primary_cta_link || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, primary_cta_link: e.target.value }))}
                className="px-4 py-3"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-2">Secondary CTA Text</label>
              <input
                type="text"
                value={formData.secondary_cta_text || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, secondary_cta_text: e.target.value }))}
                className="px-4 py-3"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-2">Secondary CTA Link</label>
              <input
                type="text"
                value={formData.secondary_cta_link || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, secondary_cta_link: e.target.value }))}
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
            Active
          </label>
        </AdminFormSection>

        <AdminFormSection title="Preview">
          <div className="rounded-2xl border border-gold-primary/20 bg-gradient-to-br from-black-primary to-black-secondary p-8 text-center">
            {formData.badge_text ? (
              <span className="inline-flex px-3 py-1 text-xs uppercase tracking-[0.14em] rounded-full bg-gold-primary/15 text-gold-primary">
                {formData.badge_text}
              </span>
            ) : null}
            <h3 className="mt-4 text-3xl text-white font-display">{formData.headline || 'Hero headline'}</h3>
            <p className="mt-3 text-gray-400 max-w-2xl mx-auto">{formData.subheadline || 'Hero subheadline preview.'}</p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              {formData.primary_cta_text ? <span className="admin-btn-primary">{formData.primary_cta_text}</span> : null}
              {formData.secondary_cta_text ? <span className="admin-btn-secondary">{formData.secondary_cta_text}</span> : null}
            </div>
          </div>
        </AdminFormSection>

        <div className="flex flex-wrap justify-end gap-3">
          <Link href="/admin" className="admin-btn-secondary">
            Cancel
          </Link>
          <button type="submit" disabled={saving} className="admin-btn-primary disabled:opacity-60">
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </AdminPageTransition>
  )
}
