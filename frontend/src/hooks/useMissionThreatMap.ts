import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import { buildRangeCircle } from '@/lib/geoCircle'
import { buildSightCone } from '@/lib/geoSightCone'
import { destinationPoint } from '@/lib/geoDestination'
import { bearingBetween } from '@/lib/geoBearing'
import { createLabeledMarker } from '@/lib/mapMarker'
import type { LaunchSite } from '@/types/simulation.types'
import type { PlacedRadar } from '@/types/mission.types'

const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'
// Cône de menace : tons laiton du HUD, jamais de rouge.
const CONE_COLOR = '#94866e'
const CONE_CORE_COLOR = '#cdbb98'
// Cercles de couverture radar : même laiton, mais en RETRAIT (contexte). Ils
// aident à choisir l'azimut — on voit quelle zone chaque radar couvre — sans
// voler la vedette au cône de visée.
const COVERAGE_COLOR = '#94866e'
// Vue 3D : inclinaison de la caméra carte (perspective terrain).
const MAP_PITCH_DEG = 55
// Couches saisissables pour orienter le cône au glisser.
const DRAG_LAYERS = ['threat-impact-hit', 'threat-cone-fill'] as const

interface UseMissionThreatMapParams {
  site: LaunchSite
  radars: PlacedRadar[]
  azimuthDeg: number
  inclinationDeg: number
  onSetAzimut: (deg: number) => void
}

interface UseMissionThreatMapResult {
  containerRef: React.RefObject<HTMLDivElement | null>
}

/** Cap du pas de tir vers un point, au dixième de degré (précis mais stable). */
function bearingToward(site: LaunchSite, lngLat: maplibregl.LngLat): number {
  const bearing = bearingBetween(site, { latitude: lngLat.lat, longitude: lngLat.lng })
  return Math.round(bearing * 10) / 10
}

/**
 * Carte 3D (caméra inclinée) de définition de la menace. Le PAS DE TIR est fixe
 * (= le site). Deux façons de viser : cliquer dans la direction voulue, ou
 * SAISIR le cône (sa pastille d'impact ou son corps) et le faire glisser — le
 * cône suit le pointeur en continu, au dixième de degré. Les radars posés
 * restent en contexte, étiquetés et atténués.
 */
export function useMissionThreatMap({
  site,
  radars,
  azimuthDeg,
  inclinationDeg,
  onSetAzimut,
}: UseMissionThreatMapParams): UseMissionThreatMapResult {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const aimRef = useRef(onSetAzimut)
  aimRef.current = onSetAzimut

  // --- Création de la carte (une fois par site) ---
  useEffect(() => {
    if (!containerRef.current) return

    const maxRangeKm = Math.max(...radars.map((r) => r.config.rangeKm), 60)
    const bounds = new maplibregl.LngLatBounds()
    buildRangeCircle(site.longitude, site.latitude, maxRangeKm).forEach(([lng, lat]) =>
      bounds.extend([lng, lat]),
    )

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      bounds,
      fitBoundsOptions: { padding: 60 },
      pitch: MAP_PITCH_DEG,
    })
    mapRef.current = map
    map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-left')

    // Pas de tir FIXE (= le site), étiqueté.
    createLabeledMarker(map, [site.longitude, site.latitude], 'launch-marker launch-marker--origin', 'Launch pad')

    // Radars posés = contexte, étiquetés, atténués. Chacun porte son cercle de
    // couverture (rayon = portée), en retrait, pour aider à orienter l'azimut.
    const drawRadarCoverage = () => {
      radars.forEach((radar) => {
        if (!radar.position) return
        const sourceId = `coverage-${radar.id}`
        if (map.getSource(sourceId)) return
        const circle = buildRangeCircle(
          radar.position.longitude,
          radar.position.latitude,
          radar.config.rangeKm,
        )
        map.addSource(sourceId, {
          type: 'geojson',
          data: {
            type: 'Feature',
            geometry: { type: 'Polygon', coordinates: [circle] },
            properties: {},
          },
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
          paint: {
            'line-color': COVERAGE_COLOR,
            'line-width': 1,
            'line-dasharray': [3, 3],
            'line-opacity': 0.3,
          },
        })
      })
    }
    if (map.isStyleLoaded()) drawRadarCoverage()
    else map.once('load', drawRadarCoverage)

    radars.forEach((radar, index) => {
      if (!radar.position) return
      createLabeledMarker(
        map,
        [radar.position.longitude, radar.position.latitude],
        'radar-marker radar-marker--dim',
        `Radar ${index + 1}`,
      )
    })

    // --- Visée fluide : saisir le cône et le faire glisser autour du pas de tir.
    let dragging = false
    const canvas = map.getCanvas()

    const startDrag = (event: maplibregl.MapMouseEvent | maplibregl.MapTouchEvent) => {
      event.preventDefault() // bloque le pan de la carte pendant le réglage
      dragging = true
      canvas.style.cursor = 'grabbing'
    }
    DRAG_LAYERS.forEach((layer) => {
      map.on('mousedown', layer, startDrag)
      map.on('touchstart', layer, startDrag)
      map.on('mouseenter', layer, () => {
        if (!dragging) canvas.style.cursor = 'grab'
      })
      map.on('mouseleave', layer, () => {
        if (!dragging) canvas.style.cursor = ''
      })
    })
    map.on('mousemove', (event) => {
      if (dragging) aimRef.current(bearingToward(site, event.lngLat))
    })
    map.on('touchmove', (event) => {
      if (dragging) aimRef.current(bearingToward(site, event.lngLat))
    })
    const endDrag = () => {
      if (!dragging) return
      dragging = false
      canvas.style.cursor = ''
    }
    map.on('mouseup', endDrag)
    map.on('touchend', endDrag)
    // Relâchement HORS de la carte : sans ça le cône resterait « collé » au
    // pointeur au retour sur la carte, bouton déjà relâché.
    document.addEventListener('pointerup', endDrag)

    // Clic simple = viser directement le point cliqué (ignoré en fin de drag :
    // le drag a déjà posé la valeur exacte, pas de ressaut d'arrondi).
    map.on('click', (event) => {
      aimRef.current(bearingToward(site, event.lngLat))
    })

    const resizeObserver = new ResizeObserver(() => map.resize())
    resizeObserver.observe(containerRef.current)

    return () => {
      resizeObserver.disconnect()
      document.removeEventListener('pointerup', endDrag)
      map.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- carte créée une fois par site
  }, [site])

  // --- Cône de menace : fin, arrondi, piloté par azimut/inclinaison ---
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const draw = () => {
      // Longueur du cône purement présentationnelle (pas d'estimation balistique).
      // Réutilise l'échelle déjà calculée pour le cadrage initial de la carte.
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

    if (map.isStyleLoaded()) draw()
    else map.once('load', draw)
  }, [site, radars, azimuthDeg, inclinationDeg])

  return { containerRef }
}
