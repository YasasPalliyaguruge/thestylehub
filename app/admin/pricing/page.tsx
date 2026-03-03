'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { BadgeDollarSign, Plus } from 'lucide-react'
import {
  AdminBadge,
  AdminCard,
  AdminEmptyState,
  AdminFilterBar,
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
}

function asStringList(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((v): v is string => typeof v === 'string')
  return []
}

export default function PricingPage() {
  const [packages, setPackages] = useState<PricingPackage[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'men' | 'women'>('all')
  const [error, setError] = useState('')

  useEffect(() => {
    fetchPackages()
  }, [])

  const fetchPackages = async () => {
    try {
      const response = await fetch('/api/admin/pricing')
      const data = await response.json()
      setPackages(Array.isArray(data.data) ? data.data : [])
    } catch {
      setError('Failed to fetch pricing packages.')
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = async (id: string, key: 'active' | 'popular', current: boolean) => {
    try {
      const response = await fetch(`/api/admin/pricing/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: !current }),
      })
      if (!response.ok) throw new Error()
      fetchPackages()
    } catch {
      setError(`Failed to update package ${key}.`)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this package?')) return
    try {
      const response = await fetch(`/api/admin/pricing/${id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error()
      fetchPackages()
    } catch {
      setError('Failed to delete pricing package.')
    }
  }

  const filteredPackages = packages.filter((pkg) => (filter === 'all' ? true : pkg.gender === filter))

  if (loading) return <AdminLoading label="Loading pricing packages..." />

  return (
    <AdminPageTransition className="space-y-5">
      <AdminShellHeader
        title="Pricing"
        subtitle="Manage package pricing, visibility, and featured plans."
        actions={
          <Link href="/admin/pricing/new" className="admin-btn-primary">
            <Plus className="w-4 h-4" />
            Add Package
          </Link>
        }
      />

      {error ? <div className="admin-card border-red-500/40 text-red-300">{error}</div> : null}

      <AdminFilterBar>
        <div className="flex flex-wrap gap-2">
          {(['all', 'men', 'women'] as const).map((value) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={filter === value ? 'admin-btn-primary capitalize' : 'admin-btn-secondary capitalize'}
            >
              {value}
            </button>
          ))}
        </div>
      </AdminFilterBar>

      {filteredPackages.length === 0 ? (
        <AdminEmptyState
          icon={BadgeDollarSign}
          title="No pricing packages found"
          description="Create your first package or adjust filters."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredPackages.map((pkg) => (
            <AdminCard key={pkg.id} className="p-0 overflow-hidden">
              <div className="p-5 border-b border-gold-primary/10">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-white text-lg font-semibold">{pkg.name}</p>
                    <p className="text-gold-primary mt-1 font-semibold">LKR {Number(pkg.price || 0).toLocaleString()}</p>
                  </div>
                  <div className="flex flex-col gap-2 items-end">
                    <AdminBadge variant={pkg.gender}>{pkg.gender}</AdminBadge>
                    {pkg.popular ? <AdminBadge variant="featured">Popular</AdminBadge> : null}
                  </div>
                </div>
                {pkg.description ? <p className="mt-3 text-sm text-gray-400">{pkg.description}</p> : null}
              </div>

              <div className="p-5 space-y-3">
                <div className="space-y-2">
                  {asStringList(pkg.services).slice(0, 5).map((item) => (
                    <div key={`${pkg.id}-${item}`} className="text-sm text-gray-300">
                      • {item}
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2">
                  <button onClick={() => handleToggle(pkg.id, 'active', pkg.active)}>
                    <AdminBadge variant={pkg.active ? 'active' : 'inactive'}>
                      {pkg.active ? 'Active' : 'Inactive'}
                    </AdminBadge>
                  </button>
                  <button onClick={() => handleToggle(pkg.id, 'popular', pkg.popular)}>
                    <AdminBadge variant={pkg.popular ? 'featured' : 'default'}>
                      {pkg.popular ? 'Featured' : 'Feature'}
                    </AdminBadge>
                  </button>
                </div>
              </div>

              <div className="p-4 border-t border-gold-primary/10 flex justify-end gap-2">
                <Link href={`/admin/pricing/${pkg.id}`} className="admin-btn-secondary">
                  Edit
                </Link>
                <button onClick={() => handleDelete(pkg.id)} className="admin-btn-secondary text-red-300 border-red-500/40">
                  Delete
                </button>
              </div>
            </AdminCard>
          ))}
        </div>
      )}
    </AdminPageTransition>
  )
}
