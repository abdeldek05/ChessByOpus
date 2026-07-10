import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import {
  ballisticStateAt,
  computeFlightDuration,
  type BallisticParams,
} from '@/lib/ballisticTrajectory'

// Axe « avant » du modèle Mesange (dressée sur +Y au repos) : sert à orienter
// le nez le long de la tangente de la trajectoire.
const MODEL_UP = new THREE.Vector3(0, 1, 0)

export type FlightPhase = 'flying' | 'broken'

interface UseMesangeFlightParams {
  params: BallisticParams
  /** Démarre le vol quand true ; le remettre à false réarme (retour rampe). */
  active: boolean
  /** Appelé à chaque frame en vol avec la position monde (caméra de suivi, etc.). */
  onFlightFrame?: (position: THREE.Vector3, progress: number) => void
}

interface UseMesangeFlightResult {
  groupRef: React.RefObject<THREE.Group | null>
  phase: FlightPhase
  /** Moteur en poussée (pilote l'affichage des flammes). */
  thrusting: React.RefObject<boolean>
  /** Temps écoulé depuis l'impact (s) — pilote la dispersion des fragments. */
  brokenElapsed: React.RefObject<number>
}

/**
 * Anime la Mesange le long de la trajectoire balistique tant que `active`.
 * Positionne le groupe à chaque frame et oriente son nez sur la tangente. À
 * l'atterrissage (progress = 1), bascule en phase 'broken' : le rendu prend
 * alors le relais pour disperser des fragments. Aucune donnée back — placeholder.
 */
export function useMesangeFlight({
  params,
  active,
  onFlightFrame,
}: UseMesangeFlightParams): UseMesangeFlightResult {
  const groupRef = useRef<THREE.Group>(null)
  const elapsed = useRef(0)
  const brokenElapsed = useRef(0)
  const thrusting = useRef(true)
  const [phase, setPhase] = useState<FlightPhase>('flying')

  // Durée réelle du vol (dépend de l'élévation), recalculée si les params changent.
  const duration = useMemo(() => computeFlightDuration(params), [params])

  useFrame((_, delta) => {
    const group = groupRef.current
    if (!group || !active) return

    if (phase === 'flying') {
      elapsed.current += delta
      const state = ballisticStateAt(elapsed.current, params)
      group.position.copy(state.position)
      group.quaternion.setFromUnitVectors(MODEL_UP, state.heading)
      thrusting.current = state.thrusting
      onFlightFrame?.(state.position, state.progress)

      if (elapsed.current >= duration) setPhase('broken')
    } else {
      brokenElapsed.current += delta
    }
  })

  return { groupRef, phase, thrusting, brokenElapsed }
}
