'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import TeamCard from './TeamCard'
import { AnimatedGrid, SectionWrapper } from '@/components/ui/SectionWrapper'

interface TeamMember {
  id: string
  name: string
  role: string
  specialties: unknown
  image: string | null
  bio: string | null
  experience: number | null
  rating: number | null
  clients: number | null
  active: boolean
  display_order: number
}

function asSpecialties(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((v): v is string => typeof v === 'string')
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : []
    } catch {
      return []
    }
  }
  return []
}

function normalizeImageUrl(url: string | null | undefined): string {
  if (typeof url === 'string' && url.trim()) return url
  return 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000"><rect width="100%" height="100%" fill="%23151515"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23d4af37" font-size="34" font-family="Arial">No image</text></svg>'
}

export default function Team() {
  const [team, setTeam] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const response = await fetch('/api/public/team')
        const data = await response.json()

        if (data.success) {
          setTeam(data.data)
        } else {
          setError('Failed to load team members')
        }
      } catch (err) {
        setError('Failed to load team members')
        console.error('Error fetching team:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchTeam()
  }, [])

  if (loading) {
    return (
      <section id="team" className="public-section py-32">
        <div className="mx-auto max-w-7xl px-6 text-center lg:px-8">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-gold-primary" />
          <p className="mt-4 text-gray-400">Loading team...</p>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section id="team" className="public-section py-32">
        <div className="mx-auto max-w-7xl px-6 text-center lg:px-8">
          <p className="text-red-400">{error}</p>
          <p className="mt-2 text-gray-500">Please refresh the page to try again.</p>
        </div>
      </section>
    )
  }

  return (
    <SectionWrapper id="team" className="section-shell py-28 md:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mb-14 grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(260px,0.95fr)] lg:items-end">
          <motion.div initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }}>
            <span className="public-eyebrow">Our Team</span>
            <h2 className="public-section-title mt-4 max-w-[12ch]">
              Meet Our <span className="public-heading-gradient">Expert Stylists</span>
            </h2>
            <p className="public-section-copy mt-5 max-w-2xl">
              Specialists chosen for technical precision, thoughtful consultation, and the ability to tailor every finish to the client in front of them.
            </p>
          </motion.div>

          <motion.div
            className="public-panel grid gap-4 p-5 sm:grid-cols-3"
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ delay: 0.08 }}
          >
            <div>
              <div className="public-metric-value text-gold-primary">{team.length}</div>
              <div className="public-metric-label">Lead Stylists</div>
            </div>
            <div>
              <div className="public-metric-value text-gold-primary">1:1</div>
              <div className="public-metric-label">Consultation Focus</div>
            </div>
            <div>
              <div className="public-metric-value text-gold-primary">High-touch</div>
              <div className="public-metric-label">Premium Service Flow</div>
            </div>
          </motion.div>
        </div>

        <AnimatedGrid className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          {team.map((member, index) => (
            <TeamCard
              key={member.id}
              {...member}
              specialties={asSpecialties(member.specialties)}
              image={normalizeImageUrl(member.image)}
              index={index}
            />
          ))}
        </AnimatedGrid>
      </div>
    </SectionWrapper>
  )
}
