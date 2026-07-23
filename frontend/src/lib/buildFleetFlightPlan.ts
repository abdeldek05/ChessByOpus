import { buildQueenTrajectory, buildPawnTrajectory } from '@/lib/decoyTrajectory'
import type { FlightData } from '@/lib/api'
import type { MesangeLaunchConfig } from '@/types/mission.types'

/** Un vol à rendre en 3D : la config de la Mesange + sa trajectoire complète
 *  (RocketPy réelle pour le Roi, dérivée JS pour un leurre). */
export interface MesangeFlightPlan {
  config: MesangeLaunchConfig
  flight: FlightData
  isKing: boolean
}

/**
 * Assemble le plan de vol de TOUTE la flotte : la Mesange KING reçoit sa
 * vraie trajectoire RocketPy (déjà calculée par le backend, voir
 * useLaunchSequence) ; la QUEEN reçoit ce MÊME vol tourné vers son azimut
 * (voir buildQueenTrajectory — cohérent avec la détection radar backend, qui
 * fait exactement ça) ; chaque PAWN reçoit une balistique JS indépendante à
 * son propre azimut/inclinaison réglés (voir buildPawnTrajectory) — aucun
 * appel backend supplémentaire, cohérent avec le prefetch.
 *
 * `kingFlight` doit être le vol RÉEL du Roi (pas encore connu tant que le
 * backend n'a pas répondu) : tant qu'il vaut `null`, aucun plan n'est
 * produit (rien à rendre avant que la trajectoire de référence existe).
 */
export function buildFleetFlightPlan(
  mesangeConfigs: MesangeLaunchConfig[],
  kingFlight: FlightData | null,
): MesangeFlightPlan[] {
  if (!kingFlight) return []

  return mesangeConfigs.map((config) => {
    const isKing = config.role === 'KING'
    let flight: FlightData
    if (isKing) {
      flight = kingFlight
    } else if (config.role === 'QUEEN') {
      flight = buildQueenTrajectory({ azimuthDeg: config.azimuthDeg, kingFlight })
    } else {
      flight = buildPawnTrajectory({
        azimuthDeg: config.azimuthDeg,
        inclinationDeg: config.inclinationDeg,
        kingFlight,
      })
    }
    return { config, isKing, flight }
  })
}
