import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import type { LaunchSite } from '@/types/simulation.types'
import type { RadarPosition } from '@/types/mission.types'

// Même style gratuit, sans clé d'accès, que la carte de sélection de site.
const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'
const PLACEMENT_ZOOM = 13

interface UseMissionPlacementMapParams {
  site: LaunchSite
  onPlaceRadar: (position: RadarPosition) => void
}

interface UseMissionPlacementMapResult {
  containerRef: React.RefObject<HTMLDivElement | null>
}

/**
 * Carte 2D (vue du dessus, pas de relief ni d'inclinaison — la précision du
 * placement prime sur l'esthétique) centrée sur la base de lancement. Le
 * point Mésange est fixe ; un clic ailleurs sur la carte place ou déplace le
 * marqueur radar.
 */
export function useMissionPlacementMap({
  site,
  onPlaceRadar,
}: UseMissionPlacementMapParams): UseMissionPlacementMapResult {
  const containerRef = useRef<HTMLDivElement>(null)
  const radarMarkerRef = useRef<maplibregl.Marker | null>(null)
  const placeRef = useRef(onPlaceRadar)
  placeRef.current = onPlaceRadar

  useEffect(() => {
    if (!containerRef.current) return

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: [site.longitude, site.latitude],
      zoom: PLACEMENT_ZOOM,
      pitch: 0,
      bearing: 0,
    })

    const launchElement = document.createElement('div')
    launchElement.className = 'launch-marker'
    launchElement.setAttribute('aria-label', 'Mésange — point de lancement fixe')
    new maplibregl.Marker({ element: launchElement })
      .setLngLat([site.longitude, site.latitude])
      .addTo(map)

    map.on('click', (event) => {
      const { lng, lat } = event.lngLat
      placeRef.current({ latitude: lat, longitude: lng })

      if (radarMarkerRef.current) {
        radarMarkerRef.current.setLngLat([lng, lat])
        return
      }

      const radarElement = document.createElement('div')
      radarElement.className = 'radar-marker'
      radarElement.setAttribute('aria-label', 'Radar')
      radarMarkerRef.current = new maplibregl.Marker({ element: radarElement })
        .setLngLat([lng, lat])
        .addTo(map)
    })

    return () => {
      radarMarkerRef.current?.remove()
      radarMarkerRef.current = null
      map.remove()
    }
  }, [site])

  return { containerRef }
}
