'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { Mail, Scissors, Settings, Star } from 'lucide-react'
import { cn } from '@/lib/utils'

type AdminStatCardIcon = 'scissors' | 'mail' | 'star' | 'settings'

interface AdminStatCardProps {
  label: string
  value: string | number
  icon: AdminStatCardIcon
  note?: string
  className?: string
}

const iconMap = {
  scissors: Scissors,
  mail: Mail,
  star: Star,
  settings: Settings,
} as const

export function AdminStatCard({ label, value, icon, note, className }: AdminStatCardProps) {
  const reduce = useReducedMotion()
  const Icon = iconMap[icon]

  return (
    <motion.div
      whileHover={reduce ? undefined : { y: -2 }}
      transition={{ duration: 0.2 }}
      className={cn('admin-card', className)}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-gray-500">{label}</p>
          <p className="text-2xl font-semibold text-white mt-2">{value}</p>
          {note ? <p className="text-sm text-gray-400 mt-1">{note}</p> : null}
        </div>
        <div className="admin-icon-pill">
          <Icon className="w-4 h-4 text-gold-primary" />
        </div>
      </div>
    </motion.div>
  )
}
