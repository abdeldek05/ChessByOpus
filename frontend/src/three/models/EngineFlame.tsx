import { forwardRef, useRef } from 'react'
import type * as THREE from 'three'
import { useEngineFlicker } from '@/three/hooks/useEngineFlicker'
import { ENGINE_FLAME } from '@/three/constants/engineFlame'

/**
 * Flamme moteur : sphère émissive scintillante + point light chaude, en
 * `toneMapped={false}` pour rester vive/saturée quelle que soit l'exposition de
 * la scène (nourrit bien le bloom).
 *
 * Deux groupes imbriqués : le groupe EXTÉRIEUR (ref transmise) est l'ancrage —
 * synchronisé en position/rotation/visibilité sur la fusée par useMesangeFlight
 * (voir RocketOnLauncher, où ce groupe est un FRÈRE du modèle, pas un enfant,
 * pour ne pas fausser sa bounding box). Le groupe INTÉRIEUR porte le décalage
 * local vers la base de l'engin : il tourne avec l'ancrage, donc la flamme
 * reste toujours à la queue de la fusée quelle que soit son orientation.
 */
export const EngineFlame = forwardRef<THREE.Group>(function EngineFlame(_props, ref) {
  const meshRef = useRef<THREE.Mesh>(null)
  const lightRef = useRef<THREE.PointLight>(null)
  useEngineFlicker(meshRef, lightRef)

  return (
    <group ref={ref} visible={false}>
      <group position={[0, ENGINE_FLAME.offsetY, 0]}>
        <mesh ref={meshRef}>
          <sphereGeometry args={[ENGINE_FLAME.coreRadius, 12, 12]} />
          <meshStandardMaterial
            color={ENGINE_FLAME.coreColor}
            emissive={ENGINE_FLAME.coreEmissive}
            emissiveIntensity={3}
            toneMapped={false}
          />
        </mesh>
        <pointLight
          ref={lightRef}
          color={ENGINE_FLAME.lightColor}
          intensity={ENGINE_FLAME.lightIntensity}
          distance={ENGINE_FLAME.lightDistance}
          decay={2}
        />
      </group>
    </group>
  )
})
