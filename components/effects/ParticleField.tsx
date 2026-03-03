'use client'

import { useEffect, useRef } from 'react'
import { getParticleConfig, getParticleProfile } from '@/lib/particle-config'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
}

export default function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const context = canvas.getContext('2d')
    if (!context) return

    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const profile = getParticleProfile(media.matches)
    const config = getParticleConfig(profile)

    let width = 0
    let height = 0
    let dpr = 1
    let rafId = 0
    let paused = false

    const pointer = {
      x: 0,
      y: 0,
      active: false,
    }

    const particles: Particle[] = []

    const random = (min: number, max: number) => min + Math.random() * (max - min)

    const createParticle = (): Particle => ({
      x: random(0, width),
      y: random(0, height),
      vx: random(-config.speed, config.speed),
      vy: random(-config.speed, config.speed),
    })

    const resize = () => {
      width = window.innerWidth
      height = window.innerHeight
      dpr = Math.min(window.devicePixelRatio || 1, profile === 'high' ? 1.6 : 1.2)

      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      context.setTransform(dpr, 0, 0, dpr, 0, 0)

      particles.length = 0
      for (let i = 0; i < config.count; i += 1) {
        particles.push(createParticle())
      }
    }

    const draw = () => {
      context.clearRect(0, 0, width, height)

      for (let i = 0; i < particles.length; i += 1) {
        const p = particles[i]

        if (!media.matches && pointer.active) {
          const dx = pointer.x - p.x
          const dy = pointer.y - p.y
          const distSq = dx * dx + dy * dy
          const range = config.pointerInfluence
          if (distSq > 0.1 && distSq < range * range) {
            const dist = Math.sqrt(distSq)
            const force = (range - dist) / range
            p.vx -= (dx / dist) * force * 0.004
            p.vy -= (dy / dist) * force * 0.004
          }
        }

        p.x += p.vx
        p.y += p.vy

        if (p.x <= -10 || p.x >= width + 10) p.vx *= -1
        if (p.y <= -10 || p.y >= height + 10) p.vy *= -1

        // Keep motion alive with tiny drift so particles never freeze.
        p.vx += random(-0.0025, 0.0025)
        p.vy += random(-0.0025, 0.0025)

        if (p.vx > config.speed) p.vx = config.speed
        if (p.vx < -config.speed) p.vx = -config.speed
        if (p.vy > config.speed) p.vy = config.speed
        if (p.vy < -config.speed) p.vy = -config.speed

        context.beginPath()
        context.fillStyle = `rgba(212, 175, 55, ${config.alpha})`
        context.arc(p.x, p.y, config.radius, 0, Math.PI * 2)
        context.fill()
      }

      for (let i = 0; i < particles.length; i += 1) {
        for (let j = i + 1; j < particles.length; j += 1) {
          const p1 = particles[i]
          const p2 = particles[j]
          const dx = p1.x - p2.x
          const dy = p1.y - p2.y
          const dist = Math.sqrt(dx * dx + dy * dy)

          if (dist < config.linkDistance) {
            const opacity = (1 - dist / config.linkDistance) * (config.alpha * 0.42)
            context.strokeStyle = `rgba(244, 228, 193, ${opacity})`
            context.lineWidth = 0.55
            context.beginPath()
            context.moveTo(p1.x, p1.y)
            context.lineTo(p2.x, p2.y)
            context.stroke()
          }
        }
      }
    }

    const frame = () => {
      if (!paused) {
        draw()
      }
      rafId = window.requestAnimationFrame(frame)
    }

    const handlePointerMove = (event: MouseEvent) => {
      pointer.x = event.clientX
      pointer.y = event.clientY
      pointer.active = true
    }

    const handlePointerLeave = () => {
      pointer.active = false
    }

    const handleVisibility = () => {
      paused = document.hidden
    }

    resize()
    frame()

    window.addEventListener('resize', resize)
    window.addEventListener('mousemove', handlePointerMove)
    window.addEventListener('mouseout', handlePointerLeave)
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', handlePointerMove)
      window.removeEventListener('mouseout', handlePointerLeave)
      document.removeEventListener('visibilitychange', handleVisibility)
      window.cancelAnimationFrame(rafId)
    }
  }, [])

  return <canvas ref={canvasRef} className="particle-field" aria-hidden="true" />
}
