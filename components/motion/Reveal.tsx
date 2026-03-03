'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { motionDuration, motionEase } from '@/lib/motion'

interface RevealProps {
  children: React.ReactNode
  delay?: number
  className?: string
  type?: 'fade' | 'up' | 'scale'
}

export default function Reveal({ children, delay = 0, className, type = 'up' }: RevealProps) {
  const reduceMotion = useReducedMotion()

  if (reduceMotion) {
    return <div className={className}>{children}</div>
  }

  const initial =
    type === 'fade'
      ? { opacity: 0 }
      : type === 'scale'
      ? { opacity: 0, scale: 0.96, y: 14 }
      : { opacity: 0, y: 26 }

  const animate = type === 'scale' ? { opacity: 1, scale: 1, y: 0 } : { opacity: 1, y: 0 }

  return (
    <motion.div
      className={className}
      initial={initial}
      animate={animate}
      transition={{
        duration: motionDuration.slow,
        delay,
        ease: motionEase.premium,
      }}
    >
      {children}
    </motion.div>
  )
}
