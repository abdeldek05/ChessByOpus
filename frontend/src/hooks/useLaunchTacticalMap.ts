import { useEffect, useMemo, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import { enuToLatLon } from '@/lib/enuToLatLon'
import { TACTICAL_MAP_STYLE, drawTacticalOverlay } from '@/lib/launchTacticalMap'
import { buildSweepTrailFeatures } from '@/lib/geoRadarSector'
import { computeRadarEnu } from '@/lib/coverage/computeRadarEnu'
import { isInCoverage } from '@/lib/coverage/computeVisibilityWindows'
import {
  SWEEP_HALF_WIDTH_DEG,
  SWEEP_TRAIL_DEG,
  SWEEP_DIRECTION,
  SWEEP_DEFAULT_RPM,
  SWEEP_SEARCH_COLOR,
  SWEEP_LOCKED_COLOR,
} from '@/constants/tacticalRadar'
import type { LaunchSite } from '@/types/simulation.types'
import type { PlacedRadar } from '@/types/mission.types'
import type { FlightData } from '@/lib/api'

interface UseLaunchTacticalMapParams {
  site: LaunchSite
  /** Tous les radars placés (1-2), chacun avec sa couverture. */
  radars: PlacedRadar[]
  /** Agrandie : pan + zoom souris actifs ; compacte : figée. */
  expanded: boolean
  /** Carte visible à l'écran (pas repliée) : coupe les boucles rAF sinon —
   *  inutile de repeindre MapLibre en continu pour une carte à hauteur 0. */
  visible: boolean
  /** Trajectoire RocketPy (null tant que non calculée). */
  flight: FlightData | null
  /** Progression du vol 0→1 (ref partagée, -1 = pas de vol). */
  flightProgressRef: React.RefObject<number>
}

// Cadence de rafraîchissement du faisceau radar (Hz) : un balayage 2D n'a pas
// besoin d'un repaint MapLibre à 60fps pour paraître fluide, et setData() sur
// une FeatureCollection à chaque frame partage inutilement le thread principal
// avec le Canvas WebGL (source de vibration pendant le vol).
const SWEEP_REFRESH_HZ = 24
const SWEEP_REFRESH_INTERVAL_MS = 1000 / SWEEP_REFRESH_HZ

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
 * nature). Épurée : uniquement les radars — marqueur, couverture, trait de
 * liaison, et un FAISCEAU ROTATIF qui balaie en continu (dessin statique →
 * lib/launchTacticalMap, rotation + détection live → boucle rAF ci-dessous).
 * Read-only en compact ; pan/zoom actifs une fois agrandie.
 */
