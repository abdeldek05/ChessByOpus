import { RAILING, RIG_COLORS, DECK_TOP_Y } from '@/three/constants/launcherRig'
import { RAILING_POSTS, RAIL_SEGMENTS } from '@/three/constants/railingLayout'

/**
 * Garde-corps galvanisé du plateau : poteaux verticaux et deux niveaux de
 * lisses tubulaires, avec l'ouverture d'accès côté échelle.
 */
export function DeckRailing() {
  return (
    <group position={[0, DECK_TOP_Y, 0]}>
      {RAILING_POSTS.map(([x, z]) => (
        <mesh key={`${x}:${z}`} position={[x, RAILING.height / 2, z]} castShadow>
          <cylinderGeometry args={[RAILING.postRadius, RAILING.postRadius, RAILING.height, 10]} />
          <meshStandardMaterial color={RIG_COLORS.galva} metalness={0.75} roughness={0.35} />
        </mesh>
      ))}
      {RAIL_SEGMENTS.map((segment, index) => (
        <mesh
          key={index}
          position={[segment.center[0], segment.height, segment.center[1]]}
          rotation={segment.alongX ? [0, 0, Math.PI / 2] : [Math.PI / 2, 0, 0]}
          castShadow
        >
          <cylinderGeometry args={[RAILING.railRadius, RAILING.railRadius, segment.length, 10]} />
          <meshStandardMaterial color={RIG_COLORS.galva} metalness={0.75} roughness={0.35} />
        </mesh>
      ))}
    </group>
  )
}
