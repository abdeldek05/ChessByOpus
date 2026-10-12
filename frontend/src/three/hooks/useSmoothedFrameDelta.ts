import { useCallback, useRef } from 'react'
import {
  DELTA_SMOOTHING,
  DELTA_SPIKE_RATIO,
  MAX_PLAYBACK_DELTA,
} from '@/three/constants/frameTiming'

/**
 * Horloge de frame LISSÉE pour le rejeu de vol : convertit le delta brut de
 * useFrame en pas d'animation régulier.
 *
 * Pourquoi : la position de la fusée est lue PAR LE TEMPS (voir
 * useTrajectoryPlayback — animElapsed × TIME_SCALE), donc sa fluidité est
 * EXACTEMENT la régularité des deltas. Une seule frame longue (compilation de
 * shader au décollage/à l'impact, GC, contention CPU) avançait le vol d'un
 * coup — jusqu'à 0,3 s de vol avec l'ancien plafond brut à 0,1 s, soit ~85 m
 * de téléportation en chute rapide. Le commentaire historique promettait un
 * « sous-échantillonnage » qui n'avait jamais été écrit ; ce lissage le
 * remplace.
 *
 * Mécanique : moyenne mobile exponentielle de la cadence. Chaque frame avance
 * d'au plus DELTA_SPIKE_RATIO × la cadence lissée (pic isolé absorbé), et
 * jamais plus de MAX_PLAYBACK_DELTA (freeze complet borné). Un ralentissement
 * DURABLE fait converger la moyenne en ~10-15 frames : la vitesse de lecture
 * reste juste sur une machine lente, sans ralenti permanent.
 */
export function useSmoothedFrameDelta(): (rawDelta: number) => number {
  const smoothed = useRef(0)

  return useCallback((rawDelta: number) => {
    const capped = Math.min(Math.max(rawDelta, 0), MAX_PLAYBACK_DELTA)
    if (smoothed.current === 0) {
      // Première frame : pas encore de cadence de référence.
      smoothed.current = capped
      return capped
    }
    const step = Math.min(capped, smoothed.current * DELTA_SPIKE_RATIO)
    smoothed.current += (step - smoothed.current) * DELTA_SMOOTHING
    return step
  }, [])
}
