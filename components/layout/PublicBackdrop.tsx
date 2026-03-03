'use client'

import { usePathname } from 'next/navigation'
import ParticleField from '@/components/effects/ParticleField'

export default function PublicBackdrop() {
  const pathname = usePathname()
  const isAdmin = pathname?.startsWith('/admin') || pathname?.startsWith('/api')

  if (isAdmin) return null

  return <ParticleField />
}
