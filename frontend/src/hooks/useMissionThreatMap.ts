import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import { buildRangeCircle } from '@/lib/geoCircle'
import { createLabeledMarker } from '@/lib/mapMarker'
import {
  THREAT_MAP_STYLE,
  MAP_PITCH_DEG,
  DRAG_LAYERS,
  bearingToward,
  drawRadarCoverage,
  drawThreatCone,
} from '@/lib/missionThreatMap'
import type { LaunchSite } from '@/types/simulation.types'
import type { PlacedRadar } from '@/types/mission.types'

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

/**
 * Carte 3D (caméra inclinée) de définition de la menace. Le PAS DE TIR est fixe
 * (= le site). Deux façons de viser : cliquer dans la direction voulue, ou
 * SAISIR le cône (sa pastille d'impact ou son corps) et le faire glisser — le
 * cône suit le pointeur en continu, au dixième de degré. Les radars posés
 * restent en contexte, étiquetés et atténués. Dessin des couches → lib/missionThreatMap.
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
      style: THREAT_MAP_STYLE,
      bounds,
      fitBoundsOptions: { padding: 60 },
      pitch: MAP_PITCH_DEG,
    })
    mapRef.current = map
    map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-left')

    // Pas de tir FIXE (= le site), étiqueté.
    createLabeledMarker(map, [site.longitude, site.latitude], 'launch-marker launch-marker--origin', 'Launch pad')

    // Radars posés = contexte, étiquetés, atténués + cercles de couverture.
    const drawCoverage = () => drawRadarCoverage(map, radars)
    if (map.isStyleLoaded()) drawCoverage()
    else map.once('load', drawCoverage)

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
    const draw = () => drawThreatCone(map, site, radars, azimuthDeg)
    if (map.isStyleLoaded()) draw()
    else map.once('load', draw)
  }, [site, radars, azimuthDeg, inclinationDeg])

  return { containerRef }
}
