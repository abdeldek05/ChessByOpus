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
// Cadence de publication en state (donc re-render + rebuild géométrie <Line>).
// Accumuler CHAQUE point en state (setState + spread à chaque frame utile)
// reconstruit toute la fat-line à chaque appel — coût croissant avec la
// longueur du corridor, cause d'une vibration qui empire au fil du vol. Les
// points sont donc accumulés en ref à chaque frame (aucun re-render), et
// publiés par lots à cette cadence seulement — invisible à l'œil sur une
// ligne qui s'allonge.
const PUBLISH_INTERVAL_SEC = 0.15

const EMPTY: CorridorPoints = { points: [], colors: [] }

/**
 * Accumule EN DIRECT les points du corridor de visibilité à la position RÉELLE
 * de la fusée (positionRef, alimenté par FlyingMesange) : chaque nouveau point
 * est classé par radar (isInCoverage — géométrie partagée avec Analytics) et
 * coloré (vert/ambre = vu, rouge = trou). L'accumulation vit dans des refs
 * (zéro re-render par point) ; le résultat n'est publié en state que par lots
 * (PUBLISH_INTERVAL_SEC), pour éviter de reconstruire la géométrie <Line> à
 * chaque frame utile. Suivre la position réellement rendue garantit
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
  // Buffers bruts, remplis à chaque frame utile SANS déclencher de re-render.
  const bufferedPoints = useRef<THREE.Vector3[]>([])
  const bufferedColors = useRef<THREE.Color[]>([])
  const timeSincePublish = useRef(0)
  const lastPoint = useRef<THREE.Vector3 | null>(null)
  const wasActive = useRef(false)

  // Ré-armement (replay) : on efface le corridor précédent tout de suite,
  // sans attendre le prochain tir (les néons repartent de zéro).
  useEffect(() => {
    if (armed) {
      bufferedPoints.current = []
      bufferedColors.current = []
      timeSincePublish.current = 0
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

  // Publie le buffer accumulé en state (donc re-render + rebuild <Line>) :
  // un SEUL nouveau tableau (immutabilité), pas un spread par point.
  const publish = () => {
    setData({ points: bufferedPoints.current.slice(), colors: bufferedColors.current.slice() })
  }

  useFrame((_, delta) => {
    // Nouveau vol (repos → vol) : repart d'un corridor vide.
    if (active && !wasActive.current) {
      lastPoint.current = null
      bufferedPoints.current = []
      bufferedColors.current = []
      timeSincePublish.current = 0
      setData(EMPTY)
    }
    // Fin de vol : flush immédiat pour ne pas perdre le dernier segment
    // resté dans le buffer depuis la dernière publication throttlée.
    if (!active && wasActive.current) {
      publish()
    }
    wasActive.current = active
    if (!active) return

    const p = positionRef.current
    if (!(lastPoint.current && lastPoint.current.distanceToSquared(p) < MIN_POINT_SPACING * MIN_POINT_SPACING)) {
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
      if (bufferedPoints.current.length < MAX_POINTS) {
        bufferedPoints.current.push(p.clone())
        bufferedColors.current.push(new THREE.Color(rgb[0], rgb[1], rgb[2]))
      }
    }

    // Publication THROTTLÉE : re-render + rebuild géométrie <Line> par lots,
    // pas à chaque point — supprime le coût croissant avec la longueur du
    // corridor qui causait une vibration s'aggravant au fil du vol.
    timeSincePublish.current += delta
    if (timeSincePublish.current >= PUBLISH_INTERVAL_SEC) {
      timeSincePublish.current = 0
      publish()
    }
  })

  return data
}
