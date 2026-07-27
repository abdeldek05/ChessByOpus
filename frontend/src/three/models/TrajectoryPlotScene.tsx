import { useMemo, useRef } from 'react'
import { Line, CatmullRomLine, Text, Billboard, Trail } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { RadarEnvelope3D } from './RadarEnvelope3D'
import { useTrajectoryPlotGeometry } from '@/three/hooks/useTrajectoryPlotGeometry'
import { computeRadarEnu } from '@/lib/coverage/computeRadarEnu'
import { computeNiceTicks } from '@/lib/coverage/computeNiceTicks'
import {
  PLOT_HALF_W,
  PLOT_HEIGHT,
  PLOT_TRACE_WIDTH,
  PLOT_SEEN_WIDTH,
  PLOT_CYAN,
  PLOT_RED,
  PLOT_AMBER,
  PLOT_GRID_SECTION,
} from '@/three/constants/trajectoryPlot'
import type { DecoyTrack } from '@/lib/launchTacticalMap'
import type { FlightData } from '@/lib/api'
import type { CoverageCut } from '@/hooks/useCoverageCut'
import type { LaunchSite } from '@/types/simulation.types'
import type { PlacedRadar } from '@/types/mission.types'

// Taille de référence des marqueurs/labels (unités scène) — fraction de la
// demi-largeur du repère, pour rester proportionné quand on redimensionne.
const MARK = PLOT_HALF_W * 0.018

interface TrajectoryPlotSceneProps {
  flight: FlightData
  cut: CoverageCut
  /** Trajectoires des leurres (Dame/pions) — contexte, tracées discrètes. */
  decoyTracks?: DecoyTrack[]
  /** Délai de mise à feu du Roi (s) — base du temps MISSION. */
  kingDelaySec?: number
  /** Temps de vol RÉEL courant du Roi (s) — état live. */
  liveTSec?: number
  site: LaunchSite
  radars: PlacedRadar[]
  flightProgressRef: React.RefObject<number>
  /** Index de trajectoire courant (live, -1 hors vol) : la trace n'est RÉVÉLÉE
   *  que jusque-là (tracé au fur et à mesure). Vol fini → tout affiché. */
  liveIndex: number
}

/** Couleur du texte des labels (off-white, jamais #fff pur — voir skill). */
const LABEL_COLOR = '#cfe6f0'
const LABEL_STROKE = '#03070d'

// Versions THREE.Color des tokens HDR : drei <Line color> attend une Color/
// string (pas un tuple [r,g,b] comme meshBasicMaterial). Instanciées une fois.
const CYAN = new THREE.Color(...PLOT_CYAN)
const RED = new THREE.Color(...PLOT_RED)

/** Étiquette km compacte (distance sol / altitude). */
function posLabel(sM: number, altM: number): string {
  return `${(Math.abs(sM) / 1000).toFixed(1)}/${(altM / 1000).toFixed(1)} km`
}

/**
 * Contenu 3D de la coupe de couverture radar — DA « Command & Control tactique »
 * (voir skill threejs-dataviz-design). Couleur = SIGNAL :
 * - trajectoire CYAN HDR = trace neutre (donnée), révélée au fil du vol ;
 * - portions VUES par un radar = ROUGE HDR (alarme/détection) — la seule chose
 *   rouge de la scène, elle capte l'œil ;
 * - apogée + graduations = AMBRE ; volumes radar holographiques (RadarEnvelope3D).
 * Ground track pointillé au sol + stems verticaux donnent l'altitude d'un coup.
 * Tête de piste avec sillage (sens du vol). Tout en HDR pour capter le Bloom.
 */
