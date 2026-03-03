export const motionEase = {
  premium: [0.22, 1, 0.36, 1] as const,
  smooth: [0.25, 0.1, 0.25, 1] as const,
  crisp: [0.16, 1, 0.3, 1] as const,
}

export const motionDuration = {
  fast: 0.28,
  normal: 0.5,
  slow: 0.85,
  cinematic: 1.2,
}

export const motionSpring = {
  soft: { type: 'spring' as const, stiffness: 95, damping: 18 },
  medium: { type: 'spring' as const, stiffness: 150, damping: 18 },
}

export const stagger = {
  hero: 0.1,
  section: 0.08,
}

export const viewportPreset = {
  once: false,
  amount: 0.25,
  margin: '-30px',
} as const
