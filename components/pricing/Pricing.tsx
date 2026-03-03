'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import PricingCard from './PricingCard'
import { AnimatedGrid, SectionWrapper } from '@/components/ui/SectionWrapper'

type Gender = 'men' | 'women'

interface PricingPackage {
  id: string
  name: string
  description: string | null
  price: number
  services: string[]
  popular: boolean
  gender: 'men' | 'women'
  active: boolean
  display_order: number
}

export default function Pricing() {
  const [pricing, setPricing] = useState<Record<Gender, PricingPackage[]>>({ men: [], women: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [gender, setGender] = useState<Gender>('men')

  useEffect(() => {
    const fetchPricing = async () => {
      try {
        const response = await fetch('/api/public/pricing')
        const data = await response.json()

        if (data.success) {
          const grouped = data.data.reduce(
            (acc: Record<Gender, PricingPackage[]>, item: PricingPackage) => {
              if (item.gender === 'men' || item.gender === 'women') {
                acc[item.gender].push(item)
              }
              return acc
            },
            { men: [], women: [] }
          )

          setPricing(grouped)
        } else {
          setError('Failed to load pricing')
        }
      } catch (err) {
        setError('Failed to load pricing')
        console.error('Error fetching pricing:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchPricing()
  }, [])

  if (loading) {
    return (
      <section id="pricing" className="public-section py-32">
        <div className="mx-auto max-w-7xl px-6 text-center lg:px-8">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-gold-primary" />
          <p className="mt-4 text-gray-400">Loading pricing...</p>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section id="pricing" className="public-section py-32">
        <div className="mx-auto max-w-7xl px-6 text-center lg:px-8">
          <p className="text-red-400">{error}</p>
          <p className="mt-2 text-gray-500">Please refresh the page to try again.</p>
        </div>
      </section>
    )
  }

  return (
    <SectionWrapper id="pricing" className="section-shell py-28 md:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <motion.div className="mb-14 text-center" initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }}>
          <span className="public-eyebrow">Pricing</span>
          <h2 className="public-section-title mt-4">
            Choose Your <span className="public-heading-gradient">Experience</span>
          </h2>
          <p className="public-section-copy mx-auto mt-5">Transparent pricing designed for every style preference and service depth.</p>
        </motion.div>

        <div className="mb-12 flex justify-center">
          <div className="inline-flex rounded-full border border-gold-primary/20 bg-black/40 p-1">
            <button
              type="button"
              className={`rounded-full px-7 py-2.5 text-sm font-semibold transition-all ${
                gender === 'men' ? 'bg-gold-primary text-black' : 'text-gray-300 hover:text-white'
              }`}
              onClick={() => setGender('men')}
            >
              Men
            </button>
            <button
              type="button"
              className={`rounded-full px-7 py-2.5 text-sm font-semibold transition-all ${
                gender === 'women' ? 'bg-gold-primary text-black' : 'text-gray-300 hover:text-white'
              }`}
              onClick={() => setGender('women')}
            >
              Women
            </button>
          </div>
        </div>

        <AnimatedGrid key={gender} className="grid grid-cols-1 gap-7 md:grid-cols-3 auto-rows-fr">
          {pricing[gender].map((plan, index) => (
            <PricingCard key={plan.id} {...plan} index={index} gender={gender} />
          ))}
        </AnimatedGrid>

        <p className="mt-7 text-center text-sm text-gray-500">All packages include consultation and premium product usage.</p>
      </div>
    </SectionWrapper>
  )
}
