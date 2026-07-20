import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { useParticleCloud } from '@/three/hooks/useParticleCloud'
import { createParticleTexture } from '@/lib/createParticleTexture'
import {
  FLAME_COUNT,
  FLAME_WIDTH,
  FLAME_SPEED,
  FLAME_LIFE,
  TRAIL_COUNT,
  TRAIL_SPREAD,
  TRAIL_SPEED,
  TRAIL_LIFE,
  TRAIL_SIZE_START,
  TRAIL_SIZE_END,
  FLAME_CORE_COLOR,
  FLAME_EDGE_COLOR,
  SMOKE_COLOR,
  EXHAUST_PLUME_Y,
} from '@/three/constants/exhaustPlume'

interface ExhaustPlumeProps {
  /** Poussée en cours : émet flamme + fumée tant que vrai. */
  thrustingRef: React.RefObject<boolean>
}

/**
 * Panache d'échappement en PARTICULES sprites : un cœur de FLAMME lumineux
 * (chalumeau, blending additif, court, fin) et une TRAÎNÉE de vapeur blanche
 * FINE qui s'étire derrière la fusée dans l'axe du jet — pas un nuage qui
 * l'entoure (un jet radial 360° au sol donnait un effet de « boule sale »
 * inesthétique en montée). Chaque nuage est un InstancedMesh de plans
 * billboardés face caméra. Rendu pur ; la vie des particules est gérée dans
 * useParticleCloud.
 */
export function ExhaustPlume({ thrustingRef }: ExhaustPlumeProps) {
  const flameTex = useMemo(() => createParticleTexture(0.35), [])
  const smokeTex = useMemo(() => createParticleTexture(0.7), [])
  // Le panache se démonte à chaque fin de vol / rejeu alors que le contexte WebGL
  // reste vivant : sans dispose, une paire de textures fuit à CHAQUE lancement.
  useEffect(() => () => {
    flameTex.dispose()
    smokeTex.dispose()
  }, [flameTex, smokeTex])
  const coreColor = useMemo(() => new THREE.Color(FLAME_CORE_COLOR), [])
  const edgeColor = useMemo(() => new THREE.Color(FLAME_EDGE_COLOR), [])
  const smokeColor = useMemo(() => new THREE.Color(SMOKE_COLOR), [])

  // --- FLAMME : jet FIN et RAPIDE façon chalumeau (pas un cône large). ---
  const flame = useParticleCloud({
    count: FLAME_COUNT,
    life: FLAME_LIFE,
    emitting: thrustingRef,
    spawn: (pos, vel) => {
      // Émise TRÈS près de l'axe (dispersion latérale minime) : jet fin, pas
      // un cône évasé — c'est la différence visuelle chalumeau/lance-flamme.
      const spread = FLAME_WIDTH * 0.25
      pos.set((Math.random() - 0.5) * spread, 0, (Math.random() - 0.5) * spread)
      vel.set(
        (Math.random() - 0.5) * 1.5,
        -FLAME_SPEED * (0.85 + Math.random() * 0.3),
        (Math.random() - 0.5) * 1.5,
      )
    },
    update: (age, _vel, out) => {
      // Fin et net sur toute sa vie très courte (pas de grossissement marqué).
      out.scale = FLAME_WIDTH * (0.5 + age * 0.4)
      out.color.copy(coreColor).lerp(edgeColor, age)
      // Additif : dimming vers le noir = fondu. On assombrit en fin de vie.
      out.color.multiplyScalar(1 - age * 0.5)
      out.opacity = 1
    },
  })

  // --- TRAÎNÉE : filet de vapeur FIN qui s'étire derrière (axe du jet), pas
  //     un nuage qui entoure la fusée. Émise quasi sur l'axe, vitesse vers le
  //     bas qui décélère doucement (s'étire puis ralentit, comme un sillage). ---
  const trail = useParticleCloud({
    count: TRAIL_COUNT,
    life: TRAIL_LIFE,
    emitting: thrustingRef,
    spawn: (pos, vel) => {
      pos.set((Math.random() - 0.5) * TRAIL_SPREAD, 0, (Math.random() - 0.5) * TRAIL_SPREAD)
      vel.set(
        (Math.random() - 0.5) * 0.6,
        -TRAIL_SPEED * (0.8 + Math.random() * 0.3),
        (Math.random() - 0.5) * 0.6,
      )
    },
    update: (age, vel, out) => {
      // Décélère progressivement : le filet s'étire puis ralentit, sans jamais
      // s'étaler en boule (dispersion latérale quasi nulle au spawn).
      vel.multiplyScalar(0.97)
      out.scale = TRAIL_SIZE_START + (TRAIL_SIZE_END - TRAIL_SIZE_START) * age
      // BLANCHE tout du long (vapeur/condensation), jamais grise/sale.
      out.color.copy(smokeColor)
      out.opacity = 1
    },
  })

  // La flamme part du bas de la fusée.
  return (
    <group position={[0, EXHAUST_PLUME_Y, 0]}>
      {/* Traînée d'abord (dessous), flamme par-dessus (additif). */}
      <instancedMesh ref={trail.meshRef} args={[undefined, undefined, TRAIL_COUNT]} frustumCulled={false}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial
          map={smokeTex}
          transparent
          depthWrite={false}
          blending={THREE.NormalBlending}
          opacity={0.4}
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

      {/* Lumière du jet : éclaire la fusée et le sol pendant la poussée — teinte
          blanc-bleuté cohérente avec la flamme façon chalumeau (pas orange). */}
      <pointLight color="#dceeff" intensity={60} distance={40} decay={2} position={[0, 1, 0]} />
    </group>
  )
}
