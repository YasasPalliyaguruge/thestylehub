'use client'

import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import useEmblaCarousel from 'embla-carousel-react'
import { ChevronLeft, ChevronRight, Star } from 'lucide-react'
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

  if (loading) {
    return (
      <section id="testimonials" className="public-section py-32">
        <div className="mx-auto max-w-7xl px-6 text-center lg:px-8">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-gold-primary" />
          <p className="mt-4 text-gray-400">Loading testimonials...</p>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section id="testimonials" className="public-section py-32">
        <div className="mx-auto max-w-7xl px-6 text-center lg:px-8">
          <p className="text-red-400">{error}</p>
          <p className="mt-2 text-gray-500">Please refresh the page to try again.</p>
        </div>
      </section>
    )
  }

  return (
    <SectionWrapper id="testimonials" className="section-shell py-28 md:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <motion.div className="mb-12 text-center" initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }}>
          <span className="public-eyebrow">Testimonials</span>
          <h2 className="public-section-title mt-4">
            Client <span className="public-heading-gradient">Experiences</span>
          </h2>
          <p className="public-section-copy mx-auto mt-5">Real stories from clients who trusted us for their style transformation.</p>
        </motion.div>

        <div className="relative">
          <div ref={emblaRef} className="overflow-hidden">
            <div className="flex gap-5">
              {testimonials.map((testimonial) => (
                <article key={testimonial.id} className="public-card min-w-[86%] flex-[0_0_86%] p-7 sm:min-w-[48%] sm:flex-[0_0_48%] lg:min-w-[32%] lg:flex-[0_0_32%]">
                  <div className="mb-4 flex items-center gap-1.5 text-gold-primary">
                    {Array.from({ length: testimonial.rating }).map((_, index) => (
                      <Star key={`${testimonial.id}-${index}`} className="h-4 w-4 fill-current" />
                    ))}
                  </div>

                  <p className="mb-6 text-sm leading-7 text-gray-300">"{testimonial.text}"</p>

                  <div className="border-t border-gold-primary/15 pt-4">
                    <p className="font-medium text-white">{testimonial.name}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.12em] text-gold-primary/90">{testimonial.service}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="mt-6 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => emblaApi?.scrollPrev()}
              disabled={!canPrev}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gold-primary/25 text-gold-primary disabled:opacity-40"
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
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gold-primary/25 text-gold-primary disabled:opacity-40"
              aria-label="Next testimonial"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <motion.div className="mx-auto mt-14 grid max-w-3xl grid-cols-3 gap-4" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }}>
          {[
            { value: '5000+', label: 'Happy Clients' },
            { value: '4.9', label: 'Average Rating' },
            { value: '10+', label: 'Years Experience' },
          ].map((stat) => (
            <div key={stat.label} className="public-card py-4 text-center">
              <div className="text-2xl font-semibold text-gold-primary">{stat.value}</div>
              <div className="mt-1 text-xs uppercase tracking-[0.1em] text-gray-400">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </SectionWrapper>
  )
}
