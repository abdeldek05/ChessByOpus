import { useMemo } from 'react'
import { Line } from '@react-three/drei'
import * as THREE from 'three'
import { computeCoverageLobeHalf } from '@/lib/coverage/computeCoverageLobeHalf'
import { COVERAGE_ELEVATION_MIN_DEG, COVERAGE_ELEVATION_MAX_DEG } from '@/constants/coverage'
import { PLOT_CYAN } from '@/three/constants/trajectoryPlot'
import type { RadarConfig } from '@/types/radar.types'

interface RadarEnvelope3DProps {
  /** Position du radar dans le repère du graphe (unités scène, au sol y=0). */
  center: THREE.Vector3
  config: RadarConfig
  /** Échelle HORIZONTALE (m → unités) : rayon du lobe (repère rectangulaire). */
  scaleH: number
  /** Échelle VERTICALE (m → unités) : altitude du lobe. */
  scaleV: number
  /** Rayon de CLIP (m) : enveloppe dessinée jusqu'à l'étendue de la zone de vol. */
  clipRadiusM: number
  /** Teinte HDR propre à CE radar (voir PLOT_RADAR_COLORS) : distingue les dômes
   *  quand plusieurs radars sont posés. Défaut cyan (radar unique). */
  tint?: [number, number, number]
}
/** Nombre de méridiens (rayons verticaux) et de parallèles (cercles) du dôme. */
const MERIDIANS = 12
const PARALLELS = 4

/**
 * VOLUME de couverture radar dans le graphe 3D — rendu comme un vrai DÔME
 * INSTRUMENTÉ (méridiens + parallèles fins, façon radôme), PAS un maillage de
 * facettes ni une sphère plastique. Le profil du dôme = le vrai demi-lobe
 * (computeCoverageLobeHalf : portée, plafond écrêté, cône de silence creusé,
 * masque d'horizon), donc géométriquement juste. Surface interne très subtile
 * (repère de volume) + grille fine cyan. depthWrite=false → ne masque jamais
 * la trajectoire.
 */
export function RadarEnvelope3D({
  center,
  config,
  scaleH,
  scaleV,
  clipRadiusM,
  tint = PLOT_CYAN,
}: RadarEnvelope3DProps) {
  const envelopeColor = useMemo(() => new THREE.Color(...tint), [tint])
  const { surface, meridians, parallels } = useMemo(() => {
    const lobeHalf = computeCoverageLobeHalf({
      rangeM: config.rangeKm * 1000,
      offAxisM: 0,
      antennaHeightM: config.antennaHeightM,
      ceilingM: config.ceilingM,
      elevMinDeg: COVERAGE_ELEVATION_MIN_DEG,
      elevMaxDeg: config.elevationMaxDeg ?? COVERAGE_ELEVATION_MAX_DEG,
    })
    if (!lobeHalf || lobeHalf.length < 2) return { surface: null, meridians: [], parallels: [] }
    // Clip du RAYON du lobe autour du radar. `clipRadiusM` était l'étendue du
    // cadre entier, mesurée depuis le PAS DE TIR : pour un radar excentré, ça
    // rognait son dôme du mauvais côté (ou pas du tout). On le borne à la distance
    // du radar au bord du cadre, ce qui garde un dôme cohérent où qu'il soit posé.
    const clipped = lobeHalf.filter(([u]) => u <= clipRadiusM)
    if (clipped.length < 2) return { surface: null, meridians: [], parallels: [] }

    // Profil (u=rayon, alt) en unités scène (déformation rectangulaire H/V).
    const profile = clipped.map(([u, alt]) => new THREE.Vector2(u * scaleH, alt * scaleV))
    const surface = new THREE.LatheGeometry(profile, 48)

    // MÉRIDIENS : le profil du lobe répété à MERIDIANS azimuts (rayons verticaux
    // qui dessinent la silhouette du dôme sous tous les angles).
    const meridians: THREE.Vector3[][] = []
    for (let m = 0; m < MERIDIANS; m++) {
      const a = (m / MERIDIANS) * Math.PI * 2
      const cos = Math.cos(a)
      const sin = Math.sin(a)
      meridians.push(profile.map((p) => new THREE.Vector3(p.x * cos, p.y, p.x * sin)))
    }

    // PARALLÈLES : cercles horizontaux à quelques altitudes du profil (donne le
    // galbe du dôme). On prend PARALLELS indices répartis le long du profil.
    const parallels: THREE.Vector3[][] = []
    for (let k = 1; k <= PARALLELS; k++) {
      const idx = Math.floor((k / (PARALLELS + 1)) * (profile.length - 1))
      const r = profile[idx].x
      const y = profile[idx].y
      if (r < 1e-3) continue
      const ring: THREE.Vector3[] = []
      const seg = 40
      for (let s = 0; s <= seg; s++) {
        const a = (s / seg) * Math.PI * 2
        ring.push(new THREE.Vector3(r * Math.cos(a), y, r * Math.sin(a)))
      }
      parallels.push(ring)
    }

    return { surface, meridians, parallels }
  }, [config, scaleH, scaleV, clipRadiusM])

  if (!surface) return null

  return (
    <group position={[center.x, 0, center.z]}>
      {/* Surface interne : donne le volume sans le remplir. Opacité RELEVÉE
          (0.03 → 0.07) — à 0.03 le dôme était pratiquement invisible, donc la
          portée du radar ne se lisait pas sur le graphe. */}
      <mesh geometry={surface}>
        <meshBasicMaterial
          color={envelopeColor}
          transparent
          opacity={0.07}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>
      {/* Grille de dôme FINE (méridiens + parallèles) = radôme instrumenté.
          Opacités relevées pour que la silhouette du lobe se lise vraiment. */}
      {meridians.map((pts, i) => (
        <Line key={`mer${i}`} points={pts} color={envelopeColor} lineWidth={0.6} transparent opacity={0.55} toneMapped={false} />
      ))}
      {parallels.map((pts, i) => (
        <Line key={`par${i}`} points={pts} color={envelopeColor} lineWidth={0.6} transparent opacity={0.42} toneMapped={false} />
      ))}
    </group>
  )
}
