'use client'

import { motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { Facebook, Globe, Instagram, Mail, MapPin, Phone } from 'lucide-react'
import GoldShimmerText from '@/components/ui/GoldShimmerText'
import { navigation } from '@/lib/data'
import { scrollToElement } from '@/lib/utils'

interface BusinessInfo {
  id: string | null
  salon_name: string
  tagline: string | null
  description: string | null
  address: string | null
  phone: string | null
  email: string | null
  hours: Record<string, unknown> | null
  social_links: Record<string, unknown> | null
}

interface SocialLink {
  name: string
  href: string
}

function getSocialIcon(name: string) {
  const normalized = name.toLowerCase()
  if (normalized.includes('instagram')) return Instagram
  if (normalized.includes('facebook')) return Facebook
  return Globe
}

export default function Footer() {
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo | null>(null)

  useEffect(() => {
    const fetchBusinessInfo = async () => {
      try {
        const response = await fetch('/api/public/business')
        const data = await response.json()

        if (data.success) {
          setBusinessInfo(data.data)
        }
      } catch (err) {
        console.error('Error fetching business info:', err)
      }
    }

    fetchBusinessInfo()
  }, [])

  const salonName = businessInfo?.salon_name || 'The Style Hub'
  const address = businessInfo?.address || 'No. 123, Main Street\nNegombo 11500, Sri Lanka'
  const phone = businessInfo?.phone || '+94 (31) 223-4567'
  const email = businessInfo?.email || 'thestylehub.negombo@gmail.com'

  const socialLinks = useMemo<SocialLink[]>(() => {
    if (businessInfo?.social_links) {
      return Object.entries(businessInfo.social_links).map(([name, href]) => ({
        name,
        href: String(href),
      }))
    }

    return [
      { name: 'Instagram', href: 'https://instagram.com' },
      { name: 'Facebook', href: 'https://facebook.com' },
      { name: 'Website', href: '#' },
    ]
  }, [businessInfo?.social_links])

  const handleNavClick = (href: string) => {
    const id = href.replace('#', '')
    scrollToElement(id)
  }

  return (
    <footer className="section-shell border-t border-gold-primary/20 bg-black-dark/80">
      <div className="relative z-10 mx-auto grid w-full max-w-7xl grid-cols-1 gap-12 px-6 py-16 md:grid-cols-[1.4fr_1fr_1fr] lg:px-8">
        <div>
          <div className="mb-4">
            <GoldShimmerText size="md">{salonName.toUpperCase()}</GoldShimmerText>
          </div>
          <p className="max-w-md text-sm leading-7 text-gray-300">
            Precision cuts, bespoke color, and premium grooming delivered in a refined environment designed around comfort and confidence.
          </p>

          <div className="mt-7 flex items-center gap-3">
            {socialLinks.map((link) => {
              const Icon = getSocialIcon(link.name)
              return (
                <a
                  key={link.name}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gold-primary/20 bg-black-primary/55 text-gold-primary transition-all hover:-translate-y-0.5 hover:border-gold-primary/45"
                  aria-label={link.name}
                >
                  <Icon className="h-4 w-4" />
                </a>
              )
            })}
          </div>
        </div>

        <div>
          <h4 className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-gold-primary">Navigate</h4>
          <ul className="space-y-3">
            {navigation.map((item) => (
              <li key={item.name}>
                <button
                  onClick={() => handleNavClick(item.href)}
                  className="text-sm text-gray-300 transition-colors hover:text-gold-primary"
                >
                  {item.name}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-gold-primary">Contact</h4>
          <ul className="space-y-4 text-sm text-gray-300">
            <li className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-4 w-4 text-gold-primary" />
              <span>
                {address.split('\n').map((line, i) => (
                  <span key={`${line}-${i}`}>
                    {line}
                    {i < address.split('\n').length - 1 ? <br /> : null}
                  </span>
                ))}
              </span>
            </li>
            <li className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-gold-primary" />
              <a href={`tel:${phone.replace(/\s/g, '')}`} className="transition-colors hover:text-gold-primary">
                {phone}
              </a>
            </li>
            <li className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-gold-primary" />
              <a href={`mailto:${email}`} className="transition-colors hover:text-gold-primary">
                {email}
              </a>
            </li>
          </ul>
        </div>
      </div>

      <motion.div
        className="relative z-10 border-t border-gold-primary/10 px-6 py-5 text-center text-xs tracking-wide text-gray-500 lg:px-8"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
      >
        <p>&copy; {new Date().getFullYear()} {salonName}. All rights reserved.</p>
      </motion.div>
    </footer>
  )
}
