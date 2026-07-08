import { useLatticeBoomGeometry } from '@/three/hooks/useLatticeBoomGeometry'
import { RAIL_COLORS } from '@/three/constants/launchRail'

/**
 * Le fût-treillis (rail) : géométrie lattice fusionnée en un seul mesh. Bâti
 * droit le long de +Y ; l'inclinaison est appliquée par le parent (LaunchRail).
 */
export function RailBoom() {
  const geometry = useLatticeBoomGeometry()

  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshStandardMaterial color={RAIL_COLORS.boom} metalness={0.6} roughness={0.4} />
    </mesh>
  )
}
