import { buildRangeCircle } from '@/lib/geoCircle'
import { buildSightCone } from '@/lib/geoSightCone'
import { createLabeledMarker } from '@/lib/mapMarker'
import type maplibregl from 'maplibre-gl'
import type { LaunchSite } from '@/types/simulation.types'
import type { PlacedRadar } from '@/types/mission.types'

// Config statique de la carte tactique de l'écran de lancement (couleurs HUD,
// paliers de distance). Style de fond sombre gratuit, sans clé d'accès.
export const TACTICAL_MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'

// Laiton du HUD. Couverture/liaison en laiton mat, cône de menace en laiton
// clair. Épuré : pas de faisceau tournant (radars statiques).
export const COVERAGE_COLOR = '#94866e'
export const THREAT_CONE_COLOR = '#cdbb98'
export const RING_COLOR = '#4a5340'

// Paliers de distance (km) tracés autour du pas de tir, épurés (peu de repères
// pour ne pas charger). Ceux qui dépassent la portée max sont ignorés.
export const RING_STEPS_KM = [25, 50, 100] as const

// Piste de la menace sur la carte (vue radar). TRACK_GHOST : portion NON encore
// détectée (angle mort) — discret, pointillé. TRACK_LOCKED : portion accrochée
// par un radar — alarme rouge, piste confirmée. TRACK_HEAD : point de position
// actuelle de la menace. (La distinction ghost/locked est branchée à l'étape 2.)
export const TRACK_COLOR = '#c8ccd0' // trace neutre (étape 1, avant détection)
export const TRACK_GHOST_COLOR = '#8790a0'
export const TRACK_LOCKED_COLOR = '#e0533a'
export const TRACK_HEAD_COLOR = '#ffffff'

/**
 * Dessine l'incrustation tactique statique : anneaux de distance, cône d'azimut
 * de la menace, couverture + liaison + marqueur de chaque radar posé, marqueur
 * du pas de tir, et les sources vides de la PISTE live (trace + tête) alimentées
 * ensuite par la boucle rAF du hook. Appelé une fois, au chargement du style.
 */
export function drawTacticalOverlay(
  map: maplibregl.Map,
  site: LaunchSite,
  placed: PlacedRadar[],
  azimuthDeg: number,
  maxRangeKm: number,
) {
  // Anneaux de distance, discrets, centrés sur le pas de tir.
  RING_STEPS_KM.filter((km) => km <= maxRangeKm).forEach((km) => {
    const ring = buildRangeCircle(site.longitude, site.latitude, km)
    map.addSource(`ring-${km}`, {
      type: 'geojson',
      data: { type: 'Feature', geometry: { type: 'LineString', coordinates: ring }, properties: {} },
    })
    map.addLayer({
      id: `ring-${km}`,
      type: 'line',
      source: `ring-${km}`,
      paint: { 'line-color': RING_COLOR, 'line-width': 1, 'line-opacity': 0.35 },
    })
  })

  // Cône d'azimut de la MENACE (depuis le pas de tir), trait fin.
  const cone = buildSightCone(site.longitude, site.latitude, azimuthDeg, maxRangeKm * 1.1)
  map.addSource('cone', {
    type: 'geojson',
    data: { type: 'Feature', geometry: { type: 'Polygon', coordinates: [cone] }, properties: {} },
  })
  map.addLayer({ id: 'cone-fill', type: 'fill', source: 'cone', paint: { 'fill-color': THREAT_CONE_COLOR, 'fill-opacity': 0.12 } })
  map.addLayer({
    id: 'cone-line',
    type: 'line',
    source: 'cone',
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: { 'line-color': THREAT_CONE_COLOR, 'line-width': 1.4, 'line-opacity': 0.8 },
  })

  // Par radar posé : couverture (trait fin) + liaison discrète + marqueur.
  placed.forEach((radar, index) => {
    const { longitude: rLng, latitude: rLat } = radar.position!
    const label = placed.length > 1 ? `Radar ${index + 1}` : 'Radar'

    const coverage = buildRangeCircle(rLng, rLat, radar.config.rangeKm)
    map.addSource(`cov-${radar.id}`, {
      type: 'geojson',
      data: { type: 'Feature', geometry: { type: 'Polygon', coordinates: [coverage] }, properties: {} },
    })
    map.addLayer({ id: `cov-fill-${radar.id}`, type: 'fill', source: `cov-${radar.id}`, paint: { 'fill-color': COVERAGE_COLOR, 'fill-opacity': 0.04 } })
    map.addLayer({
      id: `cov-line-${radar.id}`,
      type: 'line',
      source: `cov-${radar.id}`,
      paint: { 'line-color': COVERAGE_COLOR, 'line-width': 1, 'line-dasharray': [4, 4], 'line-opacity': 0.5 },
    })

    map.addSource(`link-${radar.id}`, {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: [[site.longitude, site.latitude], [rLng, rLat]] },
        properties: {},
      },
    })
    map.addLayer({
      id: `link-${radar.id}`,
      type: 'line',
      source: `link-${radar.id}`,
      layout: { 'line-cap': 'round' },
      paint: { 'line-color': COVERAGE_COLOR, 'line-width': 1.2, 'line-opacity': 0.6 },
    })

    createLabeledMarker(map, [rLng, rLat], 'radar-marker', label)
  })

  createLabeledMarker(map, [site.longitude, site.latitude], 'launch-marker launch-marker--origin', 'Launch pad')

  // PISTE de la menace (dessinée en direct par la boucle rAF du hook) : une
  // source de TRACE (LineString qui s'allonge) + une source de TÊTE (point de
  // position actuelle). Créées vides, alimentées pendant le vol.
  map.addSource('track', {
    type: 'geojson',
    data: { type: 'Feature', geometry: { type: 'LineString', coordinates: [] }, properties: {} },
  })
  map.addLayer({
    id: 'track',
    type: 'line',
    source: 'track',
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: { 'line-color': TRACK_COLOR, 'line-width': 2, 'line-opacity': 0.9 },
  })
  map.addSource('track-head', {
    type: 'geojson',
    data: { type: 'Feature', geometry: { type: 'Point', coordinates: [] }, properties: {} },
  })
  map.addLayer({
    id: 'track-head',
    type: 'circle',
    source: 'track-head',
    paint: {
      'circle-radius': 4,
      'circle-color': TRACK_COLOR,
      'circle-stroke-width': 1.5,
      'circle-stroke-color': '#0b0d10',
    },
  })
}
