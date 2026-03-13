'use client'

import { motion } from 'framer-motion'
import { ArrowRight, Clock3 } from 'lucide-react'
import { getServiceIcon } from '@/lib/icon-map'
import { scrollToElement } from '@/lib/utils'

interface ServiceCardProps {
  name: string
  description: string | null
  price: number
  duration: string | null
  icon: string | null
  category: string
  popular?: boolean
  index: number
}

export default function ServiceCard({ name, description, price, duration, icon, category, popular }: ServiceCardProps) {
  const Icon = getServiceIcon(name, icon, category)
  const categoryLabel = category ? category.replace(/_/g, ' ') : 'Signature service'

  const handleBookService = () => {
    sessionStorage.setItem('preselectedServices', JSON.stringify([name]))
    sessionStorage.removeItem('preselectedPackage')
    sessionStorage.removeItem('preselectedGender')
    window.dispatchEvent(new CustomEvent('preselectServices', { detail: { services: [name] } }))
    scrollToElement('booking')
  }

  return (
    <motion.article className="public-card public-card-hover public-lead-card flex h-full flex-col p-6 md:p-7" whileHover={{ y: -2 }}>
      <div className="mb-5 flex items-start justify-between gap-4">
        <span className="public-icon-wrap">
          <Icon className="h-5 w-5" />
        </span>
        <div className="flex flex-wrap justify-end gap-2">
          <span className="public-chip !text-[0.58rem]">{categoryLabel}</span>
          {popular ? <span className="public-chip !bg-gold-primary/12 !text-gold-primary">Popular</span> : null}
        </div>
      </div>

      <div className="min-h-[7rem]">
        <h3 className="mb-2 min-h-[3rem] text-[1.35rem] font-semibold leading-tight text-white">{name}</h3>
        <p className="line-clamp-3 min-h-[4.25rem] text-sm leading-6 text-gray-400">
          {description || 'Premium salon service tailored to your style.'}
        </p>
      </div>

      <div className="mt-auto">
        <div className="public-divider mb-4" />
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-[0.7rem] uppercase tracking-[0.22em] text-gray-500">Starting from</p>
            <p className="mt-2 text-2xl font-semibold text-gold-primary">LKR {price.toLocaleString()}</p>
          </div>
          {duration ? (
            <span className="inline-flex items-center gap-2 rounded-full border border-gold-primary/20 bg-black/40 px-3 py-1.5 text-[0.68rem] uppercase tracking-[0.16em] text-gray-300">
              <Clock3 className="h-3.5 w-3.5 text-gold-primary" />
              {duration}
            </span>
          ) : null}
        </div>

        <button
          type="button"
          onClick={handleBookService}
          className="inline-flex items-center gap-2 text-sm text-gray-300 transition-colors hover:text-gold-primary"
        >
          Book this service
          <ArrowRight className="h-4 w-4 text-gold-primary" />
        </button>
      </div>
    </motion.article>
  )
}
