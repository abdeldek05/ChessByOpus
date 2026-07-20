import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { computeRadarEnu } from '@/lib/coverage/computeRadarEnu'
import { isInCoverage } from '@/lib/coverage/computeVisibilityWindows'
import { CORRIDOR_SEEN_COLORS, CORRIDOR_BLIND_COLOR } from '@/three/constants/visibilityCorridor'
import type { LaunchSite } from '@/types/simulation.types'
import type { PlacedRadar } from '@/types/mission.types'

interface UseCorridorPointsParams {
  site: LaunchSite
  radars: PlacedRadar[]
  /** Vol en cours : accumule un nouveau point tant que vrai. */
  active: boolean
  /** Scénario ré-armé (replay / retour à l'état prêt) : efface le corridor
   *  précédent immédiatement, sans attendre le prochain tir. */
  armed: boolean
  /** Origine scène (sommet de rampe) — même repère que la position live. */
  origin: THREE.Vector3
  metersPerSceneUnit: number
  /** Position LOCALE live de la fusée (repère du groupe pad), écrite chaque
   *  frame par FlyingMesange.onFlightFrame — la source de vérité du rendu. */
  positionRef: React.RefObject<THREE.Vector3>
}

interface CorridorPoints {
  points: THREE.Vector3[]
  colors: THREE.Color[]
}

// Espacement minimal (unités scène) entre deux points accumulés — évite un
// nuage de points confondus au décollage (fusée lente).
const MIN_POINT_SPACING = 0.6
// Garde-fou mémoire pour un vol très long.
const MAX_POINTS = 3000

const EMPTY: CorridorPoints = { points: [], colors: [] }

/**
 * Accumule EN DIRECT les points du corridor de visibilité à la position RÉELLE
 * de la fusée (positionRef, alimenté par FlyingMesange) : chaque nouveau point
 * est classé par radar (isInCoverage — géométrie partagée avec Analytics) et
 * coloré (vert/ambre = vu, rouge = trou). Le résultat n'est publié en state
 * (donc re-render) QUE lorsqu'un point est réellement ajouté — pas à chaque
 * frame — pour rester fluide. Suivre la position réellement rendue garantit
 * l'alignement du corridor, montée ET descente (physiques différentes).
 */
export function useCorridorPoints({
  site,
  radars,
  active,
  armed,
  origin,
  metersPerSceneUnit,
  positionRef,
}: UseCorridorPointsParams): CorridorPoints {
  const [data, setData] = useState<CorridorPoints>(EMPTY)
  const lastPoint = useRef<THREE.Vector3 | null>(null)
  const wasActive = useRef(false)

  // Ré-armement (replay) : on efface le corridor précédent tout de suite,
  // sans attendre le prochain tir (les néons repartent de zéro).
  useEffect(() => {
    if (armed) {
      setData(EMPTY)
      lastPoint.current = null
    }
  }, [armed])

  // Radars en ENU mètres (recalculé seulement si site/liste changent).
  const placedRadars = useMemo(
    () =>
      radars
        .filter((radar) => radar.position !== null)
        .map((radar, index) => ({
          enu: computeRadarEnu(site, radar.position!),
          config: radar.config,
          colorIndex: index,
        })),
    [site, radars],
  )

  useFrame(() => {
    // Nouveau vol (repos → vol) : repart d'un corridor vide.
    if (active && !wasActive.current) {
      lastPoint.current = null
      setData(EMPTY)
    }
    wasActive.current = active
    if (!active) return

    const p = positionRef.current
    if (lastPoint.current && lastPoint.current.distanceToSquared(p) < MIN_POINT_SPACING * MIN_POINT_SPACING) return

    // Position réelle en mètres ENU (inverse de toScene) → classification radar.
    const eastM = (p.x - origin.x) * metersPerSceneUnit
    const northM = (origin.z - p.z) * metersPerSceneUnit
    const altM = (p.y - origin.y) * metersPerSceneUnit
    const livePoint = { x: eastM, y: northM, z: altM }

    let rgb: readonly [number, number, number] = CORRIDOR_BLIND_COLOR
    for (const radar of placedRadars) {
      if (isInCoverage(livePoint, radar.enu.eastM, radar.enu.northM, radar.config)) {
        rgb = CORRIDOR_SEEN_COLORS[radar.colorIndex % CORRIDOR_SEEN_COLORS.length]
        break
      }
    }

    lastPoint.current = (lastPoint.current ?? new THREE.Vector3()).copy(p)
    // Nouveau tableau (immutabilité) → drei <Line> reconstruit sa géométrie.
    setData((prev) => {
      if (prev.points.length >= MAX_POINTS) return prev
      return {
        points: [...prev.points, p.clone()],
        colors: [...prev.colors, new THREE.Color(rgb[0], rgb[1], rgb[2])],
      }
    })
  })

  return data
}
