import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { makeRng } from '@/lib/makeRng'
import { createParticleTexture } from '@/lib/createParticleTexture'
import {
  FLASH_INTENSITY,
  FLASH_DURATION,
  FLASH_COLOR,
  DUST_COUNT,
  DUST_RADIUS,
  DUST_SIZE_START,
  DUST_SIZE_END,
  DUST_LIFE,
  DUST_COLOR,
  SMOKE_COLUMN_COUNT,
  SMOKE_RISE_SPEED,
  SMOKE_COLUMN_LIFE,
  SMOKE_SIZE_START,
  SMOKE_SIZE_END,
  SMOKE_COLUMN_COLOR,
} from '@/three/constants/impactBurst'

interface ImpactBurstProps {
  /** Temps écoulé depuis l'impact (s), partagé avec les débris. */
  elapsedRef: React.RefObject<number>
}

/** Une bouffée : direction, délai d'apparition et jitter de taille. */
interface Puff {
  dirX: number
  dirZ: number
  delay: number
  jitter: number
}

/**
 * Éclat d'IMPACT au point de crash : FLASH lumineux bref, nappe de POUSSIÈRE
 * qui s'étale au ras du sol, et colonne de FUMÉE sombre qui s'élève lentement.
 * Billboards face caméra pilotés par le temps d'impact partagé — accompagne les
 * débris pour une destruction crédible. Déterministe, rendu pur.
 */
export function ImpactBurst({ elapsedRef }: ImpactBurstProps) {
  const dustRefs = useRef<(THREE.Mesh | null)[]>([])
  const dustMats = useRef<(THREE.MeshBasicMaterial | null)[]>([])
  const smokeRefs = useRef<(THREE.Mesh | null)[]>([])
  const smokeMats = useRef<(THREE.MeshBasicMaterial | null)[]>([])
  const lightRef = useRef<THREE.PointLight>(null)

  const texture = useMemo(() => createParticleTexture(0.65), [])

  const { dust, smoke } = useMemo(() => {
    const rng = makeRng(4242)
    const dust: Puff[] = Array.from({ length: DUST_COUNT }, () => {
      const a = rng() * Math.PI * 2
      return { dirX: Math.cos(a), dirZ: Math.sin(a), delay: rng() * 0.25, jitter: 0.7 + rng() * 0.6 }
    })
    const smoke: Puff[] = Array.from({ length: SMOKE_COLUMN_COUNT }, () => {
      const a = rng() * Math.PI * 2
      return { dirX: Math.cos(a) * 0.6, dirZ: Math.sin(a) * 0.6, delay: rng() * 1.4, jitter: 0.7 + rng() * 0.6 }
    })
    return { dust, smoke }
  }, [])

  useFrame(({ camera }) => {
    const t = elapsedRef.current

    // Flash : extinction rapide en carré (percussion lumineuse).
    if (lightRef.current) {
      const k = Math.max(0, 1 - t / FLASH_DURATION)
      lightRef.current.intensity = FLASH_INTENSITY * k * k
    }

    // Poussière : s'étale au ras du sol puis s'estompe.
    dust.forEach((p, i) => {
      const mesh = dustRefs.current[i]
      const mat = dustMats.current[i]
      if (!mesh || !mat) return
      const local = Math.max(0, t - p.delay)
      const frac = Math.min(1, local / DUST_LIFE)
      const ease = 1 - (1 - frac) * (1 - frac) // sortie douce
      const size = (DUST_SIZE_START + (DUST_SIZE_END - DUST_SIZE_START) * frac) * p.jitter
      mesh.visible = frac < 1 && local > 0
      mesh.scale.setScalar(Math.max(0.001, size))
      mesh.position.set(p.dirX * DUST_RADIUS * ease, 0.6 + frac * 1.2, p.dirZ * DUST_RADIUS * ease)
      mesh.quaternion.copy(camera.quaternion)
      mat.opacity = 0.55 * (1 - frac)
    })

    // Colonne de fumée : monte lentement au-dessus du point d'impact.
    smoke.forEach((p, i) => {
      const mesh = smokeRefs.current[i]
      const mat = smokeMats.current[i]
      if (!mesh || !mat) return
      const local = Math.max(0, t - p.delay)
      const frac = Math.min(1, local / SMOKE_COLUMN_LIFE)
      const size = (SMOKE_SIZE_START + (SMOKE_SIZE_END - SMOKE_SIZE_START) * frac) * p.jitter
      mesh.visible = frac < 1 && local > 0
      mesh.scale.setScalar(Math.max(0.001, size))
      mesh.position.set(p.dirX * (1 + frac * 2), 1 + local * SMOKE_RISE_SPEED, p.dirZ * (1 + frac * 2))
      mesh.quaternion.copy(camera.quaternion)
      mat.opacity = 0.5 * (1 - frac)
    })
  })

  return (
    <group>
      <pointLight ref={lightRef} color={FLASH_COLOR} intensity={0} distance={60} decay={2} position={[0, 2, 0]} />
      {dust.map((_, i) => (
        <mesh
          key={`d${i}`}
          ref={(m) => {
            dustRefs.current[i] = m
          }}
          visible={false}
        >
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial
            ref={(m) => {
              dustMats.current[i] = m
            }}
            map={texture}
            color={DUST_COLOR}
            transparent
            opacity={0}
            depthWrite={false}
          />
        </mesh>
      ))}
      {smoke.map((_, i) => (
        <mesh
          key={`s${i}`}
          ref={(m) => {
            smokeRefs.current[i] = m
          }}
          visible={false}
        >
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial
            ref={(m) => {
              smokeMats.current[i] = m
            }}
            map={texture}
            color={SMOKE_COLUMN_COLOR}
            transparent
            opacity={0}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  )
}
