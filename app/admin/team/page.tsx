'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  AdminBadge,
  AdminCard,
  AdminEmptyState,
  AdminFilterBar,
  AdminLoading,
  AdminPageTransition,
  AdminShellHeader,
} from '@/components/admin/ui'
import { Plus, Users } from 'lucide-react'

interface TeamMember {
  id: string
  name: string
  role: string
  specialties: string[] | null
  image_url: string | null
  bio: string | null
  experience_years: number | null
  rating: number | null
  client_count: number | null
  active: boolean
  display_order: number
}

function asStringList(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((v): v is string => typeof v === 'string')
  return []
}

export default function TeamPage() {
  const [team, setTeam] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all')

  useEffect(() => {
    fetchTeam()
  }, [])

  const fetchTeam = async () => {
    try {
      const response = await fetch('/api/admin/team')
      const data = await response.json()
      setTeam(data.data || [])
    } catch (error) {
      console.error('Error fetching team:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleActive = async (id: string, active: boolean) => {
    await fetch(`/api/admin/team/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !active }),
    })
    fetchTeam()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this team member?')) return
    await fetch(`/api/admin/team/${id}`, { method: 'DELETE' })
    fetchTeam()
  }

  const filteredTeam = team.filter((member) => {
    if (filter === 'active') return member.active
    if (filter === 'inactive') return !member.active
    return true
  })

  if (loading) return <AdminLoading label="Loading team..." />

  return (
    <AdminPageTransition className="space-y-5">
      <AdminShellHeader
        title="Team Members"
        subtitle="Manage your stylists and staff profiles."
        actions={
          <Link href="/admin/team/new" className="admin-btn-primary">
            <Plus className="w-4 h-4" />
            Add Team Member
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

      {filteredTeam.length === 0 ? (
        <AdminEmptyState
          icon={Users}
          title="No team members found"
          description="Add your first team member to showcase your experts."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredTeam.map((member) => (
            <AdminCard key={member.id} className="p-0 overflow-hidden">
              <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {member.image_url ? (
                      <img src={member.image_url} alt={member.name} className="w-14 h-14 rounded-full object-cover border border-gold-primary/20" />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-gold-primary/10 border border-gold-primary/20 flex items-center justify-center text-gold-primary">
                        <Users className="w-5 h-5" />
                      </div>
                    )}
                    <div>
                      <p className="text-white font-medium">{member.name}</p>
                      <p className="text-gold-primary text-sm">{member.role}</p>
                    </div>
                  </div>
                  <button onClick={() => handleToggleActive(member.id, member.active)}>
                    <AdminBadge variant={member.active ? 'active' : 'inactive'}>
                      {member.active ? 'Active' : 'Inactive'}
                    </AdminBadge>
                  </button>
                </div>

                {asStringList(member.specialties).length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {asStringList(member.specialties).slice(0, 3).map((specialty) => (
                      <AdminBadge key={specialty}>{specialty}</AdminBadge>
                    ))}
                  </div>
                )}

                {member.rating && (
                  <p className="text-sm text-gray-400 mb-1">
                    Rating {member.rating} {member.client_count ? `• ${member.client_count} clients` : ''}
                  </p>
                )}
                {member.experience_years && (
                  <p className="text-sm text-gray-500">{member.experience_years} years experience</p>
                )}
              </div>

              <div className="px-5 py-4 border-t border-gold-primary/10 flex justify-end gap-2">
                <Link href={`/admin/team/${member.id}`} className="admin-btn-secondary">Edit</Link>
                <button onClick={() => handleDelete(member.id)} className="admin-btn-secondary text-red-300 border-red-500/30">
                  Remove
                </button>
              </div>
            </AdminCard>
          ))}
        </div>
      )}
    </AdminPageTransition>
  )
}
