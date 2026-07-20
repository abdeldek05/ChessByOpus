import maplibregl from 'maplibre-gl'
import { buildRangeCircle } from '@/lib/geoCircle'
import { buildSightCone } from '@/lib/geoSightCone'
import { destinationPoint } from '@/lib/geoDestination'
import { bearingBetween } from '@/lib/geoBearing'
import type { LaunchSite } from '@/types/simulation.types'
import type { PlacedRadar } from '@/types/mission.types'

// Config statique de la carte 3D de définition de la menace (étape « Menaces »).
export const THREAT_MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'
// Cône de menace : tons laiton du HUD, jamais de rouge.
export const CONE_COLOR = '#94866e'
export const CONE_CORE_COLOR = '#cdbb98'
// Cercles de couverture radar : même laiton, mais en RETRAIT (contexte).
export const COVERAGE_COLOR = '#94866e'
// Vue 3D : inclinaison de la caméra carte (perspective terrain).
export const MAP_PITCH_DEG = 55
// Couches saisissables pour orienter le cône au glisser.
export const DRAG_LAYERS = ['threat-impact-hit', 'threat-cone-fill'] as const

/** Cap du pas de tir vers un point, au dixième de degré (précis mais stable). */
export function bearingToward(site: LaunchSite, lngLat: maplibregl.LngLat): number {
  const bearing = bearingBetween(site, { latitude: lngLat.lat, longitude: lngLat.lng })
  return Math.round(bearing * 10) / 10
}

/**
 * Cercles de couverture des radars posés (contexte, en retrait) : aident à
 * choisir l'azimut sans voler la vedette au cône de visée. Idempotent (skip si
 * la source existe déjà).
 */
export function drawRadarCoverage(map: maplibregl.Map, radars: PlacedRadar[]) {
  radars.forEach((radar) => {
    if (!radar.position) return
    const sourceId = `coverage-${radar.id}`
    if (map.getSource(sourceId)) return
    const circle = buildRangeCircle(radar.position.longitude, radar.position.latitude, radar.config.rangeKm)
    map.addSource(sourceId, {
      type: 'geojson',
      data: { type: 'Feature', geometry: { type: 'Polygon', coordinates: [circle] }, properties: {} },
    })
    map.addLayer({
      id: `coverage-fill-${radar.id}`,
      type: 'fill',
      source: sourceId,
      paint: { 'fill-color': COVERAGE_COLOR, 'fill-opacity': 0.03 },
    })
    map.addLayer({
      id: `coverage-line-${radar.id}`,
      type: 'line',
      source: sourceId,
      paint: { 'line-color': COVERAGE_COLOR, 'line-width': 1, 'line-dasharray': [3, 3], 'line-opacity': 0.3 },
    })
  })
}

/**
 * Cône de menace fin et arrondi + pastille d'impact, orienté par l'azimut. Met à
 * jour les sources si les couches existent déjà, sinon les crée. Longueur du cône
 * purement présentationnelle (pas d'estimation balistique).
 */
export function drawThreatCone(map: maplibregl.Map, site: LaunchSite, radars: PlacedRadar[], azimuthDeg: number) {
  const maxRangeKm = Math.max(...radars.map((r) => r.config.rangeKm), 60)
  const displayRangeKm = maxRangeKm * 1.2
  const cone = buildSightCone(site.longitude, site.latitude, azimuthDeg, displayRangeKm)
  const tip = destinationPoint(site.longitude, site.latitude, azimuthDeg, displayRangeKm)
  const coneGeojson = {
    type: 'Feature' as const,
    geometry: { type: 'Polygon' as const, coordinates: [cone] },
    properties: {},
  }
  const impactGeojson = {
    type: 'Feature' as const,
    geometry: { type: 'Point' as const, coordinates: tip },
    properties: {},
  }

  const coneSource = map.getSource('threat-cone') as maplibregl.GeoJSONSource | undefined
  const impactSource = map.getSource('threat-impact') as maplibregl.GeoJSONSource | undefined
  if (coneSource && impactSource) {
    coneSource.setData(coneGeojson)
    impactSource.setData(impactGeojson)
    return
  }

  map.addSource('threat-cone', { type: 'geojson', data: coneGeojson })
  map.addSource('threat-impact', { type: 'geojson', data: impactGeojson })
  const round = { 'line-cap': 'round' as const, 'line-join': 'round' as const }
  map.addLayer({
    id: 'threat-cone-fill',
    type: 'fill',
    source: 'threat-cone',
    paint: { 'fill-color': CONE_COLOR, 'fill-opacity': 0.1 },
  })
  map.addLayer({
    id: 'threat-cone-halo',
    type: 'line',
    source: 'threat-cone',
    layout: round,
    paint: { 'line-color': CONE_CORE_COLOR, 'line-width': 6, 'line-blur': 5, 'line-opacity': 0.35 },
  })
  map.addLayer({
    id: 'threat-cone-line',
    type: 'line',
    source: 'threat-cone',
    layout: round,
    paint: { 'line-color': CONE_CORE_COLOR, 'line-width': 1.5, 'line-opacity': 0.85 },
  })
  map.addLayer({
    id: 'threat-impact-halo',
    type: 'circle',
    source: 'threat-impact',
    paint: { 'circle-radius': 16, 'circle-color': CONE_COLOR, 'circle-blur': 1, 'circle-opacity': 0.28 },
  })
  map.addLayer({
    id: 'threat-impact-core',
    type: 'circle',
    source: 'threat-impact',
    paint: { 'circle-radius': 4, 'circle-color': CONE_CORE_COLOR, 'circle-opacity': 0.95 },
  })
  // Zone de saisie invisible, plus large que la pastille : facile à attraper.
  map.addLayer({
    id: 'threat-impact-hit',
    type: 'circle',
    source: 'threat-impact',
    paint: { 'circle-radius': 26, 'circle-color': CONE_CORE_COLOR, 'circle-opacity': 0.01 },
  })
}
