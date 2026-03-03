'use client'

import { ReactNode } from 'react'

interface GoldShimmerTextProps {
  children: ReactNode
  className?: string
  size?: 'sm' | 'md' | 'lg'
  onClick?: () => void
}

export default function GoldShimmerText({
  children,
  className = '',
  size = 'md',
  onClick
}: GoldShimmerTextProps) {
  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-4xl'
  }

  return (
    <span
      className={`
        font-display font-bold uppercase tracking-wide
        bg-gradient-to-r from-[#cfc09f] via-[#ffecb3] to-[#cfc09f]
        bg-[length:200%_auto]
        bg-clip-text text-transparent
        animate-shimmer
        ${sizeClasses[size]}
        ${className}
      `}
      style={{
        textShadow: '0 0 30px rgba(212, 175, 55, 0.3)',
        cursor: onClick ? 'pointer' : 'default'
      }}
      onClick={onClick}
    >
      {children}
    </span>
  )
}
