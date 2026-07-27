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
  properties: { color: string; altitudeM: number; small: boolean }
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

  /** À appeler à chaque frame pour CE radar ET CETTE menace : pose un blip si
   *  `locked` vient de passer à `true` (front montant) et que l'espacement
   *  minimal est respecté. `threatId` distingue les menaces (Roi vs chaque
   *  pion) : sans lui, elles partageraient le compteur d'espacement d'un même
   *  radar et se voleraient des plots. `nowSec` = horloge de la boucle
   *  appelante. `altitudeM` sert au rayon (data-driven, voir launchTacticalMap).
   *  `colorOverride` force une couleur (gris pour un pion, sinon couleur radar).
   *  `small` marque le blip comme réduit (pions : plus petits que le Roi). */
  const recordSample = useCallback(
    (
      map: maplibregl.Map,
      radarId: string,
      radarIndex: number,
      threatId: string,
      locked: boolean,
      lngLat: [number, number],
      altitudeM: number,
      nowSec: number,
      colorOverride?: string,
      small = false,
    ) => {
      const key = `${radarId}:${threatId}`
      const wasLocked = wasLockedByRadar.current.get(key) ?? false
      wasLockedByRadar.current.set(key, locked)
      if (!locked) return

      const lastBlipSec = lastBlipSecByRadar.current.get(key) ?? -Infinity
      const justLocked = !wasLocked
      if (!justLocked && nowSec - lastBlipSec < BLIP_MIN_INTERVAL_SEC) return

      lastBlipSecByRadar.current.set(key, nowSec)
      const color = colorOverride ?? RADAR_TRACK_COLORS[radarIndex % RADAR_TRACK_COLORS.length]
      featuresRef.current.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: lngLat },
        properties: { color, altitudeM, small },
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
