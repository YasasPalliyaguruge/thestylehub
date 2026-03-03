'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { motionDuration, motionEase, stagger } from '@/lib/motion'

interface SectionWrapperProps {
  children: React.ReactNode
  className?: string
  delay?: number
  id?: string
}

const viewport = { once: true, amount: 0.2 }

export function SectionWrapper({ children, className, delay = 0, id }: SectionWrapperProps) {
  const reduceMotion = useReducedMotion()

  if (reduceMotion) {
    return (
      <section id={id} className={cn('relative public-section', className)}>
        {children}
      </section>
    )
  }

  return (
    <motion.section
      id={id}
      className={cn('relative public-section', className)}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={viewport}
      transition={{ duration: motionDuration.normal, delay, ease: motionEase.premium }}
    >
      {children}
    </motion.section>
  )
}

export function FadeIn({ children, className, delay = 0 }: SectionWrapperProps) {
  const reduceMotion = useReducedMotion()

  if (reduceMotion) return <div className={className}>{children}</div>

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={viewport}
      transition={{ duration: motionDuration.normal, delay, ease: motionEase.smooth }}
    >
      {children}
    </motion.div>
  )
}

export function ScaleIn({ children, className, delay = 0 }: SectionWrapperProps) {
  const reduceMotion = useReducedMotion()

  if (reduceMotion) return <div className={className}>{children}</div>

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, scale: 0.97 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={viewport}
      transition={{ duration: motionDuration.normal, delay, ease: motionEase.premium }}
    >
      {children}
    </motion.div>
  )
}

export function SlideInLeft({ children, className, delay = 0 }: SectionWrapperProps) {
  const reduceMotion = useReducedMotion()

  if (reduceMotion) return <div className={className}>{children}</div>

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, x: -24 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={viewport}
      transition={{ duration: motionDuration.normal, delay, ease: motionEase.premium }}
    >
      {children}
    </motion.div>
  )
}

export function SlideInRight({ children, className, delay = 0 }: SectionWrapperProps) {
  const reduceMotion = useReducedMotion()

  if (reduceMotion) return <div className={className}>{children}</div>

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, x: 24 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={viewport}
      transition={{ duration: motionDuration.normal, delay, ease: motionEase.premium }}
    >
      {children}
    </motion.div>
  )
}

interface AnimatedGridProps {
  children: React.ReactNode
  className?: string
}

export function AnimatedGrid({ children, className }: AnimatedGridProps) {
  const reduceMotion = useReducedMotion()

  if (reduceMotion) return <div className={className}>{children}</div>

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={viewport}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: stagger.section,
          },
        },
      }}
    >
      {Array.isArray(children)
        ? children.map((child, index) => (
            <motion.div
              key={index}
              variants={{
                hidden: { opacity: 0, y: 16 },
                visible: { opacity: 1, y: 0 },
              }}
              transition={{ duration: motionDuration.fast, ease: motionEase.smooth }}
            >
              {child}
            </motion.div>
          ))
        : (
          <motion.div
            variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}
            transition={{ duration: motionDuration.fast, ease: motionEase.smooth }}
          >
            {children}
          </motion.div>
        )}
    </motion.div>
  )
}