export function useLaunchTacticalMap({
  site,
  radars,
  expanded,
  visible,
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

  // Radars posés, avec leur position ENU (m, même repère que la trajectoire)
  // et leur vitesse de rotation — recalculé seulement quand les radars/site
  // changent, pas à chaque frame.
  const placedRadars = useMemo(
    () =>
      radars
        .filter((radar) => radar.position !== null)
        .map((radar) => ({
          id: radar.id,
          lng: radar.position!.longitude,
          lat: radar.position!.latitude,
          enu: computeRadarEnu(site, radar.position!),
          config: radar.config,
          rpm: radar.config.rotating ? (radar.config.rotationRpm ?? SWEEP_DEFAULT_RPM) : 0,
        })),
    [site, radars],
  )

  // --- Création de la carte (une fois) ---
  useEffect(() => {
    if (!containerRef.current) return

    const placed = radars.filter((radar) => radar.position !== null)

    // Cadrage SERRÉ : englobe pas de tir + radars. Padding réduit + maxZoom
    // relevé (14 au lieu de 11) pour zoomer nettement plus près — la carte
    // épurée (radars + faisceau seuls, plus d'anneaux ni de cône) reste
    // lisible même resserrée. Padding gauche encore asymétrique pour décaler
    // l'ensemble (scène plus dynamique, pas de tir pas pile au centre).
    const bounds = new maplibregl.LngLatBounds()
    bounds.extend([site.longitude, site.latitude])
    placed.forEach((radar) => bounds.extend([radar.position!.longitude, radar.position!.latitude]))

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: TACTICAL_MAP_STYLE,
      bounds,
      fitBoundsOptions: { padding: { top: 15, right: 15, bottom: 60, left: 90 }, maxZoom: 14 },
      interactive: false, // navigation togglée ensuite selon `expanded`
      attributionControl: false,
    })
    mapRef.current = map

    const draw = () => drawTacticalOverlay(map, site, placed)
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
    if (!map || !visible || trackLngLat.length < 2) return

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
  }, [trackLngLat, flightProgressRef, visible])

  // --- Faisceau rotatif : boucle rAF DÉDIÉE, tourne en CONTINU (même hors
  //     vol, contrairement à la piste ci-dessus qui ne redessine que si la
  //     progression change) — un radar rotatif balaie sans arrêt. Calcule
  //     aussi la détection live (fusée dans l'enveloppe + faisceau pointé
  //     dessus) pour virer le faisceau à l'alarme. ---
  useEffect(() => {
    const map = mapRef.current
    if (!map || !visible || placedRadars.length === 0) return

    let raf = 0
    const startMs = performance.now()
    let lastUpdateMs = 0
    const lockedStateByRadar = new Map<string, boolean>()

    const update = () => {
      raf = requestAnimationFrame(update)
      const nowMs = performance.now()
      // Throttle : un balayage 2D reste lisible sans repeindre MapLibre à
      // 60fps — évite de disputer le thread principal au Canvas WebGL à
      // chaque frame (source de vibration pendant le vol).
      if (nowMs - lastUpdateMs < SWEEP_REFRESH_INTERVAL_MS) return
      lastUpdateMs = nowMs
      const elapsedMin = (nowMs - startMs) / 60000

      // Position ENU live de la menace (m, east/north) : reconstituée depuis
      // la progression partagée + la trajectoire, seulement si un vol est en
      // cours — sinon aucun radar ne peut être en détection.
      const progress = flightProgressRef.current
      let livePoint: { x: number; y: number; z: number } | null = null
      if (flight && progress >= 0) {
        const n = flight.trajectory.length
        const idx = Math.min(n - 1, Math.max(0, Math.floor(progress * (n - 1))))
        livePoint = flight.trajectory[idx]
      }

      placedRadars.forEach((radar) => {
        const sweepSrc = map.getSource(`sweep-${radar.id}`) as maplibregl.GeoJSONSource | undefined
        if (!sweepSrc) return

        if (radar.rpm <= 0) return // radar statique : pas de faisceau à animer

        const headingDeg = (elapsedMin * radar.rpm * 360 * SWEEP_DIRECTION) % 360

        // Détection : la menace est dans l'enveloppe géométrique du radar ET
        // son azimut (vu depuis le radar) tombe dans le secteur balayé.
        let locked = false
        if (livePoint) {
          const inCoverage = isInCoverage(livePoint, radar.enu.eastM, radar.enu.northM, radar.config)
          if (inCoverage) {
            const dE = livePoint.x - radar.enu.eastM
            const dN = livePoint.y - radar.enu.northM
            const bearingToThreat = (Math.atan2(dE, dN) * 180) / Math.PI
            const delta = ((bearingToThreat - headingDeg + 540) % 360) - 180
            locked = Math.abs(delta) <= SWEEP_HALF_WIDTH_DEG
          }
        }

        const features = buildSweepTrailFeatures(
          radar.lng,
          radar.lat,
          headingDeg,
          SWEEP_DIRECTION,
          SWEEP_HALF_WIDTH_DEG,
          SWEEP_TRAIL_DEG,
          radar.config.rangeKm,
        )
        sweepSrc.setData({ type: 'FeatureCollection', features })

        // Couleur mise à jour SEULEMENT au changement d'état (pas chaque
        // frame) : évite de retrigger un repaint de couche pour rien.
        if (lockedStateByRadar.get(radar.id) !== locked) {
          lockedStateByRadar.set(radar.id, locked)
          map.setPaintProperty(`sweep-${radar.id}`, 'fill-color', locked ? SWEEP_LOCKED_COLOR : SWEEP_SEARCH_COLOR)
        }
      })
    }

    raf = requestAnimationFrame(update)
    return () => cancelAnimationFrame(raf)
  }, [placedRadars, flight, flightProgressRef, visible])

  return { containerRef }
}
