import { useEffect, useRef } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import maplibregl from 'maplibre-gl'
import { launchSites } from '@/data/launchSites'
import { SiteHoverCard } from '@/components/sections/Simulation/SiteHoverCard'
import { computeSiteBounds, getResponsiveMapPadding } from '@/lib/mapViewport'
import type { LaunchSite } from '@/types/simulation.types'
import type { SiteWeather } from '@/types/weather.types'

// Style sombre Carto + relief AWS Terrain : gratuits, sans clé d'accès.
const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'
const TERRAIN_TILES = 'https://elevation-tiles-prod.s3.amazonaws.com/terrarium/{z}/{x}/{y}.png'
// Exagération modérée : un relief trop marqué fait "sauter" la caméra
// pendant le zoom/déplacement à cause du chargement progressif des tuiles.
const TERRAIN_EXAGGERATION = 1.15
// Délai avant fermeture : laisse le temps à la souris de glisser du
// marqueur vers la carte sans que celle-ci disparaisse entre les deux.
const HIDE_DELAY_MS = 150
// Doit correspondre à la durée de transition de `.maplibregl-popup` en CSS.
const HIDE_TRANSITION_MS = 180

const DEFAULT_PITCH = 45
const DEFAULT_BEARING = 0
// Recalculée à partir des coordonnées réelles des sites — un site ajouté ou
// retiré de la base réajuste le cadrage tout seul, pas besoin de chiffres en dur.
const SITE_BOUNDS = computeSiteBounds(launchSites)

interface UseSimulationMapParams {
  onSiteSelect: (site: LaunchSite) => void
  weatherBySiteId: Record<string, SiteWeather | null>
}

interface UseSimulationMapResult {
  containerRef: React.RefObject<HTMLDivElement | null>
  recenter: () => void
}

/**
 * Initialise une carte MapLibre plate (mercator, pas de globe), inclinée en 3D
 * avec relief, sur le théâtre européen. Chaque site de lancement a un
 * marqueur lumineux ; le survol affiche une carte météo (rendue en React),
 * le clic recentre la vue et notifie la sélection.
 */
export function useSimulationMap({ onSiteSelect, weatherBySiteId }: UseSimulationMapParams): UseSimulationMapResult {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const selectRef = useRef(onSiteSelect)
  selectRef.current = onSiteSelect
  const weatherRef = useRef(weatherBySiteId)
  weatherRef.current = weatherBySiteId

  useEffect(() => {
    if (!containerRef.current) return

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      bounds: SITE_BOUNDS,
      fitBoundsOptions: {
        padding: getResponsiveMapPadding(containerRef.current.clientWidth),
        pitch: DEFAULT_PITCH,
        bearing: DEFAULT_BEARING,
      },
    })
    mapRef.current = map

    map.on('load', () => {
      map.addSource('terrain', {
        type: 'raster-dem',
        tiles: [TERRAIN_TILES],
        encoding: 'terrarium',
        tileSize: 256,
        maxzoom: 13,
      })
      map.setTerrain({ source: 'terrain', exaggeration: TERRAIN_EXAGGERATION })
    })

    const markers: maplibregl.Marker[] = []
    const popupRoots: Root[] = []

    launchSites.forEach((site) => {
      const element = document.createElement('button')
      element.type = 'button'
      element.className = 'site-marker'
      element.setAttribute('aria-label', site.name)
      element.innerHTML = '<span class="site-marker__glow"></span><span class="site-marker__pulse"></span>'

      const popupContainer = document.createElement('div')
      const popupRoot = createRoot(popupContainer)
      popupRoots.push(popupRoot)

      const popup = new maplibregl.Popup({
        closeButton: false,
        closeOnClick: false,
        offset: 18,
        anchor: 'bottom',
      }).setDOMContent(popupContainer)

      // Survol marqueur OU carte = ouvert ; un court délai à la sortie
      // laisse le temps de glisser de l'un à l'autre sans coupure brutale.
      let hideTimer: ReturnType<typeof setTimeout> | null = null

      const cancelHide = () => {
        if (hideTimer) {
          clearTimeout(hideTimer)
          hideTimer = null
        }
      }

      const show = () => {
        cancelHide()
        popupRoot.render(<SiteHoverCard site={site} weather={weatherRef.current[site.id]} />)
        if (!popup.isOpen()) popup.setLngLat([site.longitude, site.latitude]).addTo(map)
        requestAnimationFrame(() => popup.getElement()?.classList.add('is-visible'))
      }

      const scheduleHide = () => {
        cancelHide()
        hideTimer = setTimeout(() => {
          popup.getElement()?.classList.remove('is-visible')
          setTimeout(() => popup.remove(), HIDE_TRANSITION_MS)
        }, HIDE_DELAY_MS)
      }

      element.addEventListener('mouseenter', show)
      element.addEventListener('mouseleave', scheduleHide)
      popupContainer.addEventListener('mouseenter', cancelHide)
      popupContainer.addEventListener('mouseleave', scheduleHide)

      element.addEventListener('click', () => {
        selectRef.current(site)
        map.flyTo({ center: [site.longitude, site.latitude], zoom: 8, pitch: 50, duration: 1800 })
      })

      markers.push(new maplibregl.Marker({ element }).setLngLat([site.longitude, site.latitude]).addTo(map))
    })

    return () => {
      markers.forEach((marker) => marker.remove())
      popupRoots.forEach((root) => root.unmount())
      map.remove()
      mapRef.current = null
    }
  }, [])

  const recenter = () => {
    const map = mapRef.current
    if (!map) return
    map.fitBounds(SITE_BOUNDS, {
      padding: getResponsiveMapPadding(map.getContainer().clientWidth),
      pitch: DEFAULT_PITCH,
      bearing: DEFAULT_BEARING,
      duration: 1500,
    })
  }

  return { containerRef, recenter }
}
