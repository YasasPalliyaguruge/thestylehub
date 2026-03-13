'use client'

import {
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { useReducedMotion } from 'framer-motion'
import { Box3, Group, MathUtils, Vector3 } from 'three'

const CHAIR_MODEL_PATH = '/BarberShopChair_01_4k.gltf/BarberShopChair_01_4k.gltf'

type StageProfile = 'desktop' | 'tablet' | 'mobile'

interface StageConfig {
  dpr: [number, number]
  fov: number
  basePosition: [number, number, number]
  baseRotation: [number, number, number]
  occupancyWidth: number
  occupancyHeight: number
  scaleBoost: number
  hoverYaw: number
  hoverPitch: number
  hoverRoll: number
  hoverShiftX: number
  hoverShiftY: number
  dragYaw: number
  dragPitch: number
  dragRoll: number
  dragShiftX: number
  dragShiftY: number
  scrollShiftY: number
  scrollYaw: number
  scrollPitch: number
  transformDamp: number
  recoveryDamp: number
  pointerDamp: number
}

interface InteractionState {
  pointerX: number
  pointerY: number
  smoothX: number
  smoothY: number
  dragX: number
  dragY: number
  spinX: number
  spinY: number
  spinZ: number
  dragging: boolean
  scrollProgress: number
}

interface ModelMetrics {
  scene: Group
  width: number
  height: number
}

const STAGE_CONFIG: Record<StageProfile, StageConfig> = {
  desktop: {
    dpr: [1, 1.45],
    fov: 25.5,
    basePosition: [-0.34, 0.56, 0],
    baseRotation: [0.03, -0.42, 0.01],
    occupancyWidth: 0.54,
    occupancyHeight: 0.72,
    scaleBoost: 1.176,
    hoverYaw: 2.25,
    hoverPitch: 0.94,
    hoverRoll: 0.42,
    hoverShiftX: 1.02,
    hoverShiftY: 0.56,
    dragYaw: 1.38,
    dragPitch: 0.72,
    dragRoll: 0.42,
    dragShiftX: 0.82,
    dragShiftY: 0.46,
    scrollShiftY: 0.52,
    scrollYaw: 0.38,
    scrollPitch: 0.22,
    transformDamp: 32,
    recoveryDamp: 5.6,
    pointerDamp: 64,
  },
  tablet: {
    dpr: [1, 1.18],
    fov: 26.5,
    basePosition: [-0.2, 0.49, 0],
    baseRotation: [0.03, -0.4, 0.01],
    occupancyWidth: 0.52,
    occupancyHeight: 0.7,
    scaleBoost: 1.128,
    hoverYaw: 1.46,
    hoverPitch: 0.62,
    hoverRoll: 0.28,
    hoverShiftX: 0.68,
    hoverShiftY: 0.38,
    dragYaw: 1.02,
    dragPitch: 0.5,
    dragRoll: 0.28,
    dragShiftX: 0.5,
    dragShiftY: 0.32,
    scrollShiftY: 0.34,
    scrollYaw: 0.24,
    scrollPitch: 0.12,
    transformDamp: 24,
    recoveryDamp: 5,
    pointerDamp: 46,
  },
  mobile: {
    dpr: [1, 1.08],
    fov: 27,
    basePosition: [-0.08, 0.44, 0],
    baseRotation: [0.03, -0.34, 0.01],
    occupancyWidth: 0.5,
    occupancyHeight: 0.66,
    scaleBoost: 1.08,
    hoverYaw: 0.72,
    hoverPitch: 0.34,
    hoverRoll: 0.16,
    hoverShiftX: 0.3,
    hoverShiftY: 0.18,
    dragYaw: 0.66,
    dragPitch: 0.3,
    dragRoll: 0.18,
    dragShiftX: 0.26,
    dragShiftY: 0.18,
    scrollShiftY: 0.22,
    scrollYaw: 0.14,
    scrollPitch: 0.07,
    transformDamp: 18,
    recoveryDamp: 4.6,
    pointerDamp: 30,
  },
}

function getProfile(width: number): StageProfile {
  if (width >= 1024) return 'desktop'
  if (width >= 640) return 'tablet'
  return 'mobile'
}

function ChairRig({
  config,
  stageSize,
  interaction,
  reduceMotion,
}: {
  config: StageConfig
  stageSize: { width: number; height: number }
  interaction: MutableRefObject<InteractionState>
  reduceMotion: boolean
}) {
  const groupRef = useRef<Group>(null)
  const { viewport } = useThree()
  const { scene } = useGLTF(CHAIR_MODEL_PATH)

  const model = useMemo<ModelMetrics>(() => {
    const clone = scene.clone()
    const box = new Box3().setFromObject(clone)
    const center = new Vector3()
    const size = new Vector3()
    box.getCenter(center)
    box.getSize(size)
    clone.position.sub(center)
    const maxDimension = Math.max(size.x, size.y, size.z) || 1
    const normalizedScale = 1 / maxDimension
    clone.scale.setScalar(normalizedScale)

    return {
      scene: clone,
      width: size.x * normalizedScale,
      height: size.y * normalizedScale,
    }
  }, [scene])

  const baseScale = useMemo(
    () =>
      Math.min(
        (viewport.width * config.occupancyWidth) / Math.max(model.width, 0.001),
        (viewport.height * config.occupancyHeight) / Math.max(model.height, 0.001)
      ) * config.scaleBoost,
    [config.occupancyHeight, config.occupancyWidth, config.scaleBoost, model.height, model.width, viewport.height, viewport.width]
  )

  useFrame((_, delta) => {
    if (!groupRef.current) return

    const state = interaction.current
    state.smoothX = MathUtils.damp(state.smoothX, state.pointerX, config.pointerDamp, delta)
    state.smoothY = MathUtils.damp(state.smoothY, state.pointerY, config.pointerDamp, delta)

    if (!state.dragging) {
      state.dragX = MathUtils.damp(state.dragX, 0, config.recoveryDamp, delta)
      state.dragY = MathUtils.damp(state.dragY, 0, config.recoveryDamp, delta)
      state.spinX = MathUtils.damp(state.spinX, 0, config.recoveryDamp, delta)
      state.spinY = MathUtils.damp(state.spinY, 0, config.recoveryDamp, delta)
      state.spinZ = MathUtils.damp(state.spinZ, 0, config.recoveryDamp, delta)
    }

    const scrollT = MathUtils.clamp(state.scrollProgress - 0.45, -0.42, 0.36)
    const targetX =
      config.basePosition[0] +
      state.smoothX * config.hoverShiftX +
      state.dragX * config.dragShiftX
    const targetY =
      config.basePosition[1] -
      state.smoothY * config.hoverShiftY +
      state.dragY * config.dragShiftY -
      scrollT * config.scrollShiftY
    const targetRotX =
      config.baseRotation[0] -
      state.smoothY * config.hoverPitch +
      state.dragY * config.dragPitch +
      state.spinX -
      scrollT * config.scrollPitch
    const targetRotY =
      config.baseRotation[1] +
      state.smoothX * config.hoverYaw +
      state.dragX * config.dragYaw +
      state.spinY +
      scrollT * config.scrollYaw
    const targetRotZ =
      config.baseRotation[2] -
      state.smoothX * config.hoverRoll +
      state.spinZ

    groupRef.current.scale.setScalar(MathUtils.damp(groupRef.current.scale.x, baseScale, config.transformDamp, delta))
    groupRef.current.position.x = MathUtils.damp(groupRef.current.position.x, targetX, config.transformDamp, delta)
    groupRef.current.position.y = MathUtils.damp(groupRef.current.position.y, targetY, config.transformDamp, delta)
    groupRef.current.rotation.x = MathUtils.damp(groupRef.current.rotation.x, targetRotX, config.transformDamp, delta)
    groupRef.current.rotation.y = MathUtils.damp(groupRef.current.rotation.y, targetRotY, config.transformDamp, delta)
    groupRef.current.rotation.z = MathUtils.damp(groupRef.current.rotation.z, targetRotZ, config.transformDamp, delta)
  })

  return (
    <group ref={groupRef}>
      <primitive object={model.scene} />
    </group>
  )
}

export default function HeroMirror() {
  const reduceMotion = useReducedMotion() ?? false
  const [profile, setProfile] = useState<StageProfile>('desktop')
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const stageRef = useRef<HTMLDivElement>(null)
  const dragMeta = useRef({ pointerId: -1, lastX: 0, lastY: 0 })
  const interaction = useRef<InteractionState>({
    pointerX: 0,
    pointerY: 0,
    smoothX: 0,
    smoothY: 0,
    dragX: 0,
    dragY: 0,
    spinX: 0,
    spinY: 0,
    spinZ: 0,
    dragging: false,
    scrollProgress: 0,
  })

  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return

    const updateSize = () => {
      const rect = stage.getBoundingClientRect()
      setStageSize({ width: rect.width, height: rect.height })
      setProfile(getProfile(rect.width))
    }

    const updatePointerFromWindow = (event: MouseEvent) => {
      const rawX = MathUtils.clamp((event.clientX / window.innerWidth) * 2 - 1, -1, 1)
      const rawY = MathUtils.clamp((event.clientY / window.innerHeight) * 2 - 1, -1, 1)
      interaction.current.pointerX = Math.sign(rawX) * Math.pow(Math.abs(rawX), 0.72)
      interaction.current.pointerY = Math.sign(rawY) * Math.pow(Math.abs(rawY), 0.72)
    }

    const resetPointer = () => {
      interaction.current.pointerX = 0
      interaction.current.pointerY = 0
    }

    updateSize()
    const observer = new ResizeObserver(updateSize)
    observer.observe(stage)
    window.addEventListener('resize', updateSize)
    window.addEventListener('mousemove', updatePointerFromWindow)
    window.addEventListener('mouseout', resetPointer)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', updateSize)
      window.removeEventListener('mousemove', updatePointerFromWindow)
      window.removeEventListener('mouseout', resetPointer)
    }
  }, [])

  useEffect(() => {
    const updateScroll = () => {
      const stage = stageRef.current
      if (!stage) return
      const rect = stage.getBoundingClientRect()
      const total = rect.height + window.innerHeight
      interaction.current.scrollProgress = MathUtils.clamp((window.innerHeight - rect.top) / total, 0, 1)
    }

    updateScroll()
    window.addEventListener('scroll', updateScroll, { passive: true })
    window.addEventListener('resize', updateScroll)

    return () => {
      window.removeEventListener('scroll', updateScroll)
      window.removeEventListener('resize', updateScroll)
    }
  }, [])

  const config = STAGE_CONFIG[profile]

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 && event.pointerType !== 'touch') return

    dragMeta.current.pointerId = event.pointerId
    dragMeta.current.lastX = event.clientX
    dragMeta.current.lastY = event.clientY
    interaction.current.dragging = true
    setIsDragging(true)
    event.currentTarget.setPointerCapture?.(event.pointerId)
  }

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!interaction.current.dragging || dragMeta.current.pointerId !== event.pointerId) return

    const rect = event.currentTarget.getBoundingClientRect()
    if (!rect.width || !rect.height) return

    const dx = (event.clientX - dragMeta.current.lastX) / rect.width
    const dy = (event.clientY - dragMeta.current.lastY) / rect.height
    dragMeta.current.lastX = event.clientX
    dragMeta.current.lastY = event.clientY

    interaction.current.dragX = MathUtils.clamp(interaction.current.dragX + dx * 5.4, -1.05, 1.05)
    interaction.current.dragY = MathUtils.clamp(interaction.current.dragY - dy * 4, -1, 1)
    interaction.current.spinY = MathUtils.clamp(interaction.current.spinY + dx * 2.1, -1.25, 1.25)
    interaction.current.spinX = MathUtils.clamp(interaction.current.spinX + dy * 0.9, -0.7, 0.7)
    interaction.current.spinZ = MathUtils.clamp(interaction.current.spinZ - dx * 0.44, -0.34, 0.34)
  }

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (dragMeta.current.pointerId !== event.pointerId) return

    interaction.current.dragging = false
    dragMeta.current.pointerId = -1
    setIsDragging(false)
    event.currentTarget.releasePointerCapture?.(event.pointerId)
  }

  return (
    <div
      ref={stageRef}
      className={`relative h-full w-full overflow-visible ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      aria-hidden="true"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onDoubleClick={() => {
        interaction.current.dragX = 0
        interaction.current.dragY = 0
    interaction.current.spinX = 0
    interaction.current.spinY = 0
    interaction.current.spinZ = 0
  }}
    >
      {stageSize.width > 0 && stageSize.height > 0 ? (
        <div className="absolute inset-[-8%]">
        <Canvas
          className="h-full w-full"
          dpr={config.dpr}
          camera={{ position: [0, 0.28, 9.4], fov: config.fov }}
          gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
        >
          <ambientLight intensity={0.82} />
          <directionalLight position={[3.8, 4.6, 5.4]} intensity={1.82} color="#f7ead1" />
          <directionalLight position={[-2.4, 1.6, 2.4]} intensity={0.84} color="#cf9d32" />
          <spotLight position={[1.2, 4.8, 3]} intensity={1.22} angle={0.42} penumbra={0.92} color="#fff1d8" />
          <pointLight position={[0.4, 1.4, 2.2]} intensity={0.36} color="#ffffff" />
          <Suspense fallback={null}>
            <ChairRig config={config} stageSize={stageSize} interaction={interaction} reduceMotion={reduceMotion} />
          </Suspense>
        </Canvas>
        </div>
      ) : null}

    </div>
  )
}

useGLTF.preload(CHAIR_MODEL_PATH)
