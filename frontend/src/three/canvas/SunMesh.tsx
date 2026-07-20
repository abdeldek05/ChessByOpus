import { forwardRef, useMemo } from 'react'
import * as THREE from 'three'
import { getSunDirection, LIGHTING } from '@/three/constants/launchDaylight'
import { FAR_GROUND_RADIUS } from '@/lib/sceneScale'

// Même distance que l'ancien SunDisc (proche du dôme <Environment>, voir
// EnvironmentSky) : assez loin pour rester derrière tout le décor (pad, arbres,
// rampe) — c'est cette occlusion par la géométrie qui dessine les rayons.
const SUN_DISTANCE = FAR_GROUND_RADIUS * 1.6
const SUN_RADIUS = FAR_GROUND_RADIUS * 0.02

/**
 * Petit disque au soleil (aligné sur SunLight/l'HDRI, voir getSunDirection) :
 * sert de SOURCE à l'effet God Rays (voir PostFX) — l'effet a besoin d'un vrai
 * mesh dans la scène pour calculer l'occlusion par le décor et dessiner les
 * rayons qui en jaillissent. Contrairement à l'ancien SunDisc (supprimé), reste
 * TONE-MAPPÉ normalement (pas de `toneMapped={false}`) pour ne pas créer un
 * second soleil qui detonne à côté de celui, déjà visible, de l'HDRI — ce
 * disque se fond dedans, seul l'effet de rayons compte visuellement.
 */
export const SunMesh = forwardRef<THREE.Mesh>(function SunMesh(_props, ref) {
  const position = useMemo(() => {
    const [dx, dy, dz] = getSunDirection()
    return new THREE.Vector3(dx, dy, dz).multiplyScalar(SUN_DISTANCE)
  }, [])

  return (
    <mesh ref={ref} position={position}>
      <sphereGeometry args={[SUN_RADIUS, 16, 16]} />
      <meshBasicMaterial color={LIGHTING.sunColor} />
    </mesh>
  )
})
