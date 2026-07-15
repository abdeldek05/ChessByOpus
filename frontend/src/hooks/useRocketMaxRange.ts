import { useEffect, useState } from 'react'
import { estimateMaxRangeQuick } from '@/lib/api'
import type { LaunchSite } from '@/types/simulation.types'

interface UseRocketMaxRangeResult {
  /** Distance max théorique (km), toutes directions de tir confondues ; null tant que non reçue. */
  maxRangeKm: number | null
  loading: boolean
}

/**
 * Récupère, une fois par site, le majorant de distance max atteignable par la
 * Mesange sous la météo réelle du site (vent GFS) — affiché comme cercle de
 * référence sur la carte de placement du radar, avant que l'azimut/élévation
 * de tir ne soient choisis à l'étape suivante.
 */
export function useRocketMaxRange(site: LaunchSite): UseRocketMaxRangeResult {
  const [maxRangeKm, setMaxRangeKm] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setMaxRangeKm(null)

    estimateMaxRangeQuick({
      latitude: site.latitude,
      longitude: site.longitude,
      siteElevationM: site.elevation,
    })
      .then((res) => {
        if (cancelled) return
        setMaxRangeKm(res.status === 'ready' && res.maxRangeM ? res.maxRangeM / 1000 : null)
      })
      .catch(() => {
        if (!cancelled) setMaxRangeKm(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [site])

  return { maxRangeKm, loading }
}
