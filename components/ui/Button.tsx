'use client'

import { forwardRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { motion, HTMLMotionProps } from 'framer-motion'

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
  className?: string
  children: React.ReactNode
  disabled?: boolean
  onClick?: () => void
}

// Premium easing for interactions
const easeOut = [0.22, 1, 0.36, 1] as const
const easeInOut = [0.4, 0, 0.2, 1] as const

const Button = forwardRef<HTMLButtonElement, ButtonProps & Omit<HTMLMotionProps<'button'>, 'ref'>>(
  ({ className, variant = 'primary', size = 'md', fullWidth = false, children, disabled, ...props }, ref) => {
    const [isHovered, setIsHovered] = useState(false)

    return (
      <motion.button
        ref={ref}
        disabled={disabled}
        className={cn(
          'relative inline-flex items-center justify-center font-medium overflow-hidden rounded-full',
          'focus:outline-none focus:ring-1 focus:ring-gold-primary/50 focus:ring-offset-2 focus:ring-offset-black',
          'disabled:opacity-40 disabled:cursor-not-allowed',
          {
            // Variants
            'bg-gold-primary text-black': variant === 'primary',
            'bg-gold-dark/80 text-white': variant === 'secondary',
            'border border-gold-primary/30 text-gold-primary': variant === 'outline',
            'text-gray-400': variant === 'ghost',

            // Sizes
            'px-6 py-3 text-sm': size === 'sm',
            'px-8 py-4 text-base': size === 'md',
            'px-10 py-5 text-lg': size === 'lg',

            // Full width
            'w-full': fullWidth,
          },
          className
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        whileHover={{ scale: 1.015 }}
        whileTap={{ scale: 0.99 }}
        transition={{ duration: 0.4, ease: easeOut }}
        {...props}
      >
        {/* Subtle shine effect on hover - primary variant */}
        {variant === 'primary' && (
          <motion.span
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            initial={{ x: '-100%' }}
            animate={{ x: isHovered ? '100%' : '-100%' }}
            transition={{ duration: 0.8, ease: easeInOut }}
          />
        )}

        {/* Background fill effect - outline variant */}
        {variant === 'outline' && (
          <motion.span
            className="absolute inset-0 bg-gold-primary/10"
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered ? 1 : 0 }}
            transition={{ duration: 0.3, ease: easeOut }}
          />
        )}

        {/* Button content */}
        <span className="relative z-10">{children}</span>
      </motion.button>
    )
  }
)

Button.displayName = 'Button'

export default Button
