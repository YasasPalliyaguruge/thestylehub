'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  AdminBadge,
  AdminEmptyState,
  AdminFilterBar,
  AdminLoading,
  AdminPageTransition,
  AdminShellHeader,
} from '@/components/admin/ui'
import { Images, Plus } from 'lucide-react'

interface PortfolioItem {
  id: string
  before_image_url: string
  after_image_url: string
  category: string | null
  stylist_name: string | null
  client_name: string | null
  active: boolean
}

export default function PortfolioPage() {
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all')

  useEffect(() => {
    fetchPortfolio()
  }, [])

  const fetchPortfolio = async () => {
    try {
      const response = await fetch('/api/admin/portfolio')
      const data = await response.json()
      setPortfolio(data.data || [])
    } catch (error) {
      console.error('Error fetching portfolio:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleActive = async (id: string, active: boolean) => {
    await fetch(`/api/admin/portfolio/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !active }),
    })
    fetchPortfolio()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this portfolio item?')) return
    await fetch(`/api/admin/portfolio/${id}`, { method: 'DELETE' })
    fetchPortfolio()
  }

  const filteredPortfolio = portfolio.filter((item) => {
    if (filter === 'active') return item.active
    if (filter === 'inactive') return !item.active
    return true
  })

  if (loading) return <AdminLoading label="Loading portfolio..." />

  return (
    <AdminPageTransition className="space-y-5">
      <AdminShellHeader
        title="Portfolio"
        subtitle="Manage before and after transformations."
        actions={
          <Link href="/admin/portfolio/new" className="admin-btn-primary">
            <Plus className="w-4 h-4" />
            Add Item
          </Link>
        }
      />

      <AdminFilterBar>
        <div className="flex gap-2 flex-wrap">
          {(['all', 'active', 'inactive'] as const).map((state) => (
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

      {filteredPortfolio.length === 0 ? (
        <AdminEmptyState
          icon={Images}
          title="No portfolio items found"
          description="Add showcase items to highlight transformations."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredPortfolio.map((item) => (
            <article key={item.id} className="admin-card p-0 overflow-hidden">
              <div className="grid grid-cols-2 gap-1">
                <div className="relative aspect-square">
                  <img src={item.before_image_url} alt="Before" className="w-full h-full object-cover" />
                  <span className="absolute bottom-2 left-2 text-[10px] uppercase tracking-wide px-2 py-1 rounded bg-black/70 text-white">Before</span>
                </div>
                <div className="relative aspect-square">
                  <img src={item.after_image_url} alt="After" className="w-full h-full object-cover" />
                  <span className="absolute bottom-2 left-2 text-[10px] uppercase tracking-wide px-2 py-1 rounded bg-gold-primary/85 text-black">After</span>
                </div>
              </div>
              <div className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  {item.category ? <AdminBadge>{item.category}</AdminBadge> : <span />}
                  <button onClick={() => handleToggleActive(item.id, item.active)}>
                    <AdminBadge variant={item.active ? 'active' : 'inactive'}>
                      {item.active ? 'Active' : 'Inactive'}
                    </AdminBadge>
                  </button>
                </div>
                {item.stylist_name && <p className="text-sm text-gray-400">Stylist: {item.stylist_name}</p>}
                {item.client_name && <p className="text-sm text-gray-500">Client: {item.client_name}</p>}
              </div>
              <div className="px-4 py-3 border-t border-gold-primary/10 flex justify-end gap-2">
                <Link href={`/admin/portfolio/${item.id}`} className="admin-btn-secondary">Edit</Link>
                <button onClick={() => handleDelete(item.id)} className="admin-btn-secondary text-red-300 border-red-500/30">
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </AdminPageTransition>
  )
}
