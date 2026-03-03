'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Paintbrush2, Scissors, ShieldCheck } from 'lucide-react'
import Button from '@/components/ui/Button'
import Reveal from '@/components/motion/Reveal'
import { motionDuration, motionEase } from '@/lib/motion'
import { scrollToElement } from '@/lib/utils'

interface HeroContent {
  id: string
  badge_text: string | null
  headline: string
  subtitle: string | null
  cta_button_text: string | null
  secondary_button_text: string | null
  active: boolean
}

function HeroTrustRow() {
  const trustItems = useMemo(
    () => [
      { icon: Scissors, text: 'Precision Stylists' },
      { icon: Paintbrush2, text: 'Bespoke Color Work' },
      { icon: ShieldCheck, text: 'Premium Care Standards' },
    ],
    []
  )

  return (
    <div className="mt-8 flex flex-wrap items-center justify-center gap-2.5">
      {trustItems.map(({ icon: Icon, text }) => (
        <span key={text} className="public-chip">
          <Icon className="h-3.5 w-3.5 text-gold-primary" />
          {text}
        </span>
      ))}
    </div>
  )
}

export default function Hero() {
  const reduceMotion = useReducedMotion()
  const [heroContent, setHeroContent] = useState<HeroContent | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const heroRes = await fetch('/api/public/hero')
        const heroData = await heroRes.json()

        if (heroData.success && heroData.data) {
          setHeroContent(heroData.data)
        }
      } catch (error) {
        console.error('Error fetching hero content:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading || !heroContent) {
    return (
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black">
        <div className="absolute inset-0 bg-[radial-gradient(900px_420px_at_50%_18%,rgba(212,175,55,0.08),transparent_68%)]" />
        <motion.div
          className="h-10 w-10 rounded-full border border-gold-primary/35"
          animate={{ scale: [1, 1.1, 1], opacity: [0.45, 0.9, 0.45] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        />
      </section>
    )
  }

  const badge = heroContent.badge_text || 'Luxury Salon Experience'
  const headline = heroContent.headline || 'Experience Luxury Styling'
  const subtitle =
    heroContent.subtitle ||
    'Precision cuts, bespoke color, and premium care delivered by expert stylists in an elegant salon atmosphere.'

  return (
    <section className="relative min-h-screen overflow-hidden bg-black pt-24 md:pt-28" aria-label="Hero section">
      <div className="absolute inset-0 bg-[radial-gradient(1000px_460px_at_50%_20%,rgba(212,175,55,0.08),transparent_70%)]" />

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-7rem)] w-full max-w-6xl items-center justify-center px-6 pb-16 pt-12 text-center md:px-10 lg:px-12">
        <div className="max-w-4xl">
          <Reveal delay={0.1} type="fade">
            <span className="hero-badge">{badge}</span>
          </Reveal>

          <Reveal delay={0.18}>
            <h1 className="hero-heading">{headline}</h1>
          </Reveal>

          <Reveal delay={0.28}>
            <p className="hero-subtitle mx-auto">{subtitle}</p>
          </Reveal>

          <Reveal delay={0.38}>
            <div className="mt-2 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button size="lg" className="hero-cta-primary" onClick={() => scrollToElement('booking')}>
                {heroContent.cta_button_text || 'Book Appointment'}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="hero-cta-secondary"
                onClick={() => scrollToElement('services')}
              >
                {heroContent.secondary_button_text || 'View Services'}
              </Button>
            </div>
          </Reveal>

          <Reveal delay={0.5} type="fade">
            <HeroTrustRow />
          </Reveal>
        </div>
      </div>

      {!reduceMotion && (
        <motion.div
          className="hero-scroll-indicator"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.58 }}
          transition={{ duration: motionDuration.normal, delay: 1.1, ease: motionEase.premium }}
        >
          <span>Scroll</span>
          <motion.div
            className="hero-scroll-line"
            animate={{ scaleY: [1, 1.35, 1], opacity: [0.3, 0.65, 0.3] }}
            transition={{ duration: 2.7, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.div>
      )}
    </section>
  )
}
