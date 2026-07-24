import { buildRangeCircle } from '@/lib/geoCircle'
import { createLabeledMarker } from '@/lib/mapMarker'
import { applyRocketRangeLayer, applyLinkLayer } from '@/lib/missionPlacementMap'
import { SWEEP_SEARCH_COLOR } from '@/constants/tacticalRadar'
import { TACTICAL_MAP_STYLE, COVERAGE_COLOR, COVERAGE_DASHARRAY, ROLE_COLOR } from '@/constants/tacticalMapTheme'
import { ROCKET_MAX_RANGE_KM } from '@/constants/rocket'
import type maplibregl from 'maplibre-gl'
import type { LaunchSite } from '@/types/simulation.types'
import type { PlacedRadar, MesangeRole } from '@/types/mission.types'
import type { FlightData } from '@/lib/api'

// Style + couleurs partagés avec les autres cartes radar — voir tacticalMapTheme.ts.
export { TACTICAL_MAP_STYLE, COVERAGE_COLOR }

/** Trajectoire d'un leurre à tracer (statique, entière) sur la carte tactique. */
export interface DecoyTrack {
  id: string
  role: MesangeRole
  flight: FlightData
}

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

    // Trait radar → pas de tir + distance chiffrée au milieu : MÊME dessin
    // que la carte de placement (applyLinkLayer, voir missionPlacementMap.ts)
    // — avant, ce trait existait ici SANS label, seule vraie différence
    // visuelle perçue entre les deux cartes malgré des couleurs déjà unifiées.
    // `outOfRange` toujours faux ici : un radar affiché en vol a déjà passé
    // la validation du scénario (voir validateScenario), jamais hors de portée.
    applyLinkLayer(map, site, radar, true, false)

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

  // Cercle de portée max de la Mesange : MÊME repère principal que la carte
  // de placement (applyRocketRangeLayer) — avant, absent ici alors qu'il
  // délimite pourtant la même zone (les radars n'ont pu être posés que dans
  // ce cercle, voir validateScenario), rendant les deux cartes visuellement
  // différentes malgré la même donnée sous-jacente.
  applyRocketRangeLayer(map, site, ROCKET_MAX_RANGE_KM)

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

  // Blips d'ACCROCHAGE radar : un plot par instant où un radar a détecté la
  // menace (voir useLaunchTacticalMap, front montant de `locked`), coloré par
  // le radar accrocheur (`color` en propriété de feature — data-driven, une
  // seule paire de couches sert TOUS les radars). S'ACCUMULENT en une trace
  // persistante (jamais vidée pendant le vol), remise à zéro seulement au
  // replay — comme les plots successifs d'un vrai écran radar PPI.
  map.addSource('detections', {
    type: 'geojson',
    data: { type: 'FeatureCollection', features: [] },
  })
  // Halo large et flou : rend le blip « éclatant », lisible même à petit zoom.
  map.addLayer({
    id: 'detections-halo',
    type: 'circle',
    source: 'detections',
    paint: {
      'circle-radius': 9,
      'circle-color': ['get', 'color'],
      'circle-blur': 1,
      'circle-opacity': 0.35,
    },
  })
  map.addLayer({
    id: 'detections-core',
    type: 'circle',
    source: 'detections',
    paint: {
      // Rayon DATA-DRIVEN sur l'altitude (m) : plus la menace est haute au
      // moment du plot, plus le point est gros — seconde piste de lecture,
      // REDONDANTE avec l'étiquette chiffrée (track-label ci-dessous), jamais
      // seule source de vérité (un canal graphique isolé se lit mal sous
      // stress — voir la recherche UX). Couleur reste celle du radar
      // accrocheur : l'altitude n'emprunte SURTOUT PAS ce canal (sinon la
      // couleur porterait deux sens à la fois, illisible).
      'circle-radius': ['interpolate', ['linear'], ['get', 'altitudeM'], 0, 2, 20000, 6],
      'circle-color': ['get', 'color'],
      'circle-opacity': 0.95,
      'circle-stroke-width': 1,
      'circle-stroke-color': '#0b0d10',
    },
  })

  // Étiquette de piste (data block) sur la TÊTE de piste live : altitude
  // chiffrée en mètres, seule vraie garantie de lecture — la vue de dessus
  // écrase l'axe vertical, ce texte est ce qui empêche la carte de « mentir ».
  // Alimentée par la même boucle rAF que track-head (voir useLaunchTacticalMap).
  map.addSource('track-label', {
    type: 'geojson',
    data: { type: 'Feature', geometry: { type: 'Point', coordinates: [] }, properties: { text: '' } },
  })
  map.addLayer({
    id: 'track-label',
    type: 'symbol',
    source: 'track-label',
    layout: {
      'text-field': ['get', 'text'],
      'text-size': 11,
      'text-font': ['Open Sans Regular'],
      'text-offset': [0, -1.4],
      'text-anchor': 'bottom',
      // TOUJOURS visible : sans ces deux réglages, MapLibre masque le label
      // dès qu'il entre en collision avec un autre symbole (ex. le label de
      // distance radar↔pas de tir, voir applyLinkLayer) — la donnée la plus
      // importante en vol ne doit jamais disparaître selon la position de la
      // tête de piste sur l'écran.
      'text-allow-overlap': true,
      'text-ignore-placement': true,
    },
    paint: {
      'text-color': TRACK_COLOR,
      'text-halo-color': '#0b0d10',
      'text-halo-width': 1.4,
    },
  })
}

