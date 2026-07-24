import { useCallback, useMemo, useRef } from 'react'
import type maplibregl from 'maplibre-gl'
import { RADAR_TRACK_COLORS } from '@/constants/tacticalMapTheme'

// Espacement minimal entre deux blips POSÉS PAR LE MÊME RADAR pendant un
// accrochage continu (s) — sans lui, un radar qui garde la menace verrouillée
// poserait un plot à ~24 Hz (cadence de la boucle appelante) empilés au même
// endroit ; cet espacement donne l'esthétique « plots successifs » d'un vrai
// écran radar PPI qui ne rafraîchit qu'à chaque tour d'antenne.
const BLIP_MIN_INTERVAL_SEC = 0.4

interface DetectionBlipFeature {
  type: 'Feature'
  geometry: { type: 'Point'; coordinates: [number, number] }
  properties: { color: string; altitudeM: number }
}

/**
 * Accumule les blips d'accrochage radar sur la carte tactique (voir
 * lib/launchTacticalMap.ts, source `detections`) : un plot posé à la position
 * live de la menace à chaque front montant de `locked` (radar qui vient
 * d'accrocher), coloré par radar accrocheur (RADAR_TRACK_COLORS, même code
 * couleur que le corridor de visibilité 3D et sa légende). Les blips
 * S'ACCUMULENT en une trace persistante — jamais vidés pendant le vol, remis
 * à zéro uniquement via `reset()` (appelé au replay).
 *
 * Toute la mécanique vit dans des refs (pas de state React) : appelée depuis
 * la boucle rAF du faisceau radar déjà existante (useLaunchTacticalMap),
 * aucun re-render, aucune allocation par frame en régime permanent.
 */
export function useDetectionBlips() {
  const featuresRef = useRef<DetectionBlipFeature[]>([])
  const lastBlipSecByRadar = useRef(new Map<string, number>())
  const wasLockedByRadar = useRef(new Map<string, boolean>())

  // Fonctions stables (useCallback à deps vides, tout l'état vit dans des
  // refs) : peuvent être ajoutées sans risque aux deps des useEffect
  // appelants, sans jamais retrigger un effet.

  /** À appeler à chaque frame pour CE radar : pose un blip si `locked` vient
   *  de passer à `true` (front montant) et que l'espacement minimal est
   *  respecté. `nowSec` = horloge de la boucle appelante (performance.now()/1000).
   *  `altitudeM` porte l'altitude réelle de la menace à cet instant — sert au
   *  rayon du blip (voir launchTacticalMap.ts, `detections-core` data-driven),
   *  seconde piste de lecture en plus de la couleur par radar : sans elle, la
   *  carte de dessus « écrase » l'axe vertical et ment sur la hauteur réelle. */
  const recordSample = useCallback(
    (
      map: maplibregl.Map,
      radarId: string,
      radarIndex: number,
      locked: boolean,
      lngLat: [number, number],
      altitudeM: number,
      nowSec: number,
    ) => {
      const wasLocked = wasLockedByRadar.current.get(radarId) ?? false
      wasLockedByRadar.current.set(radarId, locked)
      if (!locked) return

      const lastBlipSec = lastBlipSecByRadar.current.get(radarId) ?? -Infinity
      const justLocked = !wasLocked
      if (!justLocked && nowSec - lastBlipSec < BLIP_MIN_INTERVAL_SEC) return

      lastBlipSecByRadar.current.set(radarId, nowSec)
      const color = RADAR_TRACK_COLORS[radarIndex % RADAR_TRACK_COLORS.length]
      featuresRef.current.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: lngLat },
        properties: { color, altitudeM },
      })

      const source = map.getSource('detections') as maplibregl.GeoJSONSource | undefined
      source?.setData({ type: 'FeatureCollection', features: featuresRef.current })
    },
    [],
  )

  /** Vide la trace de blips (nouveau vol/replay) — idempotent si déjà vide. */
  const reset = useCallback((map: maplibregl.Map) => {
    if (featuresRef.current.length === 0) return
    featuresRef.current = []
    lastBlipSecByRadar.current.clear()
    wasLockedByRadar.current.clear()
    const source = map.getSource('detections') as maplibregl.GeoJSONSource | undefined
    source?.setData({ type: 'FeatureCollection', features: [] })
  }, [])

  // Objet englobant mémoïsé : sans ça, un nouvel objet serait renvoyé à
  // chaque render même avec des fonctions internes stables — cassant la
  // stabilité recherchée pour les deps des useEffect appelants.
  return useMemo(() => ({ recordSample, reset }), [recordSample, reset])
}
