import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import {
  ballisticStateAt,
  BALLISTIC_FLIGHT_DURATION_SEC,
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
}

interface UseMesangeFlightResult {
  groupRef: React.RefObject<THREE.Group | null>
  phase: FlightPhase
  /** Temps écoulé depuis l'impact (s) — pilote la dispersion des fragments. */
  brokenElapsed: React.RefObject<number>
}

/**
 * Anime la Mesange le long de la trajectoire balistique tant que `active`.
 * Positionne le groupe à chaque frame et oriente son nez sur la tangente. À
 * l'atterrissage (progress = 1), bascule en phase 'broken' : le rendu prend
 * alors le relais pour disperser des fragments. Aucune donnée back — placeholder.
 */
export function useMesangeFlight({ params, active }: UseMesangeFlightParams): UseMesangeFlightResult {
  const groupRef = useRef<THREE.Group>(null)
  const elapsed = useRef(0)
  const brokenElapsed = useRef(0)
  const [phase, setPhase] = useState<FlightPhase>('flying')

  useFrame((_, delta) => {
    const group = groupRef.current
    if (!group || !active) return

    if (phase === 'flying') {
      elapsed.current += delta
      const state = ballisticStateAt(elapsed.current, params)
      group.position.copy(state.position)

      // Oriente l'axe +Y du modèle le long de la tangente de vol.
      group.quaternion.setFromUnitVectors(MODEL_UP, state.heading)

      if (elapsed.current >= BALLISTIC_FLIGHT_DURATION_SEC) setPhase('broken')
    } else {
      brokenElapsed.current += delta
    }
  })

  return { groupRef, phase, brokenElapsed }
}
