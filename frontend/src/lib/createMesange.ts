import type { MesangeLaunchConfig, MesangeRole } from '@/types/mission.types'

const AZIMUTH_STEP_DEG = 30

function makeId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `mesange-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

/**
 * Nouvelle Mesange avec des valeurs par défaut sensées : chaque ajout part
 * d'un azimut décalé (trajectoires distinctes). La première du scénario est
 * le Roi, les suivantes des Pions.
 */
export function createMesange(index: number): MesangeLaunchConfig {
  const role: MesangeRole = index === 0 ? 'KING' : 'PAWN'
  return {
    id: makeId(),
    role,
    azimuthDeg: (index * AZIMUTH_STEP_DEG) % 360,
    inclinationDeg: 80,
    launchDelaySec: 0,
  }
}
