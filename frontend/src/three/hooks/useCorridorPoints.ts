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
  /** Compteur d'écritures de `positionRef` par le moteur de vol. Ce hook
   *  n'accumule un point QUE si ce compteur a bougé : sans cette garde, il
   *  consommait une position PÉRIMÉE (voir le commentaire de la boucle). */
  writeCountRef: React.RefObject<number>
  /** Espacement min entre points (défaut Roi). Les leurres passent plus grand. */
  minPointSpacing?: number
  /** Plafond de points (défaut Roi). Les leurres passent plus bas. */
  maxPoints?: number
  /** Cadence de publication en s (défaut Roi). Les leurres passent plus lent. */
  publishIntervalSec?: number
}

interface CorridorPoints {
  points: THREE.Vector3[]
  colors: THREE.Color[]
}

/**
 * Plafond atteint : on DÉCIME (1 point sur 2) au lieu d'arrêter d'accumuler.
 * Arrêter net gelait la ligne à mi-vol — un leurre (budget 500 pts × 2.5 u
 * d'espacement = 1250 u) s'interrompait vers l'apogée alors que son arc fait
 * 2500-4000 u de scène. La décimation garde la géométrie complète de bout en
 * bout : la mémoire reste bornée par `maxPoints`, seule la résolution baisse
 * (l'espacement double à chaque passe, donc la fréquence de décimation chute
 * géométriquement — coût total amorti négligeable).
 */
function decimate(points: THREE.Vector3[], colors: THREE.Color[]): void {
  const lastIndex = points.length - 1
  let write = 0
  for (let read = 0; read < points.length; read += 2, write += 1) {
    points[write] = points[read]
    colors[write] = colors[read]
  }
  // Le DERNIER point est toujours conservé : la boucle ci-dessus ne le garde que
  // si son index est pair, sinon l'extrémité de la ligne reculait d'un cran à
  // chaque passe — un micro-saut visible en bout de corridor, répété à chaque
  // décimation (plusieurs fois par vol pour un leurre, maxPoints = 500).
  if (lastIndex % 2 !== 0) {
    points[write] = points[lastIndex]
    colors[write] = colors[lastIndex]
    write += 1
  }
  points.length = write
  colors.length = write
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
  writeCountRef,
  minPointSpacing = MIN_POINT_SPACING,
  maxPoints = MAX_POINTS,
  publishIntervalSec = PUBLISH_INTERVAL_SEC,
}: UseCorridorPointsParams): CorridorPoints {
  const [data, setData] = useState<CorridorPoints>(EMPTY)
  // Buffers bruts, remplis à chaque frame utile SANS déclencher de re-render.
  const bufferedPoints = useRef<THREE.Vector3[]>([])
  const bufferedColors = useRef<THREE.Color[]>([])
  const timeSincePublish = useRef(0)
  const lastPoint = useRef<THREE.Vector3 | null>(null)
  const wasActive = useRef(false)
  // Dernière valeur de `writeCountRef` déjà consommée : sert la garde
  // anti-position-périmée de la boucle de frame.
  const lastWriteCount = useRef(-1)
  // Des points restent-ils à publier ? Permet un dernier flush quand le vol de
  // CETTE menace s'achève après celui du Roi (voir le prolongement plus bas).
  const pendingFlush = useRef(false)
  // Espacement COURANT : part de la prop et double à chaque décimation, pour que
  // les points suivants arrivent à la résolution du buffer déjà décimé (sinon on
  // re-saturerait le plafond immédiatement après chaque passe).
  const spacing = useRef(minPointSpacing)

  // Ré-armement (replay) : on efface le corridor précédent tout de suite,
  // sans attendre le prochain tir (les néons repartent de zéro).
  useEffect(() => {
    if (armed) {
      bufferedPoints.current = []
      bufferedColors.current = []
      timeSincePublish.current = 0
      setData(EMPTY)
      lastPoint.current = null
      spacing.current = minPointSpacing
      // Aligné sur le compteur COURANT (et non remis à -1) : la position que la
      // ref contient à cet instant appartient au vol précédent, il faut donc
      // attendre une NOUVELLE écriture avant d'accumuler quoi que ce soit.
      lastWriteCount.current = writeCountRef.current
    }
  }, [armed, minPointSpacing, writeCountRef])

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
      spacing.current = minPointSpacing
      // Même raison que dans l'effet de réarmement : on repart du compteur
      // courant pour ignorer la position héritée du vol précédent.
      lastWriteCount.current = writeCountRef.current
      setData(EMPTY)
    }
    // Fin de vol : flush immédiat pour ne pas perdre le dernier segment
    // resté dans le buffer depuis la dernière publication throttlée.
    if (!active && wasActive.current) {
      publish()
    }
    wasActive.current = active

    // Le vol de CETTE menace continue-t-il ? `active` est le vol GLOBAL (partagé
    // par toute la flotte) et retombe dès que le Roi atterrit — un leurre encore
    // en l'air voyait alors son corridor coupé net à mi-trajectoire. On le
    // prolonge donc tant que le moteur de vol écrit encore sa position, exactement
    // comme le loquet `started` de useTrajectoryPlayback, qui laisse la Mesange
    // vivre sa propre durée de vol. (Le flush ci-dessus n'est pas perdu : les
    // points suivants continuent d'être publiés par la cadence throttlée.)
    const stillWriting = writeCountRef.current !== lastWriteCount.current
    if (!active && !stillWriting) {
      // Le prolongement vient de s'achever (la menace a fini son vol après le
      // Roi) : un dernier flush publie les points accumulés depuis la dernière
      // publication throttlée, qui seraient sinon restés dans le buffer.
      if (pendingFlush.current) {
        pendingFlush.current = false
        publish()
      }
      return
    }
    pendingFlush.current = true

    // GARDE ANTI-POSITION PÉRIMÉE. `positionRef` n'est écrite qu'une fois que la
    // Mesange correspondante est montée ET a joué sa première frame : pendant les
    // 1-2 frames qui suivent le début du vol, elle contient donc encore soit
    // (0,0,0) au tout premier tir, soit LA POSITION D'IMPACT DU VOL PRÉCÉDENT
    // au replay (les refs de position vivent dans une Map jamais purgée).
    // Accumuler ce point-là produisait un sommet parasite loin du pas de tir,
    // relié en LIGNE DROITE au premier vrai point — et comme la décimation
    // conserve toujours l'index 0, ce sommet était indestructible : tous les
    // corridors semblaient converger vers un même point aberrant.
    // On n'accumule donc que si le moteur de vol a écrit la ref depuis la
    // dernière frame observée ici.
    const writeCount = writeCountRef.current
    if (writeCount === lastWriteCount.current) return
    lastWriteCount.current = writeCount

    const p = positionRef.current
    if (!(lastPoint.current && lastPoint.current.distanceToSquared(p) < spacing.current * spacing.current)) {
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
      bufferedPoints.current.push(p.clone())
      bufferedColors.current.push(new THREE.Color(rgb[0], rgb[1], rgb[2]))
      if (bufferedPoints.current.length >= maxPoints) {
        decimate(bufferedPoints.current, bufferedColors.current)
        spacing.current *= 2
      }
    }

    // Publication THROTTLÉE : re-render + rebuild géométrie <Line> par lots,
    // pas à chaque point — supprime le coût croissant avec la longueur du
    // corridor qui causait une vibration s'aggravant au fil du vol.
    timeSincePublish.current += delta
    if (timeSincePublish.current >= publishIntervalSec) {
      timeSincePublish.current = 0
      publish()
    }
  })

  return data
}
