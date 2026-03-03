'use client'

import { motion, useReducedMotion } from 'framer-motion'

interface AdminPageTransitionProps {
  children: React.ReactNode
  className?: string
}

export function AdminPageTransition({ children, className = '' }: AdminPageTransitionProps) {
  const reduce = useReducedMotion()

  if (reduce) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}
