import { MesangeStatic } from './MesangeStatic'
import { MesangeDebris } from './MesangeDebris'
import { useMesangeFlight } from '@/three/hooks/useMesangeFlight'
import { ballisticStateAt, BALLISTIC_FLIGHT_DURATION_SEC } from '@/lib/ballisticTrajectory'
import type { BallisticParams } from '@/lib/ballisticTrajectory'

interface FlyingMesangeProps {
  params: BallisticParams
  /** Vol en cours (phase 'running') : anime le tir ; false = rien affiché. */
  active: boolean
}

/**
 * Mesange en vol pendant la séquence de lancement : suit la trajectoire
 * balistique (montée, apogée, descente) puis se BRISE au sol en fragments
 * dispersés. Placeholder purement visuel (aucun trait, aucune donnée back) —
 * orchestre le modèle en vol et les débris ; la mécanique vit dans le hook.
 */
export function FlyingMesange({ params, active }: FlyingMesangeProps) {
  const { groupRef, phase, brokenElapsed } = useMesangeFlight({ params, active })

  if (!active) return null

  // Point d'impact = position finale de la trajectoire (retour au sol).
  const impact = ballisticStateAt(BALLISTIC_FLIGHT_DURATION_SEC, params).position

  return (
    <>
      {phase === 'flying' && (
        <group ref={groupRef}>
          <MesangeStatic />
        </group>
      )}
      {phase === 'broken' && (
        <group position={impact}>
          <MesangeDebris elapsedRef={brokenElapsed} />
        </group>
      )}
    </>
  )
}
