import { useEffect, useRef, useState } from 'react'
import { useCoverageCut, type CoverageCut } from '@/hooks/useCoverageCut'
import { projectPointToCutAxis } from '@/lib/coverage/projectToCutAxis'
import type { FlightData } from '@/lib/api'
import type { LaunchSite } from '@/types/simulation.types'
import type { PlacedRadar } from '@/types/mission.types'

/** Position live du Roi dans le plan de coupe — `null` hors vol. */
export interface LiveCutHead {
  sM: number
  altM: number
}

interface UseLiveCoverageProfileResult {
  /** Modèle complet de la coupe (lobes + fenêtres de visibilité) — identique
   *  au débrief Analytics, réutilisé tel quel : la trajectoire complète du
   *  Roi est déjà connue dès que le backend a répondu, pas besoin d'un
   *  calcul "en cours de vol" différent. */
  cut: CoverageCut
  /** Position live projetée sur l'axe de coupe, throttlée (voir le hook). */
  head: LiveCutHead | null
}

// Cadence de rafraîchissement de la tête live (Hz) — même throttle que le
// bandeau de statut (useDetectionStatus) : un profil SVG n'a pas besoin de
// re-render à 60fps pour paraître fluide.
const HEAD_REFRESH_HZ = 12
const HEAD_REFRESH_INTERVAL_MS = 1000 / HEAD_REFRESH_HZ

/**
 * Modèle de la coupe de couverture verticale (VCD) EN VOL — voir
 * LaunchVerticalProfile.tsx (rendu SVG, onglet PROFIL de la carte tactique).
 * Le lobe/les fenêtres de visibilité sont statiques pour tout le vol (calculés
 * une fois par useCoverageCut, mémoïsé) ; seule la position de tête suit la
 * progression live (flightProgressRef) via une boucle rAF dédiée, throttlée —
 * pas de re-render à 60fps pour un texte/point qui n'a pas besoin de cette
 * fréquence.
 */
export function useLiveCoverageProfile(
  flight: FlightData,
  site: LaunchSite,
  radars: PlacedRadar[],
  azimuthDeg: number,
  flightProgressRef: React.RefObject<number>,
  active: boolean,
): UseLiveCoverageProfileResult {
  const cut = useCoverageCut({ flight, site, radars, azimuthDeg })
  const [head, setHead] = useState<LiveCutHead | null>(null)
  const lastHeadRef = useRef<LiveCutHead | null>(null)

  useEffect(() => {
    if (!active) {
      setHead(null)
      lastHeadRef.current = null
      return
    }

    let raf = 0
    let lastUpdateMs = 0

    const update = () => {
      raf = requestAnimationFrame(update)
      const nowMs = performance.now()
      if (nowMs - lastUpdateMs < HEAD_REFRESH_INTERVAL_MS) return
      lastUpdateMs = nowMs

      const progress = flightProgressRef.current
      if (progress < 0) {
        if (lastHeadRef.current !== null) {
          lastHeadRef.current = null
          setHead(null)
        }
        return
      }

      const n = flight.trajectory.length
      const idx = Math.min(n - 1, Math.max(0, Math.floor(progress * (n - 1))))
      const point = flight.trajectory[idx]
      const projection = projectPointToCutAxis(point.x, point.y, azimuthDeg)
      const next: LiveCutHead = { sM: projection.sM, altM: point.z }

      const prev = lastHeadRef.current
      if (!prev || prev.sM !== next.sM || prev.altM !== next.altM) {
        lastHeadRef.current = next
        setHead(next)
      }
    }

    raf = requestAnimationFrame(update)
    return () => cancelAnimationFrame(raf)
  }, [flight, azimuthDeg, flightProgressRef, active])

  return { cut, head }
}
