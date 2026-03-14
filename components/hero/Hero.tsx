'use client'

import { useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, Paintbrush2, Scissors, ShieldCheck } from 'lucide-react'
import Button from '@/components/ui/Button'
import Reveal from '@/components/motion/Reveal'
import { motionDuration, motionEase } from '@/lib/motion'
import { scrollToElement } from '@/lib/utils'

const HeroMirror = dynamic(() => import('@/components/hero/HeroMirror'), {
  ssr: false,
})

interface HeroContent {
  id: string
  badge_text: string | null
  headline: string
  subtitle: string | null
  cta_button_text: string | null
  secondary_button_text: string | null
  active: boolean
}

function sanitizeHeroSubtitle(value: string | null | undefined) {
  if (!value) return null

  return value
    .replace(/\bour\s+award-winning\s+stylists\b/gi, 'our expert stylists')
    .replace(/\baward-winning\s+stylists\b/gi, 'expert stylists')
    .replace(/\baward-winning\b/gi, 'refined')
    .replace(/\s{2,}/g, ' ')
    .trim()
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
    <div className="mt-5 flex flex-wrap items-center justify-center gap-2 sm:mt-7 lg:justify-start">
      {trustItems.map(({ icon: Icon, text }) => (
        <span key={text} className="public-chip">
          <Icon className="h-3.5 w-3.5 text-gold-primary" />
          {text}
        </span>
      ))}
    </div>
  )
}

function HeroMetrics() {
  const items = [
    { value: '4.9', label: 'Average client rating' },
    { value: 'Tailored', label: 'Consultation-led appointments' },
    { value: 'Refined', label: 'Premium in-salon experience' },
  ]

  return (
    <div className="mt-6 grid max-w-[36rem] gap-3 sm:mt-8 sm:grid-cols-3">
      {items.map((item) => (
        <div key={item.label} className="public-metric">
          <div className="public-metric-value text-gold-primary">{item.value}</div>
          <div className="public-metric-label !mt-2 !tracking-[0.14em] !text-gray-400">{item.label}</div>
        </div>
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
      <section className="relative flex min-h-[70vh] items-center justify-center overflow-hidden bg-black sm:min-h-screen">
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
    sanitizeHeroSubtitle(heroContent.subtitle) ||
    'Precision cuts, bespoke color, and premium care delivered in an elegant salon atmosphere.'

  return (
    <section data-hero-root className="public-section-shell relative overflow-hidden bg-black" aria-label="Hero section">
      <div className="public-grid-fade absolute inset-0 opacity-80" />
      <div className="public-spotlight left-[-6%] top-[8%] h-[240px] w-[240px] bg-[radial-gradient(circle,rgba(212,175,55,0.12),transparent_72%)] sm:h-[320px] sm:w-[320px] md:h-[480px] md:w-[480px]" />
      <div className="relative z-10 mx-auto max-w-7xl px-5 pb-8 pt-[4rem] sm:px-6 sm:pb-10 sm:pt-[5rem] lg:px-12 lg:pb-14">
        <div className="grid items-center gap-8 lg:min-h-[calc(100svh-8rem)] lg:grid-cols-[minmax(0,38rem)_minmax(360px,1fr)] lg:gap-8">
          <div data-hero-copy className="max-w-4xl text-center lg:max-w-[39rem] lg:pl-2 lg:text-left xl:max-w-[40rem]">
            <Reveal delay={0.1} type="fade">
              <span className="hero-badge">{badge}</span>
            </Reveal>

            <Reveal delay={0.18}>
              <h1 className="hero-heading mx-auto max-w-[12ch] text-balance lg:mx-0 lg:max-w-[11.4ch]">
                {headline}
              </h1>
            </Reveal>

            <Reveal delay={0.28}>
              <p className="hero-subtitle mx-auto mt-4 max-w-[34rem] text-balance lg:mx-0">{subtitle}</p>
            </Reveal>

            <Reveal delay={0.38}>
              <div className="mt-4 flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start">
                <Button size="lg" className="hero-cta-primary" onClick={() => scrollToElement('booking')}>
                  {heroContent.cta_button_text || 'Book Appointment'}
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="hero-cta-secondary"
                  onClick={() => scrollToElement('services')}
                >
                  <span>{heroContent.secondary_button_text || 'View Services'}</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </Reveal>

            <Reveal delay={0.5} type="fade">
              <HeroTrustRow />
            </Reveal>

            <Reveal delay={0.6} type="fade">
              <HeroMetrics />
            </Reveal>
          </div>

          <Reveal delay={0.24} type="fade">
            <div className="relative mx-auto h-[clamp(240px,60vw,360px)] w-full max-w-[420px] overflow-visible sm:h-[420px] sm:max-w-[600px] md:h-[520px] lg:h-[660px] lg:max-w-[840px] lg:justify-self-end xl:h-[720px] xl:max-w-[960px]">
              <HeroMirror />
            </div>
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
