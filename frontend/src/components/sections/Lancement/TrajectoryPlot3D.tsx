import { Canvas } from '@react-three/fiber'
import { OrbitControls, Grid } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import * as THREE from 'three'
import { TrajectoryPlotScene } from '@/three/models/TrajectoryPlotScene'
import {
  PLOT_CAMERA_POSITION,
  PLOT_CAMERA_TARGET,
  PLOT_CAMERA_MIN,
  PLOT_CAMERA_MAX,
  PLOT_HALF_W,
  PLOT_BG,
  PLOT_FOG,
  PLOT_FOG_DENSITY,
  PLOT_GRID_CELL,
  PLOT_GRID_SECTION,
} from '@/three/constants/trajectoryPlot'
import type { DecoyTrack } from '@/lib/launchTacticalMap'
import type { FlightData } from '@/lib/api'
import type { CoverageCut } from '@/hooks/useCoverageCut'
import type { LaunchSite } from '@/types/simulation.types'
import type { PlacedRadar } from '@/types/mission.types'

interface TrajectoryPlot3DProps {
  flight: FlightData
  cut: CoverageCut
  /** Trajectoires des leurres (Dame/pions) — contexte dans le profil. */
  decoyTracks?: DecoyTrack[]
  /** Délai de mise à feu du Roi (s) — base du temps mission. */
  kingDelaySec?: number
  /** Temps de vol RÉEL courant du Roi (s, état live). */
  liveTSec?: number
  site: LaunchSite
  radars: PlacedRadar[]
  /** Progression du vol 0→1 (ref partagée) — tête + tracé progressif. */
  flightProgressRef: React.RefObject<number>
  /** Index de trajectoire courant (état live) — pilote le tracé progressif. */
  liveIndex: number
}

/**
 * Graphe 3D de la coupe de couverture radar — DA « Command & Control tactique »
 * (voir skill threejs-dataviz-design). Rendu « instrument » : fond anthracite
 * bleu nuit, grille mission-control (drei <Grid>), fog de profondeur, tone
 * mapping ACES + Bloom SÉLECTIF (seuls les traits HDR glow). Trajectoire tracée
 * au fur et à mesure du vol, portions vues en rouge (alarme), volumes radar
 * holographiques — voir TrajectoryPlotScene. Interactif (orbite/zoom souris).
 */
export function TrajectoryPlot3D({
  flight,
  cut,
  decoyTracks,
  kingDelaySec = 0,
  liveTSec = 0,
  site,
  radars,
  flightProgressRef,
  liveIndex,
}: TrajectoryPlot3DProps) {
  return (
    <Canvas
      camera={{ position: PLOT_CAMERA_POSITION, fov: 45, near: 0.1, far: PLOT_HALF_W * 30 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1 }}
    >
      {/* Fond teinté (jamais noir) + fog de profondeur de la même couleur. */}
      <color attach="background" args={[PLOT_BG]} />
      <fogExp2 attach="fog" args={[PLOT_FOG, PLOT_FOG_DENSITY]} />
      <ambientLight intensity={1} />

      {/* Grille de sol « mission control » : cellules sombres discrètes, sections
          en accent cyan, fondu en distance. */}
      <Grid
        position={[0, 0, 0]}
        args={[PLOT_HALF_W * 4, PLOT_HALF_W * 4]}
        cellSize={PLOT_HALF_W / 8}
        cellThickness={0.5}
        cellColor={PLOT_GRID_CELL}
        sectionSize={PLOT_HALF_W / 2}
        sectionThickness={1}
        sectionColor={PLOT_GRID_SECTION}
        fadeDistance={PLOT_HALF_W * 5}
        fadeStrength={1.5}
        infiniteGrid
      />

      <TrajectoryPlotScene
        flight={flight}
        cut={cut}
        decoyTracks={decoyTracks}
        kingDelaySec={kingDelaySec}
        liveTSec={liveTSec}
        site={site}
        radars={radars}
        flightProgressRef={flightProgressRef}
        liveIndex={liveIndex}
      />

      <OrbitControls
        target={PLOT_CAMERA_TARGET}
        enablePan={false}
        minDistance={PLOT_CAMERA_MIN}
        maxDistance={PLOT_CAMERA_MAX}
        maxPolarAngle={Math.PI / 2 - 0.02}
        enableDamping
        dampingFactor={0.1}
      />

      {/* Post : Bloom SÉLECTIF (luminanceThreshold ~0.9 → seuls les traits HDR
          > 1.0 glow, le reste reste net) + vignette douce (focalise, look écran). */}
      <EffectComposer>
        <Bloom mipmapBlur luminanceThreshold={0.9} luminanceSmoothing={0.3} intensity={0.9} radius={0.6} />
        <Vignette eskil={false} offset={0.3} darkness={0.5} />
      </EffectComposer>
    </Canvas>
  )
}
