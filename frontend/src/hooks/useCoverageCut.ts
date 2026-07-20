import { useMemo } from 'react'
import { computeRadarEnu } from '@/lib/coverage/computeRadarEnu'
import { projectTrajectoryToCutAxis, projectPointToCutAxis, type CutPoint } from '@/lib/coverage/projectToCutAxis'
import { computeVisibilityWindows, type VisibilityWindow } from '@/lib/coverage/computeVisibilityWindows'
import { computeCoverageLobeHalf } from '@/lib/coverage/computeCoverageLobeHalf'
import {
  COVERAGE_ELEVATION_MIN_DEG,
  COVERAGE_ELEVATION_MAX_DEG,
  CUT_RADAR_COLORS,
} from '@/constants/coverage'
import type { FlightData } from '@/lib/api'
import type { LaunchSite } from '@/types/simulation.types'
import type { PlacedRadar } from '@/types/mission.types'

/** Fenêtre de visibilité enrichie des positions dans le plan de coupe. */
export interface CutVisibilityWindow extends VisibilityWindow {
  sInM: number
  altInM: number
  sOutM: number
  altOutM: number
}

/** Tout ce qu'il faut pour tracer UN radar sur la coupe. */
export interface RadarCut {
  id: string
  name: string
  color: string
  /** Position du radar le long de l'axe (m) et écart latéral au plan (m). */
  sRadarM: number
  offAxisM: number
  /** Demi-lobe local (u, alt) — null si le plan de coupe est hors de portée. */
  lobeHalf: Array<[number, number]> | null
  antennaHeightM: number
  windows: CutVisibilityWindow[]
}

export interface CoverageCut {
  cutPoints: CutPoint[]
  radarCuts: RadarCut[]
  /** Bornes du graphe (m) : distance le long de l'axe et altitude max. */
  sMinM: number
  sMaxM: number
  altMaxM: number
}

interface UseCoverageCutParams {
  flight: FlightData
  site: LaunchSite
  radars: PlacedRadar[]
  azimuthDeg: number
}

/**
 * Assemble la coupe Thales : trajectoire projetée dans le plan de l'axe de
 * tir, lobes de couverture instrumentée de chaque radar dans ce plan, et
 * fenêtres de visibilité (avec positions) — tout mémoïsé, calculé une fois
 * par vol.
 */
export function useCoverageCut({ flight, site, radars, azimuthDeg }: UseCoverageCutParams): CoverageCut {
  return useMemo(() => {
    const cutPoints = projectTrajectoryToCutAxis(flight.trajectory, azimuthDeg)

    const radarCuts: RadarCut[] = radars
      .filter((radar) => radar.position !== null)
      .map((radar, index) => {
        const enu = computeRadarEnu(site, radar.position!)
        const projection = projectPointToCutAxis(enu.eastM, enu.northM, azimuthDeg)
        const lobeHalf = computeCoverageLobeHalf({
          rangeM: radar.config.rangeKm * 1000,
          offAxisM: projection.offAxisM,
          antennaHeightM: radar.config.antennaHeightM,
          ceilingM: radar.config.ceilingM,
          elevMinDeg: COVERAGE_ELEVATION_MIN_DEG,
          elevMaxDeg: radar.config.elevationMaxDeg ?? COVERAGE_ELEVATION_MAX_DEG,
        })
        const windows = computeVisibilityWindows(flight.trajectory, enu.eastM, enu.northM, radar.config).map(
          (window): CutVisibilityWindow => ({
            ...window,
            sInM: cutPoints[window.iIn].sM,
            altInM: cutPoints[window.iIn].altM,
            sOutM: cutPoints[window.iOut].sM,
            altOutM: cutPoints[window.iOut].altM,
          }),
        )
        return {
          id: radar.id,
          name: radar.config.name,
          color: CUT_RADAR_COLORS[index % CUT_RADAR_COLORS.length],
          sRadarM: projection.sM,
          offAxisM: projection.offAxisM,
          lobeHalf,
          antennaHeightM: radar.config.antennaHeightM,
          windows,
        }
      })

    // Bornes : trajectoire ET lobes entiers visibles.
    let sMin = 0
    let sMax = 0
    let altMax = 0
    for (const p of cutPoints) {
      sMin = Math.min(sMin, p.sM)
      sMax = Math.max(sMax, p.sM)
      altMax = Math.max(altMax, p.altM)
    }
    for (const rc of radarCuts) {
      if (!rc.lobeHalf) continue
      for (const [u, alt] of rc.lobeHalf) {
        sMin = Math.min(sMin, rc.sRadarM - u)
        sMax = Math.max(sMax, rc.sRadarM + u)
        altMax = Math.max(altMax, alt)
      }
    }

    return { cutPoints, radarCuts, sMinM: sMin, sMaxM: sMax, altMaxM: altMax }
  }, [flight, site, radars, azimuthDeg])
}
