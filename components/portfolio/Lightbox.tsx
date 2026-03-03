'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, ChevronsUpDown, X } from 'lucide-react'

interface LightboxProps {
  item: {
    id: string
    before: string
    after: string
    category: string
    stylist: string
  }
  onClose: () => void
  onNext: () => void
  onPrevious: () => void
}

export default function Lightbox({ item, onClose, onNext, onPrevious }: LightboxProps) {
  const [sliderPosition, setSliderPosition] = useState(50)
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
      if (event.key === 'ArrowRight') onNext()
      if (event.key === 'ArrowLeft') onPrevious()
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [onClose, onNext, onPrevious])

  const handleSliderMove = (event: React.MouseEvent | React.TouchEvent) => {
    if (!containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    const x = 'touches' in event ? event.touches[0].clientX : event.clientX
    const position = ((x - rect.left) / rect.width) * 100
    setSliderPosition(Math.max(0, Math.min(100, position)))
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[90] flex items-center justify-center bg-black-primary/94 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <button
          className="absolute right-6 top-6 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full bg-black-primary/60 text-white transition-colors hover:text-gold-primary"
          onClick={onClose}
          aria-label="Close lightbox"
        >
          <X className="h-6 w-6" />
        </button>

        <button
          className="absolute left-5 top-1/2 z-10 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-black-primary/65 text-white transition-colors hover:text-gold-primary"
          onClick={(event) => {
            event.stopPropagation()
            onPrevious()
          }}
          aria-label="Previous image"
        >
          <ChevronLeft className="h-7 w-7" />
        </button>

        <button
          className="absolute right-5 top-1/2 z-10 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-black-primary/65 text-white transition-colors hover:text-gold-primary"
          onClick={(event) => {
            event.stopPropagation()
            onNext()
          }}
          aria-label="Next image"
        >
          <ChevronRight className="h-7 w-7" />
        </button>

        <motion.div
          className="relative mx-4 w-full max-w-6xl"
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0.95 }}
          onClick={(event) => event.stopPropagation()}
        >
          <div
            ref={containerRef}
            className="relative aspect-video cursor-ew-resize overflow-hidden rounded-2xl border border-gold-primary/20 select-none"
            onMouseMove={handleSliderMove}
            onMouseDown={() => setIsDragging(true)}
            onMouseUp={() => setIsDragging(false)}
            onMouseLeave={() => setIsDragging(false)}
            onTouchMove={handleSliderMove}
            onTouchStart={() => setIsDragging(true)}
            onTouchEnd={() => setIsDragging(false)}
          >
            <div className="absolute inset-0">
              <Image src={item.before} alt="Before" fill className="object-cover" sizes="(max-width: 768px) 100vw, 80vw" priority />
            </div>

            <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}>
              <Image src={item.after} alt="After" fill className="object-cover" sizes="(max-width: 768px) 100vw, 80vw" priority />
            </div>

            <motion.div className="absolute bottom-0 top-0 z-10 w-1 bg-white" style={{ left: `${sliderPosition}%` }} animate={{ scale: isDragging ? 1.4 : 1 }}>
              <div className="absolute left-1/2 top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-lg">
                <ChevronsUpDown className="h-5 w-5 text-black" />
              </div>
            </motion.div>

            <span className="absolute bottom-6 left-6 rounded-lg bg-black-primary/75 px-4 py-2 text-sm font-semibold text-white">Before</span>
            <span className="absolute bottom-6 right-6 rounded-lg bg-gold-primary px-4 py-2 text-sm font-semibold text-black">After</span>
            <span className="absolute left-1/2 top-6 -translate-x-1/2 rounded-full bg-black-primary/65 px-4 py-2 text-xs text-gray-200">
              Drag the handle to compare
            </span>
          </div>

          <div className="mt-6 text-center">
            <span className="text-sm uppercase tracking-[0.18em] text-gold-primary">{item.category}</span>
            <h3 className="mt-2 text-2xl font-semibold text-white">by {item.stylist}</h3>
            <div className="mt-4 flex justify-center gap-2 text-sm text-gray-400">
              <span>Use arrow keys to navigate</span>
              <span className="public-dot-separator">|</span>
              <span>Press ESC to close</span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
