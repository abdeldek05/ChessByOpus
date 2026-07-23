import { useMemo } from 'react'
import * as THREE from 'three'
import { MesangeStatic } from './MesangeStatic'
import { MesangeDebris } from './MesangeDebris'
import { ImpactBurst } from './ImpactBurst'
import { ExhaustPlume } from './ExhaustPlume'
import { useTrajectoryPlayback } from '@/three/hooks/useTrajectoryPlayback'
import { PAWN_BURN_TIME_SEC } from '@/lib/decoyTrajectory'
import type { FlightData } from '@/lib/api'
import type { MesangeRole } from '@/types/mission.types'

// Signature visuelle de la Dame (leurre premium, doctrine CHESS) : plus
// grosse qu'un Pion standard, pour rester crédible face au Roi. Voir
// backend/radar.py RCS_ROLE_MULTIPLIER pour l'équivalent côté détection.
const QUEEN_SCALE_MULTIPLIER = 1.25

/** Niveau de détail du rendu d'une Mesange en vol : `full` = Roi (modèle
 *  détaillé, panache riche + lumière dynamique), `lite` = leurres (allégé,
 *  sans lumière dynamique — protège les FPS quand N Mesange volent). Le LOD
 *  proprement dit est branché en R3 ; en R2 la prop existe mais toutes sont
 *  rendues `full` (elle évite de re-toucher la signature au lot suivant). */
export type MesangeDetail = 'full' | 'lite'

interface FlyingMesangeProps {
  /** Trajectoire à rejouer — RocketPy réelle (Roi), vol du Roi tourné (Dame,
   *  voir buildQueenTrajectory) ou balistique JS indépendante (Pion, voir
   *  buildPawnTrajectory) ; null = rien à animer. */
  flight: FlightData | null
  /** Origine scène (sommet de rampe) où démarre la trajectoire. */
  origin: THREE.Vector3
  /** Direction unitaire du nez au décollage (axe de la rampe). */
  initialDirection: THREE.Vector3
  /** Vol en cours : anime le tir ; false = rien affiché. */
  active: boolean
  /** Mètres réels → unités scène (map fixe, voir computeSceneScale). */
  metersPerSceneUnit: number
  /** Niveau de détail (voir MesangeDetail) — défaut `full`. */
  detail?: MesangeDetail
  /** Rôle CHESS (KING/QUEEN/PAWN) — pilote le suivi de spline en descente, la
   *  durée du panache et la signature visuelle des leurres (voir
   *  useTrajectoryPlayback). Défaut `'KING'`. */
  role?: MesangeRole
  /** Position monde de la fusée à chaque frame (caméra de suivi). */
  onFlightFrame?: (position: THREE.Vector3, progress: number) => void
  /** Impact réel (fin de la chute sur le relief 3D) — voir useTrajectoryPlayback. */
  onImpact?: () => void
}

/**
 * Mesange en vol : rejoue une trajectoire (RocketPy pour le Roi, dérivée JS
 * pour un leurre) à un rythme visible (décollage ralenti), AGRANDIE pour
 * rester lisible à distance, avec un PANACHE d'échappement en particules
 * (flamme + fumée), puis se BRISE au sol à l'impact. Orchestre le modèle, le
 * panache et les débris ; l'interpolation vit dans le hook. Remonte la
 * position monde (caméra de suivi).
 */
export function FlyingMesange({
  flight,
  origin,
  initialDirection,
  active,
  metersPerSceneUnit,
  detail = 'full',
  role = 'KING',
  onFlightFrame,
  onImpact,
}: FlyingMesangeProps) {
  // Prop de LOD réservée pour R3 (branchement du rendu allégé) — référencée
  // ici pour ne pas déclencher "unused prop" tant qu'elle n'est pas exploitée.
  void detail
  // La Dame REJOUE le vol du Roi tel quel (juste tourné, voir
  // buildQueenTrajectory) : même mode de lecture que le Roi (spline montée +
  // PGRV en chute, burn de 35.7s). Seul le Pion a sa PROPRE physique JS
  // (montée+chute complète sur la spline, burn court) — voir useRealDescent.
  const isPawn = role === 'PAWN'
  // Stabilise l'origine/direction (évite un nouveau Vector3 à chaque render → reset hook).
  const originStable = useMemo(() => origin.clone(), [origin.x, origin.y, origin.z])
  const directionStable = useMemo(
    () => initialDirection.clone(),
    [initialDirection.x, initialDirection.y, initialDirection.z],
  )

  const { groupRef, phase, thrusting, brokenElapsed, impact, hasStarted } = useTrajectoryPlayback({
    flight,
    active,
    origin: originStable,
    initialDirection: directionStable,
    metersPerSceneUnit,
    useRealDescent: isPawn,
    burnTimeSec: isPawn ? PAWN_BURN_TIME_SEC : undefined,
    scaleMultiplier: role === 'QUEEN' ? QUEEN_SCALE_MULTIPLIER : 1,
    onFrame: onFlightFrame,
    onImpact,
  })

  if (!hasStarted || !flight) return null

  return (
    <>
      {phase === 'flying' && (
        <group ref={groupRef}>
          {/* noFog : en altitude la fusée monte au-delà du fog (calé sur le
              rayon du terrain) — sans ça elle se noierait dans la brume.
              Échelle et orientation initiales gérées dans useTrajectoryPlayback
              (transition progressive, pas de saut). */}
          <MesangeStatic noFog />
          <ExhaustPlume thrustingRef={thrusting} />
        </group>
      )}
      {phase === 'broken' && (
        <group position={impact}>
          {/* Fragments physiques (rebonds) + flash/poussière/fumée d'impact. */}
          <MesangeDebris elapsedRef={brokenElapsed} />
          <ImpactBurst elapsedRef={brokenElapsed} />
        </group>
      )}
    </>
  )
}
