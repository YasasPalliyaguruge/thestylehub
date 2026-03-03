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

// Smooth scroll to element
export function scrollToElement(id: string, duration: number = 1200) {
  const element = document.getElementById(id)

  if (!element) {
    console.warn(`Element with id "${id}" not found`)
    return
  }

  const headerOffset = 80 // Fixed header height (h-20)
  const elementPosition = element.getBoundingClientRect().top + window.pageYOffset
  const offsetPosition = elementPosition - headerOffset

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
  smoothScrollTo(0, duration)
}
