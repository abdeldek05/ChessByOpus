import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import { buildRangeCircle } from '@/lib/geoCircle'
import type { LaunchSite } from '@/types/simulation.types'
import type { RadarPosition } from '@/types/mission.types'

// Même style sombre gratuit, sans clé d'accès.
const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'

interface UseMissionPlacementMapParams {
  site: LaunchSite
  radarPosition: RadarPosition | null
  rangeKm: number
  onPlaceRadar: (position: RadarPosition) => void
}

interface UseMissionPlacementMapResult {
  containerRef: React.RefObject<HTMLDivElement | null>
}

/**
 * Carte 2D de placement du radar. Points clés :
 * - le marqueur radar est PILOTÉ PAR L'ÉTAT `radarPosition` (pas seulement par
 *   le clic) → état = rendu, cohérent et persistant au remontage ;
 * - la vue est cadrée sur la portée du radar (on voit le pas de tir + tout son
 *   rayon d'action), pas un zoom fixe arbitraire ;
 * - cercle de portée + trait pas-de-tir→radar + échelle pour juger la distance.
 */
export function useMissionPlacementMap({
  site,
  radarPosition,
  rangeKm,
  onPlaceRadar,
}: UseMissionPlacementMapParams): UseMissionPlacementMapResult {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const radarMarkerRef = useRef<maplibregl.Marker | null>(null)
  const placeRef = useRef(onPlaceRadar)
  placeRef.current = onPlaceRadar

  // --- Création de la carte (une fois par site, cadrée sur la portée) ---
  useEffect(() => {
    if (!containerRef.current) return

    const bounds = new maplibregl.LngLatBounds()
    const circle = buildRangeCircle(site.longitude, site.latitude, rangeKm)
    circle.forEach(([lng, lat]) => bounds.extend([lng, lat]))

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      bounds,
      fitBoundsOptions: { padding: 48 },
    })
    mapRef.current = map
    map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-left')

    const launchElement = document.createElement('div')
    launchElement.className = 'launch-marker'
    launchElement.setAttribute('aria-label', 'Mesange — pas de tir')
    new maplibregl.Marker({ element: launchElement })
      .setLngLat([site.longitude, site.latitude])
      .addTo(map)

    map.on('load', () => {
      // Cercle de portée du radar autour du pas de tir.
      map.addSource('range', {
        type: 'geojson',
        data: { type: 'Feature', geometry: { type: 'Polygon', coordinates: [circle] }, properties: {} },
      })
      map.addLayer({
        id: 'range-fill',
        type: 'fill',
        source: 'range',
        paint: { 'fill-color': '#94866e', 'fill-opacity': 0.08 },
      })
      map.addLayer({
        id: 'range-line',
        type: 'line',
        source: 'range',
        paint: { 'line-color': '#94866e', 'line-width': 1.5, 'line-dasharray': [3, 3], 'line-opacity': 0.6 },
      })

      // Trait pas-de-tir → radar (vide au départ).
      map.addSource('link', {
        type: 'geojson',
        data: { type: 'Feature', geometry: { type: 'LineString', coordinates: [] }, properties: {} },
      })
      map.addLayer({
        id: 'link-line',
        type: 'line',
        source: 'link',
        paint: { 'line-color': '#cdbb98', 'line-width': 2 },
      })
    })

    map.on('click', (event) => {
      placeRef.current({ latitude: event.lngLat.lat, longitude: event.lngLat.lng })
    })

    return () => {
      radarMarkerRef.current?.remove()
      radarMarkerRef.current = null
      map.remove()
      mapRef.current = null
    }
  }, [site, rangeKm])

  // --- Synchronise marqueur + trait à partir de L'ÉTAT `radarPosition` ---
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    if (!radarPosition) {
      radarMarkerRef.current?.remove()
      radarMarkerRef.current = null
      return
    }

    const lngLat: [number, number] = [radarPosition.longitude, radarPosition.latitude]

    if (radarMarkerRef.current) {
      radarMarkerRef.current.setLngLat(lngLat)
    } else {
      const element = document.createElement('div')
      element.className = 'radar-marker'
      element.setAttribute('aria-label', 'Radar')
      radarMarkerRef.current = new maplibregl.Marker({ element }).setLngLat(lngLat).addTo(map)
    }

    const updateLink = () => {
      const source = map.getSource('link') as maplibregl.GeoJSONSource | undefined
      source?.setData({
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: [[site.longitude, site.latitude], lngLat] },
        properties: {},
      })
    }
    if (map.isStyleLoaded()) updateLink()
    else map.once('load', updateLink)
  }, [radarPosition, site])

  return { containerRef }
}