// Préfixe des couches/sources de trace de leurre — sert à les retrouver pour
// Préfixes des sources de piste LIVE par leurre — sert à la mise à jour
// idempotente (replay = nouvelle flotte) et au nettoyage des leurres disparus.
const DECOY_SOURCE_PREFIX = 'decoy-track-'

/** IDs des sources/couches live d'un leurre donné (piste + tête + étiquette). */
export function decoyLayerIds(id: string) {
  return {
    trackSource: `${DECOY_SOURCE_PREFIX}${id}`,
    trackLayer: `decoy-line-${id}`,
    headSource: `decoy-head-src-${id}`,
    headLayer: `decoy-head-${id}`,
    labelSource: `decoy-label-src-${id}`,
    labelLayer: `decoy-label-${id}`,
  }
}

/**
 * Crée (ou met à jour) les couches de piste LIVE de chaque leurre sur la carte
 * tactique — MÊME traitement que le Roi (piste qui s'allonge + tête + étiquette
 * altitude·distance), teinté par rôle CHESS (ROLE_COLOR). Sources créées VIDES,
 * alimentées ensuite par la boucle rAF du hook (voir useLaunchTacticalMap) qui
 * fait avancer chaque piste sur la même progression 0→1 que le Roi, mappée sur
 * la trajectoire propre du leurre — toutes les pistes arrivent donc au bout
 * ensemble. Idempotent : nettoie les leurres disparus (replay différent).
 * Trait un peu plus fin que le Roi (la menace réelle reste prioritaire). */
export function drawDecoyTracks(map: maplibregl.Map, decoys: DecoyTrack[]) {
  const currentIds = new Set(decoys.map((d) => d.id))

  // Nettoyage des pistes de leurres qui n'existent plus (replay différent).
  const style = map.getStyle()
  const existingSources = style?.sources ? Object.keys(style.sources) : []
  existingSources
    .filter((id) => id.startsWith(DECOY_SOURCE_PREFIX))
    .map((id) => id.slice(DECOY_SOURCE_PREFIX.length))
    .filter((id) => !currentIds.has(id))
    .forEach((staleId) => {
      const ids = decoyLayerIds(staleId)
      ;[ids.trackLayer, ids.headLayer, ids.labelLayer].forEach((l) => {
        if (map.getLayer(l)) map.removeLayer(l)
      })
      ;[ids.trackSource, ids.headSource, ids.labelSource].forEach((s) => {
        if (map.getSource(s)) map.removeSource(s)
      })
    })

  decoys.forEach((decoy) => {
    const ids = decoyLayerIds(decoy.id)
    const color = ROLE_COLOR[decoy.role]
    const emptyLine = { type: 'Feature' as const, geometry: { type: 'LineString' as const, coordinates: [] }, properties: {} }
    const emptyPoint = { type: 'Feature' as const, geometry: { type: 'Point' as const, coordinates: [] }, properties: { text: '' } }

    // Déjà créées (re-render) : on rafraîchit juste la couleur (rôle inchangé
    // en pratique, mais robuste au cas où) et on laisse la boucle rAF piloter.
    if (map.getSource(ids.trackSource)) {
      map.setPaintProperty(ids.trackLayer, 'line-color', color)
      map.setPaintProperty(ids.headLayer, 'circle-color', color)
      map.setPaintProperty(ids.labelLayer, 'text-color', color)
      return
    }

    map.addSource(ids.trackSource, { type: 'geojson', data: emptyLine })
    map.addLayer({
      id: ids.trackLayer,
      type: 'line',
      source: ids.trackSource,
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': color, 'line-width': 1.6, 'line-opacity': 0.85 },
    })

    map.addSource(ids.headSource, { type: 'geojson', data: { ...emptyPoint, properties: {} } })
    map.addLayer({
      id: ids.headLayer,
      type: 'circle',
      source: ids.headSource,
      paint: {
        'circle-radius': 3.5,
        'circle-color': color,
        'circle-stroke-width': 1.5,
        'circle-stroke-color': '#0b0d10',
      },
    })

    map.addSource(ids.labelSource, { type: 'geojson', data: emptyPoint })
    map.addLayer({
      id: ids.labelLayer,
      type: 'symbol',
      source: ids.labelSource,
      layout: {
        'text-field': ['get', 'text'],
        'text-size': 10,
        'text-font': ['Open Sans Regular'],
        'text-offset': [0, -1.2],
        'text-anchor': 'bottom',
        'text-allow-overlap': true,
        'text-ignore-placement': true,
      },
      paint: { 'text-color': color, 'text-halo-color': '#0b0d10', 'text-halo-width': 1.2 },
    })
  })
}
