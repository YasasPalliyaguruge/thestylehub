'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronDown, ChevronUp } from 'lucide-react'
import ServiceCard from './ServiceCard'
import { AnimatedGrid, SectionWrapper } from '@/components/ui/SectionWrapper'

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

  if (loading) {
    return (
      <section id="services" className="public-section section-shell py-32">
        <div className="mx-auto max-w-7xl px-6 text-center lg:px-8">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-gold-primary" />
          <p className="mt-4 text-gray-400">Loading services...</p>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section id="services" className="public-section section-shell py-32">
        <div className="mx-auto max-w-7xl px-6 text-center lg:px-8">
          <p className="text-red-400">{error}</p>
          <p className="mt-2 text-gray-500">Please refresh the page to try again.</p>
        </div>
      </section>
    )
  }

  return (
    <SectionWrapper id="services" className="section-shell py-28 md:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <motion.div className="mb-14 text-center" initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }}>
          <span className="public-eyebrow">Our Services</span>
          <h2 className="public-section-title mt-4">
            Tailored <span className="public-heading-gradient">Salon Services</span>
          </h2>
          <p className="public-section-copy mx-auto mt-5">
            Discover precision cutting, bespoke color, and restorative treatments crafted around your style, hair type, and lifestyle.
          </p>
        </motion.div>

        <AnimatedGrid className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 auto-rows-fr">
          {displayServices.map((service, index) => (
            <ServiceCard key={service.id} {...service} index={index} />
          ))}
        </AnimatedGrid>

        {services.length > 8 ? (
          <div className="mt-12 text-center">
            <button
              type="button"
              onClick={() => setShowAll((prev) => !prev)}
              className="inline-flex items-center gap-2 rounded-full border border-gold-primary/30 px-5 py-2.5 text-sm text-gold-primary transition-colors hover:bg-gold-primary/10"
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
