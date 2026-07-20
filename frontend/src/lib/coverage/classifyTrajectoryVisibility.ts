import type { TrajectoryPoint } from '@/types/api.types'
import type { LaunchSite } from '@/types/simulation.types'
import type { PlacedRadar } from '@/types/mission.types'
import { computeRadarEnu } from './computeRadarEnu'
import { isInCoverage } from './computeVisibilityWindows'

/**
 * Pour CHAQUE point de trajectoire (même ordre/index que `trajectory`) : l'id
 * du radar qui le voit (le premier trouvé si plusieurs), ou `null` si aucun
 * radar ne couvre ce point (trou). Même géométrie que `computeVisibilityWindows`
 * (isInCoverage) — la classification reste garantie cohérente avec les
 * fenêtres de visibilité déjà utilisées ailleurs (Analytics, HUD).
 */
export function classifyTrajectoryVisibility(
  trajectory: TrajectoryPoint[],
  site: LaunchSite,
  radars: PlacedRadar[],
): (string | null)[] {
  const placed = radars
    .filter((radar) => radar.position !== null)
    .map((radar) => ({
      id: radar.id,
      enu: computeRadarEnu(site, radar.position!),
      config: radar.config,
    }))

  return trajectory.map((point) => {
    for (const radar of placed) {
      if (isInCoverage(point, radar.enu.eastM, radar.enu.northM, radar.config)) {
        return radar.id
      }
    }
    return null
  })
}
