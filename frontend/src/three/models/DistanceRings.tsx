import { Text } from '@react-three/drei'
import { useDistanceRings } from '@/three/hooks/useDistanceRings'
import {
  RING_COLOR,
  RING_LABEL_COLOR,
  RING_LABEL_SIZE,
} from '@/three/constants/distanceRings'

interface DistanceRingsProps {
  /** Rayon max à couvrir (unités de scène) : au moins jusqu'au radar. */
  maxRadius: number
}

/** Hauteur au-dessus du sol : évite le z-fighting avec la pelouse. */
const Y_OFFSET = 0.15

/**
 * Anneaux de distance gradués au sol, centrés sur le pas de tir. Rend la vraie
 * distance LISIBLE dans la scène (échelle fixe 1:200) : chaque cercle porte son
 * label km. Calcul géométrique délégué à useDistanceRings ; ici, rendu seul.
 */
export function DistanceRings({ maxRadius }: DistanceRingsProps) {
  const rings = useDistanceRings(maxRadius)

  return (
    <group position={[0, Y_OFFSET, 0]}>
      {rings.map((ring) => (
        <group key={ring.km}>
          <lineLoop geometry={ring.geometry}>
            <lineBasicMaterial color={RING_COLOR} transparent opacity={0.4} />
          </lineLoop>
          {/* Label posé à plat sur l'anneau, côté sud (+z), face au ciel. */}
          <Text
            position={[0, 0, ring.radius]}
            rotation={[-Math.PI / 2, 0, 0]}
            fontSize={RING_LABEL_SIZE}
            color={RING_LABEL_COLOR}
            anchorX="center"
            anchorY="middle"
            fillOpacity={0.7}
          >
            {`${ring.km} km`}
          </Text>
        </group>
      ))}
    </group>
  )
}