export function TrajectoryPlotScene({
  flight,
  cut,
  decoyTracks,
  kingDelaySec = 0,
  liveTSec = 0,
  site,
  radars,
  flightProgressRef,
  liveIndex,
}: TrajectoryPlotSceneProps) {
  const { points, scaleH, scaleV, toPlot, extentM, altExtentM } = useTrajectoryPlotGeometry(flight, site, radars)
  const headRef = useRef<THREE.Group>(null)

  // Trajectoires des LEURRES projetées dans le même repère (contexte). Chaque
  // leurre a sa propre trajectoire (Dame/pion) — même toPlot que le Roi, donc
  // positions cohérentes avec la vraie scène. Révélées par liveIndex comme le Roi.
  const decoyLines = useMemo(
    () =>
      (decoyTracks ?? []).map((d) => ({
        id: d.id,
        delaySec: d.launchDelaySec ?? 0,
        pts: d.flight.trajectory.map((p) => toPlot(p.x, p.y, p.z)),
        // Horodatage de chaque point (s de SON vol) : sert à révéler le leurre
        // à son VRAI timing, pas à celui du Roi.
        times: d.flight.trajectory.map((p) => p.t),
      })),
    [decoyTracks, toPlot],
  )

  // Points révélés : jusqu'à l'index live pendant le vol, tout une fois fini.
  const revealed = liveIndex < 0 ? points.length : Math.min(points.length, liveIndex + 2)
  const revealedPoints = useMemo(() => points.slice(0, revealed), [points, revealed])

  // Ground track (projection au sol, y=0) révélé — trait fin discret.
  const groundTrack = useMemo(() => revealedPoints.map((p) => new THREE.Vector3(p.x, 0, p.z)), [revealedPoints])

  // Apogée (point le plus haut) — marqueur ambre labellisé.
  const apogee = useMemo(() => {
    let best = points[0]
    for (const p of points) if (p.y > best.y) best = p
    return best
  }, [points])
  const apogeeKm = useMemo(() => {
    let maxZ = 0
    for (const p of flight.trajectory) maxZ = Math.max(maxZ, p.z)
    return maxZ / 1000
  }, [flight])

  // Graduations km (distance sol le long de +X, altitude le long de +Y).
  const { distTicks, altTicks } = useMemo(() => {
    return {
      distTicks: computeNiceTicks(0, extentM / 1000, 5),
      altTicks: computeNiceTicks(0, altExtentM / 1000, 4),
    }
  }, [extentM, altExtentM])

  // Position 3D de chaque radar (même repère que la trajectoire).
  const radarPlacements = useMemo(
    () =>
      cut.radarCuts
        .map((rc) => {
          const placed = radars.find((r) => r.id === rc.id)
          if (!placed?.position) return null
          const enu = computeRadarEnu(site, placed.position)
          return { rc, center: toPlot(enu.eastM, enu.northM, 0), config: placed.config }
        })
        .filter((v): v is NonNullable<typeof v> => v !== null),
    [cut.radarCuts, radars, site, toPlot],
  )

  useFrame(() => {
    const head = headRef.current
    if (!head || points.length < 2) return
    const progress = flightProgressRef.current
    if (progress < 0) {
      head.visible = false
      return
    }
    head.visible = true
    const idx = Math.min(points.length - 1, Math.max(0, Math.floor(progress * (points.length - 1))))
    head.position.copy(points[idx])
  })

  if (points.length < 2) return null
  const topY = PLOT_HEIGHT

  return (
    <>
      {/* Repère RECTANGULAIRE posé sur le sol (large en X/Z, moins haut en Y).
          Arêtes cyan discrètes — le cadre « instrument », pas une boîte grise. */}
      <lineSegments position={[0, PLOT_HEIGHT / 2, 0]}>
        <edgesGeometry args={[new THREE.BoxGeometry(PLOT_HALF_W * 2, PLOT_HEIGHT, PLOT_HALF_W * 2)]} />
        <lineBasicMaterial color={PLOT_GRID_SECTION} transparent opacity={0.25} />
      </lineSegments>

      {/* Axe vertical (altitude) au pas de tir. */}
      <Line points={[[0, 0, 0], [0, topY, 0]]} color={CYAN} lineWidth={0.6} transparent opacity={0.4} toneMapped={false} />

      {/* Graduations km (texte SDF face caméra). Altitude → scaleV, distance → scaleH. */}
      {altTicks.map((km) => (
        <Billboard key={`alt${km}`} position={[-0.9, km * 1000 * scaleV, 0]}>
          <Text fontSize={0.7} color={LABEL_COLOR} anchorX="right" outlineWidth={0.02} outlineColor={LABEL_STROKE}>
            {km}km
          </Text>
        </Billboard>
      ))}
      {distTicks.map((km) => (
        <Billboard key={`dist${km}`} position={[km * 1000 * scaleH, -0.8, 0]}>
          <Text fontSize={0.7} color={LABEL_COLOR} anchorY="top" outlineWidth={0.02} outlineColor={LABEL_STROKE}>
            {km}
          </Text>
        </Billboard>
      ))}

      {/* Volume de couverture de chaque radar (holographique) + repère sol + nom. */}
      {radarPlacements.map(({ rc, center, config }) => (
        <group key={rc.id}>
          <RadarEnvelope3D center={center} config={config} scaleH={scaleH} scaleV={scaleV} clipRadiusM={extentM} />
          <Line points={[[center.x, 0, center.z], [center.x, MARK * 2, center.z]]} color={CYAN} lineWidth={0.8} toneMapped={false} />
          <mesh position={[center.x, 0, center.z]}>
            <coneGeometry args={[MARK * 1.4, MARK * 3, 4]} />
            <meshBasicMaterial color={PLOT_CYAN} toneMapped={false} />
          </mesh>
          <Billboard position={[center.x, MARK * 4, center.z]}>
            <Text fontSize={0.55} color={LABEL_COLOR} outlineWidth={0.025} outlineColor={LABEL_STROKE}>
              {rc.name}
            </Text>
          </Billboard>
        </group>
      ))}

      {/* Ground track pointillé au sol (projection de la trajectoire) — trait
          FIN et discret. Les « stems » verticaux (barreaux trajectoire→sol) ont
          été RETIRÉS : ils « remplissaient » la courbe et la rendaient lourde. */}
      {groundTrack.length >= 2 && (
        <Line points={groundTrack} color={CYAN} lineWidth={0.6} dashed dashScale={6} transparent opacity={0.25} toneMapped={false} />
      )}

      {/* Trajectoires des LEURRES (contexte) : gris bleuté discret, révélées au
          fil du vol comme le Roi (même liveIndex). La menace (Roi) reste
          prioritaire — trait plus fin et sombre pour les leurres. */}
      {decoyLines.map((d) => {
        // SYNCHRO EXACTE : temps MISSION courant = délai du Roi + son temps de
        // vol. Ce leurre a décollé à `d.delaySec`, il est donc à
        // (tMission − d.delaySec) de SA propre trajectoire — exactement comme
        // dans la vraie scène 3D. Sans ça, tous les leurres suivaient bêtement
        // la progression du Roi et se désynchronisaient dès que les délais
        // différaient. Vol fini (liveIndex < 0) → trace complète.
        let count: number
        if (liveIndex < 0) {
          count = d.pts.length
        } else {
          const tDecoy = kingDelaySec + liveTSec - d.delaySec
          if (tDecoy <= 0) return null // pas encore décollé
          count = d.times.findIndex((t) => t > tDecoy)
          if (count < 0) count = d.pts.length
        }
        const seg = d.pts.slice(0, count)
        if (seg.length < 2) return null
        return <CatmullRomLine key={d.id} points={seg} curveType="catmullrom" color="#5a6b7a" lineWidth={1} transparent opacity={0.5} />
      })}

      {/* Trajectoire du ROI = COURBE lisse (Catmull-Rom, pas une polyligne à
          segments) CYAN neutre, révélée au fil du vol. */}
      {revealedPoints.length >= 2 && (
        <CatmullRomLine points={revealedPoints} curveType="catmullrom" color={CYAN} lineWidth={PLOT_TRACE_WIDTH} toneMapped={false} />
      )}

      {/* Portions VUES par un radar = ROUGE (alarme, la seule chose rouge) +
          marqueurs acquisition/perte, révélés progressivement. */}
      {cut.radarCuts.map((rc) =>
        rc.windows.map((w) => {
          if (w.iIn >= revealed) return null
          const segEnd = Math.min(w.iOut, revealed - 1)
          const seg = points.slice(w.iIn, segEnd + 1)
          const outReached = w.iOut < revealed
          return (
            <group key={`${rc.id}-${w.iIn}`}>
              {seg.length >= 2 && <CatmullRomLine points={seg} curveType="catmullrom" color={RED} lineWidth={PLOT_SEEN_WIDTH} toneMapped={false} />}
              <mesh position={points[w.iIn]}>
                <sphereGeometry args={[MARK * 1.6, 14, 14]} />
                <meshBasicMaterial color={PLOT_RED} toneMapped={false} />
              </mesh>
              <Billboard position={[points[w.iIn].x, points[w.iIn].y + 0.7, points[w.iIn].z]}>
                <Text fontSize={0.42} color={LABEL_COLOR} outlineWidth={0.02} outlineColor={LABEL_STROKE}>
                  {`ACQ ${rc.name}  T+${Math.round(w.tIn)}s  ${posLabel(w.sInM, w.altInM)}`}
                </Text>
              </Billboard>
              {outReached && (
                <>
                  <mesh position={points[w.iOut]}>
                    <sphereGeometry args={[MARK * 1.2, 12, 12]} />
                    <meshBasicMaterial color={PLOT_RED} transparent opacity={0.5} toneMapped={false} />
                  </mesh>
                  <Billboard position={[points[w.iOut].x, points[w.iOut].y - 0.7, points[w.iOut].z]}>
                    <Text fontSize={0.42} color={LABEL_COLOR} outlineWidth={0.02} outlineColor={LABEL_STROKE}>
                      {`PERTE  T+${Math.round(w.tOut)}s`}
                    </Text>
                  </Billboard>
                </>
              )}
            </group>
          )
        }),
      )}

      {/* Marqueur d'APOGÉE (ambre) — repère de lecture clé. */}
      <group position={apogee}>
        <mesh>
          <sphereGeometry args={[MARK * 1.5, 14, 14]} />
          <meshBasicMaterial color={PLOT_AMBER} toneMapped={false} />
        </mesh>
        <Billboard position={[0, 0.7, 0]}>
          <Text fontSize={0.45} color={LABEL_COLOR} outlineWidth={0.02} outlineColor={LABEL_STROKE}>
            {`APOGÉE ${apogeeKm.toFixed(1)} km`}
          </Text>
        </Billboard>
      </group>

      {/* Pas de tir (cyan). */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[MARK * 1.2, 12, 12]} />
        <meshBasicMaterial color={PLOT_CYAN} toneMapped={false} />
      </mesh>

      {/* Tête de piste live + sillage (Trail) = sens du vol évident. */}
      <group ref={headRef} visible={false}>
        <Trail width={2} length={5} color={new THREE.Color(...PLOT_AMBER)} attenuation={(t) => t * t}>
          <mesh>
            <sphereGeometry args={[MARK * 1.6, 16, 16]} />
            <meshBasicMaterial color={PLOT_AMBER} toneMapped={false} />
          </mesh>
        </Trail>
      </group>
    </>
  )
}
