'use client'

import { motion } from 'framer-motion'
import { Check } from 'lucide-react'

interface PricingCardProps {
  name: string
  description: string | null
  price: number
  services: string[]
  popular?: boolean
  index: number
  gender: 'men' | 'women'
}

export default function PricingCard({ name, description, price, services, popular, index, gender }: PricingCardProps) {
  return (
    <motion.article
      className={`public-card public-card-hover relative flex h-full flex-col p-7 ${popular ? 'border-gold-primary/45 bg-gold-primary/5' : ''}`}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ delay: Math.min(index * 0.07, 0.3) }}
    >
      {popular ? (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gold-primary px-3 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-black">
          Most Popular
        </span>
      ) : null}

      <div className="mb-7 text-center">
        <h3 className="min-h-[3.5rem] text-2xl font-semibold text-white">{name}</h3>
        <div className="min-h-[3.5rem]">
          {description ? <p className="mt-2 text-sm leading-6 text-gray-400">{description}</p> : null}
        </div>
      </div>

      <div className="mb-8 text-center">
        <p className="text-4xl font-semibold text-gold-primary">LKR {price.toLocaleString()}</p>
      </div>

      <ul className="mb-8 flex-1 space-y-3">
        {services.map((service) => (
          <li key={service} className="flex items-start gap-2.5 text-sm text-gray-200">
            <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full border border-gold-primary/30 bg-gold-primary/10 text-gold-primary">
              <Check className="h-3.5 w-3.5" />
            </span>
            <span>{service}</span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        className={`mt-auto w-full rounded-xl px-4 py-3 text-center text-sm font-semibold transition-all ${
          popular
            ? 'bg-gold-primary text-black hover:shadow-[0_0_24px_rgba(212,175,55,0.3)]'
            : 'border border-gold-primary/35 text-gold-primary hover:bg-gold-primary/10'
        }`}
        onClick={() => {
          sessionStorage.setItem('preselectedPackage', name)
          sessionStorage.setItem('preselectedServices', JSON.stringify(services))
          sessionStorage.setItem('preselectedGender', gender)
          window.dispatchEvent(new CustomEvent('preselectServices', { detail: { services, packageName: name, gender } }))

          const bookingSection = document.getElementById('booking')
          if (!bookingSection) return

          const headerOffset = 80
          const elementPosition = bookingSection.getBoundingClientRect().top + window.pageYOffset
          const offsetPosition = elementPosition - headerOffset

          const lenisInstance = (window as Window & { lenis?: { scrollTo: (value: number) => void } }).lenis
          if (lenisInstance) {
            lenisInstance.scrollTo(offsetPosition)
          } else {
            window.scrollTo({ top: offsetPosition, behavior: 'smooth' })
          }
        }}
      >
        Choose {name}
      </button>
    </motion.article>
  )
}
