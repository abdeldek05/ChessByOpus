import { buildRangeCircle } from '@/lib/geoCircle'
import { createLabeledMarker } from '@/lib/mapMarker'
import { SWEEP_SEARCH_COLOR } from '@/constants/tacticalRadar'
import { TACTICAL_MAP_STYLE, COVERAGE_COLOR, COVERAGE_DASHARRAY, ROLE_COLOR } from '@/constants/tacticalMapTheme'
import type maplibregl from 'maplibre-gl'
import type { LaunchSite } from '@/types/simulation.types'
import type { PlacedRadar } from '@/types/mission.types'

// Style + couleurs partagés avec les autres cartes radar — voir tacticalMapTheme.ts.
export { TACTICAL_MAP_STYLE, COVERAGE_COLOR }

// Piste de la menace sur la carte (vue radar) : le Roi, seule menace tracée
// ici (voir useLaunchTacticalMap) — teinte alignée sur ROLE_COLOR.KING, le
// même rouge que son cône d'azimut sur la carte Menace (fil de couleur par
// rôle qui continue jusqu'au vol, pas juste sur l'étape de placement).
// TRACK_GHOST : portion NON encore détectée (angle mort) — discret, pointillé.
// TRACK_LOCKED : portion accrochée par un radar — alarme confirmée, même
// rouge que ALERT_COLOR partout ailleurs dans l'appli (pas une variante
// proche qui divergeait silencieusement — voir tacticalMapTheme.ts).
export const TRACK_COLOR = ROLE_COLOR.KING
export const TRACK_GHOST_COLOR = '#8790a0'
export const TRACK_LOCKED_COLOR = ROLE_COLOR.KING
export const TRACK_HEAD_COLOR = '#ffffff'

/**
 * Dessine l'incrustation tactique statique : couverture + liaison + marqueur
 * de chaque radar posé, marqueur du pas de tir, les sources vides du FAISCEAU
 * rotatif par radar (traîne balayée, alimentée ensuite par la boucle rAF du
 * hook — voir buildSweepTrailFeatures), et les sources vides de la PISTE live
 * (trace + tête). Épurée : pas d'anneaux de distance ni de cône d'azimut de
 * menace (redondant avec la piste de vol live). Appelé une fois, au
 * chargement du style.
 */
export function drawTacticalOverlay(map: maplibregl.Map, site: LaunchSite, placed: PlacedRadar[]) {
  // Par radar posé : couverture (trait fin) + liaison discrète + marqueur +
  // source vide du faisceau rotatif (secteurs de traîne, voir le hook).
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
      paint: { 'line-color': COVERAGE_COLOR, 'line-width': 1, 'line-dasharray': COVERAGE_DASHARRAY, 'line-opacity': 0.5 },
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

    // Faisceau rotatif : FeatureCollection vide, remplie chaque frame par la
    // boucle rAF du hook avec la traîne balayée courante (fade par feature).
    map.addSource(`sweep-${radar.id}`, {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    })
    map.addLayer({
      id: `sweep-${radar.id}`,
      type: 'fill',
      source: `sweep-${radar.id}`,
      // Faisceau de tête net (fade=1 → 0.55) puis traîne qui s'efface vite
      // (fade² côté buildSweepTrailFeatures) : lecture immédiate du balayage.
      paint: {
        'fill-color': SWEEP_SEARCH_COLOR,
        'fill-opacity': ['*', ['get', 'fade'], 0.55],
      },
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
