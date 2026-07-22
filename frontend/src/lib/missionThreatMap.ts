import maplibregl from 'maplibre-gl'
import { buildRangeCircle } from '@/lib/geoCircle'
import { buildSightCone } from '@/lib/geoSightCone'
import { destinationPoint } from '@/lib/geoDestination'
import { bearingBetween } from '@/lib/geoBearing'
import type { LaunchSite } from '@/types/simulation.types'
import type { PlacedRadar, MesangeLaunchConfig, MesangeRole } from '@/types/mission.types'

// Config statique de la carte 3D de définition de la menace (étape « Menaces »).
export const THREAT_MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'
// Cercles de couverture radar : laiton, en RETRAIT (contexte).
export const COVERAGE_COLOR = '#94866e'
// Vue 3D : inclinaison de la caméra carte (perspective terrain).
export const MAP_PITCH_DEG = 55

/** Teinte de cône par rôle CHESS — mêmes hex que --color-role-* (styles/index.css),
 *  dupliqués ici car MapLibre paint properties ne lisent pas les custom properties CSS. */
const ROLE_CONE_COLOR: Record<MesangeRole, string> = {
  KING: '#e0584f',
  QUEEN: '#cdbb98',
  PAWN: '#8a8d86',
}

// Préfixe des couches saisissables ("hit zone" + remplissage du cône) : sert à
// retrouver l'ID de Mesange depuis le nom de couche cliqué par MapLibre (voir
// `mesangeIdFromLayer`), pour que N'IMPORTE QUEL cône de la flotte se saisisse
// et s'oriente au glisser — pas seulement celui actuellement sélectionné (le
// client doit pouvoir attraper la pièce qu'il veut directement, sans détour
// par un sélecteur ailleurs sur l'écran).
const IMPACT_HIT_PREFIX = 'threat-impact-hit-'
const CONE_FILL_PREFIX = 'threat-cone-fill-'

// Trait de saisie le long de TOUT le cône (site → point d'impact), en plus de
// la pastille d'impact : le corps du cône lui-même (polygone à ±4°
// d'ouverture, voir geoSightCone.ts) est trop fin près du site pour être
// cliqué de façon fiable — cette ligne invisible mais large en PIXELS (donc
// indépendante du zoom) couvre toute sa longueur.
const AXIS_HIT_PREFIX = 'threat-axis-hit-'

function coneLayerIds(mesangeId: string) {
  return {
    source: `threat-cone-${mesangeId}`,
    axisSource: `threat-axis-${mesangeId}`,
    impactSource: `threat-impact-${mesangeId}`,
    fill: `${CONE_FILL_PREFIX}${mesangeId}`,
    halo: `threat-cone-halo-${mesangeId}`,
    line: `threat-cone-line-${mesangeId}`,
    axisHit: `${AXIS_HIT_PREFIX}${mesangeId}`,
    impactHalo: `threat-impact-halo-${mesangeId}`,
    impactCore: `threat-impact-core-${mesangeId}`,
    impactHit: `${IMPACT_HIT_PREFIX}${mesangeId}`,
  }
}

/** Couches saisissables de TOUTE la flotte (hit zone du point d'impact + trait
 *  de saisie sur toute la longueur + remplissage du cône, par Mesange id) —
 *  chaque cône est attrapable indépendamment de la sélection, sur toute sa
 *  longueur (pas seulement à son extrémité). */
export function allDragLayers(mesangeIds: string[]): string[] {
  return mesangeIds.flatMap((id) => {
    const ids = coneLayerIds(id)
    return [ids.impactHit, ids.axisHit, ids.fill]
  })
}

/** Retrouve quelle Mesange possède la couche cliquée (attraper un cône
 *  quelconque le sélectionne AUSSI, pas seulement le fait pivoter). */
export function mesangeIdFromLayer(layerId: string): string | null {
  if (layerId.startsWith(IMPACT_HIT_PREFIX)) return layerId.slice(IMPACT_HIT_PREFIX.length)
  if (layerId.startsWith(AXIS_HIT_PREFIX)) return layerId.slice(AXIS_HIT_PREFIX.length)
  if (layerId.startsWith(CONE_FILL_PREFIX)) return layerId.slice(CONE_FILL_PREFIX.length)
  return null
}

