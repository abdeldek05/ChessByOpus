import type { LngLatBoundsLike } from 'maplibre-gl'
import type { LaunchSite } from '@/types/simulation.types'

const MOBILE_BREAKPOINT_PX = 640
const MOBILE_PADDING_PX = 28
const DESKTOP_PADDING_PX = 80

/** Emprise (bounding box) englobant tous les sites — recalculée à partir des données. */
export function computeSiteBounds(sites: LaunchSite[]): LngLatBoundsLike {
  const longitudes = sites.map((site) => site.longitude)
  const latitudes = sites.map((site) => site.latitude)
  return [
    [Math.min(...longitudes), Math.min(...latitudes)],
    [Math.max(...longitudes), Math.max(...latitudes)],
  ]
}

/**
 * Marge autour de l'emprise : plus petite sur mobile pour éviter un cadrage
 * trop dézoomé (beaucoup de vide autour des points) sur un écran étroit.
 */
export function getResponsiveMapPadding(containerWidthPx: number): number {
  return containerWidthPx < MOBILE_BREAKPOINT_PX ? MOBILE_PADDING_PX : DESKTOP_PADDING_PX
}
