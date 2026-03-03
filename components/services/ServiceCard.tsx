'use client'

import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { getServiceIcon } from '@/lib/icon-map'

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

  return (
    <motion.article className="public-card public-card-hover flex h-full flex-col p-6" whileHover={{ y: -2 }}>
      <div className="mb-4 flex items-start justify-between">
        <span className="public-icon-wrap">
          <Icon className="h-5 w-5" />
        </span>
        {popular ? <span className="public-chip">Popular</span> : null}
      </div>

      <h3 className="mb-2 text-xl font-semibold text-white">{name}</h3>
      <p className="mb-5 line-clamp-3 text-sm leading-6 text-gray-400">{description || 'Premium salon service tailored to your style.'}</p>

      <div className="mt-auto border-t border-gold-primary/15 pt-4">
        <div className="mb-3 flex items-end justify-between">
          <p className="text-xl font-semibold text-gold-primary">LKR {price.toLocaleString()}</p>
          {duration ? <span className="text-xs uppercase tracking-[0.14em] text-gray-400">{duration}</span> : null}
        </div>

        <div className="inline-flex items-center gap-2 text-sm text-gray-300">
          Learn more
          <ArrowRight className="h-4 w-4 text-gold-primary" />
        </div>
      </div>
    </motion.article>
  )
}
