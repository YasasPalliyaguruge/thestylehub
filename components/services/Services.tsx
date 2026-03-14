'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronDown, ChevronUp } from 'lucide-react'
import ServiceCard from './ServiceCard'
import { SectionWrapper } from '@/components/ui/SectionWrapper'

interface Service {
  id: string
  name: string
  description: string | null
  price: number
  duration: string | null
  icon: string | null
  category: string
  popular: boolean
  display_order: number
  active: boolean
}

export default function Services() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await fetch('/api/public/services')
        const data = await response.json()

        if (data.success) {
          setServices(data.data)
        } else {
          setError('Failed to load services')
        }
      } catch (err) {
        setError('Failed to load services')
        console.error('Error fetching services:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchServices()
  }, [])

  const displayServices = useMemo(() => (showAll ? services : services.slice(0, 8)), [services, showAll])
  const categories = useMemo(() => new Set(services.map((service) => service.category)).size, [services])

  if (loading) {
    return (
      <section id="services" className="public-section section-shell py-10 sm:py-14">
        <div className="mx-auto max-w-7xl px-5 text-center sm:px-6 lg:px-8">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-gold-primary" />
          <p className="mt-4 text-gray-400">Loading services...</p>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section id="services" className="public-section section-shell py-10 sm:py-14">
        <div className="mx-auto max-w-7xl px-5 text-center sm:px-6 lg:px-8">
          <p className="text-red-400">{error}</p>
          <p className="mt-2 text-gray-500">Please refresh the page to try again.</p>
        </div>
      </section>
    )
  }

  return (
    <SectionWrapper id="services" className="section-shell py-10 sm:py-14 lg:py-20">
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="mb-6 grid gap-5 sm:mb-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(260px,0.8fr)] lg:items-end">
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }}>
            <span className="public-eyebrow">Our Services</span>
            <h2 className="public-section-title mt-4 max-w-[12ch]">
              Tailored <span className="public-heading-gradient">Salon Services</span>
            </h2>
            <p className="public-section-copy mt-4 max-w-2xl">
              Precision cutting, bespoke color, and restorative rituals planned around your hair goals, maintenance routine, and signature style.
            </p>
          </motion.div>

          <motion.div
            className="public-panel grid gap-4 p-[var(--card-pad)] sm:grid-cols-3"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ delay: 0.08 }}
          >
            <div>
              <div className="public-metric-value text-gold-primary">{services.length}</div>
              <div className="public-metric-label">Signature Services</div>
            </div>
            <div>
              <div className="public-metric-value text-gold-primary">{categories}</div>
              <div className="public-metric-label">Service Categories</div>
            </div>
            <div>
              <div className="public-metric-value text-gold-primary">Consult-first</div>
              <div className="public-metric-label">Every visit is tailored</div>
            </div>
          </motion.div>
        </div>

        <motion.div
          key={showAll ? 'all-services' : 'featured-services'}
          className="grid grid-cols-1 gap-[var(--card-gap)] auto-rows-fr sm:grid-cols-2 lg:grid-cols-4"
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
        >
          {displayServices.map((service, index) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ delay: Math.min(index * 0.04, 0.22) }}
            >
              <ServiceCard {...service} index={index} />
            </motion.div>
          ))}
        </motion.div>

        {services.length > 8 ? (
          <div className="mt-6 text-center sm:mt-8">
            <button
              type="button"
              onClick={() => setShowAll((prev) => !prev)}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-gold-primary/30 px-5 py-2.5 text-sm text-gold-primary transition-colors hover:bg-gold-primary/10"
            >
              {showAll ? 'Show Fewer Services' : `View All Services (${services.length})`}
              {showAll ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>
        ) : null}
      </div>
    </SectionWrapper>
  )
}