// Marge d'affichage des cônes au-delà de la portée radar max : sans elle, le
// point d'impact (donc sa zone de saisie généreuse, voir impactHit) tombe
// PILE sur le bord du cadrage — la moindre marge d'arrondi le pousse hors
// champ. Exportée pour que le cadrage INITIAL de la carte (bounds, voir
// useMissionThreatMap) utilise EXACTEMENT le même rayon que les cônes
// eux-mêmes : sans ça, un cône pouvait pointer hors du viewport visible par
// défaut, avec sa seule zone de saisie fiable (26px) hors écran — impossible
// à saisir tant qu'on n'avait pas dézoomé/déplacé la carte manuellement.
const DISPLAY_RANGE_FACTOR = 1.2

/** Longueur d'affichage des cônes (km) : portée radar max (au moins 60 km),
 *  majorée pour que le point d'impact ne tombe jamais pile sur le bord. */
export function computeDisplayRangeKm(radars: PlacedRadar[]): number {
  const maxRangeKm = Math.max(...radars.map((r) => r.config.rangeKm), 60)
  return maxRangeKm * DISPLAY_RANGE_FACTOR
}

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
 * Un cône de menace (fin, arrondi) + pastille d'impact pour UNE Mesange, teinté
 * par son rôle CHESS. La sélectionnée est VIVE, les autres ATTÉNUÉES (en
 * sourdine, pour rester lisibles sans voler la vedette). Met à jour les
 * sources si les couches existent déjà, sinon les crée. Longueur du cône
 * purement présentationnelle (pas d'estimation balistique).
 */
function drawOneThreatCone(
  map: maplibregl.Map,
  site: LaunchSite,
  radars: PlacedRadar[],
  config: MesangeLaunchConfig,
  selected: boolean,
) {
  const ids = coneLayerIds(config.id)
  const displayRangeKm = computeDisplayRangeKm(radars)
  const cone = buildSightCone(site.longitude, site.latitude, config.azimuthDeg, displayRangeKm)
  const tip = destinationPoint(site.longitude, site.latitude, config.azimuthDeg, displayRangeKm)
  const coneGeojson = {
    type: 'Feature' as const,
    geometry: { type: 'Polygon' as const, coordinates: [cone] },
    properties: {},
  }
  const axisGeojson = {
    type: 'Feature' as const,
    geometry: { type: 'LineString' as const, coordinates: [[site.longitude, site.latitude], tip] },
    properties: {},
  }
  const impactGeojson = {
    type: 'Feature' as const,
    geometry: { type: 'Point' as const, coordinates: tip },
    properties: {},
  }

  const coneColor = ROLE_CONE_COLOR[config.role]
  const fillOpacity = selected ? 0.12 : 0.04
  const lineOpacity = selected ? 0.9 : 0.35
  const haloOpacity = selected ? 0.4 : 0.12

  const coneSource = map.getSource(ids.source) as maplibregl.GeoJSONSource | undefined
  const axisSource = map.getSource(ids.axisSource) as maplibregl.GeoJSONSource | undefined
  const impactSource = map.getSource(ids.impactSource) as maplibregl.GeoJSONSource | undefined
  if (coneSource && axisSource && impactSource) {
    coneSource.setData(coneGeojson)
    axisSource.setData(axisGeojson)
    impactSource.setData(impactGeojson)
    map.setPaintProperty(ids.fill, 'fill-color', coneColor)
    map.setPaintProperty(ids.fill, 'fill-opacity', fillOpacity)
    map.setPaintProperty(ids.halo, 'line-color', coneColor)
    map.setPaintProperty(ids.halo, 'line-opacity', haloOpacity)
    map.setPaintProperty(ids.line, 'line-color', coneColor)
    map.setPaintProperty(ids.line, 'line-opacity', lineOpacity)
    map.setPaintProperty(ids.impactHalo, 'circle-color', coneColor)
    map.setPaintProperty(ids.impactHalo, 'circle-opacity', haloOpacity)
    map.setPaintProperty(ids.impactCore, 'circle-color', coneColor)
    map.setPaintProperty(ids.impactCore, 'circle-opacity', selected ? 0.95 : 0.55)
    return
  }

  map.addSource(ids.source, { type: 'geojson', data: coneGeojson })
  map.addSource(ids.axisSource, { type: 'geojson', data: axisGeojson })
  map.addSource(ids.impactSource, { type: 'geojson', data: impactGeojson })
  const round = { 'line-cap': 'round' as const, 'line-join': 'round' as const }
  map.addLayer({
    id: ids.fill,
    type: 'fill',
    source: ids.source,
    paint: { 'fill-color': coneColor, 'fill-opacity': fillOpacity },
  })
  map.addLayer({
    id: ids.halo,
    type: 'line',
    source: ids.source,
    layout: round,
    paint: { 'line-color': coneColor, 'line-width': 6, 'line-blur': 5, 'line-opacity': haloOpacity },
  })
  map.addLayer({
    id: ids.line,
    type: 'line',
    source: ids.source,
    layout: round,
    paint: { 'line-color': coneColor, 'line-width': 1.5, 'line-opacity': lineOpacity },
  })
  // Zone de saisie invisible sur TOUTE la longueur du cône (site → impact) :
  // le corps du cône (fill ci-dessus, ±4° d'ouverture) est trop fin près du
  // site pour être cliqué fiablement — cette ligne, large en PIXELS (donc
  // constante quel que soit le zoom), couvre tout l'axe de tir.
  map.addLayer({
    id: ids.axisHit,
    type: 'line',
    source: ids.axisSource,
    layout: round,
    paint: { 'line-color': coneColor, 'line-width': 22, 'line-opacity': 0.01 },
  })
  map.addLayer({
    id: ids.impactHalo,
    type: 'circle',
    source: ids.impactSource,
    paint: { 'circle-radius': 16, 'circle-color': coneColor, 'circle-blur': 1, 'circle-opacity': haloOpacity },
  })
  map.addLayer({
    id: ids.impactCore,
    type: 'circle',
    source: ids.impactSource,
    paint: { 'circle-radius': 4, 'circle-color': coneColor, 'circle-opacity': selected ? 0.95 : 0.55 },
  })
  // Zone de saisie invisible, plus large que la pastille : facile à attraper.
  map.addLayer({
    id: ids.impactHit,
    type: 'circle',
    source: ids.impactSource,
    paint: { 'circle-radius': 26, 'circle-color': coneColor, 'circle-opacity': 0.01 },
  })
}

/** Retire les couches/sources d'un cône dont la Mesange a été supprimée de la flotte. */
function removeThreatCone(map: maplibregl.Map, mesangeId: string) {
  const ids = coneLayerIds(mesangeId)
  ;[ids.fill, ids.halo, ids.line, ids.axisHit, ids.impactHalo, ids.impactCore, ids.impactHit].forEach((layerId) => {
    if (map.getLayer(layerId)) map.removeLayer(layerId)
  })
  ;[ids.source, ids.axisSource, ids.impactSource].forEach((sourceId) => {
    if (map.getSource(sourceId)) map.removeSource(sourceId)
  })
}

// Préfixe commun aux sources de cône — sert à retrouver, DEPUIS LA CARTE
// elle-même (source de vérité, pas un état JS externe), quelles Mesanges ont
// déjà un cône dessiné et lesquelles ont été retirées de la flotte entre deux
// rendus.
const CONE_SOURCE_PREFIX = 'threat-cone-'

function existingConeMesangeIds(map: maplibregl.Map): string[] {
  const sources = map.getStyle()?.sources ?? {}
  return Object.keys(sources)
    .filter((id) => id.startsWith(CONE_SOURCE_PREFIX))
    .map((id) => id.slice(CONE_SOURCE_PREFIX.length))
}

/**
 * Dessine le cône de CHAQUE Mesange de la flotte, teinté par rôle — celle
 * sélectionnée est vive, les autres en sourdine. Idempotent (met à jour les
 * sources existantes plutôt que de tout recréer) ; nettoie les cônes des
 * Mesanges retirées de la flotte depuis le dernier appel.
 */
export function drawThreatCones(
  map: maplibregl.Map,
  site: LaunchSite,
  radars: PlacedRadar[],
  mesangeConfigs: MesangeLaunchConfig[],
  selectedId: string,
) {
  const currentIds = new Set(mesangeConfigs.map((m) => m.id))
  existingConeMesangeIds(map)
    .filter((id) => !currentIds.has(id))
    .forEach((staleId) => removeThreatCone(map, staleId))

  mesangeConfigs.forEach((config) => {
    drawOneThreatCone(map, site, radars, config, config.id === selectedId)
  })
}
