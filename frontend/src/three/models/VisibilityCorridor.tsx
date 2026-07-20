import { Line } from '@react-three/drei'
import * as THREE from 'three'
import { useCorridorPoints } from '@/three/hooks/useCorridorPoints'
import { CORRIDOR_LINE_WIDTH } from '@/three/constants/visibilityCorridor'
import type { LaunchSite } from '@/types/simulation.types'
import type { PlacedRadar } from '@/types/mission.types'

interface VisibilityCorridorProps {
  site: LaunchSite
  radars: PlacedRadar[]
  /** Vol en cours : le corridor s'allonge tant que vrai. */
  active: boolean
  /** Scénario ré-armé (replay) : efface le corridor (néons remis à zéro). */
  armed: boolean
  /** Origine scène (sommet de rampe) — même repère que FlyingMesange. */
  origin: THREE.Vector3
  metersPerSceneUnit: number
  /** Position LOCALE live de la fusée, alimentée par FlyingMesange.onFlightFrame. */
  positionRef: React.RefObject<THREE.Vector3>
}

/**
 * La trajectoire RÉELLEMENT volée, tracée en direct comme un corridor coloré :
 * vert/ambre là où un radar voit la fusée, rouge là où aucun ne la voit. Rendu
 * via drei `<Line>` (fat line fiable) ; toute la logique (accumulation live,
 * classification) vit dans useCorridorPoints.
 */
export function VisibilityCorridor(props: VisibilityCorridorProps) {
  const { points, colors } = useCorridorPoints(props)

  // drei <Line> exige au moins 2 points pour une géométrie valide.
  if (points.length < 2) return null

  return <Line points={points} vertexColors={colors} lineWidth={CORRIDOR_LINE_WIDTH} toneMapped={false} />
}
