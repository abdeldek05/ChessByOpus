import { useEffect, useMemo, useRef, useState } from 'react'
import { classifyCoverage, type CoverageReason } from '@/lib/coverage/computeVisibilityWindows'
import { computeRadarEnu } from '@/lib/coverage/computeRadarEnu'
import type { LaunchSite } from '@/types/simulation.types'
import type { PlacedRadar } from '@/types/mission.types'
import type { FlightData } from '@/lib/api'

/** Statut de détection du Roi à l'instant courant — `null` hors vol. */
export interface DetectionStatus {
  /** Vu par au moins un radar (alors `radarIndex` désigne lequel, 0-based). */
  visible: boolean
  /** Index du radar concerné (celui qui voit, ou le "meilleur" candidat en
   *  cas de perte — voir le classement dans la boucle). */
  radarIndex: number
  /** Raison de perte quand `visible` est faux (jamais 'visible' dans ce cas). */
  reason: CoverageReason
}

// Cadence de rafraîchissement du statut (Hz) : un texte HUD n'a pas besoin
// d'un recalcul à 60fps — évite un setState React à chaque frame pendant le
// vol (source de re-render inutile, cf. la même logique de throttle que le
// faisceau radar de la carte tactique).
const STATUS_REFRESH_HZ = 8
const STATUS_REFRESH_INTERVAL_MS = 1000 / STATUS_REFRESH_HZ

// Priorité de "meilleure" raison quand AUCUN radar ne voit la menace : la
// cause la plus proche d'une détection est affichée (ex. si un radar dit
// "hors portée" et un autre "cône de silence", le cône de silence est plus
// informatif — la menace est déjà dans le champ d'action, juste trop haut).
const REASON_PRIORITY: Record<Exclude<CoverageReason, 'visible'>, number> = {
  'cone-of-silence': 0,
  'below-horizon-mask': 1,
  'above-ceiling': 2,
  'out-of-range': 3,
}

/**
 * Statut de détection LIVE du Roi (voir doctrine CHESS — seule la menace
 * réelle pilote ce bandeau, comme la carte tactique/le corridor 3D) : à
 * chaque frame de vol, classe sa position par rapport à CHAQUE radar posé
 * (classifyCoverage) et retient soit le premier qui le voit, soit la raison
 * de perte la plus informative. Alimente DetectionStatusHud.
 *
 * Boucle rAF DÉDIÉE (comme useLaunchTacticalMap) : le statut est un state
 * React classique, mais recalculé/appliqué au maximum à STATUS_REFRESH_HZ —
 * un texte n'a pas besoin de 60 re-renders par seconde.
 */
export function useDetectionStatus(
  site: LaunchSite,
  radars: PlacedRadar[],
  flight: FlightData | null,
  flightProgressRef: React.RefObject<number>,
): DetectionStatus | null {
  const [status, setStatus] = useState<DetectionStatus | null>(null)
  const lastStatusRef = useRef<DetectionStatus | null>(null)

  const placedRadars = useMemo(
    () =>
      radars
        .filter((radar) => radar.position !== null)
        .map((radar) => ({ config: radar.config, enu: computeRadarEnu(site, radar.position!) })),
    [site, radars],
  )

  useEffect(() => {
    if (!flight || placedRadars.length === 0) {
      setStatus(null)
      lastStatusRef.current = null
      return
    }

    let raf = 0
    let lastUpdateMs = 0

    const update = () => {
      raf = requestAnimationFrame(update)
      const nowMs = performance.now()
      if (nowMs - lastUpdateMs < STATUS_REFRESH_INTERVAL_MS) return
      lastUpdateMs = nowMs

      const progress = flightProgressRef.current
      if (progress < 0) {
        if (lastStatusRef.current !== null) {
          lastStatusRef.current = null
          setStatus(null)
        }
        return
      }

      const n = flight.trajectory.length
      const idx = Math.min(n - 1, Math.max(0, Math.floor(progress * (n - 1))))
      const point = flight.trajectory[idx]

      let best: DetectionStatus | null = null
      for (let radarIndex = 0; radarIndex < placedRadars.length; radarIndex++) {
        const radar = placedRadars[radarIndex]
        const reason = classifyCoverage(point, radar.enu.eastM, radar.enu.northM, radar.config)
        if (reason === 'visible') {
          if (best === null || !best.visible) best = { visible: true, radarIndex, reason }
          continue
        }
        if (best === null) {
          best = { visible: false, radarIndex, reason }
        } else if (!best.visible && REASON_PRIORITY[reason] < REASON_PRIORITY[best.reason as Exclude<CoverageReason, 'visible'>]) {
          best = { visible: false, radarIndex, reason }
        }
      }

      const prev = lastStatusRef.current
      const changed =
        !prev || prev.visible !== best?.visible || prev.radarIndex !== best?.radarIndex || prev.reason !== best?.reason
      if (changed) {
        lastStatusRef.current = best
        setStatus(best)
      }
    }

    raf = requestAnimationFrame(update)
    return () => cancelAnimationFrame(raf)
  }, [placedRadars, flight, flightProgressRef])

  return status
}
