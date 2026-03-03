'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import { Clock3, Star, Users } from 'lucide-react'

interface TeamCardProps {
  name: string
  role: string
  specialties: string[]
  image: string
  bio: string | null
  experience: number | null
  rating: number | null
  clients: number | null
  index: number
}

function scrollToBooking(name: string) {
  sessionStorage.setItem('preselectedStylist', name)
  window.dispatchEvent(new CustomEvent('preselectStylist', { detail: { stylist: name } }))
  const bookingSection = document.getElementById('booking')
  if (!bookingSection) return

  const headerOffset = 80
  const elementPosition = bookingSection.getBoundingClientRect().top + window.pageYOffset
  const offsetPosition = elementPosition - headerOffset

  const lenisInstance = (window as Window & { lenis?: { scrollTo: (value: number) => void } }).lenis
  if (lenisInstance) {
    lenisInstance.scrollTo(offsetPosition)
    return
  }

  window.scrollTo({ top: offsetPosition, behavior: 'smooth' })
}

export default function TeamCard({ name, role, specialties, image, bio, experience, rating, clients, index }: TeamCardProps) {
  return (
    <motion.article
      className="public-card public-card-hover flex h-full flex-col overflow-hidden"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ delay: Math.min(index * 0.06, 0.28) }}
    >
      <div className="relative aspect-[3/4] border-b border-gold-primary/15">
        <Image src={image} alt={`${name}, ${role}`} fill className="object-cover" sizes="(max-width: 768px) 100vw, 420px" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        <div className="absolute bottom-3 left-3">
          <span className="rounded-full border border-gold-primary/30 bg-black/65 px-3 py-1 text-[0.62rem] uppercase tracking-[0.16em] text-gold-primary">
            {role}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-xl font-semibold text-white">{name}</h3>
        <p className="mt-1 text-sm leading-6 text-gray-400">{bio || 'Trusted stylist delivering high-finish, personalized looks.'}</p>

        <div className="mt-4 grid grid-cols-3 gap-2 text-xs text-gray-300">
          <div className="rounded-lg border border-gold-primary/15 bg-black/45 p-2 text-center">
            <Clock3 className="mx-auto mb-1 h-3.5 w-3.5 text-gold-primary" />
            <div className="font-semibold text-white">{experience ?? '-'}y</div>
            <div className="text-gray-500">Experience</div>
          </div>
          <div className="rounded-lg border border-gold-primary/15 bg-black/45 p-2 text-center">
            <Star className="mx-auto mb-1 h-3.5 w-3.5 text-gold-primary" />
            <div className="font-semibold text-white">{rating ?? '-'}</div>
            <div className="text-gray-500">Rating</div>
          </div>
          <div className="rounded-lg border border-gold-primary/15 bg-black/45 p-2 text-center">
            <Users className="mx-auto mb-1 h-3.5 w-3.5 text-gold-primary" />
            <div className="font-semibold text-white">{clients ? `${Math.round(clients / 100) / 10}k` : '-'}</div>
            <div className="text-gray-500">Clients</div>
          </div>
        </div>

        {specialties.length ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {specialties.slice(0, 3).map((specialty) => (
              <span key={specialty} className="public-chip !text-[0.58rem]">
                {specialty}
              </span>
            ))}
          </div>
        ) : null}

        <button
          type="button"
          className="mt-5 rounded-xl border border-gold-primary/30 bg-gold-primary/10 px-4 py-2.5 text-sm font-medium text-gold-primary transition-colors hover:bg-gold-primary hover:text-black"
          onClick={() => scrollToBooking(name)}
        >
          Book with {name.split(' ')[0]}
        </button>
      </div>
    </motion.article>
  )
}
