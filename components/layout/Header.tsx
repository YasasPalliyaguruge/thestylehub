'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import { navigation } from '@/lib/data'
import { scrollToElement, scrollToTop } from '@/lib/utils'
import Button from '@/components/ui/Button'
import GoldShimmerText from '@/components/ui/GoldShimmerText'
import { motionDuration, motionEase } from '@/lib/motion'

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 28)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [isMobileMenuOpen])

  useEffect(() => {
    if (!isMobileMenuOpen) return

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMobileMenuOpen(false)
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isMobileMenuOpen])

  const handleNavClick = (href: string) => {
    const id = href.replace('#', '')
    scrollToElement(id)
    setIsMobileMenuOpen(false)
  }

  return (
    <>
      <motion.header
        className={`fixed inset-x-0 top-0 z-40 transition-all duration-300 ${
          isScrolled
            ? 'border-b border-gold-primary/20 bg-black-primary/75 backdrop-blur-xl'
            : 'bg-transparent'
        }`}
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: motionDuration.fast, ease: motionEase.premium }}
      >
        <nav className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-6 lg:px-8">
          <button
            type="button"
            onClick={() => scrollToTop()}
            className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-primary/60"
            aria-label="Go to top"
          >
            <GoldShimmerText size="md" className="text-[1.45rem] tracking-[0.04em] lg:text-[1.65rem]">
              THE STYLE HUB
            </GoldShimmerText>
          </button>

          <div className="hidden items-center gap-6 md:flex">
            {navigation.map((item) => (
              <button
                key={item.name}
                onClick={() => handleNavClick(item.href)}
                className="text-sm tracking-[0.06em] text-gray-200 transition-colors hover:text-gold-primary"
              >
                {item.name}
              </button>
            ))}
            <Button size="sm" className="!px-7 !py-3" onClick={() => handleNavClick('#booking')}>
              Book Now
            </Button>
          </div>

          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gold-primary/20 text-white md:hidden"
            aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-navigation"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </nav>
      </motion.header>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            id="mobile-navigation"
            className="fixed inset-0 z-50 bg-black-primary/92 backdrop-blur-xl md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="flex h-full flex-col px-6 pb-8 pt-24">
              <div className="mb-8 flex items-center justify-between">
                <GoldShimmerText size="md">THE STYLE HUB</GoldShimmerText>
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gold-primary/25 text-white"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex flex-1 flex-col gap-3">
                {navigation.map((item, index) => (
                  <motion.button
                    key={item.name}
                    onClick={() => handleNavClick(item.href)}
                    className="w-full rounded-xl border border-gold-primary/15 bg-black-medium/40 px-4 py-4 text-left text-lg text-white"
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    {item.name}
                  </motion.button>
                ))}
              </div>

              <Button size="md" fullWidth onClick={() => handleNavClick('#booking')}>
                Book Appointment
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
