import { useMemo } from 'react'
import * as THREE from 'three'
import { computeRadarEnu } from '@/lib/coverage/computeRadarEnu'
import { PLOT_HALF_W, PLOT_HEIGHT } from '@/three/constants/trajectoryPlot'
import type { FlightData } from '@/lib/api'
import type { LaunchSite } from '@/types/simulation.types'
import type { PlacedRadar } from '@/types/mission.types'

/** Marge ajoutée au-delà de l'objet le plus lointain (trajectoire ou radar) pour
 *  que rien ne colle au bord du repère. */
const FRAME_MARGIN = 1.05

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
    // TOUT radar posé doit tenir dans le cadre, quelle que soit sa distance.
    //
    // L'ancienne version testait `if (distToPad <= horizM) horizM = max(horizM,
    // distToPad)` — un NO-OP : quand la condition est vraie, le max vaut déjà
    // horizM. Le radar n'élargissait donc JAMAIS le cadre, et un radar au-delà de
    // la portée du vol (mesuré : 97 unités pour un radar à 78 km dans un cadre de
    // ±60) tombait hors champ. Son enveloppe, bornée autour de LUI, sortait avec
    // lui : il n'en restait qu'un résidu minuscule au bord de l'image.
    //
    // Le cadre s'étend donc jusqu'au radar le plus lointain, SANS PLAFOND : c'est
    // la seule façon de garantir un dôme correct pour n'importe quelle position de
    // radar. Comprimer la trajectoire est ici acceptable — contrairement à la
    // scène 3D (voir sceneScale.ts), ce repère a DEUX échelles indépendantes, donc
    // l'ALTITUDE continue de remplir toute la hauteur (scaleV) même quand la
    // distance est très comprimée (scaleH). Le vol reste lisible en hauteur, et les
    // graduations chiffrent les deux axes.
    let radarReachM = 0
    for (const radar of radars) {
      if (!radar.position) continue
      const enu = computeRadarEnu(site, radar.position)
      radarReachM = Math.max(radarReachM, Math.hypot(enu.eastM, enu.northM))
    }
    horizM = Math.max(horizM, radarReachM) * FRAME_MARGIN

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
