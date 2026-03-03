export type ParticleProfile = 'high' | 'medium' | 'low' | 'minimal'

export interface ParticleConfig {
  count: number
  speed: number
  linkDistance: number
  radius: number
  pointerInfluence: number
  alpha: number
}

export function getParticleProfile(reducedMotion: boolean): ParticleProfile {
  if (typeof window === 'undefined') return 'minimal'

  if (reducedMotion) return 'minimal'

  const width = window.innerWidth
  const cores = navigator.hardwareConcurrency || 4
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory || 4

  if (width < 640 || cores <= 4 || memory <= 4) return 'low'
  if (width < 1200 || cores <= 8) return 'medium'
  return 'high'
}

export function getParticleConfig(profile: ParticleProfile): ParticleConfig {
  switch (profile) {
    case 'high':
      return {
        count: 76,
        speed: 0.28,
        linkDistance: 130,
        radius: 1.4,
        pointerInfluence: 110,
        alpha: 0.34,
      }
    case 'medium':
      return {
        count: 56,
        speed: 0.22,
        linkDistance: 118,
        radius: 1.3,
        pointerInfluence: 96,
        alpha: 0.3,
      }
    case 'low':
      return {
        count: 34,
        speed: 0.17,
        linkDistance: 96,
        radius: 1.15,
        pointerInfluence: 76,
        alpha: 0.25,
      }
    case 'minimal':
    default:
      return {
        count: 18,
        speed: 0.1,
        linkDistance: 74,
        radius: 1,
        pointerInfluence: 52,
        alpha: 0.18,
      }
  }
}
