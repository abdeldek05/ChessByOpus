import { useMemo } from 'react'
import { Line } from '@react-three/drei'
import * as THREE from 'three'
import { COVERAGE_ELEVATION_MAX_DEG } from '@/constants/coverage'
import { PLOT_AMBER } from '@/three/constants/trajectoryPlot'

interface RadarSilenceConeProps {
  /** Position du radar dans le repère du graphe (unités scène, au sol y=0). */
  center: THREE.Vector3
  /** Élévation max du faisceau (deg) — au-delà, le radar ne voit plus. */
  elevationMaxDeg?: number
  /** Portée du radar (m) : donne la hauteur du cône (il monte aussi haut que
   *  le radar porte loin). */
  rangeM: number
  scaleH: number
  scaleV: number
}

const CONE_COLOR = new THREE.Color(...PLOT_AMBER)
/** Nombre d'arêtes du cône : assez pour lire le volume, assez peu pour rester fin. */
const EDGES = 8

/**
 * CÔNE DE SILENCE du radar : le volume au-dessus de l'antenne que le faisceau
 * n'atteint pas, parce qu'il ne s'élève pas au-delà de `elevationMaxDeg`. C'est
 * l'angle mort par lequel une menace passe à la verticale sans être vue — donc
 * une information de DÉCISION, pas de la décoration.
 *
 * Le dôme de couverture (RadarEnvelope3D) creuse déjà ce cône dans son profil,
 * mais rien ne le DÉSIGNAIT : on voyait un dôme échancré sans savoir pourquoi.
 * Tracé en AMBRE (attention) et non en cyan (donnée) ni en rouge (réservé à la
 * détection), avec des arêtes montantes + un cercle de gorge au sommet.
 */
export function RadarSilenceCone({
  center,
  elevationMaxDeg,
  rangeM,
  scaleH,
  scaleV,
}: RadarSilenceConeProps) {
  const { edges, throat } = useMemo(() => {
    const elevMax = elevationMaxDeg ?? COVERAGE_ELEVATION_MAX_DEG
    // Au-dessus de 85° il n'y a plus de cône lisible (le radar couvre presque
    // la verticale) : rien à dessiner plutôt qu'un artefact dégénéré.
    if (elevMax >= 85) return { edges: [], throat: [] }

    // Le cône monte jusqu'à l'altitude atteinte par le faisceau à portée max,
    // et son rayon au sol en découle : r = h / tan(elevMax).
    const apexAltM = rangeM * Math.sin((elevMax * Math.PI) / 180)
    const radiusM = apexAltM / Math.tan((elevMax * Math.PI) / 180)
    const h = apexAltM * scaleV
    const r = radiusM * scaleH

    // Arêtes : de l'antenne (apex, au sol) vers le cercle de gorge en altitude.
    const edges: THREE.Vector3[][] = []
    for (let i = 0; i < EDGES; i++) {
      const a = (i / EDGES) * Math.PI * 2
      edges.push([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(r * Math.cos(a), h, r * Math.sin(a)),
      ])
    }

    // Cercle de gorge : ferme le cône en haut, donne son ouverture réelle.
    const throat: THREE.Vector3[] = []
    const seg = 36
    for (let s = 0; s <= seg; s++) {
      const a = (s / seg) * Math.PI * 2
      throat.push(new THREE.Vector3(r * Math.cos(a), h, r * Math.sin(a)))
    }

    return { edges, throat }
  }, [elevationMaxDeg, rangeM, scaleH, scaleV])

  if (edges.length === 0) return null

  return (
    <group position={[center.x, 0, center.z]}>
      {edges.map((pts, i) => (
        <Line
          key={`edge${i}`}
          points={pts}
          color={CONE_COLOR}
          lineWidth={0.5}
          dashed
          dashScale={10}
          transparent
          opacity={0.35}
          toneMapped={false}
        />
      ))}
      <Line
        points={throat}
        color={CONE_COLOR}
        lineWidth={0.7}
        transparent
        opacity={0.45}
        toneMapped={false}
      />
    </group>
  )
}
