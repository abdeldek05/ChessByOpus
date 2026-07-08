import maplibregl from 'maplibre-gl'

/**
 * Marqueur MapLibre avec une étiquette texte accolée (ex. « Pas de tir »,
 * « Radar 1 ») — pour distinguer les points sur la carte au premier coup d'œil.
 * Partagé entre les cartes de placement radar et de menace.
 */
export function createLabeledMarker(
  map: maplibregl.Map,
  lngLat: [number, number],
  dotClassName: string,
  labelText: string,
): maplibregl.Marker {
  const element = document.createElement('div')
  element.className = dotClassName
  const label = document.createElement('span')
  label.className = 'map-marker-label'
  label.textContent = labelText
  element.appendChild(label)
  return new maplibregl.Marker({ element }).setLngLat(lngLat).addTo(map)
}
