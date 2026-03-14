'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import { Clock3, Star, Users } from 'lucide-react'
import { scrollToElement } from '@/lib/utils'

interface TeamCardProps {
  name: string
  role: string
  specialties: string[]
  bio: string | null
  experience: number | null
  rating: number | null
  clients: number | null
  index: number
}

function scrollToBooking(name: string) {
  sessionStorage.setItem('preselectedStylist', name)
  window.dispatchEvent(new CustomEvent('preselectStylist', { detail: { stylist: name } }))
  scrollToElement('booking')
}

export default function TeamCard({ name, role, specialties, bio, experience, rating, clients, index }: TeamCardProps) {
  return (
    <motion.article
      className="public-card public-card-hover public-lead-card flex h-full flex-col overflow-hidden"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ delay: Math.min(index * 0.06, 0.28) }}
    >
      <div className="border-b border-gold-primary/15 p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <span className="rounded-full border border-gold-primary/30 bg-gold-primary/10 px-3 py-1 text-[0.62rem] uppercase tracking-[0.16em] text-gold-primary">
              {role}
            </span>
            <h3 className="mt-3 text-xl font-semibold text-white">{name}</h3>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full border border-gold-primary/20 bg-black/55 px-3 py-1 text-[0.65rem] uppercase tracking-[0.14em] text-gold-primary">
            <Star className="h-3.5 w-3.5 text-gold-primary" />
            {rating ?? '4.9'}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-[var(--card-pad)]">
        <p className="text-sm leading-6 text-gray-400 lg:min-h-[5.25rem]">
          {bio || 'Trusted stylist delivering high-finish, personalized looks.'}
        </p>

        <div className="mt-4 grid grid-cols-3 gap-2 text-xs text-gray-300">
          <div className="rounded-xl border border-gold-primary/15 bg-black/45 p-2.5 text-center">
            <Clock3 className="mx-auto mb-1.5 h-3.5 w-3.5 text-gold-primary" />
            <div className="font-semibold text-white">{experience ?? '-'}y</div>
            <div className="text-gray-500">Experience</div>
          </div>
          <div className="rounded-xl border border-gold-primary/15 bg-black/45 p-2.5 text-center">
            <Star className="mx-auto mb-1.5 h-3.5 w-3.5 text-gold-primary" />
            <div className="font-semibold text-white">{rating ?? '-'}</div>
            <div className="text-gray-500">Rating</div>
          </div>
          <div className="rounded-xl border border-gold-primary/15 bg-black/45 p-2.5 text-center">
            <Users className="mx-auto mb-1.5 h-3.5 w-3.5 text-gold-primary" />
            <div className="font-semibold text-white">{clients ? `${Math.round(clients / 100) / 10}k` : '-'}</div>
            <div className="text-gray-500">Clients</div>
          </div>
        </div>

        <div className="mt-4">
          {specialties.length ? (
            <div className="flex flex-wrap gap-2">
              {specialties.slice(0, 3).map((specialty) => (
                <span key={specialty} className="public-chip !text-[0.58rem]">
                  {specialty}
                </span>
              ))}
            </div>
          ) : (
            <div aria-hidden="true" />
          )}
        </div>

        <div className="mt-auto pt-4">
          <div className="public-divider" />
          <button
            type="button"
            className="mt-4 w-full min-h-[44px] rounded-xl border border-gold-primary/30 bg-gold-primary/10 px-4 py-3 text-sm font-medium text-gold-primary transition-colors hover:bg-gold-primary hover:text-black"
            onClick={() => scrollToBooking(name)}
          >
            Book with {name.split(' ')[0]}
          </button>
        </div>
      </div>
    </motion.article>
  )
}
