import { useEffect, useMemo, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import { buildRangeCircle } from '@/lib/geoCircle'
import { createLabeledMarker } from '@/lib/mapMarker'
import { computeDistanceKm } from '@/lib/computeDistanceKm'
import {
  PLACEMENT_MAP_STYLE,
  applyCoverageLayer,
  applyRocketRangeLayer,
  applyLinkLayer,
} from '@/lib/missionPlacementMap'
import type { LaunchSite } from '@/types/simulation.types'
import type { RadarPosition, PlacedRadar } from '@/types/mission.types'

interface UseMissionPlacementMapParams {
  /** Région (cadrage initial de la carte). */
  site: LaunchSite
  radars: PlacedRadar[]
  /** Radar en cours d'édition : le clic sur la carte le positionne. */
  activeRadarId: string
  onPlaceRadar: (id: string, position: RadarPosition) => void
  /** Distance max théorique de la Mesange (km) ; null tant que non reçue. */
  rocketMaxRangeKm?: number | null
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

/**
 * Carte 2D de placement de 1 à 2 radars, autour du PAS DE TIR fixe (= le site,
 * repère de référence). Chaque radar posé affiche son cercle de COUVERTURE, un
 * trait de liaison chiffré et un marqueur ; le radar ACTIF reçoit les clics. Le
 * dessin des couches vit dans lib/missionPlacementMap ; ce hook orchestre les
 * effets. L'azimut de la Mesange se règle à l'étape Menaces (useMissionThreatMap).
 */
export function useMissionPlacementMap({
  site,
  radars,
  activeRadarId,
  onPlaceRadar,
  rocketMaxRangeKm = null,
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
  // l'avertissement carte et le blocage final restent cohérents).
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
      style: PLACEMENT_MAP_STYLE,
      bounds,
      fitBoundsOptions: { padding: 48 },
    })
    mapRef.current = map
    map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-left')

    // Pas de tir FIXE = le site (repère de référence pour poser les radars).
    createLabeledMarker(map, [site.longitude, site.latitude], 'launch-marker launch-marker--origin', 'Launch pad')

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

  // --- Cercle de couverture par radar (centré sur le radar une fois posé) ---
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    radars.forEach((radar) =>
      applyCoverageLayer(
        map,
        radar,
        radar.id === activeRadarId,
        radarsOutOfRange.some((excess) => excess.id === radar.id),
      ),
    )
  }, [radars, activeRadarId, radarsOutOfRange])

  // --- Cercle de portée max de la Mesange (centré sur le pas de tir) ---
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    applyRocketRangeLayer(map, site, rocketMaxRangeKm)
  }, [site, rocketMaxRangeKm])

  // --- Trait radar → pas de tir + distance discrète ---
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    radars.forEach((radar) =>
      applyLinkLayer(
        map,
        site,
        radar,
        radar.id === activeRadarId,
        radarsOutOfRange.some((excess) => excess.id === radar.id),
      ),
    )
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
