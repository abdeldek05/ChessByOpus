import { useEffect, useMemo, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import { buildRangeCircle } from '@/lib/geoCircle'
import { createLabeledMarker } from '@/lib/mapMarker'
import { computeDistanceKm, formatDistance } from '@/lib/computeDistanceKm'
import type { LaunchSite } from '@/types/simulation.types'
import type { RadarPosition, PlacedRadar } from '@/types/mission.types'

// Même style sombre gratuit, sans clé d'accès.
const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'
// Cercle de couverture + trait de liaison : même laiton que le pas de tir,
// rouge vif si hors portée (miroir --color-radar / --color-alert).
const COVERAGE_COLOR = '#94866e'
const ALERT_COLOR = '#e0584f'

interface UseMissionPlacementMapParams {
  /** Région (cadrage initial de la carte). */
  site: LaunchSite
  radars: PlacedRadar[]
  /** Radar en cours d'édition : le clic sur la carte le positionne. */
  activeRadarId: string
  onPlaceRadar: (id: string, position: RadarPosition) => void
}

export interface RadarRangeExcess {
  /** Id du radar concerné. */
  id: string
  /** Distance réelle radar → pas de tir (km, non arrondie). */
  distanceKm: number
  /** Portée du radar (km) — la limite exacte dépassée. */
  maxKm: number
}

interface UseMissionPlacementMapResult {
  containerRef: React.RefObject<HTMLDivElement | null>
  /** Radars posés au-delà de leur portée exacte, avec les distances mesurées. */
  radarsOutOfRange: RadarRangeExcess[]
}

function rangeLayerIds(radarId: string) {
  return {
    source: `range-${radarId}`,
    fill: `range-fill-${radarId}`,
    line: `range-line-${radarId}`,
  }
}

function linkLayerIds(radarId: string) {
  return {
    source: `link-${radarId}`,
    line: `link-line-${radarId}`,
    labelSource: `link-label-${radarId}`,
    label: `link-label-layer-${radarId}`,
  }
}

/**
 * Exécute `fn` une fois le style prêt à recevoir des sources/couches — en
 * retentant à chaque frame plutôt qu'en écoutant l'évènement `load` (qui ne se
 * déclenche qu'UNE fois pour toute la vie de la carte : un `setData()` sur
 * N'IMPORTE QUELLE source, y compris une autre que la nôtre, repasse
 * `isStyleLoaded()` à `false` le temps du re-tuilage — un second
 * `map.once('load', fn)` enregistré à ce moment-là ne se déclenchera alors
 * plus JAMAIS, laissant la couche silencieusement plus jamais mise à jour).
 */
function whenStyleReady(map: maplibregl.Map, fn: () => void) {
  if (map.isStyleLoaded()) fn()
  else requestAnimationFrame(() => whenStyleReady(map, fn))
}

/**
 * Carte 2D de placement de 1 à 2 radars, autour du PAS DE TIR fixe (= le site,
 * repère de référence). Chaque radar posé affiche son propre cercle de COUVERTURE
 * (rayon = sa portée, centré sur le radar). Le radar ACTIF (onglet sélectionné)
 * reçoit les clics ; les autres restent visibles en retrait. Une étiquette
 * distingue chaque point (« Pas de tir », « Radar 1 »…). L'azimut de la Mesange
 * ne se règle PAS ici — uniquement à l'étape Menaces (cf. useMissionThreatMap).
 */
export function useMissionPlacementMap({
  site,
  radars,
  activeRadarId,
  onPlaceRadar,
}: UseMissionPlacementMapParams): UseMissionPlacementMapResult {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const markersRef = useRef<Record<string, maplibregl.Marker>>({})
  const activeIdRef = useRef(activeRadarId)
  activeIdRef.current = activeRadarId
  const placeRef = useRef(onPlaceRadar)
  placeRef.current = onPlaceRadar

  // Radars posés dont la distance au pas de tir dépasse leur portée EXACTE
  // (haversine, sans marge — même règle que validateScenario, pour que
  // l'avertissement carte et le blocage final restent cohérents). On avertit
  // tôt, avec les distances mesurées, sans attendre l'écran de validation.
  const radarsOutOfRange = useMemo(() => {
    const out: RadarRangeExcess[] = []
    radars.forEach((radar) => {
      if (!radar.position) return
      const distanceKm = computeDistanceKm(site, radar.position)
      if (distanceKm > radar.config.rangeKm) {
        out.push({ id: radar.id, distanceKm, maxKm: radar.config.rangeKm })
      }
    })
    return out
  }, [site, radars])

  // --- Création de la carte (une fois par site) ---
  useEffect(() => {
    if (!containerRef.current) return

    // Cadrage initial : la région autour du site, dimensionné sur la plus grande
    // portée radar (juste pour donner une échelle de départ raisonnable).
    const maxRangeKm = Math.max(...radars.map((r) => r.config.rangeKm), 60)
    const bounds = new maplibregl.LngLatBounds()
    buildRangeCircle(site.longitude, site.latitude, maxRangeKm).forEach(([lng, lat]) =>
      bounds.extend([lng, lat]),
    )

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      bounds,
      fitBoundsOptions: { padding: 48 },
    })
    mapRef.current = map
    map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-left')

    // Pas de tir FIXE = le site (repère de référence pour poser les radars).
    createLabeledMarker(map, [site.longitude, site.latitude], 'launch-marker launch-marker--origin', 'Pas de tir')

    map.on('click', (event) => {
      placeRef.current(activeIdRef.current, { latitude: event.lngLat.lat, longitude: event.lngLat.lng })
    })

    // Resync taille (mise en page flexbox) — cf. note historique du bug marqueurs.
    const resizeObserver = new ResizeObserver(() => map.resize())
    resizeObserver.observe(containerRef.current)

    return () => {
      resizeObserver.disconnect()
      Object.values(markersRef.current).forEach((marker) => marker.remove())
      markersRef.current = {}
      map.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- carte créée une seule fois par site
  }, [site])

  // --- Cercle de couverture par radar : centré sur le radar une fois posé ---
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    radars.forEach((radar) => {
      const ids = rangeLayerIds(radar.id)
      // Cercle centré sur le radar posé (sa couverture) ; vide s'il n'est pas
      // encore placé.
      const circle = radar.position
        ? buildRangeCircle(radar.position.longitude, radar.position.latitude, radar.config.rangeKm)
        : []
      const geojson = {
        type: 'Feature' as const,
        geometry: { type: 'Polygon' as const, coordinates: circle.length ? [circle] : [] },
        properties: {},
      }
      const active = radar.id === activeRadarId
      // Radar hors de portée du pas de tir → cercle en rouge d'alerte.
      const outOfRange = radarsOutOfRange.some((excess) => excess.id === radar.id)
      const color = outOfRange ? ALERT_COLOR : COVERAGE_COLOR

      // Source déjà créée : mise à jour IMMÉDIATE, jamais conditionnée par
      // isStyleLoaded() (cf. whenStyleReady — ce n'est fiable qu'à la création).
      const source = map.getSource(ids.source) as maplibregl.GeoJSONSource | undefined
      if (source) {
        source.setData(geojson)
        map.setPaintProperty(ids.fill, 'fill-color', color)
        map.setPaintProperty(ids.line, 'line-color', color)
        map.setPaintProperty(ids.fill, 'fill-opacity', active ? 0.08 : 0.03)
        map.setPaintProperty(ids.line, 'line-opacity', active ? 0.6 : 0.3)
        map.setPaintProperty(ids.line, 'line-width', active ? 1.5 : 1)
        return
      }

      whenStyleReady(map, () => {
        if (map.getSource(ids.source)) return // créée entre-temps par une frame précédente
        map.addSource(ids.source, { type: 'geojson', data: geojson })
        map.addLayer({
          id: ids.fill,
          type: 'fill',
          source: ids.source,
          paint: { 'fill-color': color, 'fill-opacity': active ? 0.08 : 0.03 },
        })
        map.addLayer({
          id: ids.line,
          type: 'line',
          source: ids.source,
          paint: {
            'line-color': color,
            'line-width': active ? 1.5 : 1,
            'line-dasharray': [3, 3],
            'line-opacity': active ? 0.6 : 0.3,
          },
        })
      })
    })
  }, [radars, activeRadarId, radarsOutOfRange])

  // --- Trait radar → pas de tir : montre où chaque radar se situe par rapport
  //     au site, avec la distance en discret au milieu du trait. La source
  //     n'est créée qu'une fois le radar RÉELLEMENT positionné. ---
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    radars.forEach((radar) => {
      const ids = linkLayerIds(radar.id)

      if (!radar.position) {
        // Pas encore posé : retire le trait s'il existait (radar déplacé
        // "en attente"), rien à dessiner tant qu'il n'a pas de position.
        if (map.getLayer(ids.line)) map.removeLayer(ids.line)
        if (map.getLayer(ids.label)) map.removeLayer(ids.label)
        if (map.getSource(ids.source)) map.removeSource(ids.source)
        if (map.getSource(ids.labelSource)) map.removeSource(ids.labelSource)
        return
      }

      const from: [number, number] = [site.longitude, site.latitude]
      const to: [number, number] = [radar.position.longitude, radar.position.latitude]

      const lineGeojson = {
        type: 'Feature' as const,
        geometry: { type: 'LineString' as const, coordinates: [from, to] },
        properties: {},
      }
      const labelGeojson = {
        type: 'Feature' as const,
        geometry: { type: 'Point' as const, coordinates: [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2] },
        properties: { distance: formatDistance(computeDistanceKm(site, radar.position)) },
      }

      const active = radar.id === activeRadarId
      const outOfRange = radarsOutOfRange.some((excess) => excess.id === radar.id)
      const color = outOfRange ? ALERT_COLOR : COVERAGE_COLOR

      // Sources déjà créées : mise à jour IMMÉDIATE, jamais conditionnée par
      // isStyleLoaded() — cf. whenStyleReady, fiable seulement à la création.
      const lineSource = map.getSource(ids.source) as maplibregl.GeoJSONSource | undefined
      const labelSource = map.getSource(ids.labelSource) as maplibregl.GeoJSONSource | undefined
      if (lineSource && labelSource) {
        lineSource.setData(lineGeojson)
        labelSource.setData(labelGeojson)
        map.setPaintProperty(ids.line, 'line-color', color)
        map.setPaintProperty(ids.line, 'line-opacity', active ? 0.85 : 0.5)
        map.setPaintProperty(ids.label, 'text-color', color)
        map.setPaintProperty(ids.label, 'text-opacity', active ? 0.75 : 0.4)
        return
      }

      whenStyleReady(map, () => {
        if (map.getSource(ids.source)) return // créée entre-temps par une frame précédente
        map.addSource(ids.source, { type: 'geojson', data: lineGeojson })
        map.addSource(ids.labelSource, { type: 'geojson', data: labelGeojson })
        map.addLayer({
          id: ids.line,
          type: 'line',
          source: ids.source,
          layout: { 'line-cap': 'round' },
          paint: { 'line-color': color, 'line-width': 1.6, 'line-opacity': active ? 0.85 : 0.5 },
        })
        // Distance discrète, posée au milieu du trait — pas de fond, petite
        // taille, pour ne pas surcharger la carte.
        map.addLayer({
          id: ids.label,
          type: 'symbol',
          source: ids.labelSource,
          layout: {
            'text-field': ['get', 'distance'],
            'text-size': 10,
            'text-font': ['Open Sans Regular'],
            'text-offset': [0, -0.9],
          },
          paint: {
            'text-color': color,
            'text-opacity': active ? 0.75 : 0.4,
            'text-halo-color': '#101210',
            'text-halo-width': 1,
          },
        })
      })
    })
  }, [site, radars, activeRadarId, radarsOutOfRange])

  // --- Marqueurs radar : un par radar posé, étiqueté, piloté par l'état ---
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const seenIds = new Set(radars.map((r) => r.id))
    Object.keys(markersRef.current).forEach((id) => {
      if (!seenIds.has(id)) {
        markersRef.current[id].remove()
        delete markersRef.current[id]
      }
    })

    radars.forEach((radar, index) => {
      if (!radar.position) {
        markersRef.current[radar.id]?.remove()
        delete markersRef.current[radar.id]
        return
      }

      const lngLat: [number, number] = [radar.position.longitude, radar.position.latitude]
      const active = radar.id === activeRadarId
      const label = `Radar ${index + 1}`

      if (markersRef.current[radar.id]) {
        const marker = markersRef.current[radar.id]
        marker.setLngLat(lngLat)
        marker.getElement().classList.toggle('radar-marker--dim', !active)
      } else {
        markersRef.current[radar.id] = createLabeledMarker(
          map,
          lngLat,
          `radar-marker${active ? '' : ' radar-marker--dim'}`,
          label,
        )
      }
    })
  }, [radars, activeRadarId])

  return { containerRef, radarsOutOfRange }
}
