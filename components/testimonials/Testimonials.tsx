'use client'

import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import useEmblaCarousel from 'embla-carousel-react'
import { ChevronLeft, ChevronRight, Quote, Star } from 'lucide-react'
import { SectionWrapper } from '@/components/ui/SectionWrapper'

interface Testimonial {
  id: string
  name: string
  service: string
  text: string
  rating: number
  image: string | null
  featured: boolean
  active: boolean
  display_order: number
  created_at: string
}

export default function Testimonials() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(false)

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false, align: 'start', containScroll: 'trimSnaps' })

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setSelectedIndex(emblaApi.selectedScrollSnap())
    setCanPrev(emblaApi.canScrollPrev())
    setCanNext(emblaApi.canScrollNext())
  }, [emblaApi])

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        const response = await fetch('/api/public/testimonials')
        const data = await response.json()

        if (data.success) {
          setTestimonials(data.data)
        } else {
          setError('Failed to load testimonials')
        }
      } catch (err) {
        setError('Failed to load testimonials')
        console.error('Error fetching testimonials:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchTestimonials()
  }, [])

  useEffect(() => {
    if (!emblaApi) return
    onSelect()
    emblaApi.on('select', onSelect)
    emblaApi.on('reInit', onSelect)
    return () => {
      emblaApi.off('select', onSelect)
      emblaApi.off('reInit', onSelect)
    }
  }, [emblaApi, onSelect])

  const averageRating = testimonials.length
    ? (testimonials.reduce((sum, testimonial) => sum + testimonial.rating, 0) / testimonials.length).toFixed(1)
    : '0.0'
  const featuredCount = testimonials.filter((testimonial) => testimonial.featured).length

  if (loading) {
    return (
      <section id="testimonials" className="public-section py-10 sm:py-14">
        <div className="mx-auto max-w-7xl px-5 text-center sm:px-6 lg:px-8">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-gold-primary" />
          <p className="mt-4 text-gray-400">Loading testimonials...</p>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section id="testimonials" className="public-section py-10 sm:py-14">
        <div className="mx-auto max-w-7xl px-5 text-center sm:px-6 lg:px-8">
          <p className="text-red-400">{error}</p>
          <p className="mt-2 text-gray-500">Please refresh the page to try again.</p>
        </div>
      </section>
    )
  }

  return (
    <SectionWrapper id="testimonials" className="section-shell py-10 sm:py-14 lg:py-20">
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="mb-6 grid gap-5 sm:mb-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-end">
          <motion.div
            className="public-panel p-[var(--card-pad)] sm:p-[calc(var(--card-pad)+0.25rem)]"
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
          >
            <span className="public-eyebrow">Testimonials</span>
            <h2 className="public-section-title mt-4 max-w-[11ch]">
              Client <span className="public-heading-gradient">Experiences</span>
            </h2>
            <p className="public-section-copy mt-4 max-w-xl">
              Real feedback from clients who trusted our team for signature cuts, color work, and restorative care.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {[
                { value: `${testimonials.length}`, label: 'Client Stories' },
                { value: averageRating, label: 'Average Rating' },
                { value: `${featuredCount}`, label: 'Featured Reviews' },
              ].map((stat) => (
                <div key={stat.label} className="public-metric">
                  <div className="public-metric-value text-gold-primary">{stat.value}</div>
                  <div className="public-metric-label">{stat.label}</div>
                </div>
              ))}
            </div>
          </motion.div>

          {testimonials[0] ? (
            <motion.article
              className="public-card public-lead-card p-[var(--card-pad)] sm:p-[calc(var(--card-pad)+0.25rem)]"
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ delay: 0.08 }}
            >
              <Quote className="h-8 w-8 text-gold-primary/70" />
              <p className="mt-4 text-base leading-7 text-gray-200">"{testimonials[0].text}"</p>
              <div className="mt-6 flex items-center gap-1.5 text-gold-primary">
                {Array.from({ length: testimonials[0].rating }).map((_, index) => (
                  <Star key={`lead-${index}`} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <div className="mt-5 flex items-end justify-between gap-4 border-t border-gold-primary/15 pt-4">
                <div>
                  <p className="text-base font-medium text-white">{testimonials[0].name}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.16em] text-gold-primary/90">{testimonials[0].service}</p>
                </div>
                <span className="public-chip !text-[0.58rem]">Featured Review</span>
              </div>
            </motion.article>
          ) : null}
        </div>

        <div className="relative">
          <div ref={emblaRef} className="overflow-hidden">
            <div className="flex gap-3 sm:gap-4">
              {testimonials.map((testimonial, index) => (
                <article key={testimonial.id} className="public-card flex min-w-[86%] flex-[0_0_86%] flex-col p-[var(--card-pad)] sm:min-w-[48%] sm:flex-[0_0_48%] lg:min-w-[32%] lg:flex-[0_0_32%] sm:p-[calc(var(--card-pad)+0.25rem)]">
                  <div className="mb-3 flex items-center gap-1.5 text-gold-primary">
                    {Array.from({ length: testimonial.rating }).map((_, index) => (
                      <Star key={`${testimonial.id}-${index}`} className="h-4 w-4 fill-current" />
                    ))}
                  </div>

                  <p className="mb-5 flex-1 text-sm leading-7 text-gray-300">"{testimonial.text}"</p>

                  <div className="mt-auto border-t border-gold-primary/15 pt-4">
                    <p className="font-medium text-white">{testimonial.name}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.12em] text-gold-primary/90">{testimonial.service}</p>
                    {testimonial.featured && index !== 0 ? (
                      <span className="mt-4 inline-flex rounded-full border border-gold-primary/25 px-3 py-1 text-[0.58rem] uppercase tracking-[0.18em] text-gold-primary">
                        Featured
                      </span>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => emblaApi?.scrollPrev()}
              disabled={!canPrev}
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-gold-primary/25 text-gold-primary disabled:opacity-40"
              aria-label="Previous testimonial"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <span className="min-w-[110px] text-center text-xs uppercase tracking-[0.18em] text-gray-400">
              {selectedIndex + 1} / {Math.max(testimonials.length, 1)}
            </span>

            <button
              type="button"
              onClick={() => emblaApi?.scrollNext()}
              disabled={!canNext}
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-gold-primary/25 text-gold-primary disabled:opacity-40"
              aria-label="Next testimonial"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </SectionWrapper>
  )
}
