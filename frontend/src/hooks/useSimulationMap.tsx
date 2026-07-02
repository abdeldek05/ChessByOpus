import { useEffect, useRef } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import maplibregl from 'maplibre-gl'
import { launchSites } from '@/data/launchSites'
import { SiteHoverCard } from '@/components/sections/Simulation/SiteHoverCard'
import { computeSiteBounds, getResponsiveMapPadding } from '@/lib/mapViewport'
import type { LaunchSite } from '@/types/simulation.types'
import type { SiteWeather } from '@/types/weather.types'

// Base sombre Carto (Dark Matter), gratuite et sans clé. Pas de relief 3D
// (les tuiles DEM saccadaient) : carte plate = fluide et nette.
const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'

// Recolorage « gris foncé + réseau blanc lumineux » : fond gris neutre, eau
// en creux, routes/frontières en blanc léger et lumineux, labels blancs.
const MAP_COLORS = {
  background: '#141517',
  land: '#191b1e',
  water: '#0f1012',
  line: '#e9edf24d',
  label: '#dfe3e7',
  labelHalo: '#0f1012',
}
// Délai avant fermeture : laisse le temps à la souris de glisser du
// marqueur vers la carte sans que celle-ci disparaisse entre les deux.
const HIDE_DELAY_MS = 150
// Doit correspondre à la durée de transition de `.maplibregl-popup` en CSS.
const HIDE_TRANSITION_MS = 180

const DEFAULT_PITCH = 0
const DEFAULT_BEARING = 0
// Recalculée à partir des coordonnées réelles des sites — un site ajouté ou
// retiré de la base réajuste le cadrage tout seul, pas besoin de chiffres en dur.
const SITE_BOUNDS = computeSiteBounds(launchSites)

// Sur tactile, il n'y a pas de vrai survol : un pincement pour zoomer fait
// bouger le doigt hors du marqueur et déclencherait une fermeture en plein
// geste. On bascule donc en "toucher pour ouvrir/fermer" sur ces appareils.
const IS_TOUCH_DEVICE =
  typeof window !== 'undefined' && (navigator.maxTouchPoints > 0 || 'ontouchstart' in window)

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
 * marqueur lumineux ; le survol (ou le toucher sur mobile) affiche une carte
 * météo, le clic recentre la vue et notifie la sélection.
 */
export function useSimulationMap({ onSiteSelect, weatherBySiteId }: UseSimulationMapParams): UseSimulationMapResult {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const selectRef = useRef(onSiteSelect)
  selectRef.current = onSiteSelect
  const weatherRef = useRef(weatherBySiteId)
  weatherRef.current = weatherBySiteId
  // Popup actuellement épinglée (mode tactile) — accessible depuis `recenter`.
  const closeActivePopupRef = useRef<(() => void) | null>(null)

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

    // Recolore les couches vectorielles au chargement pour habiller la carte
    // aux teintes du site (laiton-nuit) plutôt que le gris Carto par défaut.
    map.on('load', () => {
      for (const layer of map.getStyle().layers ?? []) {
        if (layer.type === 'background') {
          map.setPaintProperty(layer.id, 'background-color', MAP_COLORS.background)
        } else if (layer.type === 'fill') {
          const isWater = layer.id.includes('water')
          map.setPaintProperty(layer.id, 'fill-color', isWater ? MAP_COLORS.water : MAP_COLORS.land)
        } else if (layer.type === 'line') {
          map.setPaintProperty(layer.id, 'line-color', MAP_COLORS.line)
        } else if (layer.type === 'symbol') {
          map.setPaintProperty(layer.id, 'text-color', MAP_COLORS.label)
          map.setPaintProperty(layer.id, 'text-halo-color', MAP_COLORS.labelHalo)
        }
      }
    })

    // Sur tactile, taper la carte en dehors d'un marqueur ferme la popup ouverte.
    if (IS_TOUCH_DEVICE) {
      map.on('click', () => closeActivePopupRef.current?.())
    }

    const markers: maplibregl.Marker[] = []
    const popupRoots: Root[] = []

    launchSites.forEach((site) => {
      const element = document.createElement('button')
      element.type = 'button'
      element.className = 'site-marker'
      element.setAttribute('aria-label', site.name)
      element.innerHTML = '<span class="site-marker__glow"></span>'

      const popupContainer = document.createElement('div')
      const popupRoot = createRoot(popupContainer)
      popupRoots.push(popupRoot)

      const popup = new maplibregl.Popup({
        closeButton: false,
        closeOnClick: false,
        offset: 18,
        anchor: 'bottom',
      }).setDOMContent(popupContainer)

      const renderAndOpen = () => {
        popupRoot.render(<SiteHoverCard site={site} weather={weatherRef.current[site.id]} />)
        if (!popup.isOpen()) popup.setLngLat([site.longitude, site.latitude]).addTo(map)
        requestAnimationFrame(() => popup.getElement()?.classList.add('is-visible'))
      }

      const closeNow = () => {
        popup.getElement()?.classList.remove('is-visible')
        setTimeout(() => popup.remove(), HIDE_TRANSITION_MS)
        if (closeActivePopupRef.current === closeNow) closeActivePopupRef.current = null
      }

      const flyToSite = () => {
        selectRef.current(site)
        map.flyTo({ center: [site.longitude, site.latitude], zoom: 7.5, pitch: 0, duration: 1400 })
      }

      if (IS_TOUCH_DEVICE) {
        // Taper : ouvre (et ferme la précédente) ; taper le même : referme.
        element.addEventListener('click', (event) => {
          event.stopPropagation()
          const wasOpen = popup.isOpen()
          closeActivePopupRef.current?.()
          if (!wasOpen) {
            renderAndOpen()
            closeActivePopupRef.current = closeNow
          }
          flyToSite()
        })
      } else {
        // Survol du marqueur = carte météo visible (info seule, non
        // cliquable — voir pointer-events:none en CSS). Un court délai à la
        // sortie évite un clignotement si la souris frôle le bord.
        let hideTimer: ReturnType<typeof setTimeout> | null = null

        const cancelHide = () => {
          if (hideTimer) {
            clearTimeout(hideTimer)
            hideTimer = null
          }
        }

        element.addEventListener('mouseenter', () => {
          cancelHide()
          renderAndOpen()
          closeActivePopupRef.current = closeNow
        })
        element.addEventListener('mouseleave', () => {
          cancelHide()
          hideTimer = setTimeout(closeNow, HIDE_DELAY_MS)
        })
        element.addEventListener('click', flyToSite)
      }

      markers.push(new maplibregl.Marker({ element }).setLngLat([site.longitude, site.latitude]).addTo(map))
    })

    return () => {
      markers.forEach((marker) => marker.remove())
      popupRoots.forEach((root) => root.unmount())
      map.remove()
      mapRef.current = null
      closeActivePopupRef.current = null
    }
  }, [])

  const recenter = () => {
    const map = mapRef.current
    if (!map) return
    // Une popup ouverte deviendrait illisible une fois la caméra très
    // dézoomée pour englober tous les sites — on la ferme avant.
    closeActivePopupRef.current?.()
    map.fitBounds(SITE_BOUNDS, {
      padding: getResponsiveMapPadding(map.getContainer().clientWidth),
      pitch: DEFAULT_PITCH,
      bearing: DEFAULT_BEARING,
      duration: 1500,
    })
  }

  return { containerRef, recenter }
}
