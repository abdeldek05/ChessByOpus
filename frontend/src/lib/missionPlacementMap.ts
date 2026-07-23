import maplibregl from 'maplibre-gl'
import { buildRangeCircle } from '@/lib/geoCircle'
import { computeDistanceKm, formatDistance } from '@/lib/computeDistanceKm'
import {
  TACTICAL_MAP_STYLE,
  COVERAGE_COLOR,
  ALERT_COLOR,
  ACCENT_BRIGHT_COLOR,
  COVERAGE_DASHARRAY,
} from '@/constants/tacticalMapTheme'
import type { LaunchSite } from '@/types/simulation.types'
import type { PlacedRadar } from '@/types/mission.types'

// Style + couleurs partagés avec les autres cartes radar — voir tacticalMapTheme.ts.
export const PLACEMENT_MAP_STYLE = TACTICAL_MAP_STYLE
export { COVERAGE_COLOR, ALERT_COLOR }
// Cercle de portée max de la Mesange : REPÈRE PRINCIPAL de cette étape — c'est
// lui qui délimite où un radar peut être posé, donc net et bien visible.
export const ROCKET_RANGE_COLOR = ACCENT_BRIGHT_COLOR
export const ROCKET_RANGE_SOURCE_ID = 'rocket-max-range'

export function rangeLayerIds(radarId: string) {
  return {
    source: `range-${radarId}`,
    fill: `range-fill-${radarId}`,
    line: `range-line-${radarId}`,
  }
}

export function linkLayerIds(radarId: string) {
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
 * N'IMPORTE QUELLE source repasse `isStyleLoaded()` à `false` le temps du
 * re-tuilage — un second `map.once('load', fn)` enregistré à ce moment-là ne se
 * déclenchera alors plus JAMAIS, laissant la couche silencieusement plus jamais
 * mise à jour).
 */
export function whenStyleReady(map: maplibregl.Map, fn: () => void) {
  if (map.isStyleLoaded()) fn()
  else requestAnimationFrame(() => whenStyleReady(map, fn))
}

/** Cercle de couverture d'un radar (centré sur le radar posé, rouge si hors portée). */
export function applyCoverageLayer(
  map: maplibregl.Map,
  radar: PlacedRadar,
  active: boolean,
  outOfRange: boolean,
) {
  const ids = rangeLayerIds(radar.id)
  const circle = radar.position
    ? buildRangeCircle(radar.position.longitude, radar.position.latitude, radar.config.rangeKm)
    : []
  const geojson = {
    type: 'Feature' as const,
    geometry: { type: 'Polygon' as const, coordinates: circle.length ? [circle] : [] },
    properties: {},
  }
  const color = outOfRange ? ALERT_COLOR : COVERAGE_COLOR

  // Source déjà créée : mise à jour IMMÉDIATE, jamais conditionnée par
  // isStyleLoaded() (cf. whenStyleReady — fiable seulement à la création).
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
        'line-dasharray': COVERAGE_DASHARRAY,
        'line-opacity': active ? 0.6 : 0.3,
      },
    })
  })
}

export function rocketRangeLayerIds() {
  return { fill: `${ROCKET_RANGE_SOURCE_ID}-fill`, line: `${ROCKET_RANGE_SOURCE_ID}-line` }
}

/** Cercle de portée max de la Mesange, centré sur le pas de tir (toutes
 *  directions) : zone AUTORISÉE pour poser un radar — trait net + léger
 *  remplissage, repère principal de l'étape de placement. */
export function applyRocketRangeLayer(map: maplibregl.Map, site: LaunchSite, rocketMaxRangeKm: number | null) {
  const ids = rocketRangeLayerIds()
  const circle = rocketMaxRangeKm ? buildRangeCircle(site.longitude, site.latitude, rocketMaxRangeKm) : []
  const geojson = {
    type: 'Feature' as const,
    geometry: { type: 'Polygon' as const, coordinates: circle.length ? [circle] : [] },
    properties: {},
  }

  const source = map.getSource(ROCKET_RANGE_SOURCE_ID) as maplibregl.GeoJSONSource | undefined
  if (source) {
    source.setData(geojson)
    return
  }

  whenStyleReady(map, () => {
    if (map.getSource(ROCKET_RANGE_SOURCE_ID)) return
    map.addSource(ROCKET_RANGE_SOURCE_ID, { type: 'geojson', data: geojson })
    map.addLayer({
      id: ids.fill,
      type: 'fill',
      source: ROCKET_RANGE_SOURCE_ID,
      paint: { 'fill-color': ROCKET_RANGE_COLOR, 'fill-opacity': 0.05 },
    })
    map.addLayer({
      id: ids.line,
      type: 'line',
      source: ROCKET_RANGE_SOURCE_ID,
      paint: { 'line-color': ROCKET_RANGE_COLOR, 'line-width': 1.5, 'line-opacity': 0.75 },
    })
  })
}

/** Trait radar → pas de tir + distance discrète au milieu (retiré si non posé). */
export function applyLinkLayer(
  map: maplibregl.Map,
  site: LaunchSite,
  radar: PlacedRadar,
  active: boolean,
  outOfRange: boolean,
) {
  const ids = linkLayerIds(radar.id)

  if (!radar.position) {
    // Pas encore posé : retire le trait s'il existait, rien à dessiner.
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

  const color = outOfRange ? ALERT_COLOR : COVERAGE_COLOR

  // Sources déjà créées : mise à jour IMMÉDIATE (cf. whenStyleReady).
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
    // Distance discrète, posée au milieu du trait — pas de fond, petite taille.
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
}
