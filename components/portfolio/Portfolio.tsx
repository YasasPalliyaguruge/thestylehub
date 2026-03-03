'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import useEmblaCarousel from 'embla-carousel-react'
import { WheelGesturesPlugin } from 'embla-carousel-wheel-gestures'
import { ReactCompareSlider, ReactCompareSliderImage } from 'react-compare-slider'
import { ChevronLeft, ChevronRight, Eye } from 'lucide-react'
import Lightbox from './Lightbox'
import { SectionWrapper } from '@/components/ui/SectionWrapper'

interface PortfolioItem {
  id: string
  before: string | null
  after: string | null
  category: string | null
  stylist: string | null
  active: boolean
  display_order: number
}

const FALLBACK_DATA_URI =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="960" height="1280"><rect width="100%" height="100%" fill="%23151515"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23d4af37" font-size="40" font-family="Arial">Image unavailable</text></svg>'

function normalizeImageUrl(url: string | null | undefined): string {
  return typeof url === 'string' && url.trim() ? url : FALLBACK_DATA_URI
}

export default function Portfolio() {
  const reduceMotion = useReducedMotion()
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedImage, setSelectedImage] = useState<PortfolioItem | null>(null)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([])
  const [canScrollPrev, setCanScrollPrev] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(false)

  const plugins = useMemo(() => [WheelGesturesPlugin({ forceWheelAxis: 'x' })], [])

  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      align: 'start',
      dragFree: false,
      containScroll: 'trimSnaps',
      skipSnaps: false,
      loop: false,
    },
    plugins
  )

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setSelectedIndex(emblaApi.selectedScrollSnap())
    setCanScrollPrev(emblaApi.canScrollPrev())
    setCanScrollNext(emblaApi.canScrollNext())
  }, [emblaApi])

  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        const response = await fetch('/api/public/portfolio')
        const data = await response.json()

        if (data.success && Array.isArray(data.data)) {
          setPortfolio(data.data)
        } else {
          setError('Failed to load portfolio')
        }
      } catch (err) {
        setError('Failed to load portfolio')
        console.error('Error fetching portfolio:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchPortfolio()
  }, [])

  useEffect(() => {
    if (!emblaApi) return
    setScrollSnaps(emblaApi.scrollSnapList())
    onSelect()
    emblaApi.on('select', onSelect)
    emblaApi.on('reInit', onSelect)
    emblaApi.on('reInit', () => setScrollSnaps(emblaApi.scrollSnapList()))
    return () => {
      emblaApi.off('select', onSelect)
      emblaApi.off('reInit', onSelect)
    }
  }, [emblaApi, onSelect, portfolio.length])

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi])
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi])
  const scrollTo = useCallback((index: number) => emblaApi?.scrollTo(index), [emblaApi])

  if (loading) {
    return (
      <section id="portfolio" className="public-section py-24">
        <div className="mx-auto max-w-7xl px-6 text-center lg:px-8">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-gold-primary" />
          <p className="mt-4 text-gray-400">Loading portfolio...</p>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section id="portfolio" className="public-section py-24">
        <div className="mx-auto max-w-7xl px-6 text-center lg:px-8">
          <p className="text-red-400">{error}</p>
          <p className="mt-2 text-gray-500">Please refresh the page to try again.</p>
        </div>
      </section>
    )
  }

  if (!portfolio.length) {
    return (
      <section id="portfolio" className="public-section py-24">
        <div className="mx-auto max-w-7xl px-6 text-center lg:px-8">
          <p className="text-gray-400">No transformations available yet.</p>
        </div>
      </section>
    )
  }

  return (
    <>
      <SectionWrapper id="portfolio" className="section-shell py-24 md:py-28">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <motion.div
            className="mb-12 text-center"
            initial={reduceMotion ? false : { opacity: 0, y: 24 }}
            whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
          >
            <span className="public-eyebrow">Our Work</span>
            <h2 className="public-section-title mt-4">
              Transformation <span className="public-heading-gradient">Gallery</span>
            </h2>
            <p className="public-section-copy mx-auto mt-5">
              Browse high-finish before and after results crafted by our stylist team.
            </p>
          </motion.div>

          <div
            className="relative"
            role="region"
            aria-roledescription="carousel"
            aria-label="Transformation gallery"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === 'ArrowLeft') {
                event.preventDefault()
                scrollPrev()
              }
              if (event.key === 'ArrowRight') {
                event.preventDefault()
                scrollNext()
              }
            }}
          >
            <button
              type="button"
              aria-label="Previous transformation"
              onClick={scrollPrev}
              disabled={!canScrollPrev}
              className="absolute -left-2 top-1/2 z-20 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl border border-gold-primary/25 bg-black/80 text-gold-primary disabled:opacity-35 lg:-left-5"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <div ref={emblaRef} className="overflow-hidden">
              <div className="flex">
                {portfolio.map((item, index) => {
                  const beforeUrl = normalizeImageUrl(item.before)
                  const afterUrl = normalizeImageUrl(item.after)
                  const category = item.category || 'Transformation'
                  const stylist = item.stylist || 'Style Hub Team'

                  return (
                    <div
                      key={item.id}
                      className="min-w-[250px] flex-[0_0_88%] pr-4 sm:min-w-[290px] sm:flex-[0_0_62%] lg:min-w-[320px] lg:flex-[0_0_34%] xl:flex-[0_0_30%]"
                    >
                      <motion.article
                        className="public-card overflow-hidden"
                        initial={reduceMotion ? false : { opacity: 0, y: 18 }}
                        whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.2 }}
                        transition={{ delay: Math.min(index * 0.05, 0.3) }}
                      >
                        <div className="relative aspect-[3/4] bg-black-dark">
                          <ReactCompareSlider
                            itemOne={<ReactCompareSliderImage src={beforeUrl} alt={`${category} before`} />}
                            itemTwo={<ReactCompareSliderImage src={afterUrl} alt={`${category} after`} />}
                            position={50}
                            portrait={false}
                            style={{ width: '100%', height: '100%' }}
                          />

                          <span className="absolute left-4 top-4 z-10 rounded-full border border-white/25 bg-black/75 px-3 py-1 text-xs uppercase tracking-wider text-white">
                            Before
                          </span>
                          <span className="absolute right-14 top-4 z-10 rounded-full bg-gold-primary px-3 py-1 text-xs uppercase tracking-wider text-black">
                            After
                          </span>

                          <button
                            type="button"
                            aria-label={`Open ${category} transformation`}
                            className="absolute right-4 top-4 z-20 rounded-full bg-white/90 p-2.5 text-black shadow-lg"
                            onClick={(event) => {
                              event.stopPropagation()
                              setSelectedImage(item)
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/75 via-transparent to-transparent" />
                          <div className="absolute bottom-0 left-0 right-0 p-4">
                            <span className="text-xs uppercase tracking-[0.15em] text-gold-primary">{category}</span>
                            <h3 className="mt-1 text-xl font-semibold text-white">{stylist}</h3>
                          </div>
                        </div>
                      </motion.article>
                    </div>
                  )
                })}
              </div>
            </div>

            <button
              type="button"
              aria-label="Next transformation"
              onClick={scrollNext}
              disabled={!canScrollNext}
              className="absolute -right-2 top-1/2 z-20 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl border border-gold-primary/25 bg-black/80 text-gold-primary disabled:opacity-35 lg:-right-5"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-6 flex justify-center gap-2" role="tablist" aria-label="Transformation slide selectors">
            {scrollSnaps.map((_, index) => (
              <button
                key={`dot-${index}`}
                type="button"
                className={`h-2.5 w-2.5 rounded-full transition-all ${
                  index === selectedIndex ? 'scale-110 bg-gold-primary' : 'bg-gold-primary/30'
                }`}
                aria-label={`Go to slide ${index + 1}`}
                aria-current={index === selectedIndex ? 'true' : undefined}
                onClick={() => scrollTo(index)}
              />
            ))}
          </div>

          <p className="mt-4 text-center text-sm text-gray-500">
            {portfolio.length} transformations. Use arrows, wheel, drag, swipe, or dots to navigate.
          </p>
        </div>
      </SectionWrapper>

      {selectedImage ? (
        <Lightbox
          item={{
            ...selectedImage,
            before: normalizeImageUrl(selectedImage.before),
            after: normalizeImageUrl(selectedImage.after),
            category: selectedImage.category || 'Transformation',
            stylist: selectedImage.stylist || 'Style Hub Team',
          }}
          onClose={() => setSelectedImage(null)}
          onNext={() => {
            const index = portfolio.findIndex((entry) => entry.id === selectedImage.id)
            setSelectedImage(portfolio[(index + 1) % portfolio.length])
          }}
          onPrevious={() => {
            const index = portfolio.findIndex((entry) => entry.id === selectedImage.id)
            setSelectedImage(portfolio[(index - 1 + portfolio.length) % portfolio.length])
          }}
        />
      ) : null}
    </>
  )
}
