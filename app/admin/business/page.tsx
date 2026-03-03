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

interface DayHours {
  open?: string
  close?: string
  closed?: boolean
}

interface BusinessInfo {
  id: string | null
  salon_name: string
  tagline: string | null
  description: string | null
  address: string | null
  phone: string | null
  email: string | null
  hours: Record<string, DayHours>
  social_links: Record<string, string>
}

const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

function asRecord(value: unknown): Record<string, any> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, any>
  }
  return {}
}

export default function BusinessInfoPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [formData, setFormData] = useState<BusinessInfo>({
    id: null,
    salon_name: '',
    tagline: '',
    description: '',
    address: '',
    phone: '',
    email: '',
    hours: {},
    social_links: {},
  })

  useEffect(() => {
    const fetchBusinessInfo = async () => {
      try {
        const response = await fetch('/api/admin/business')
        const data = await response.json()
        if (!response.ok || !data?.data) {
          throw new Error(data.error || 'Failed to load business information')
        }

        const next = data.data
        setFormData({
          id: next.id ?? null,
          salon_name: next.salon_name || '',
          tagline: next.tagline || '',
          description: next.description || '',
          address: next.address || '',
          phone: next.phone || '',
          email: next.email || '',
          hours: asRecord(next.hours),
          social_links: asRecord(next.social_links),
        })
      } catch (err: any) {
        setError(err.message || 'Failed to load business information')
      } finally {
        setLoading(false)
      }
    }

    fetchBusinessInfo()
  }, [])

  const updateHours = (day: string, field: keyof DayHours, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      hours: {
        ...prev.hours,
        [day]: {
          ...(prev.hours[day] || {}),
          [field]: value,
        },
      },
    }))
  }

  const updateSocialLink = (key: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      social_links: {
        ...prev.social_links,
        [key]: value,
      },
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/admin/business', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          salon_name: formData.salon_name.trim(),
          tagline: formData.tagline?.trim() || '',
          description: formData.description?.trim() || '',
          address: formData.address?.trim() || '',
          phone: formData.phone?.trim() || '',
          email: formData.email?.trim() || '',
          hours: formData.hours,
          social_links: formData.social_links,
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to update business information')
      setSuccess('Business information updated successfully.')
    } catch (err: any) {
      setError(err.message || 'Failed to update business information')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <AdminLoading label="Loading business information..." />

  return (
    <AdminPageTransition className="space-y-5 max-w-5xl">
      <div className="flex items-center justify-between gap-3">
        <Link href="/admin" className="admin-btn-secondary">
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
      </div>

      <AdminShellHeader
        title="Business Information"
        subtitle="Manage core business profile details and operating hours."
      />

      {error ? <div className="admin-card border-red-500/40 text-red-300">{error}</div> : null}
      {success ? <div className="admin-card border-green-500/40 text-green-300">{success}</div> : null}

      <form onSubmit={handleSubmit} className="space-y-5">
        <AdminFormSection title="Basic Information">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-300 mb-2">Salon Name</label>
              <input
                type="text"
                value={formData.salon_name}
                onChange={(e) => setFormData((prev) => ({ ...prev, salon_name: e.target.value }))}
                className="px-4 py-3"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-2">Tagline</label>
              <input
                type="text"
                value={formData.tagline || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, tagline: e.target.value }))}
                className="px-4 py-3"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-2">Phone</label>
              <input
                type="tel"
                value={formData.phone || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                className="px-4 py-3"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-2">Email</label>
              <input
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                className="px-4 py-3"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-300 mb-2">Address</label>
              <textarea
                rows={3}
                value={formData.address || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
                className="px-4 py-3 resize-none"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-300 mb-2">Description</label>
              <textarea
                rows={4}
                value={formData.description || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                className="px-4 py-3 resize-none"
              />
            </div>
          </div>
        </AdminFormSection>

        <AdminFormSection title="Business Hours">
          <div className="space-y-3">
            {days.map((day) => {
              const dayHours = (formData.hours[day] || {}) as DayHours
              const isOpen = !dayHours.closed
              return (
                <div key={day} className="rounded-xl border border-gold-primary/10 bg-black-primary/20 p-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="w-28 text-sm text-white capitalize">{day}</div>
                    <label className="inline-flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isOpen}
                        onChange={(e) => updateHours(day, 'closed', !e.target.checked)}
                        className="w-4 h-4"
                      />
                      Open
                    </label>
                    {isOpen ? (
                      <>
                        <input
                          type="time"
                          value={dayHours.open || ''}
                          onChange={(e) => updateHours(day, 'open', e.target.value)}
                          className="px-3 py-2 max-w-[150px]"
                        />
                        <span className="text-gray-500">to</span>
                        <input
                          type="time"
                          value={dayHours.close || ''}
                          onChange={(e) => updateHours(day, 'close', e.target.value)}
                          className="px-3 py-2 max-w-[150px]"
                        />
                      </>
                    ) : (
                      <span className="text-sm text-gray-500">Closed</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </AdminFormSection>

        <AdminFormSection title="Social Links">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-300 mb-2">Instagram</label>
              <input
                type="url"
                value={formData.social_links.instagram || ''}
                onChange={(e) => updateSocialLink('instagram', e.target.value)}
                placeholder="https://instagram.com/..."
                className="px-4 py-3"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-2">Facebook</label>
              <input
                type="url"
                value={formData.social_links.facebook || ''}
                onChange={(e) => updateSocialLink('facebook', e.target.value)}
                placeholder="https://facebook.com/..."
                className="px-4 py-3"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-2">Twitter / X</label>
              <input
                type="url"
                value={formData.social_links.twitter || ''}
                onChange={(e) => updateSocialLink('twitter', e.target.value)}
                placeholder="https://x.com/..."
                className="px-4 py-3"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-2">TikTok</label>
              <input
                type="url"
                value={formData.social_links.tiktok || ''}
                onChange={(e) => updateSocialLink('tiktok', e.target.value)}
                placeholder="https://www.tiktok.com/@..."
                className="px-4 py-3"
              />
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
