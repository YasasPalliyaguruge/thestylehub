import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Premium easing function for smooth scroll (ease-out-cubic)
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

// Custom smooth scroll with premium easing
function smoothScrollTo(targetY: number, duration: number = 1200) {
  const startY = window.pageYOffset
  const distance = targetY - startY
  let startTime: number | null = null

  function animation(currentTime: number) {
    if (startTime === null) startTime = currentTime
    const timeElapsed = currentTime - startTime

    // Calculate progress (0 to 1)
    const progress = Math.min(timeElapsed / duration, 1)

    // Apply easing
    const easedProgress = easeOutCubic(progress)

    // Calculate new position
    const newPosition = startY + distance * easedProgress

    window.scrollTo(0, newPosition)

    // Continue animation if not complete
    if (progress < 1) {
      requestAnimationFrame(animation)
    }
  }

  requestAnimationFrame(animation)
}

function getHeaderOffset() {
  if (typeof window === 'undefined') return 80

  const header = document.querySelector<HTMLElement>('[data-site-header]')
  if (header) {
    const height = header.getBoundingClientRect().height
    if (Number.isFinite(height) && height > 0) return height
  }

  const rootStyles = getComputedStyle(document.documentElement)
  const cssOffset = parseFloat(rootStyles.getPropertyValue('--header-offset'))
  if (Number.isFinite(cssOffset) && cssOffset > 0) return cssOffset

  return 80
}

// Smooth scroll to element
export function scrollToElement(id: string, duration: number = 1200) {
  const element = document.getElementById(id)

  if (!element) {
    console.warn(`Element with id "${id}" not found`)
    return
  }

  const headerOffset = getHeaderOffset()
  const elementPosition = element.getBoundingClientRect().top + window.pageYOffset
  const elementStyles = getComputedStyle(element)
  const paddingTop = parseFloat(elementStyles.paddingTop) || 0
  const offsetPosition = Math.max(0, elementPosition - headerOffset + paddingTop)

  // Try to use Lenis if available (for smooth scroll library)
  const lenisInstance = (window as any).lenis
  if (lenisInstance) {
    lenisInstance.scrollTo(offsetPosition, { duration: duration / 1000 })
  } else {
    // Use custom smooth scroll with premium easing
    smoothScrollTo(offsetPosition, duration)
  }
}

// Scroll to top
export function scrollToTop(duration: number = 1000) {
  const lenisInstance = (window as any)?.lenis
  if (lenisInstance) {
    lenisInstance.scrollTo(0, { duration: duration / 1000 })
    return
  }

  smoothScrollTo(0, duration)
}
