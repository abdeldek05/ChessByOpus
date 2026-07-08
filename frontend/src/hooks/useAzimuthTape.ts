import { useMemo } from 'react'

// Pas de graduation (deg) et demi-fenêtre visible autour de l'azimut courant.
const TICK_STEP_DEG = 10
const HALF_WINDOW_DEG = 60

export interface AzimuthTick {
  /** Valeur du cap 0–359, déjà normalisée (le 350→0→10 s'enchaîne proprement). */
  deg: number
  /** Décalage vertical par rapport au centre, en degrés (négatif = au-dessus). */
  offsetDeg: number
  /** Cap cardinal marqué plus fort (tous les 90°). */
  cardinal: boolean
}

/**
 * Graduations d'un ruban d'azimut vertical défilant : une fenêtre glissante de
 * ±HALF_WINDOW_DEG autour du cap courant, échantillonnée tous les TICK_STEP_DEG.
 * Chaque tick porte son offset (pour le positionner) et son cap normalisé (pour
 * l'afficher). Pur affichage — recalculé à chaque changement d'azimut.
 */
export function useAzimuthTape(azimuthDeg: number): AzimuthTick[] {
  return useMemo(() => {
    const ticks: AzimuthTick[] = []
    // On aligne le premier tick sur un multiple de TICK_STEP_DEG sous la fenêtre.
    const start = Math.ceil((azimuthDeg - HALF_WINDOW_DEG) / TICK_STEP_DEG) * TICK_STEP_DEG
    for (let raw = start; raw <= azimuthDeg + HALF_WINDOW_DEG; raw += TICK_STEP_DEG) {
      const deg = ((raw % 360) + 360) % 360
      ticks.push({ deg, offsetDeg: raw - azimuthDeg, cardinal: deg % 90 === 0 })
    }
    return ticks
  }, [azimuthDeg])
}

export const AZIMUTH_TAPE_HALF_WINDOW_DEG = HALF_WINDOW_DEG
