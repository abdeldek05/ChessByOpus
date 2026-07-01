import type { LaunchSite } from '@/types/simulation.types'
import type { RadarPosition } from '@/types/mission.types'

const EARTH_RADIUS_KM = 6371

/** Distance réelle (haversine) entre le site de lancement et le radar, en km. */
export function computeDistanceKm(site: LaunchSite, radarPosition: RadarPosition): number {
  const dLat = ((radarPosition.latitude - site.latitude) * Math.PI) / 180
  const dLng = ((radarPosition.longitude - site.longitude) * Math.PI) / 180
  const lat1 = (site.latitude * Math.PI) / 180
  const lat2 = (radarPosition.latitude * Math.PI) / 180

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a))
}

/** Formatage court : « 12,4 km » ou « 840 m » sous le kilomètre. */
export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) return `${Math.round(distanceKm * 1000)} m`
  return `${distanceKm.toFixed(1).replace('.', ',')} km`
}
