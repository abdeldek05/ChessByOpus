import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import { buildRangeCircle } from '@/lib/geoCircle'
import { createLabeledMarker } from '@/lib/mapMarker'
import {
  THREAT_MAP_STYLE,
  MAP_PITCH_DEG,
  allDragLayers,
  mesangeIdFromLayer,
  bearingToward,
  computeDisplayRangeKm,
  drawRadarCoverage,
  drawThreatCones,
} from '@/lib/missionThreatMap'
import type { LaunchSite } from '@/types/simulation.types'
import type { PlacedRadar, MesangeLaunchConfig } from '@/types/mission.types'

interface UseMissionThreatMapParams {
  site: LaunchSite
  radars: PlacedRadar[]
  /** Toute la flotte (tous les cônes affichés) — voir drawThreatCones. */
  mesangeConfigs: MesangeLaunchConfig[]
  /** Mesange actuellement éditée : son cône est en surbrillance. */
  selectedId: string
  onSetAzimut: (id: string, deg: number) => void
  onSelect: (id: string) => void
}

interface UseMissionThreatMapResult {
  containerRef: React.RefObject<HTMLDivElement | null>
}

/**
 * Carte de la flotte de menaces : pas de tir fixe (= le site), partagé par
 * toutes les Mesanges. Un cône par Mesange, teinté par rôle — TOUS
 * attrapables (pas seulement la sélection), pour que le client puisse saisir
 * directement la pièce qu'il veut sur la carte, comme sur un échiquier.
 * Attraper un cône le sélectionne aussi (voir onSelect) — se répercute sur le
 * panneau focus de l'assistant Menaces (voir ThreatConfigStep/useThreatWizard).
 * Les radars posés restent en contexte, étiquetés et atténués. Dessin des
 * couches → lib/missionThreatMap.
 */
