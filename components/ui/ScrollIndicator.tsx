'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

export default function ScrollIndicator() {
  const [scrollProgress, setScrollProgress] = useState(0)

  useEffect(() => {
    const updateScrollProgress = () => {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0
      setScrollProgress(progress)
    }

    window.addEventListener('scroll', updateScrollProgress)
    updateScrollProgress()
    return () => window.removeEventListener('scroll', updateScrollProgress)
  }, [])

  return (
    <motion.div className="fixed inset-x-0 top-0 z-50 h-[3px] bg-black-primary/20" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
      <motion.div
        className="h-full bg-[linear-gradient(90deg,#d4af37_0%,#f4e4c1_100%)]"
        style={{ width: `${scrollProgress}%` }}
        transition={{ type: 'spring', stiffness: 110, damping: 26 }}
      />
    </motion.div>
  )
}
