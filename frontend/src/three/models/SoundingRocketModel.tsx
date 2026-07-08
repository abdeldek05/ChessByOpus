import { useInclinationTilt } from '@/three/hooks/useInclinationTilt'
import { ROCKET, ROCKET_COLORS, ARC, ARC_COLOR } from '@/three/constants/inclinationScene'

interface SoundingRocketModelProps {
  /** Élévation, en degrés (90 = verticale). */
  inclinationDeg: number
}

const FIN_ANGLES = [0, 1, 2] as const

/**
 * Fusée-sonde simplifiée en primitives lisses (pas de GLB) : corps élancé
 * clair, ogive laiton effilée, liseré, trois ailerons, tuyère. Pivote autour de
 * sa base avec amorti (useInclinationTilt) ; un point lumineux au rayon de
 * l'arc marque l'angle courant. Rendu uniquement.
 */
export function SoundingRocketModel({ inclinationDeg }: SoundingRocketModelProps) {
  const { pivotRef } = useInclinationTilt(inclinationDeg)

  const nozzleCenterY = ROCKET.liftOff + ROCKET.nozzleHeight / 2
  const bodyCenterY = ROCKET.liftOff + ROCKET.nozzleHeight + ROCKET.bodyHeight / 2
  const bodyTopY = ROCKET.liftOff + ROCKET.nozzleHeight + ROCKET.bodyHeight
  const collarCenterY = bodyTopY + ROCKET.collarHeight / 2
  const noseCenterY = bodyTopY + ROCKET.collarHeight + ROCKET.noseHeight / 2
  const finCenterY = ROCKET.liftOff + ROCKET.nozzleHeight + ROCKET.finHeight / 2

  return (
    <group ref={pivotRef}>
      {/* Tuyère. */}
      <mesh position={[0, nozzleCenterY, 0]}>
        <cylinderGeometry args={[ROCKET.bodyRadius * 0.75, ROCKET.bodyRadius, ROCKET.nozzleHeight, 20]} />
        <meshStandardMaterial color={ROCKET_COLORS.nozzle} roughness={0.6} metalness={0.5} />
      </mesh>

      {/* Corps. */}
      <mesh position={[0, bodyCenterY, 0]}>
        <cylinderGeometry args={[ROCKET.bodyRadius, ROCKET.bodyRadius, ROCKET.bodyHeight, 24]} />
        <meshStandardMaterial color={ROCKET_COLORS.body} roughness={0.35} metalness={0.45} />
      </mesh>

      {/* Liseré laiton. */}
      <mesh position={[0, collarCenterY, 0]}>
        <cylinderGeometry args={[ROCKET.bodyRadius * 1.02, ROCKET.bodyRadius * 1.02, ROCKET.collarHeight, 24]} />
        <meshStandardMaterial color={ROCKET_COLORS.collar} roughness={0.3} metalness={0.7} />
      </mesh>

      {/* Ogive effilée. */}
      <mesh position={[0, noseCenterY, 0]}>
        <coneGeometry args={[ROCKET.bodyRadius, ROCKET.noseHeight, 24]} />
        <meshStandardMaterial color={ROCKET_COLORS.nose} roughness={0.3} metalness={0.65} />
      </mesh>

      {/* Ailerons. */}
      {FIN_ANGLES.map((i) => (
        <group key={i} rotation={[0, (i * 2 * Math.PI) / 3, 0]}>
          <mesh position={[ROCKET.bodyRadius + ROCKET.finWidth / 2, finCenterY, 0]}>
            <boxGeometry args={[ROCKET.finWidth, ROCKET.finHeight, ROCKET.finThickness]} />
            <meshStandardMaterial color={ROCKET_COLORS.fin} roughness={0.4} metalness={0.6} />
          </mesh>
        </group>
      ))}

      {/* Marqueur de l'angle courant sur l'arc (suit le pivot, donc l'amorti). */}
      <mesh position={[0, ARC.radius, 0]}>
        <circleGeometry args={[0.12, 20]} />
        <meshBasicMaterial color={ARC_COLOR} transparent opacity={0.95} depthWrite={false} />
      </mesh>
    </group>
  )
}
