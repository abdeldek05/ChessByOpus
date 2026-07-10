import { useMemo } from 'react'
import * as THREE from 'three'
import { useParticleCloud } from '@/three/hooks/useParticleCloud'
import { createParticleTexture } from '@/lib/createParticleTexture'
import {
  FLAME_COUNT,
  SMOKE_COUNT,
  FLAME_LENGTH,
  FLAME_WIDTH,
  FLAME_SPEED,
  FLAME_LIFE,
  SMOKE_SPEED,
  SMOKE_LIFE,
  SMOKE_SIZE_START,
  SMOKE_SIZE_END,
  FLAME_CORE_COLOR,
  FLAME_EDGE_COLOR,
  SMOKE_COLOR,
} from '@/three/constants/exhaustPlume'

interface ExhaustPlumeProps {
  /** Poussée en cours : émet flamme + fumée tant que vrai. */
  thrustingRef: React.RefObject<boolean>
}

/**
 * Panache d'échappement en PARTICULES sprites, façon décollage filmé : un cœur
 * de FLAMME lumineux (blending additif, court, vacillant) et un large panache de
 * FUMÉE clair qui s'étale et retombe au sol. Chaque nuage est un InstancedMesh
 * de plans billboardés face caméra → volume continu, pas de contours « dessinés ».
 * Rendu pur ; la vie des particules est gérée dans useParticleCloud.
 */
export function ExhaustPlume({ thrustingRef }: ExhaustPlumeProps) {
  const flameTex = useMemo(() => createParticleTexture(0.35), [])
  const smokeTex = useMemo(() => createParticleTexture(0.7), [])
  const coreColor = useMemo(() => new THREE.Color(FLAME_CORE_COLOR), [])
  const edgeColor = useMemo(() => new THREE.Color(FLAME_EDGE_COLOR), [])
  const smokeColor = useMemo(() => new THREE.Color(SMOKE_COLOR), [])

  // --- FLAMME : jet court vers le bas, couleur cœur→bord selon l'âge. ---
  const flame = useParticleCloud({
    count: FLAME_COUNT,
    life: FLAME_LIFE,
    emitting: thrustingRef,
    spawn: (pos, vel) => {
      // Émise juste sous la base, dispersion latérale légère.
      pos.set((Math.random() - 0.5) * FLAME_WIDTH, 0, (Math.random() - 0.5) * FLAME_WIDTH)
      vel.set(
        (Math.random() - 0.5) * 4,
        -FLAME_SPEED * (0.7 + Math.random() * 0.6),
        (Math.random() - 0.5) * 4,
      )
    },
    update: (age, _vel, out) => {
      // Grossit un peu puis rétrécit ; couleur du blanc chaud vers l'orange.
      const grow = Math.sin(age * Math.PI) // 0→1→0
      out.scale = FLAME_WIDTH * (0.6 + grow * (FLAME_LENGTH / FLAME_WIDTH) * 0.25)
      out.color.copy(coreColor).lerp(edgeColor, age)
      // Additif : dimming vers le noir = fondu. On assombrit en fin de vie.
      out.color.multiplyScalar(1 - age * 0.7)
      out.opacity = 1
    },
  })

  // --- FUMÉE : bouffées qui s'étalent au sol, grossissent et s'éclaircissent. ---
  const smoke = useParticleCloud({
    count: SMOKE_COUNT,
    life: SMOKE_LIFE,
    emitting: thrustingRef,
    spawn: (pos, vel) => {
      const a = Math.random() * Math.PI * 2
      pos.set(Math.cos(a) * 1.5, 0, Math.sin(a) * 1.5)
      // S'échappe surtout latéralement (retombe/roule au sol) + un peu vers le bas.
      vel.set(
        Math.cos(a) * SMOKE_SPEED * (0.4 + Math.random() * 0.8),
        -SMOKE_SPEED * 0.25 + Math.random() * 1.5,
        Math.sin(a) * SMOKE_SPEED * (0.4 + Math.random() * 0.8),
      )
      // Frein latéral progressif (la fumée s'étale puis stagne).
      vel.multiplyScalar(1)
    },
    update: (age, vel, out) => {
      // Décélère (traînée) pour que le panache s'étale puis se pose.
      vel.multiplyScalar(0.96)
      out.scale = SMOKE_SIZE_START + (SMOKE_SIZE_END - SMOKE_SIZE_START) * age
      // Fumée fraîche plus sombre → s'éclaircit en vieillissant, puis s'éteint.
      const shade = 0.5 + age * 0.5
      out.color.copy(smokeColor).multiplyScalar(shade * (1 - age * 0.9))
      out.opacity = 1
    },
  })

  // La flamme part du bas de la fusée (base ~ -3.4 après scale du modèle en vol).
  return (
    <group position={[0, -3.4, 0]}>
      {/* Fumée d'abord (dessous), flamme par-dessus (additif). */}
      <instancedMesh ref={smoke.meshRef} args={[undefined, undefined, SMOKE_COUNT]} frustumCulled={false}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial
          map={smokeTex}
          transparent
          depthWrite={false}
          blending={THREE.NormalBlending}
          opacity={0.55}
          toneMapped={false}
        />
      </instancedMesh>

      <instancedMesh ref={flame.meshRef} args={[undefined, undefined, FLAME_COUNT]} frustumCulled={false}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial
          map={flameTex}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </instancedMesh>

      {/* Lumière du jet : éclaire la fusée et le sol pendant la poussée. */}
      <pointLight color="#ff9a3c" intensity={60} distance={40} decay={2} position={[0, 1, 0]} />
    </group>
  )
}
