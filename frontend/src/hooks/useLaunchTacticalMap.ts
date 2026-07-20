import { useEffect, useMemo, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import { enuToLatLon } from '@/lib/enuToLatLon'
import { TACTICAL_MAP_STYLE, drawTacticalOverlay } from '@/lib/launchTacticalMap'
import type { LaunchSite } from '@/types/simulation.types'
import type { PlacedRadar } from '@/types/mission.types'
import type { FlightData } from '@/lib/api'

interface UseLaunchTacticalMapParams {
  site: LaunchSite
  /** Tous les radars placés (1-2), chacun avec sa couverture. */
  radars: PlacedRadar[]
  azimuthDeg: number
  /** Agrandie : pan + zoom souris actifs ; compacte : figée. */
  expanded: boolean
  /** Trajectoire RocketPy (null tant que non calculée). */
  flight: FlightData | null
  /** Progression du vol 0→1 (ref partagée, -1 = pas de vol). */
  flightProgressRef: React.RefObject<number>
}

interface UseLaunchTacticalMapResult {
  containerRef: React.RefObject<HTMLDivElement | null>
}

/** Active/désactive les gestes de navigation d'un coup (bascule figée ↔ libre). */
function setInteractive(map: maplibregl.Map, on: boolean) {
  const handlers = [map.dragPan, map.scrollZoom, map.boxZoom, map.doubleClickZoom, map.touchZoomRotate, map.keyboard]
  handlers.forEach((h) => (on ? h.enable() : h.disable()))
}

/**
 * Carte tactique de l'écran de lancement : vue de dessus à l'échelle réelle,
 * là où la distance est FIDÈLE (la scène 3D montre le pas de tir grandeur
 * nature). Épurée : anneaux de distance, cône d'azimut de la MENACE, et pour
 * chaque radar sa couverture + un trait de liaison (dessin → lib/launchTacticalMap).
 * Read-only en compact ; pan/zoom actifs une fois agrandie.
 */
export function useLaunchTacticalMap({
  site,
  radars,
  azimuthDeg,
  expanded,
  flight,
  flightProgressRef,
}: UseLaunchTacticalMapParams): UseLaunchTacticalMapResult {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)

  // Points [lng, lat] de la trajectoire, convertis une fois depuis l'ENU
  // RocketPy (x=est, y=nord, en m) autour du pas de tir. Projection au sol :
  // l'altitude (z) est ignorée (vue de dessus) — on la lira dans les graphiques.
  const trackLngLat = useMemo<[number, number][]>(() => {
    if (!flight) return []
    return flight.trajectory.map((p) => enuToLatLon(p.x, p.y, site.longitude, site.latitude))
  }, [flight, site.longitude, site.latitude])

  // --- Création de la carte (une fois) ---
  useEffect(() => {
    if (!containerRef.current) return

    const placed = radars.filter((radar) => radar.position !== null)
    const maxRangeKm = Math.max(...placed.map((r) => r.config.rangeKm), 40)

    // Cadrage SERRÉ : englobe pas de tir + radars. Padding ASYMÉTRIQUE FORT pour
    // pousser l'ensemble nettement dans un coin → le pas de tir est franchement
    // décalé sur le côté (pas au milieu), scène plus dynamique.
    const bounds = new maplibregl.LngLatBounds()
    bounds.extend([site.longitude, site.latitude])
    placed.forEach((radar) => bounds.extend([radar.position!.longitude, radar.position!.latitude]))

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: TACTICAL_MAP_STYLE,
      bounds,
      fitBoundsOptions: { padding: { top: 25, right: 25, bottom: 150, left: 210 }, maxZoom: 11 },
      interactive: false, // navigation togglée ensuite selon `expanded`
      attributionControl: false,
    })
    mapRef.current = map

    const draw = () => drawTacticalOverlay(map, site, placed, azimuthDeg, maxRangeKm)
    if (map.isStyleLoaded()) draw()
    else map.once('load', draw)

    const resizeObserver = new ResizeObserver(() => map.resize())
    resizeObserver.observe(containerRef.current)

    return () => {
      resizeObserver.disconnect()
      map.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- carte créée une seule fois
  }, [])

  // --- Interactivité selon l'état agrandi ---
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    setInteractive(map, expanded)
    const timer = setTimeout(() => map.resize(), 260)
    return () => clearTimeout(timer)
  }, [expanded])

  // --- Piste live : boucle rAF DÉDIÉE qui lit la progression partagée et
  //     redessine la trace + la tête, SANS re-render React (fluide 60fps). ---
  useEffect(() => {
    const map = mapRef.current
    if (!map || trackLngLat.length < 2) return

    let raf = 0
    let lastProgress = -2 // force un premier dessin

    const update = () => {
      raf = requestAnimationFrame(update)
      const progress = flightProgressRef.current
      if (progress === lastProgress) return // rien de neuf cette frame
      lastProgress = progress

      const trackSrc = map.getSource('track') as maplibregl.GeoJSONSource | undefined
      const headSrc = map.getSource('track-head') as maplibregl.GeoJSONSource | undefined
      if (!trackSrc || !headSrc) return

      // Hors vol (-1) : piste vide.
      if (progress < 0) {
        trackSrc.setData({ type: 'Feature', geometry: { type: 'LineString', coordinates: [] }, properties: {} })
        headSrc.setData({ type: 'Feature', geometry: { type: 'Point', coordinates: [] }, properties: {} })
        return
      }

      // Portion parcourue : les points jusqu'à l'index correspondant à la
      // progression. La trace s'allonge donc au fil du vol.
      const n = trackLngLat.length
      const idx = Math.min(n - 1, Math.max(1, Math.floor(progress * (n - 1)) + 1))
      const coords = trackLngLat.slice(0, idx + 1)
      const head = trackLngLat[idx]

      trackSrc.setData({ type: 'Feature', geometry: { type: 'LineString', coordinates: coords }, properties: {} })
      headSrc.setData({ type: 'Feature', geometry: { type: 'Point', coordinates: head }, properties: {} })
    }

    raf = requestAnimationFrame(update)
    return () => cancelAnimationFrame(raf)
  }, [trackLngLat, flightProgressRef])

  return { containerRef }
}
