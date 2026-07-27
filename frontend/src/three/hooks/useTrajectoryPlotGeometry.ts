import { useMemo } from 'react'
import * as THREE from 'three'
import { computeRadarEnu } from '@/lib/coverage/computeRadarEnu'
import { PLOT_HALF_W, PLOT_HEIGHT } from '@/three/constants/trajectoryPlot'
import type { FlightData } from '@/lib/api'
import type { LaunchSite } from '@/types/simulation.types'
import type { PlacedRadar } from '@/types/mission.types'

interface TrajectoryPlotGeometry {
  /** Points 3D de la trajectoire dans le repère du graphe (rectangle). */
  points: THREE.Vector3[]
  /** Échelle HORIZONTALE (m → unités) : distance sol X/Z. */
  scaleH: number
  /** Échelle VERTICALE (m → unités) : altitude Y. Distincte de scaleH → repère
   *  RECTANGULAIRE (plus large que haut), la trajectoire s'étale au lieu d'être
   *  tassée. Le volume radar applique les deux (rayon=scaleH, alt=scaleV). */
  scaleV: number
  /** Étendue horizontale réelle (m) couverte par le repère (demi-largeur). */
  extentM: number
  /** Altitude max réelle couverte (m) — graduations verticales. */
  altExtentM: number
  /** Bornes réelles (m) pour les étiquettes récap. */
  bounds: { rangeM: number; altMaxM: number }
  /** Convertit une position ENU réelle (m) en point 3D du graphe. */
  toPlot: (xM: number, yM: number, zM: number) => THREE.Vector3
}

/**
 * Géométrie du graphe 3D de trajectoire à ÉCHELLE COMMUNE : la trajectoire ET
 * les radars (position + portée + plafond) partagent un SEUL facteur d'échelle,
 * calé sur l'étendue GLOBALE de la scène — sinon le dôme d'un radar (portée
 * 75 km) écrase la trajectoire (apogée ~22 km) faute d'échelle commune. Tout
 * tombe donc à sa vraie proportion, rien ne déborde du cube repère. Centré au
 * sol sur le pas de tir. ENU (x=est, y=nord, z=alt) → Three (x=est, y=alt,
 * z=-nord). Mémoïsé.
 */
export function useTrajectoryPlotGeometry(
  flight: FlightData | null,
  site: LaunchSite,
  radars: PlacedRadar[],
): TrajectoryPlotGeometry {
  return useMemo(() => {
    const traj = flight?.trajectory ?? []

    // ÉCHELLE CALÉE SUR LA TRAJECTOIRE SEULE : elle doit REMPLIR le cube, bien
    // grande et étalée (demande Abdel « augmente radicalement l'échelle »). Les
    // radars ne dilatent PLUS le cadre — leur enveloppe est BORNÉE à la zone de
    // vol côté rendu (clipRadiusM = extentM, voir RadarEnvelope3D), donc on voit
    // la portion d'enveloppe autour de la trajectoire, pas le dôme de 75 km qui
    // l'écrasait. Un radar proche reste inclus (marge) pour rester repérable.
    let horizM = 1
    let altM = 1
    for (const p of traj) {
      horizM = Math.max(horizM, Math.abs(p.x), Math.abs(p.y))
      altM = Math.max(altM, p.z)
    }
    // Inclut seulement les radars DANS la zone de vol (distance ≤ étendue
    // trajectoire) pour ne pas re-dilater le cadre ; un radar lointain reste
    // hors-champ, repéré au bord (trait/pastille).
    for (const radar of radars) {
      if (!radar.position) continue
      const enu = computeRadarEnu(site, radar.position)
      const distToPad = Math.hypot(enu.eastM, enu.northM)
      if (distToPad <= horizM) horizM = Math.max(horizM, distToPad)
    }

    // DEUX échelles → repère RECTANGULAIRE : l'horizontale remplit la demi-
    // largeur (PLOT_HALF_W), la verticale remplit la hauteur (PLOT_HEIGHT). Comme
    // distance ≫ altitude, ça étale la trajectoire au lieu de la tasser dans un
    // cube. (Note : proportions volontairement non réalistes ici — c'est un
    // graphe de lecture, pas une maquette ; l'altitude reste chiffrée par les
    // graduations.)
    const scaleH = PLOT_HALF_W / horizM
    const scaleV = PLOT_HEIGHT / altM

    // ENU (x=est, y=nord, z=alt) → Three (x=est·H, y=alt·V, z=-nord·H).
    const toPlot = (xM: number, yM: number, zM: number) =>
      new THREE.Vector3(xM * scaleH, zM * scaleV, -yM * scaleH)

    const points = traj.map((p) => toPlot(p.x, p.y, p.z))
    const rangeM = traj.length ? Math.hypot(traj[traj.length - 1].x, traj[traj.length - 1].y) : 0

    return { points, scaleH, scaleV, extentM: horizM, altExtentM: altM, bounds: { rangeM, altMaxM: altM }, toPlot }
  }, [flight, site, radars])
}