export function useMissionThreatMap({
  site,
  radars,
  mesangeConfigs,
  selectedId,
  onSetAzimut,
  onSelect,
}: UseMissionThreatMapParams): UseMissionThreatMapResult {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const aimRef = useRef(onSetAzimut)
  aimRef.current = onSetAzimut
  const selectRef = useRef(onSelect)
  selectRef.current = onSelect
  // Valeur COURANTE de selectedId : le clic simple doit viser avec la Mesange
  // sélectionnée AU MOMENT du clic (les listeners sont posés une seule fois
  // au montage, voir plus bas — ils ne voient donc jamais la prop à jour sans
  // cette ref).
  const selectedRef = useRef(selectedId)
  selectedRef.current = selectedId
  // Flotte COURANTE (jamais capturée dans une closure figée) : le hit-testing
  // au clic interroge la carte (queryRenderedFeatures) pour SAVOIR quel cône
  // est sous le curseur au moment précis du clic, plutôt que d'attacher un
  // listener PAR COUCHE à chaque changement de flotte. L'ancienne approche
  // (un useEffect séparé, réabonné à chaque ajout/retrait de Mesange)
  // superposait plusieurs générations de listeners/closures dès qu'on
  // dépassait 1 Mesange : le drag cessait totalement de répondre. Ici, les
  // listeners sont posés UNE SEULE FOIS (même effect que la création de la
  // carte) et lisent toujours la flotte la plus récente via cette ref.
  const mesangeConfigsRef = useRef(mesangeConfigs)
  mesangeConfigsRef.current = mesangeConfigs

  // --- Création de la carte + tous les listeners d'interaction (une fois par site) ---
  useEffect(() => {
    if (!containerRef.current) return

    // MÊME rayon que les cônes eux-mêmes (computeDisplayRangeKm) — sinon le
    // point d'impact d'un cône (donc sa zone de saisie généreuse) tombe hors
    // du cadrage initial et reste impossible à attraper tant qu'on n'a pas
    // dézoomé/déplacé la carte manuellement.
    const bounds = new maplibregl.LngLatBounds()
    buildRangeCircle(site.longitude, site.latitude, computeDisplayRangeKm(radars)).forEach(([lng, lat]) =>
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
    // Pas d'échelle km ici (contrairement à la carte de placement radar) : on
    // vise par AZIMUT (saisir le cône), pas par distance mesurée — l'échelle
    // n'apportait rien et chevauchait le HUD de configuration ancré en bas
    // (voir ThreatConfigBar).

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

    const resizeObserver = new ResizeObserver(() => map.resize())
    resizeObserver.observe(containerRef.current)

    // --- Visée fluide : saisir N'IMPORTE QUEL cône de la flotte pour le faire
    // glisser autour du pas de tir (ça le sélectionne aussi). Cliquer ailleurs
    // sur la carte oriente la Mesange COURAMMENT sélectionnée.
    //
    // Listeners posés UNE SEULE FOIS ici (jamais par nom de couche, jamais
    // réabonnés à chaque changement de flotte) : au mousedown, on interroge
    // la carte (queryRenderedFeatures) pour savoir SI le point cliqué touche
    // une des couches de saisie de la flotte ACTUELLE (via mesangeConfigsRef),
    // et LAQUELLE. C'est le pattern robuste pour du hit-testing sur un nombre
    // de features qui varie dans le temps.
    const canvas = map.getCanvas()
    let draggingId: string | null = null

    // IMPORTANT (vérifié dans le source MapLibre, Style.queryRenderedFeatures) :
    // si NE SERAIT-CE QU'UNE seule couche de la liste `layers` n'existe pas
    // encore sur le style, `queryRenderedFeatures` renvoie [] pour TOUT le lot
    // (pas juste pour la couche manquante) — silencieux côté exception JS,
    // mais ça aurait cassé le hit-test de TOUTE la flotte dès qu'une Mesange
    // venait d'être ajoutée et que `drawThreatCones` n'avait pas encore fini
    // de créer ses couches. On filtre donc aux couches RÉELLEMENT présentes.
    const hitLayers = () =>
      allDragLayers(mesangeConfigsRef.current.map((m) => m.id)).filter((layerId) => map.getLayer(layerId))

    const hitTest = (point: maplibregl.Point): string | null => {
      const layers = hitLayers()
      if (layers.length === 0) return null
      const features = map.queryRenderedFeatures(point, { layers })
      if (features.length === 0) return null
      return mesangeIdFromLayer(features[0].layer.id)
    }

    const onMouseDown = (event: maplibregl.MapMouseEvent) => {
      const mesangeId = hitTest(event.point)
      if (!mesangeId) return
      event.preventDefault() // bloque le pan de la carte pendant le réglage
      draggingId = mesangeId
      selectRef.current(mesangeId)
      canvas.style.cursor = 'grabbing'
    }
    const onTouchStart = (event: maplibregl.MapTouchEvent) => {
      const mesangeId = hitTest(event.point)
      if (!mesangeId) return
      event.preventDefault()
      draggingId = mesangeId
      selectRef.current(mesangeId)
    }
    const onMouseMove = (event: maplibregl.MapMouseEvent) => {
      if (draggingId) {
        aimRef.current(draggingId, bearingToward(site, event.lngLat))
        return
      }
      // Survol hors drag : curseur "grab" au-dessus d'un cône saisissable.
      canvas.style.cursor = hitTest(event.point) ? 'grab' : ''
    }
    const onTouchMove = (event: maplibregl.MapTouchEvent) => {
      if (draggingId) aimRef.current(draggingId, bearingToward(site, event.lngLat))
    }
    const endDrag = () => {
      if (!draggingId) return
      draggingId = null
      canvas.style.cursor = ''
    }
    // Clic simple (hors cône) = viser directement le point cliqué avec la
    // Mesange COURAMMENT sélectionnée (ignoré en fin de drag : le drag a déjà
    // posé la valeur exacte, pas de ressaut d'arrondi ; ignoré si le clic a
    // touché un cône, déjà traité par onMouseDown/le drag).
    const onClick = (event: maplibregl.MapMouseEvent) => {
      if (draggingId) return
      if (hitTest(event.point)) return
      aimRef.current(selectedRef.current, bearingToward(site, event.lngLat))
    }

    map.on('mousedown', onMouseDown)
    map.on('touchstart', onTouchStart)
    map.on('mousemove', onMouseMove)
    map.on('touchmove', onTouchMove)
    map.on('mouseup', endDrag)
    map.on('touchend', endDrag)
    map.on('click', onClick)
    // Relâchement HORS de la carte : sans ça le cône resterait « collé » au
    // pointeur au retour sur la carte, bouton déjà relâché.
    document.addEventListener('pointerup', endDrag)

    return () => {
      resizeObserver.disconnect()
      map.off('mousedown', onMouseDown)
      map.off('touchstart', onTouchStart)
      map.off('mousemove', onMouseMove)
      map.off('touchmove', onTouchMove)
      map.off('mouseup', endDrag)
      map.off('touchend', endDrag)
      map.off('click', onClick)
      document.removeEventListener('pointerup', endDrag)
      map.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- carte + listeners créés une fois par site, tout le reste est lu via ref
  }, [site])

  // --- Cônes de menace : un par Mesange, tous fins et arrondis ---
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const draw = () => drawThreatCones(map, site, radars, mesangeConfigs, selectedId)
    if (map.isStyleLoaded()) draw()
    else map.once('load', draw)
  }, [site, radars, mesangeConfigs, selectedId])

  return { containerRef }
}
